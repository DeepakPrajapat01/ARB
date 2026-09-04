# AI Resume Rebuilder

## 1. Product Overview
The AI Resume Rebuilder is a student-first tool that takes an existing PDF/DOCX resume, extracts its structured data, improves it via AI without inventing facts, and regenerates a polished ATS-friendly PDF resume in one of several professional templates.

## 2. Technology Stack
- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zod, React Hook Form
- **Backend**: Spring Boot 3.3.x, Java 21, Maven
- **Database/Files**: Firebase Cloud Firestore, Firebase Storage
- **Auth**: Firebase Authentication

## 3. Architecture
Client -> Next.js Frontend -> Spring Boot REST API -> AI APIs / PDF Generator / Firebase

## 4. Repository Structure
- `/frontend`: Next.js application
- `/backend`: Spring Boot application
- `/docs`: Project documentation

## 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 6. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```


## 8. How to run locally
1. Run backend (port 8080)
2. Run frontend (port 3000)

## 9. Health-check endpoint
Verify backend is up at `http://localhost:8080/api/v1/health`.

## 10. Planned Development Milestones
- [x] Milestone 1: Project Foundation (Repository layout, health-checks)
- [ ] Milestone 2: Firebase Auth & User Model
- [ ] Milestone 3: Resume Upload & Extraction
- [ ] Milestone 4: AI Optimization
- [ ] Milestone 5: Output Generation (Templates & PDF)
