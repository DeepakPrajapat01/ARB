import { getStorage } from "firebase/storage";
import { app } from "./config";

// Note: Storage requires Blaze plan for full functionality in some regions.
// This is initialized as a foundation for future Resume Upload functionality.
export const storage = getStorage(app);
