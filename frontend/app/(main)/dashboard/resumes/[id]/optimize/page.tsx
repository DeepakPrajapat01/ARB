'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { resumeClient, ResumeData, ResumeOptimization } from '@/lib/api/resumeClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, ChevronLeft, Sparkles, AlertTriangle } from 'lucide-react';

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

function formatValue(val: unknown): string {
    if (val === null || val === undefined) return '(empty)';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) return val.map(formatValue).join('\n');
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
}

function buildChanges(original: ResumeData, optimized: ResumeData): SectionChange[] {
    const changes: SectionChange[] = [];

    const compare = (key: string, label: string, orig: unknown, opt: unknown) => {
        const a = formatValue(orig);
        const b = formatValue(opt);
        if (a !== b) {
            changes.push({ key, label, original: a, suggested: b, status: 'pending' });
        }
    };

    compare('summary', 'Professional Summary', original.summary, optimized.summary);
    compare('skills', 'Skills', original.skills, optimized.skills);
    compare('experience', 'Experience', original.experience, optimized.experience);
    compare('projects', 'Projects', original.projects, optimized.projects);
    compare('certifications', 'Certifications', original.certifications, optimized.certifications);
    compare('achievements', 'Achievements', original.achievements, optimized.achievements);

    return changes;
}

function applyChanges(base: ResumeData, optimized: ResumeData, changes: SectionChange[]): ResumeData {
    const result: ResumeData = { ...base };
    for (const change of changes) {
        if (change.status === 'accepted') {
            (result as any)[change.key] = (optimized as any)[change.key];
        }
    }
    return result;
}

