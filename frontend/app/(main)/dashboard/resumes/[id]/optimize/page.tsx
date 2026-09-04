'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { resumeClient, ResumeData, OptResumeData, ResumeOptimization } from '@/lib/api/resumeClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, CheckCircle2, XCircle, ChevronLeft, Sparkles, AlertTriangle,
    ChevronRight, FileText
} from 'lucide-react';

const TARGET_ROLES = [
    'Software Engineer',
    'Android Developer',
    'Java Developer',
    'Backend Developer',
    'Frontend Developer',
    'Full Stack Developer',
    'Web Developer',
    'Data Analyst',
    'Software Developer',
    'Other',
];

type ChangeStatus = 'pending' | 'accepted' | 'rejected';

interface SectionChange {
    key: string;
    label: string;
    original: string;
    suggested: string;
    status: ChangeStatus;
}

// ── Human-readable formatters ──────────────────────────────────────────────

function formatSkills(skills: ResumeData['skills']): string {
    if (!skills) return '(none)';
    const SKILL_LABELS: Record<string, string> = {
        programmingLanguages: 'Programming Languages',
        frameworks: 'Frameworks',
        libraries: 'Libraries',
        databases: 'Databases',
        tools: 'Tools',
        cloudPlatforms: 'Cloud Platforms',
        other: 'Other',
    };
    return Object.entries(skills)
        .filter(([, items]) => Array.isArray(items) && items.length > 0)
        .map(([key, items]) => `${SKILL_LABELS[key] ?? key}: ${(items as string[]).join(' · ')}`)
        .join('\n');
}

function formatExperience(exp: ResumeData['experience']): string {
    if (!exp || exp.length === 0) return '(none)';
    return exp.map(e => {
        const header = `${e.position ?? ''} at ${e.company ?? ''}`;
        const dates = [e.startDate, e.current ? 'Present' : e.endDate].filter(Boolean).join(' – ');
        const bullets = (e.responsibilities ?? []).map(r => `  • ${r}`).join('\n');
        return [header, dates ? `  ${dates}` : '', bullets].filter(Boolean).join('\n');
    }).join('\n\n');
}

function formatProjects(projects: ResumeData['projects']): string {
    if (!projects || projects.length === 0) return '(none)';
    return projects.map(p => {
        const tech = p.technologies?.length ? `  Technologies: ${p.technologies.join(', ')}` : '';
        return [`${p.name ?? ''}`, tech, `  ${p.description ?? ''}`].filter(Boolean).join('\n');
    }).join('\n\n');
}

function formatCertifications(certs: ResumeData['certifications']): string {
    if (!certs || certs.length === 0) return '(none)';
    return certs.map(c => `${c.name ?? ''} — ${c.issuer ?? ''} (${c.date ?? ''})`).join('\n');
}

function formatAchievements(ach: ResumeData['achievements']): string {
    if (!ach || ach.length === 0) return '(none)';
    return ach.map(a => `${a.title ?? ''}: ${a.description ?? ''}`).join('\n');
}

function formatValue(key: string, val: unknown): string {
    if (val === null || val === undefined) return '(empty)';
    if (typeof val === 'string') return val || '(empty)';
    if (key === 'skills') return formatSkills(val as ResumeData['skills']);
    if (key === 'experience') return formatExperience(val as ResumeData['experience']);
    if (key === 'projects') return formatProjects(val as ResumeData['projects']);
    if (key === 'certifications') return formatCertifications(val as ResumeData['certifications']);
    if (key === 'achievements') return formatAchievements(val as ResumeData['achievements']);
    if (Array.isArray(val)) return val.join('\n');
    return String(val);
}

function buildChanges(original: ResumeData, optimized: ResumeData): SectionChange[] {
    const changes: SectionChange[] = [];
    const SECTIONS: Array<{ key: keyof ResumeData; label: string }> = [
        { key: 'summary', label: 'Professional Summary' },
        { key: 'skills', label: 'Skills' },
        { key: 'experience', label: 'Work Experience' },
        { key: 'projects', label: 'Projects' },
        { key: 'certifications', label: 'Certifications' },
        { key: 'achievements', label: 'Achievements' },
    ];
    for (const { key, label } of SECTIONS) {
        const a = formatValue(key, original[key]);
        const b = formatValue(key, optimized[key]);
        if (a !== b) {
            changes.push({ key, label, original: a, suggested: b, status: 'pending' });
        }
    }
    return changes;
}

