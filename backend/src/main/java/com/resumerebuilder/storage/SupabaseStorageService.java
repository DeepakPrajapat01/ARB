package com.resumerebuilder.storage;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.time.Duration;

@Service
public class SupabaseStorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    public SupabaseStorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    @Override
    public String uploadFile(String bucketName, String path, MultipartFile file) {
        try {
            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putOb, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return path;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read file content for upload.", e);
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload file to storage.", e);
        }
    }

    @Override
    public String uploadFile(String bucketName, String path, byte[] data, String contentType) {
        try {
            PutObjectRequest putOb = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .contentType(contentType)
                    .build();

            s3Client.putObject(putOb, RequestBody.fromBytes(data));
            return path;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload binary file to storage.", e);
        }
    }

    @Override
    public void deleteFile(String bucketName, String path) {
        try {
            DeleteObjectRequest delReq = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .build();
            s3Client.deleteObject(delReq);
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete file from storage.", e);
        }
    }

    @Override
    public URL generatePresignedUrl(String bucketName, String path, int durationMinutes) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .build();

            GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(durationMinutes))
                    .getObjectRequest(getObjectRequest)
                    .build();

            PresignedGetObjectRequest presignedRequest = s3Presigner.presignGetObject(presignRequest);
            return presignedRequest.url();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate presigned URL.", e);
        }
    }

    @Override
    public InputStream downloadFile(String bucketName, String path) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(path)
                    .build();
            // Returns a ResponseInputStream which implements InputStream.
            // The caller (DocumentExtractionService) is responsible for closing it.
            return s3Client.getObject(getObjectRequest);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download file from storage: " + path, e);
        }
    }
}
