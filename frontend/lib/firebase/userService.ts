import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "./firestore";

type AdditionalUserData = Record<string, string | null | undefined>;

export async function createUserProfileDocument(user: User, additionalData?: AdditionalUserData) {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        const { email, displayName, photoURL } = user;
        const createdAt = serverTimestamp();

        try {
            await setDoc(userRef, {
                uid: user.uid,
                email,
                name: displayName || email?.split("@")[0] || "User",
                photoURL,
                createdAt,
                updatedAt: createdAt,
                provider: user.providerData?.[0]?.providerId || "password",
                ...additionalData,
            });
        } catch (error) {
            console.error("Error creating user profile document", error);
        }
    } else {
        // If document already exists, update only the timestamp to record the latest login
        try {
            await setDoc(userRef, { updatedAt: serverTimestamp() }, { merge: true });
        } catch (error) {
            console.error("Error updating user document", error);
        }
    }
}
