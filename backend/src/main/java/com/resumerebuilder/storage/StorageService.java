package com.resumerebuilder.storage;

import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.net.URL;

public interface StorageService {

    /**
     * Upload a file to a specific storage bucket.
     * 
     * @param bucketName The name of the bucket (e.g., resume-files)
     * @param path       The path/filename inside the bucket
     * @param file       The multipart file to upload
     * @return The uploaded path/key
     */
    String uploadFile(String bucketName, String path, MultipartFile file);

    /**
     * Upload a raw byte array to a specific storage bucket.
     * 
     * @param bucketName  The name of the bucket
     * @param path        The path/filename inside the bucket
     * @param data        The binary byte array length
     * @param contentType The mime type (e.g. application/pdf)
     * @return The uploaded path/key
     */
    String uploadFile(String bucketName, String path, byte[] data, String contentType);

    /**
     * Delete a file from a specific storage bucket.
     * 
     * @param bucketName The name of the bucket
     * @param path       The path/filename inside the bucket
     */
    void deleteFile(String bucketName, String path);

    /**
     * Generate a short-lived presigned URL for downloading/viewing a file.
     * 
     * @param bucketName      The name of the bucket
     * @param path            The path/filename inside the bucket
     * @param durationMinutes How many minutes until the link expires
     * @return Valid HTTPS URL pointing directly to the file
     */
    URL generatePresignedUrl(String bucketName, String path, int durationMinutes);

    /**
     * Download a file from storage and return its content as an InputStream.
     * The caller is responsible for closing the stream.
     *
     * @param bucketName The name of the bucket
     * @param path       The path/filename inside the bucket
     * @return InputStream of the file content
     */
    InputStream downloadFile(String bucketName, String path);
}
