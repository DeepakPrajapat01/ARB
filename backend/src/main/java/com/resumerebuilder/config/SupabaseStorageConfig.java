package com.resumerebuilder.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Configures an AWS S3Client pointed at Supabase Storage's S3-compatible
 * endpoint.
 *
 * <p>
 * Supabase Storage exposes a fully S3-compatible API, so the standard AWS SDK
 * v2
 * works without modification. Required settings:
 * <ul>
 * <li>{@code endpointOverride()} — Supabase's custom HTTPS endpoint</li>
 * <li>{@code pathStyleAccessEnabled(true)} — required by Supabase (no virtual
 * hosting)</li>
 * <li>{@code StaticCredentialsProvider} — using Supabase-generated S3 keys</li>
 * </ul>
 *
 * <p>
 * All credentials are injected through {@link SupabaseStorageProperties},
 * which reads from environment variables. Nothing is hardcoded here.
 */
@Configuration
@EnableConfigurationProperties(SupabaseStorageProperties.class)
public class SupabaseStorageConfig {

    private final SupabaseStorageProperties props;

    public SupabaseStorageConfig(SupabaseStorageProperties props) {
        this.props = props;
    }

    @Bean
    public S3Client supabaseS3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(props.getEndpoint()))
                .region(Region.of(props.getRegion()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey())))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                .build();
    }

    @Bean
    public S3Presigner supabaseS3Presigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(props.getEndpoint()))
                .region(Region.of(props.getRegion()))
                .credentialsProvider(
                        StaticCredentialsProvider.create(
                                AwsBasicCredentials.create(props.getAccessKey(), props.getSecretKey())))
                .serviceConfiguration(
                        S3Configuration.builder()
                                .pathStyleAccessEnabled(true)
                                .build())
                .build();
    }
}
