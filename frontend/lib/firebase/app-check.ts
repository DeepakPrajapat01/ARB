import { AppCheck, initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { app } from "./config";

/**
 * App Check Foundation — Dev/Prod Guide:
 *
 * LOCAL DEVELOPMENT:
 *   To use App Check in dev, set the debug token in your browser console BEFORE the app loads:
 *   self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
 *   Then copy the printed token from console and add it in Firebase Console (App Check > Debug tokens).
 *
 * PRODUCTION:
 *   - Add your reCAPTCHA v3 site key to NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY
 *   - Enable App Check enforcement in Firebase Console only after adding the site key
 *   - Do NOT enable enforcement until real token is configured — it will break production
 */
export function initAppCheck(): AppCheck | null {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY) {
        return initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY),
            isTokenAutoRefreshEnabled: true,
        });
    }
    return null;
}
