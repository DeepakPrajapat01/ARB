package com.resumerebuilder.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class FirebaseTokenService {

    public FirebaseToken verifyToken(String bearerToken) {
        if (!StringUtils.hasText(bearerToken) || !bearerToken.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String tokenID = bearerToken.substring(7);
        try {
            return FirebaseAuth.getInstance().verifyIdToken(tokenID);
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Firebase Token");
        }
    }

    public FirebaseToken extractTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        return verifyToken(header);
    }
}
