package com.resumerebuilder.pdf.service;

import com.google.firebase.auth.FirebaseAuth;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import com.resumerebuilder.firebase.FirestoreService;
import com.resumerebuilder.pdf.model.PdfMetadata;
import com.resumerebuilder.pdf.model.PdfStatus;
import com.resumerebuilder.storage.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfGenerationService {

    private final StorageService storageService;
    private final FirestoreService firestoreService;

    @Value("${supabase.bucket-name:resume-files}")
    private String bucketName;

     @Value("${renderer.base-url}")
   private String rendererBaseUrl;


    public PdfGenerationService(
            StorageService storageService,
            FirestoreService firestoreService) {
        this.storageService = storageService;
        this.firestoreService = firestoreService;
    }

    /**
     * Generates a NEW PDF from the optimized ResumeData using the selected
     * React template.
     *
     * Flow:
     *
     * Optimized ResumeData
     * ↓
     * Firebase Custom Token
     * ↓
     * /resume-render/auth
     * ↓
     * /resume-render/{id}?templateId=...
     * ↓
     * Same React template used by Live Preview
     * ↓
     * #render-ready attached
     * ↓
     * Fonts loaded
     * ↓
     * Chromium page.pdf()
     * ↓
     * Supabase Storage
     * ↓
     * Firestore PDF metadata
     */
    public PdfMetadata generatePdf(
            String resumeId,
            String templateId,
            String userId,
            String contentHash) {

        String basePath = resumeId + "/pdfs";
        String currentPdfPath = basePath + "/current";

        /*
         * ------------------------------------------------------------
         * 1. IDEMPOTENCY CHECK
         * ------------------------------------------------------------
         *
         * If the exact same optimized content + template was already
         * generated, reuse it instead of generating another identical PDF.
         */
        PdfMetadata currentMeta = firestoreService.getDocument(
                "resumes",
                currentPdfPath,
                PdfMetadata.class);

        if (currentMeta != null
                && PdfStatus.GENERATED.equals(currentMeta.getStatus())
                && contentHash != null
                && contentHash.equals(currentMeta.getContentHash())
                && templateId != null
                && templateId.equals(currentMeta.getTemplateId())) {
            return currentMeta;
        }

        /*
         * ------------------------------------------------------------
         * 2. CREATE GENERATING METADATA
         * ------------------------------------------------------------
         */
        PdfMetadata meta = new PdfMetadata();

        meta.setResumeId(resumeId);
        meta.setVersionId(contentHash);
        meta.setTemplateId(templateId);
        meta.setContentHash(contentHash);
        meta.setStatus(PdfStatus.GENERATING);
        meta.setGeneratedAt(Instant.now().toString());

        firestoreService.saveDocument(
                "resumes",
                currentPdfPath,
                meta);

        try {

            /*
             * --------------------------------------------------------
             * 3. CREATE FIREBASE CUSTOM TOKEN
             * --------------------------------------------------------
             *
             * Playwright cannot directly use the user's browser
             * Firebase session, so the backend creates a temporary
             * Firebase Custom Token.
             */
            String customToken = FirebaseAuth.getInstance().createCustomToken(userId);

            /*
             * --------------------------------------------------------
             * 4. ENCODE QUERY PARAMETERS
             * --------------------------------------------------------
             */
               String encodedToken = URLEncoder.encode(
                    customToken,
                    StandardCharsets.UTF_8);

            String renderPath = "/resume-render/"
                    + encodePathSegment(resumeId)
                    + "?templateId="
                    + URLEncoder.encode(
                            templateId,
                            StandardCharsets.UTF_8);

            String encodedRedirect = URLEncoder.encode(
                    renderPath,
                    StandardCharsets.UTF_8);

            String baseUrl = rendererBaseUrl.endsWith("/")
                    ? rendererBaseUrl.substring(0, rendererBaseUrl.length() - 1)
                    : rendererBaseUrl;

            String navigateTo = baseUrl
                    + "/resume-render/auth"
                    + "?token="
                    + encodedToken
                    + "&redirect="
                    + encodedRedirect;

            byte[] pdfBytes;

            /*
             * --------------------------------------------------------
             * 5. START PLAYWRIGHT
             * --------------------------------------------------------
             */
            try (Playwright playwright = Playwright.create()) {

                Browser browser = null;

                try {

                    browser = playwright.chromium().launch(
                            new BrowserType.LaunchOptions()
                                    .setHeadless(true));

                    try (BrowserContext context = browser.newContext()) {

                        Page page = context.newPage();

                        /*
                         * ------------------------------------------------
                         * 6. NAVIGATE TO AUTH BRIDGE
                         * ------------------------------------------------
                         */
                        page.navigate(
                                navigateTo,
                                new Page.NavigateOptions()
                                        .setWaitUntil(
                                                com.microsoft.playwright.options.WaitUntilState.DOMCONTENTLOADED));

                        /*
                         * ------------------------------------------------
                         * 7. WAIT FOR RENDER MARKER
                         * ------------------------------------------------
                         */
                        Locator renderReady = page.locator("#render-ready");

                        renderReady.waitFor(
                                new Locator.WaitForOptions()
                                        .setState(
                                                com.microsoft.playwright.options.WaitForSelectorState.ATTACHED)
                                        .setTimeout(30000));

                        /*
                         * ------------------------------------------------
                         * 8. WAIT FOR WEB FONTS
                         * ------------------------------------------------
                         */
                        page.evaluate(
                                "() => document.fonts.ready");

                        /*
                         * ------------------------------------------------
                         * 9. SMALL RENDER STABILITY CHECK
                         * ------------------------------------------------
                         */
                        page.waitForFunction(
                                "() => document.readyState === 'complete'",
                                null,
                                new Page.WaitForFunctionOptions()
                                        .setTimeout(15000));

                        /*
                         * ------------------------------------------------
                         * 10. GENERATE PDF
                         * ------------------------------------------------
                         */
                        pdfBytes = page.pdf(
                                new Page.PdfOptions()
                                        .setFormat("A4")
                                        .setPrintBackground(true)
                                        .setPreferCSSPageSize(false)
                                        .setMargin(
                                                new com.microsoft.playwright.options.Margin()
                                                        .setTop("0")
                                                        .setBottom("0")
                                                        .setLeft("0")
                                                        .setRight("0")));
                    }

                } finally {

                    if (browser != null) {
                        browser.close();
                    }
                }
            }

            /*
             * --------------------------------------------------------
             * 12. VALIDATE PDF
             * --------------------------------------------------------
             */
            if (pdfBytes == null || pdfBytes.length == 0) {
                throw new IllegalStateException(
                        "PDF generation returned empty PDF bytes.");
            }

            /*
             * --------------------------------------------------------
             * 13. UPLOAD GENERATED PDF TO SUPABASE
             * --------------------------------------------------------
             */
            String storageKey = String.format(
                    "users/%s/resumes/%s/generated/v_%s.pdf",
                    userId,
                    resumeId,
                    contentHash);

            storageService.uploadFile(
                    bucketName,
                    storageKey,
                    pdfBytes,
                    "application/pdf");

            /*
             * --------------------------------------------------------
             * 14. UPDATE FIRESTORE METADATA
             * --------------------------------------------------------
             */
            meta.setStorageKey(storageKey);
            meta.setStatus(PdfStatus.GENERATED);
            meta.setFileSize(pdfBytes.length);
            meta.setPageCount(1);

            firestoreService.updateDocument(
                    "resumes",
                    currentPdfPath,
                    meta);

            return meta;

        } catch (Exception e) {

            Map<String, Object> failureUpdate = new HashMap<>();

            failureUpdate.put(
                    "status",
                    PdfStatus.GENERATION_FAILED);

            failureUpdate.put(
                    "errorMessage",
                    e.getMessage());

            firestoreService.updateDocument(
                    "resumes",
                    currentPdfPath,
                    failureUpdate);

            throw new RuntimeException(
                    "PDF generation failed: " + e.getMessage(),
                    e);
        }
    }

    /**
     * Returns information about the latest generated PDF.
     */
    public Map<String, Object> getGeneratedPdfInfo(
            String resumeId,
            String userId) {

        String currentPdfPath = resumeId + "/pdfs/current";

        PdfMetadata meta = firestoreService.getDocument(
                "resumes",
                currentPdfPath,
                PdfMetadata.class);

        if (meta == null
                || meta.getStorageKey() == null
                || !PdfStatus.GENERATED.equals(meta.getStatus())) {
            throw new RuntimeException(
                    "No successfully generated PDF exists for this resume.");
        }

        String downloadUrl = storageService
                .generatePresignedUrl(
                        bucketName,
                        meta.getStorageKey(),
                        60)
                .toString();

        Map<String, Object> result = new HashMap<>();

        result.put("downloadUrl", downloadUrl);
        result.put("templateId", meta.getTemplateId());
        result.put("generatedAt", meta.getGeneratedAt());
        result.put("status", meta.getStatus());
        result.put("fileSize", meta.getFileSize());
        result.put("storageKey", meta.getStorageKey());

        return result;
    }

    private String encodePathSegment(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "Resume ID cannot be null or empty.");
        }

        return URLEncoder
                .encode(value, StandardCharsets.UTF_8)
                .replace("+", "%20");
    }
}