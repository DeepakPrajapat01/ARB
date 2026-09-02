package com.resumerebuilder.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseAdminConfig {

    /**
     * Path to the Firebase service account JSON file.
     * Injected from GOOGLE_APPLICATION_CREDENTIALS environment variable via .env.
     * Example: ./secrets/firebase-service-account.json
     */
    @Value("${GOOGLE_APPLICATION_CREDENTIALS:}")
    private String credentialsPath;

    @PostConstruct
    public void init() {
        if (FirebaseApp.getApps().isEmpty()) {
            try {
                GoogleCredentials credentials = resolveCredentials();
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(credentials)
                        .build();
                FirebaseApp.initializeApp(options);
            } catch (IOException e) {
                throw new RuntimeException(
                        "Firebase Admin SDK failed to initialize. " +
                                "Ensure GOOGLE_APPLICATION_CREDENTIALS is set in .env and points to a valid service account JSON file. "
                                +
                                "Details: " + e.getMessage(),
                        e);
            }
        }
    }

    private GoogleCredentials resolveCredentials() throws IOException {
        // If a specific file path is provided, load it directly.
        if (credentialsPath != null && !credentialsPath.isBlank()) {
            try (InputStream is = new FileInputStream(credentialsPath)) {
                return ServiceAccountCredentials.fromStream(is);
            }
        }
        // Fall back to Google Application Default Credentials (CI / cloud
        // environments).
        return GoogleCredentials.getApplicationDefault();
    }
}
