package com.resumerebuilder.storage;

import com.resumerebuilder.firebase.FirebaseTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;

import java.net.URL;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/storage")
public class StorageController {

    private final StorageService storageService;
    private final FirebaseTokenService firebaseTokenService;

    @Autowired
    public StorageController(StorageService storageService, FirebaseTokenService firebaseTokenService) {
        this.storageService = storageService;
        this.firebaseTokenService = firebaseTokenService;
    }

    @PostMapping("/{bucketName}/upload")
    public ResponseEntity<?> uploadFile(
            HttpServletRequest request,
            @PathVariable String bucketName,
            @RequestParam("path") String path,
            @RequestParam("file") MultipartFile file) {
        try {
            // Protect endpoint
            firebaseTokenService.extractTokenFromRequest(request);

            String uploadedPath = storageService.uploadFile(bucketName, path, file);
            return ResponseEntity.ok(Map.of(
                    "message", "File uploaded successfully",
                    "path", uploadedPath));
        } catch (RuntimeException e) {
            if (e.getMessage() != null &&
                    (e.getMessage().contains("Firebase Token") || e.getMessage().contains("Authorization"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{bucketName}/delete")
    public ResponseEntity<?> deleteFile(
            HttpServletRequest request,
            @PathVariable String bucketName,
            @RequestParam("path") String path) {
        try {
            firebaseTokenService.extractTokenFromRequest(request);
            storageService.deleteFile(bucketName, path);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (Exception e) {
            if (e.getMessage() != null &&
                    (e.getMessage().contains("Firebase Token") || e.getMessage().contains("Authorization"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{bucketName}/signed-url")
    public ResponseEntity<?> getSignedUrl(
            HttpServletRequest request,
            @PathVariable String bucketName,
            @RequestParam("path") String path,
            @RequestParam(value = "durationMinutes", defaultValue = "60") int durationMinutes) {
        try {
            firebaseTokenService.extractTokenFromRequest(request);
            URL url = storageService.generatePresignedUrl(bucketName, path, durationMinutes);
            return ResponseEntity.ok(Map.of("url", url.toString()));
        } catch (Exception e) {
            if (e.getMessage() != null &&
                    (e.getMessage().contains("Firebase Token") || e.getMessage().contains("Authorization"))) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
