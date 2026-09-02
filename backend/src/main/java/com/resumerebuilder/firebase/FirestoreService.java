package com.resumerebuilder.firebase;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class FirestoreService {

    private Firestore getFirestore() {
        return FirestoreClient.getFirestore();
    }

    public void saveDocument(String collection, String documentId, Object data) {
        try {
            getFirestore().collection(collection).document(documentId).set(data).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to save document to Firestore: " + e.getMessage(), e);
        }
    }

    /**
     * Partially updates a document — only the fields in {@code data} are written;
     * all other existing fields (e.g. userId) are preserved.
     * Use this for status / timestamp updates, NOT for initial document creation.
     */
    public void updateDocument(String collection, String documentId, Object data) {
        try {
            getFirestore().collection(collection).document(documentId)
                    .set(data, com.google.cloud.firestore.SetOptions.merge()).get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to update document in Firestore: " + e.getMessage(), e);
        }
    }

    public void deleteDocument(String collection, String documentId) {
        try {
            getFirestore().collection(collection).document(documentId).delete().get();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to delete document from Firestore: " + e.getMessage(), e);
        }
    }

    public <T> List<T> getDocumentsByField(String collection, String field, String value, Class<T> clazz) {
        try {
            QuerySnapshot snapshot = getFirestore().collection(collection)
                    .whereEqualTo(field, value)
                    .get()
                    .get();

            List<T> results = new ArrayList<>();
            for (QueryDocumentSnapshot doc : snapshot.getDocuments()) {
                results.add(doc.toObject(clazz));
            }
            return results;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to query documents: " + e.getMessage(), e);
        }
    }

    public <T> T getDocument(String collection, String documentId, Class<T> clazz) {
        try {
            DocumentSnapshot snapshot = getFirestore().collection(collection).document(documentId).get().get();
            if (snapshot.exists()) {
                return snapshot.toObject(clazz);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Failed to fetch document: " + e.getMessage(), e);
        }
    }
}
