import { ApiClient } from "./client";

export interface Resume {
    id: string;
    userId: string;
    originalFileName: string;
    fileType: string;
    fileSize: number;
    status: string;
    targetRole?: string;
    templateId?: string;
    score?: number;
    createdAt: string;
    updatedAt: string;
}

export interface ExtractionResult {
    resumeId: string;
    status: string;
    pageCount: number;
    characterCount: number;
    extractedAt?: string;
    previewText?: string;
    message?: string;
}

export interface GeneratedPdfInfo {
    downloadUrl?: string;
    templateId?: string;
    generatedAt?: string;
    status: string;
    message?: string;
}

export interface ResumeData {
    schemaVersion: string;
    personalInfo: {
        name: string | null;
        email: string | null;
        phone: string | null;
        location: string | null;
        linkedin: string | null;
        github: string | null;
        portfolio: string | null;
    } | null;
    summary: string | null;
    education: Array<{
        institution: string | null;
        degree: string | null;
        fieldOfStudy: string | null;
        startDate: string | null;
        endDate: string | null;
        grade: string | null;
        description: string | null;
    }>;
    skills: {
        programmingLanguages: string[];
        frameworks: string[];
        libraries: string[];
        databases: string[];
        tools: string[];
        cloudPlatforms: string[];
        other: string[];
    };
    projects: Array<{
        name: string | null;
        description: string | null;
        technologies: string[];
        url: string | null;
        githubUrl: string | null;
        startDate: string | null;
        endDate: string | null;
    }>;
    experience: Array<{
        company: string | null;
        position: string | null;
        location: string | null;
        startDate: string | null;
        endDate: string | null;
        current: boolean | null;
        responsibilities: string[];
    }>;
    certifications: Array<{
        name: string | null;
        issuer: string | null;
        date: string | null;
        credentialUrl: string | null;
    }>;
    achievements: Array<{
        title: string | null;
        description: string | null;
        date: string | null;
    }>;
}

export type OptResumeData = ResumeData;

export const resumeClient = {
    /**
     * securely transmits binary payloads mirroring to the strict Spring Boot Multipart boundaries
     */
    uploadResume: async (file: File): Promise<Resume> => {
        const formData = new FormData();
        formData.append("file", file);

        return ApiClient.request("/api/v1/resumes", {
            method: "POST",
            body: formData,
        }) as Promise<Resume>;
    },

    getUserResumes: async (): Promise<Resume[]> => {
        const response = await ApiClient.get("/api/v1/resumes") as { resumes: Resume[] };
        return response.resumes;
    },

    getResume: async (id: string): Promise<Resume> => {
        return ApiClient.get(`/api/v1/resumes/${id}`) as Promise<Resume>;
    },

    deleteResume: async (id: string): Promise<{ message: string }> => {
        return ApiClient.request(`/api/v1/resumes/${id}`, { method: "DELETE" }) as Promise<{ message: string }>;
    },

    getPresignedUrl: async (id: string): Promise<{ url: string }> => {
        return ApiClient.get(`/api/v1/resumes/${id}/download`) as Promise<{ url: string }>;
    },

    getGeneratedPdfInfo: async (id: string): Promise<GeneratedPdfInfo> => {
        return ApiClient.get(`/api/v1/resumes/${id}/pdf/download`) as Promise<GeneratedPdfInfo>;
    },

    extractResume: async (id: string): Promise<ExtractionResult> => {
        return ApiClient.post(`/api/v1/resumes/${id}/extract`, {}) as Promise<ExtractionResult>;
    },

    getExtractionResult: async (id: string): Promise<ExtractionResult> => {
        return ApiClient.get(`/api/v1/resumes/${id}/extraction`) as Promise<ExtractionResult>;
    },

    structureResume: async (id: string): Promise<{ status: string, sectionsFound: string[] }> => {
        return ApiClient.post(`/api/v1/resumes/${id}/structure`, {}) as Promise<{ status: string, sectionsFound: string[] }>;
    },

    getResumeData: async (id: string): Promise<ResumeData> => {
        return ApiClient.get(`/api/v1/resumes/${id}/data`) as Promise<ResumeData>;
    },

    updateResumeData: async (id: string, data: ResumeData): Promise<{ status: string }> => {
        return ApiClient.request(`/api/v1/resumes/${id}/data`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        }) as Promise<{ status: string }>;
    },

    optimizeResume: async (id: string, targetRole: string): Promise<ResumeOptimization> => {
        return ApiClient.request(`/api/v1/resumes/${id}/optimize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetRole })
        }) as Promise<ResumeOptimization>;
    },

    getOptimization: async (id: string): Promise<ResumeOptimization | null> => {
        try {
            return await ApiClient.get(`/api/v1/resumes/${id}/optimization`) as ResumeOptimization;
        } catch {
            return null;
        }
    },

    acceptOptimization: async (id: string, optResumeData: OptResumeData): Promise<{ message: string }> => {
        return ApiClient.request(`/api/v1/resumes/${id}/optimization/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(optResumeData)
        }) as Promise<{ message: string }>;
    },

    rejectOptimization: async (id: string): Promise<{ message: string }> => {
        return ApiClient.request(`/api/v1/resumes/${id}/optimization/reject`, {
            method: "POST"
        }) as Promise<{ message: string }>;
    },

    generatePdf: async (id: string, templateId: string): Promise<{ downloadUrl?: string, stale?: boolean }> => {
        return ApiClient.request(`/api/v1/resumes/${id}/pdf`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId })
        }) as Promise<{ downloadUrl?: string, stale?: boolean }>;
    }
};

export interface ResumeOptimization {
    targetRole: string;
    originalData: ResumeData;
    optResumeData: OptResumeData;
    status: string;
    createdAt: string;
    updatedAt: string;
}
