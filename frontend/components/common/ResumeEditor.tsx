import React, { useState } from 'react';
import { ResumeData } from '@/lib/api/resumeClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Loader2, X } from 'lucide-react';

interface ResumeEditorProps {
    initialData: ResumeData;
    onSave: (data: ResumeData) => Promise<void>;
    onCancel: () => void;
}

export function ResumeEditor({ initialData, onSave, onCancel }: ResumeEditorProps) {
    const [data, setData] = useState<ResumeData>(initialData);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(data);
        } finally {
            setSaving(false);
        }
    };

    const updatePersonalInfo = (field: string, value: string) => {
        // @ts-expect-error - field dynamically maps to personalInfo keys
        setData(prev => ({
            ...prev,
            personalInfo: {
                ...(prev.personalInfo || {}),
                [field]: value
            }
        }));
    };

    const updateSummary = (value: string) => {
        setData(prev => ({ ...prev, summary: value }));
    };

    const updateArrayItem = (arrayName: keyof ResumeData, index: number, field: string, value: string | string[]) => {
        setData(prev => {
            const newArray = [...((prev[arrayName] as unknown[]) || [])];
            newArray[index] = { ...(newArray[index] as object), [field]: value };
            return { ...prev, [arrayName]: newArray as any }; // Cast to any to bypass complex structural typing for the top level ResumeData assignment
        });
    };

    const updateSkills = (category: string, value: string) => {
        setData(prev => ({
            ...prev,
            skills: {
                ...prev.skills,
                [category]: value.split(',').map(s => s.trim()).filter(Boolean)
            }
        }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Resume Data</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={saving}><X className="h-4 w-4 mr-2" /> Cancel</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-sm font-medium">Name</label><Input value={data.personalInfo?.name || ''} onChange={e => updatePersonalInfo('name', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">Email</label><Input value={data.personalInfo?.email || ''} onChange={e => updatePersonalInfo('email', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">Phone</label><Input value={data.personalInfo?.phone || ''} onChange={e => updatePersonalInfo('phone', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">Location</label><Input value={data.personalInfo?.location || ''} onChange={e => updatePersonalInfo('location', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">LinkedIn</label><Input value={data.personalInfo?.linkedin || ''} onChange={e => updatePersonalInfo('linkedin', e.target.value)} /></div>
                    <div><label className="text-sm font-medium">GitHub</label><Input value={data.personalInfo?.github || ''} onChange={e => updatePersonalInfo('github', e.target.value)} /></div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                <CardContent>
                    <Textarea rows={4} value={data.summary || ''} onChange={e => updateSummary(e.target.value)} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Experience</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {data.experience?.map((exp, i) => (
                        <div key={i} className="p-4 border rounded relative grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Company</label><Input value={exp.company || ''} onChange={e => updateArrayItem('experience', i, 'company', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Position</label><Input value={exp.position || ''} onChange={e => updateArrayItem('experience', i, 'position', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Start Date</label><Input value={exp.startDate || ''} onChange={e => updateArrayItem('experience', i, 'startDate', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">End Date</label><Input value={exp.endDate || ''} onChange={e => updateArrayItem('experience', i, 'endDate', e.target.value)} /></div>
                            <div className="col-span-full"><label className="text-sm font-medium">Responsibilities (one point per line)</label>
                                <Textarea rows={4} value={(exp.responsibilities || []).join('\n')} onChange={e => updateArrayItem('experience', i, 'responsibilities', e.target.value.split('\n'))} />
                            </div>
                        </div>
                    ))}
                    {(!data.experience || data.experience.length === 0) && <p className="text-muted-foreground text-sm">No experience to edit. Add feature coming soon.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Education</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {data.education?.map((edu, i) => (
                        <div key={i} className="p-4 border rounded grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Institution</label><Input value={edu.institution || ''} onChange={e => updateArrayItem('education', i, 'institution', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Degree</label><Input value={edu.degree || ''} onChange={e => updateArrayItem('education', i, 'degree', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Field of Study</label><Input value={edu.fieldOfStudy || ''} onChange={e => updateArrayItem('education', i, 'fieldOfStudy', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Grade</label><Input value={edu.grade || ''} onChange={e => updateArrayItem('education', i, 'grade', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Start Date</label><Input value={edu.startDate || ''} onChange={e => updateArrayItem('education', i, 'startDate', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">End Date</label><Input value={edu.endDate || ''} onChange={e => updateArrayItem('education', i, 'endDate', e.target.value)} /></div>
                        </div>
                    ))}
                    {(!data.education || data.education.length === 0) && <p className="text-muted-foreground text-sm">No education to edit.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    {data.projects?.map((proj, i) => (
                        <div key={i} className="p-4 border rounded grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium">Project Name</label><Input value={proj.name || ''} onChange={e => updateArrayItem('projects', i, 'name', e.target.value)} /></div>
                            <div><label className="text-sm font-medium">Technologies</label><Input value={(proj.technologies || []).join(', ')} onChange={e => updateArrayItem('projects', i, 'technologies', e.target.value.split(',').map((x: string) => x.trim()))} /></div>
                            <div className="col-span-full"><label className="text-sm font-medium">Description</label><Textarea value={proj.description || ''} onChange={e => updateArrayItem('projects', i, 'description', e.target.value)} /></div>
                        </div>
                    ))}
                    {(!data.projects || data.projects.length === 0) && <p className="text-muted-foreground text-sm">No projects to edit.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                    {Object.entries(data.skills || {}).map(([cat, list]) => (
                        <div key={cat}>
                            <label className="text-sm font-medium capitalize">{cat.replace(/([A-Z])/g, ' $1').trim()}</label>
                            <Input value={(list as string[]).join(', ')} onChange={e => updateSkills(cat, e.target.value)} placeholder="Comma separated..." />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