function applyChanges(base: ResumeData, optResumeData: OptResumeData, changes: SectionChange[]): OptResumeData {
    const result: any = { ...base };
    for (const change of changes) {
        if (change.status === 'accepted') {
            result[change.key] = (optResumeData as any)[change.key];
        }
    }
    return result as OptResumeData;
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function OptimizePage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser, loading } = useAuth();
    const resumeId = params.id as string;

    const [targetRole, setTargetRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [isOther, setIsOther] = useState(false);

    const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
    const [changes, setChanges] = useState<SectionChange[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [error, setError] = useState('');
    const [phase, setPhase] = useState<'select' | 'review' | 'done'>('select');

    useEffect(() => {
        if (!loading && !currentUser) router.push('/login');
    }, [currentUser, loading, router]);

    // Load existing optimization if pending review
    useEffect(() => {
        if (!currentUser) return;
        resumeClient.getOptimization(resumeId).then(opt => {
            if (opt && opt.status === 'OPTIMIZED') {
                setOptimization(opt);
                setChanges(buildChanges(opt.originalData, opt.optResumeData));
                setTargetRole(opt.targetRole);
                setPhase('review');
            }
        }).catch(() => { /* no pending optimization */ });
    }, [currentUser, resumeId]);

    const effectiveRole = isOther ? customRole.trim() : targetRole;

    const handleRoleChange = (val: string) => {
        setIsOther(val === 'Other');
        setTargetRole(val === 'Other' ? '' : val);
    };

    const handleOptimize = async () => {
        if (!effectiveRole) return;
        setError('');
        setIsOptimizing(true);
        try {
            const result = await resumeClient.optimizeResume(resumeId, effectiveRole);
            setOptimization(result);
            setChanges(buildChanges(result.originalData, result.optResumeData));
            setPhase('review');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Optimization failed. Please try again.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const setChangeStatus = (key: string, status: ChangeStatus) => {
        setChanges(prev => prev.map(c => c.key === key ? { ...c, status } : c));
    };

    const acceptAll = () => setChanges(prev => prev.map(c => ({ ...c, status: 'accepted' as ChangeStatus })));
    const rejectAll = () => setChanges(prev => prev.map(c => ({ ...c, status: 'rejected' as ChangeStatus })));

    const handleSave = async () => {
        if (!optimization) return;
        setIsSaving(true);
        setError('');
        try {
            const merged = applyChanges(optimization.originalData, optimization.optResumeData, changes);
            await resumeClient.acceptOptimization(resumeId, merged);
            setPhase('done');
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to save changes.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        setError('');
        try {
            await resumeClient.rejectOptimization(resumeId);
            router.push(`/dashboard/resumes/${resumeId}`);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to discard optimization.');
        } finally {
            setIsRejecting(false);
        }
    };

    const pendingCount = changes.filter(c => c.status === 'pending').length;
    const acceptedCount = changes.filter(c => c.status === 'accepted').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/resumes/${resumeId}`)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">AI Optimization</h1>
                        <p className="text-muted-foreground text-sm">Improve your resume for a specific role — only your real information is used</p>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* ── DONE PHASE ─────────────────────────────────────────── */}
                {phase === 'done' && (
                    <Card className="border-green-500/30">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold mb-1">Resume Optimized Successfully</h2>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    Your approved AI improvements have been saved. Your resume is ready for formatting.
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
                                <Button
                                    size="lg"
                                    className="w-full"
                                    onClick={() => router.push(`/dashboard/resumes/${resumeId}/preview`)}
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    Choose Resume Template
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground"
                                    onClick={() => router.push(`/dashboard/resumes/${resumeId}`)}
                                >
                                    Review Resume Data
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── SELECT PHASE ───────────────────────────────────────── */}
                {phase === 'select' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Select Target Role
                            </CardTitle>
                            <CardDescription>
                                Choose the role you&apos;re applying for. AI will improve clarity and presentation using only your existing information — no fabrications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">What role are you applying for?</label>
                                <select
                                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    value={isOther ? 'Other' : targetRole}
                                    onChange={e => handleRoleChange(e.target.value)}
                                >
                                    <option value="">Select target role</option>
                                    {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            {isOther && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Enter your role</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Cloud Engineer"
                                        className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={customRole}
                                        onChange={e => setCustomRole(e.target.value)}
                                    />
                                </div>
                            )}

                            <Button
                                className="w-full"
                                disabled={!effectiveRole || isOptimizing}
                                onClick={handleOptimize}
                            >
                                {isOptimizing ? (
                                    <><Loader2 className="animate-spin h-4 w-4 mr-2" />Analyzing your resume...</>
                                ) : (
                                    <><Sparkles className="h-4 w-4 mr-2" />Optimize Resume</>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* ── REVIEW PHASE ───────────────────────────────────────── */}
                {phase === 'review' && optimization && (
                    <div className="space-y-4">

                        {/* Sticky action bar */}
                        <div className="bg-card border rounded-xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div>
                                    <p className="font-semibold">
                                        Target Role: <span className="text-primary">{optimization.targetRole}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {changes.length} section{changes.length !== 1 ? 's' : ''} with AI suggestions
                                        {pendingCount > 0 ? ` · ${pendingCount} pending review` : ''}
                                        {acceptedCount > 0 ? ` · ${acceptedCount} accepted` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Primary action */}
                            <Button
                                className="w-full"
                                onClick={handleSave}
                                disabled={isSaving || changes.every(c => c.status === 'rejected')}
                                size="lg"
                            >
                                {isSaving
                                    ? <><Loader2 className="animate-spin h-4 w-4 mr-2" />Saving...</>
                                    : <><CheckCircle2 className="h-4 w-4 mr-2" />Save Accepted Changes</>
                                }
                            </Button>

                            {/* Secondary actions */}
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={acceptAll} className="flex-1">
                                    Accept All
                                </Button>
                                <Button variant="outline" size="sm" onClick={rejectAll} className="flex-1">
                                    Reject All
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleReject}
                                    disabled={isRejecting}
                                    className="flex-1"
                                >
                                    {isRejecting
                                        ? <Loader2 className="animate-spin h-4 w-4 mr-1" />
                                        : <XCircle className="h-4 w-4 mr-1" />
                                    }
                                    Discard All
                                </Button>
                            </div>
                        </div>

                        {/* No changes */}
                        {changes.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                                    No changes were suggested. Your resume already looks great for this role!
                                    <div className="mt-4">
                                        <Button onClick={() => setPhase('done')}>Continue to Template Selection</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Change cards */}
                        {changes.map(change => (
                            <Card
                                key={change.key}
                                className={
                                    change.status === 'accepted' ? 'border-green-500/40 bg-green-500/[0.02]' :
                                        change.status === 'rejected' ? 'border-muted opacity-55' : ''
                                }
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <CardTitle className="text-base">{change.label}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            {change.status === 'accepted' && (
                                                <Badge className="bg-green-500/15 text-green-600 border border-green-500/30">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Accepted
                                                </Badge>
                                            )}
                                            {change.status === 'rejected' && (
                                                <Badge variant="outline" className="text-muted-foreground">Rejected</Badge>
                                            )}
                                            {change.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-green-500/50 text-green-600 hover:bg-green-500/10"
                                                        onClick={() => setChangeStatus(change.key, 'accepted')}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs"
                                                        onClick={() => setChangeStatus(change.key, 'rejected')}
                                                    >
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {change.status !== 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-muted-foreground"
                                                    onClick={() => setChangeStatus(change.key, 'pending')}
                                                >
                                                    Undo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Original</p>
                                            <div className="bg-muted/40 rounded-md p-3 text-sm whitespace-pre-wrap leading-relaxed min-h-[60px]">
                                                {change.original}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">AI Suggestion</p>
                                            <div className="bg-primary/5 border border-primary/15 rounded-md p-3 text-sm whitespace-pre-wrap leading-relaxed min-h-[60px]">
                                                {change.suggested}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
