# How to Run AI Resume Rebuilder (PowerShell)

## Prerequisites

Make sure these are installed before starting:

| Tool | Version | Check |
|------|---------|-------|
| Java | 21+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 18+ | `node -version` |
| npm | 9+ | `npm -version` |

---

## Step 1 — Configure the Backend

Copy the example env file and fill in your secrets:

```powershell
cd C:\Users\user\Downloads\AIResume\backend
Copy-Item .env.example .env
notepad .env
```

Fill in the `.env` file:

```env
# Path to your Firebase Admin SDK service account JSON
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\your\firebase-service-account.json

# Supabase Storage (S3-compatible credentials)
SUPABASE_STORAGE_ENDPOINT=https://your-project-id.supabase.co/storage/v1/s3
SUPABASE_STORAGE_REGION=your-region
SUPABASE_STORAGE_ACCESS_KEY=your-s3-access-key
SUPABASE_STORAGE_SECRET_KEY=your-s3-secret-key
SUPABASE_STORAGE_BUCKET_RESUMES=resume-files

# Gemini AI (from https://aistudio.google.com/apikey)
AI_API_KEY=your-gemini-api-key
AI_MODEL=gemini-1.5-flash
AI_BASE_URL=https://generativelanguage.googleapis.com
```

> **Where to get each credential:**
> - `firebase-service-account.json` → Firebase Console → Project Settings → Service Accounts → Generate new private key
> - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` → Supabase Dashboard → Project Settings → API
> - `AI_API_KEY` → https://aistudio.google.com/apikey

---

## Step 2 — Configure the Frontend

The frontend `.env.local` file already exists. Verify it has the correct Firebase config:

```powershell
cd C:\Users\user\Downloads\AIResume\frontend
notepad .env.local
```

It should contain **only** these lines (remove any code or passwords that were accidentally added):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

> **Where to get Firebase config:** Firebase Console → Project Settings → Your Apps → Web App → SDK setup

---

## Step 3 — Run the Backend

Open **PowerShell Terminal 1**:

```powershell
cd C:\Users\user\Downloads\AIResume\backend
mvn spring-boot:run
```

Wait until you see:
```
Started ResumeRebuilderApplication in X.XXX seconds
```

The backend runs on: **http://localhost:8080**

> **First run takes longer** — Maven downloads all dependencies (~2 min).

---

## Step 4 — Run the Frontend

Open **PowerShell Terminal 2** (keep Terminal 1 running):

```powershell
cd C:\Users\user\Downloads\AIResume\frontend
npm install
npm run dev
```

Wait until you see:
```
▲ Next.js
- Local: http://localhost:3000
```

Open your browser at: **http://localhost:3000**

---

## Step 5 — Verify Everything Works

1. Open **http://localhost:3000**
2. Click **Sign Up** → create an account
3. Log in and go to **Dashboard**
4. Upload a PDF or DOCX resume (max 5 MB)
5. Click **Extract Text** on the resume detail page
6. Click **Analyze with AI** to structure the resume
7. Click **Optimize Resume** or navigate to `/dashboard/resumes/{id}/optimize`
8. Select a target role and click **Optimize Resume**
9. Review AI suggestions and Accept / Reject changes

---

## Useful Commands

```powershell
# Run backend tests
cd C:\Users\user\Downloads\AIResume\backend
mvn clean test

# Build backend JAR
mvn clean package -DskipTests

# Check frontend for TypeScript errors
cd C:\Users\user\Downloads\AIResume\frontend
npx tsc --noEmit

# Build frontend for production
npm run build
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `GOOGLE_APPLICATION_CREDENTIALS` error | Make sure the path in `.env` uses forward slashes or escaped backslashes |
| Port 8080 already in use | `netstat -ano \| findstr :8080` then `taskkill /PID <pid> /F` |
| Port 3000 already in use | Change port: `npm run dev -- --port 3001` |
| Firebase token error | Verify service account JSON is from the correct Firebase project |
| Supabase upload fails | Make sure `resume-files` bucket exists in your Supabase Storage |
| AI returns empty result | Verify `AI_API_KEY` is set and Gemini API is enabled in Google AI Studio |
