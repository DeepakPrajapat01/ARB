package com.resumerebuilder.pdf.service;

import com.google.firebase.auth.FirebaseAuth;
import com.microsoft.playwright.Browser;
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

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
public class PdfGenerationService {

    private final StorageService storageService;
    private final FirestoreService firestoreService;

    @Value("${supabase.bucket-name:resume-files}")
    private String bucketName;

    // Use localhost in dev environment, configure this via ENV for prod
    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public PdfGenerationService(StorageService storageService, FirestoreService firestoreService) {
        this.storageService = storageService;
        this.firestoreService = firestoreService;
    }

    public PdfMetadata generatePdf(String resumeId, String templateId, String userId, String contentHash) {
        String basePath = "resumes/" + resumeId + "/pdfs";
        String currentPdfPath = basePath + "/current";

        // 1. Check idempotency (if the content hasn't changed, return the existing
        // tracking mapped).
        PdfMetadata currentMeta = firestoreService.getDocument("resumes", currentPdfPath, PdfMetadata.class);
        if (currentMeta != null && PdfStatus.GENERATED.equals(currentMeta.getStatus())
                && currentMeta.getContentHash().equals(contentHash)) {
            return currentMeta;
        }

        PdfMetadata meta = new PdfMetadata();
        meta.setResumeId(resumeId);
        meta.setVersionId(contentHash); // using hash securely maps variations uniquely linearly
        meta.setTemplateId(templateId);
        meta.setContentHash(contentHash);
        meta.setStatus(PdfStatus.GENERATING);
        meta.setGeneratedAt(Instant.now().toString());

        // Store the initialized state safely explicitly
        firestoreService.saveDocument("resumes", currentPdfPath, meta);

        try {
            // 2. Headless Context Pipeline
            // Mints a secure transient token enabling Playwright to breach auth wrappers
            // seamlessly mapping identity
            String customToken = FirebaseAuth.getInstance().createCustomToken(userId);

            byte[] pdfBytes;
            // Native try-with-resources to enforce JVM clean up on Chromium zombies
            try (Playwright playwright = Playwright.create()) {
                Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
                Page page = browser.newPage();

                // Pass the custom-token into the bridging route
                // The frontend sets the firebase identity, then redirects to the target
                // `/resume-render/[id]`
                String navigateTo = String.format(
                        "%s/resume-render/auth?token=%s&redirect=/resume-render/%s?templateId=%s",
                        frontendUrl, customToken, resumeId, templateId);

                page.navigate(navigateTo);

                // Wait firmly until the `#render-ready` explicitly populates mapping all API
                // returns natively
                Locator marker = page.locator("#render-ready");
                marker.waitFor(new Locator.WaitForOptions().setTimeout(15000));

                // Emulate standard A4 print margins exactly mapping strictly
                pdfBytes = page.pdf(new Page.PdfOptions()
                        .setFormat("A4")
                        .setPrintBackground(true)
                        .setMargin(new com.microsoft.playwright.options.Margin()
                                .setTop("0").setBottom("0").setLeft("0").setRight("0")));
            }

            // 3. Storage flushing mapping explicitly linearly
            String storageKey = String.format("users/%s/resumes/%s/generated/v_%s.pdf", userId, resumeId, contentHash);
            storageService.uploadFile(bucketName, storageKey, pdfBytes, "application/pdf");

            // 4. Update structural markers permanently
            meta.setStorageKey(storageKey);
            meta.setStatus(PdfStatus.GENERATED);
            meta.setFileSize(pdfBytes.length);
            // Default 1 page for now mapping structurally if needed later
            meta.setPageCount(1);

            firestoreService.updateDocument("resumes", currentPdfPath, meta);
            return meta;

        } catch (Exception e) {
            Map<String, Object> failureUpdate = new HashMap<>();
            failureUpdate.put("status", PdfStatus.GENERATION_FAILED);
            firestoreService.updateDocument("resumes", currentPdfPath, failureUpdate);
            throw new RuntimeException("Generated structural PDF failures: " + e.getMessage(), e);
        }
    }

    public String generateDownloadUrl(String resumeId, String userId) {
        String currentPdfPath = "resumes/" + resumeId + "/pdfs/current";
        PdfMetadata meta = firestoreService.getDocument("resumes", currentPdfPath, PdfMetadata.class);

        if (meta == null || meta.getStorageKey() == null) {
            throw new RuntimeException("Requested PDF missing storage keys explicitly.");
        }

        // Return signed transiently expiring freely
        return storageService.generatePresignedUrl(bucketName, meta.getStorageKey(), 60).toString();
    }
}
