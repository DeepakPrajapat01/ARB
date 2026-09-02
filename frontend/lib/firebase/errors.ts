interface FirebaseError {
    code?: string;
    message?: string;
}

function isFirebaseError(error: unknown): error is FirebaseError {
    return typeof error === "object" && error !== null && "code" in error;
}

export function getAuthErrorMessage(error: unknown): string {
    const code = isFirebaseError(error) ? (error.code ?? "") : "";
    switch (code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email or password is incorrect.";
        case "auth/email-already-in-use":
            return "This email is already registered.";
        case "auth/weak-password":
            return "Your password must be at least 6 characters.";
        case "auth/invalid-email":
            return "Please enter a valid email address.";
        case "auth/network-request-failed":
            return "Network error. Please check your connection.";
        case "auth/too-many-requests":
            return "Too many failed attempts. Please try again later.";
        case "auth/popup-closed-by-user":
            return "Sign in was cancelled.";
        default:
            return isFirebaseError(error)
                ? (error.message ?? "Unable to sign in. Please try again.")
                : "Unable to sign in. Please try again.";
    }
}