export default function OptimizePage() {
    const params = useParams();
    const router = useRouter();
    const { currentUser, loading } = useAuth();
    const resumeId = params.id as string;

    // Target role state
    const [targetRole, setTargetRole] = useState('');
    const [customRole, setCustomRole] = useState('');
    const [isOther, setIsOther] = useState(false);

    // Optimization state
    const [optimization, setOptimization] = useState<ResumeOptimization | null>(null);
    const [changes, setChanges] = useState<SectionChange[]>([]);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [error, setError] = useState('');
    const [phase, setPhase] = useState<'select' | 'review' | 'done'>('select');

    useEffect(() => {
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]);

    // Load existing optimization if any
    useEffect(() => {
        if (!currentUser) return;
        resumeClient.getOptimization(resumeId).then(opt => {
            if (opt && opt.status === 'OPTIMIZED') {
                setOptimization(opt);
                setChanges(buildChanges(opt.originalData, opt.optimizedData));
                setTargetRole(opt.targetRole);
                setPhase('review');
            }
        }).catch(() => { /* no pending optimization */ });
    }, [currentUser, resumeId]);

    const handleRoleChange = (val: string) => {
        setIsOther(val === 'Other');
        setTargetRole(val === 'Other' ? '' : val);
    };

    const effectiveRole = isOther ? customRole.trim() : targetRole;

    const handleOptimize = async () => {
        if (!effectiveRole) return;
        setError('');
        setIsOptimizing(true);
        try {
            const result = await resumeClient.optimizeResume(resumeId, effectiveRole);
            setOptimization(result);
            setChanges(buildChanges(result.originalData, result.optimizedData));
            setPhase('review');
        } catch (e: any) {
            setError(e.message || 'Optimization failed. Please try again.');
        } finally {
            setIsOptimizing(false);
        }
    };

    const setChangeStatus = (key: string, status: ChangeStatus) => {
        setChanges(prev => prev.map(c => c.key === key ? { ...c, status } : c));
    };

    const acceptAll = () => setChanges(prev => prev.map(c => ({ ...c, status: 'accepted' })));
    const rejectAll = () => setChanges(prev => prev.map(c => ({ ...c, status: 'rejected' })));

    const handleSave = async () => {
        if (!optimization) return;
        setIsSaving(true);
        setError('');
        try {
            const merged = applyChanges(optimization.originalData, optimization.optimizedData, changes);
            await resumeClient.acceptOptimization(resumeId, merged);
            setPhase('done');
        } catch (e: any) {
            setError(e.message || 'Failed to save changes.');
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
        } catch (e: any) {
            setError(e.message || 'Failed to reject.');
        } finally {
            setIsRejecting(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/resumes/${resumeId}`)}>
                        <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">AI Optimization</h1>
                        <p className="text-muted-foreground text-sm">Improve your resume presentation for a specific role</p>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Done screen */}
                {phase === 'done' && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Changes Saved!</h2>
                            <p className="text-muted-foreground mb-6">Your approved optimizations have been applied to your resume.</p>
                            <Button onClick={() => router.push(`/dashboard/resumes/${resumeId}`)}>View Resume</Button>
                        </CardContent>
                    </Card>
                )}

                {/* Target role selection */}
                {phase === 'select' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                Select Target Role
                            </CardTitle>
                            <CardDescription>Choose the role you are applying for. AI will improve your resume presentation without fabricating information.</CardDescription>
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
                                    <><Loader2 className="animate-spin h-4 w-4 mr-2" />Optimizing...</>
                                ) : (
                                    <><Sparkles className="h-4 w-4 mr-2" />Optimize Resume</>
                                )}
                            </Button>

                            <p className="text-xs text-muted-foreground text-center">
                                AI will improve clarity and presentation using only your existing information. No fabrications.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Review phase */}
                {phase === 'review' && optimization && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-card border rounded-lg">
                            <div>
                                <p className="font-medium">Target Role: <span className="text-primary">{optimization.targetRole}</span></p>
                                <p className="text-sm text-muted-foreground">{changes.filter(c => c.status === 'pending').length} changes pending review</p>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <Button variant="outline" size="sm" onClick={acceptAll}>Accept All</Button>
                                <Button variant="outline" size="sm" onClick={rejectAll}>Reject All</Button>
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving || changes.every(c => c.status === 'rejected')}
                                >
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : null}
                                    Save Accepted
                                </Button>
                                <Button variant="destructive" size="sm" onClick={handleReject} disabled={isRejecting}>
                                    {isRejecting ? <Loader2 className="animate-spin h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                    Discard All
                                </Button>
                            </div>
                        </div>

                        {changes.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center text-muted-foreground">
                                    <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-green-500" />
                                    No changes were suggested. Your resume already looks great for this role!
                                </CardContent>
                            </Card>
                        )}

                        {changes.map(change => (
                            <Card key={change.key} className={
                                change.status === 'accepted' ? 'border-green-500/50' :
                                    change.status === 'rejected' ? 'border-muted opacity-60' : ''
                            }>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base">{change.label}</CardTitle>
                                        <div className="flex items-center gap-2">
                                            {change.status === 'accepted' && <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Accepted</Badge>}
                                            {change.status === 'rejected' && <Badge variant="outline" className="text-muted-foreground">Rejected</Badge>}
                                            {change.status === 'pending' && (
                                                <div className="flex gap-1">
                                                    <Button size="sm" variant="outline" className="h-7 text-xs border-green-500/50 text-green-600 hover:bg-green-500/10"
                                                        onClick={() => setChangeStatus(change.key, 'accepted')}>
                                                        Accept
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                                        onClick={() => setChangeStatus(change.key, 'rejected')}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                            {change.status !== 'pending' && (
                                                <Button size="sm" variant="ghost" className="h-7 text-xs"
                                                    onClick={() => setChangeStatus(change.key, 'pending')}>
                                                    Undo
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Mobile: stacked. Desktop: side-by-side */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Original</p>
                                            <div className="bg-muted/50 rounded-md p-3 text-sm whitespace-pre-wrap min-h-[60px] font-mono text-xs">
                                                {change.original}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">AI Suggestion</p>
                                            <div className="bg-primary/5 border border-primary/20 rounded-md p-3 text-sm whitespace-pre-wrap min-h-[60px] font-mono text-xs">
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
