package com.resumerebuilder.auth;

import com.google.firebase.auth.FirebaseToken;
import com.resumerebuilder.firebase.FirebaseTokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @Autowired
    private FirebaseTokenService firebaseTokenService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            FirebaseToken token = firebaseTokenService.extractTokenFromRequest(request);

            Map<String, Object> response = new HashMap<>();
            response.put("uid", token.getUid());
            response.put("email", token.getEmail());
            response.put("name", token.getName());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
        }
    }
}
