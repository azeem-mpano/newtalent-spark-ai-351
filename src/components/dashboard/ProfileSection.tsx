import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Save, Plus, Trash2, Briefcase, GraduationCap, Award, FolderOpen,
  Globe, Linkedin, Github, MapPin, Mail, Phone, Languages, Clock
} from "lucide-react";

type SkillObj = { name: string; level: string; yearsOfExperience: number };
type LangObj = { name: string; proficiency: string };
type ExpObj = { company: string; role: string; startDate: string; endDate: string; description: string; technologies: string[]; isCurrent: boolean };
type EduObj = { institution: string; degree: string; fieldOfStudy: string; startYear: number; endYear: number };
type CertObj = { name: string; issuer: string; issueDate: string };
type ProjObj = { name: string; description: string; technologies: string[]; role: string; link: string; startDate: string; endDate: string };
type AvailObj = { status: string; type: string; startDate?: string };

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LANG_PROFS = ["Basic", "Conversational", "Fluent", "Native"];
const AVAIL_STATUSES = ["Available", "Open to Opportunities", "Not Available"];
const AVAIL_TYPES = ["Full-time", "Part-time", "Contract"];

const emptySkill = (): SkillObj => ({ name: "", level: "Intermediate", yearsOfExperience: 1 });
const emptyLang = (): LangObj => ({ name: "", proficiency: "Conversational" });
const emptyExp = (): ExpObj => ({ company: "", role: "", startDate: "", endDate: "", description: "", technologies: [], isCurrent: false });
const emptyEdu = (): EduObj => ({ institution: "", degree: "", fieldOfStudy: "", startYear: new Date().getFullYear() - 4, endYear: new Date().getFullYear() });
const emptyCert = (): CertObj => ({ name: "", issuer: "", issueDate: "" });
const emptyProj = (): ProjObj => ({ name: "", description: "", technologies: [], role: "", link: "", startDate: "", endDate: "" });

const ProfileSection = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Structured fields
  const [skills, setSkills] = useState<SkillObj[]>([]);
  const [languages, setLanguages] = useState<LangObj[]>([]);
  const [experience, setExperience] = useState<ExpObj[]>([]);
  const [education, setEducation] = useState<EduObj[]>([]);
  const [certifications, setCertifications] = useState<CertObj[]>([]);
  const [projects, setProjects] = useState<ProjObj[]>([]);
  const [availability, setAvailability] = useState<AvailObj>({ status: "Available", type: "Full-time" });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) {
      setProfile(data);
      // Parse JSONB fields
      setSkills(Array.isArray(data.languages) ? [] : []); // will set from proper field
      try { setSkills(Array.isArray((data as any).skills) ? (data as any).skills.map((s: any) => typeof s === "string" ? { name: s, level: "Intermediate", yearsOfExperience: 1 } : s) : []); } catch { setSkills([]); }
      try { setLanguages(Array.isArray((data as any).languages) ? (data as any).languages : []); } catch { setLanguages([]); }
      try { setExperience(Array.isArray((data as any).experience) ? (data as any).experience : []); } catch { setExperience([]); }
      try { setEducation(Array.isArray((data as any).education) ? (data as any).education : []); } catch { setEducation([]); }
      try { setCertifications(Array.isArray((data as any).certifications) ? (data as any).certifications : []); } catch { setCertifications([]); }
      try { setProjects(Array.isArray((data as any).projects) ? (data as any).projects : []); } catch { setProjects([]); }
      try {
        const av = (data as any).availability;
        if (av && typeof av === "object") setAvailability(av);
      } catch {}
    }
    setLoading(false);
  };

  const updateField = useCallback((field: string, value: any) => {
    setProfile((p: any) => ({ ...p, [field]: value }));
  }, []);

  const updateProfile = async () => {
    setSaving(true);
    const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    const { error } = await supabase.from("profiles").update({
      first_name: profile.first_name,
      last_name: profile.last_name,
      full_name: fullName,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      headline: profile.headline,
      bio: profile.bio,
      linkedin_url: profile.linkedin_url,
      github_url: profile.github_url,
      portfolio_url: profile.portfolio_url,
      experience_years: profile.experience_years,
      skills: skills as any,
      languages: languages as any,
      experience: experience as any,
      education: education as any,
      certifications: certifications as any,
      projects: projects as any,
      availability: availability as any,
    }).eq("user_id", user!.id);
    if (error) toast.error(error.message);
    else toast.success("Profile updated successfully!");
    setSaving(false);
  };

  // Array helpers
  const updateArrayItem = <T,>(arr: T[], setArr: React.Dispatch<React.SetStateAction<T[]>>, idx: number, field: string, value: any) => {
    setArr(arr.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const removeArrayItem = <T,>(arr: T[], setArr: React.Dispatch<React.SetStateAction<T[]>>, idx: number) => {
    setArr(arr.filter((_, i) => i !== idx));
  };

  if (loading) return <div className="text-muted-foreground p-8 text-center">Loading profile...</div>;
  if (!profile) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Basic Information */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">First Name *</Label>
              <Input value={profile.first_name || ""} onChange={(e) => updateField("first_name", e.target.value)} placeholder="John" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Last Name *</Label>
              <Input value={profile.last_name || ""} onChange={(e) => updateField("last_name", e.target.value)} placeholder="Doe" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input value={profile.email || ""} disabled className="h-11 bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
              <Input value={profile.phone || ""} onChange={(e) => updateField("phone", e.target.value)} placeholder="+250 788 000 000" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Location *</Label>
              <Input value={profile.location || ""} onChange={(e) => updateField("location", e.target.value)} placeholder="Kigali, Rwanda" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Experience (years)</Label>
              <Input type="number" value={profile.experience_years || 0} onChange={(e) => updateField("experience_years", parseInt(e.target.value) || 0)} className="h-11" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Headline *</Label>
            <Input value={profile.headline || ""} onChange={(e) => updateField("headline", e.target.value)} placeholder="Backend Engineer – Node.js & AI Systems" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Bio</Label>
            <Textarea value={profile.bio || ""} onChange={(e) => updateField("bio", e.target.value)} rows={3} placeholder="Tell recruiters about your professional journey..." className="resize-y min-h-[80px]" />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Globe className="h-5 w-5 text-primary" /> Social Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Linkedin className="h-3 w-3" /> LinkedIn</Label>
              <Input value={profile.linkedin_url || ""} onChange={(e) => updateField("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Github className="h-3 w-3" /> GitHub</Label>
              <Input value={profile.github_url || ""} onChange={(e) => updateField("github_url", e.target.value)} placeholder="https://github.com/..." className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Portfolio</Label>
              <Input value={profile.portfolio_url || ""} onChange={(e) => updateField("portfolio_url", e.target.value)} placeholder="https://..." className="h-11" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" /> Skills *</span>
            <Button variant="outline" size="sm" onClick={() => setSkills([...skills, emptySkill()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Skill</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No skills added yet. Click "Add Skill" to get started.</p>}
          {skills.map((skill, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
              <Input placeholder="e.g. Node.js" value={skill.name} onChange={(e) => updateArrayItem(skills, setSkills, idx, "name", e.target.value)} className="h-9 flex-1" />
              <Select value={skill.level} onValueChange={(v) => updateArrayItem(skills, setSkills, idx, "level", v)}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{SKILL_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Input type="number" min={0} max={30} value={skill.yearsOfExperience} onChange={(e) => updateArrayItem(skills, setSkills, idx, "yearsOfExperience", parseInt(e.target.value) || 0)} className="h-9 w-16 text-center" />
                <span className="text-xs text-muted-foreground">yrs</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeArrayItem(skills, setSkills, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><Languages className="h-5 w-5 text-primary" /> Languages</span>
            <Button variant="outline" size="sm" onClick={() => setLanguages([...languages, emptyLang()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Language</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {languages.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Add your spoken languages.</p>}
          {languages.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
              <Input placeholder="e.g. English" value={lang.name} onChange={(e) => updateArrayItem(languages, setLanguages, idx, "name", e.target.value)} className="h-9 flex-1" />
              <Select value={lang.proficiency} onValueChange={(v) => updateArrayItem(languages, setLanguages, idx, "proficiency", v)}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{LANG_PROFS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeArrayItem(languages, setLanguages, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" /> Work Experience *</span>
            <Button variant="outline" size="sm" onClick={() => setExperience([...experience, emptyExp()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Experience</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Add your professional experience.</p>}
          {experience.map((exp, idx) => (
            <div key={idx} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Experience #{idx + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeArrayItem(experience, setExperience, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Company" value={exp.company} onChange={(e) => updateArrayItem(experience, setExperience, idx, "company", e.target.value)} className="h-9" />
                <Input placeholder="Role / Title" value={exp.role} onChange={(e) => updateArrayItem(experience, setExperience, idx, "role", e.target.value)} className="h-9" />
                <Input type="month" value={exp.startDate} onChange={(e) => updateArrayItem(experience, setExperience, idx, "startDate", e.target.value)} className="h-9" />
                <Input type="month" value={exp.endDate} onChange={(e) => updateArrayItem(experience, setExperience, idx, "endDate", e.target.value)} className="h-9" placeholder="End date" disabled={exp.isCurrent} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={exp.isCurrent} onChange={(e) => updateArrayItem(experience, setExperience, idx, "isCurrent", e.target.checked)} className="rounded" />
                Currently working here
              </label>
              <Textarea placeholder="Key responsibilities and achievements" value={exp.description} onChange={(e) => updateArrayItem(experience, setExperience, idx, "description", e.target.value)} rows={2} className="resize-y" />
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Technologies (comma-separated)</Label>
                <Input placeholder="Node.js, PostgreSQL, React" value={(exp.technologies || []).join(", ")} onChange={(e) => updateArrayItem(experience, setExperience, idx, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} className="h-9" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Education */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><GraduationCap className="h-5 w-5 text-primary" /> Education *</span>
            <Button variant="outline" size="sm" onClick={() => setEducation([...education, emptyEdu()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Education</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Add your academic background.</p>}
          {education.map((edu, idx) => (
            <div key={idx} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Education #{idx + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeArrayItem(education, setEducation, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Institution" value={edu.institution} onChange={(e) => updateArrayItem(education, setEducation, idx, "institution", e.target.value)} className="h-9" />
                <Input placeholder="Degree (e.g. Bachelor's)" value={edu.degree} onChange={(e) => updateArrayItem(education, setEducation, idx, "degree", e.target.value)} className="h-9" />
                <Input placeholder="Field of Study" value={edu.fieldOfStudy} onChange={(e) => updateArrayItem(education, setEducation, idx, "fieldOfStudy", e.target.value)} className="h-9" />
                <div className="flex gap-2">
                  <Input type="number" placeholder="Start Year" value={edu.startYear} onChange={(e) => updateArrayItem(education, setEducation, idx, "startYear", parseInt(e.target.value) || 0)} className="h-9" />
                  <Input type="number" placeholder="End Year" value={edu.endYear} onChange={(e) => updateArrayItem(education, setEducation, idx, "endYear", parseInt(e.target.value) || 0)} className="h-9" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><Award className="h-5 w-5 text-primary" /> Certifications</span>
            <Button variant="outline" size="sm" onClick={() => setCertifications([...certifications, emptyCert()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Certification</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {certifications.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Add any professional certifications.</p>}
          {certifications.map((cert, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
              <Input placeholder="Certification name" value={cert.name} onChange={(e) => updateArrayItem(certifications, setCertifications, idx, "name", e.target.value)} className="h-9 flex-1" />
              <Input placeholder="Issuer" value={cert.issuer} onChange={(e) => updateArrayItem(certifications, setCertifications, idx, "issuer", e.target.value)} className="h-9 w-[150px]" />
              <Input type="month" value={cert.issueDate} onChange={(e) => updateArrayItem(certifications, setCertifications, idx, "issueDate", e.target.value)} className="h-9 w-[150px]" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => removeArrayItem(certifications, setCertifications, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Projects */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg"><FolderOpen className="h-5 w-5 text-primary" /> Projects *</span>
            <Button variant="outline" size="sm" onClick={() => setProjects([...projects, emptyProj()])} className="gap-1"><Plus className="h-3.5 w-3.5" /> Add Project</Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Showcase your portfolio projects.</p>}
          {projects.map((proj, idx) => (
            <div key={idx} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">Project #{idx + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeArrayItem(projects, setProjects, idx)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Project name" value={proj.name} onChange={(e) => updateArrayItem(projects, setProjects, idx, "name", e.target.value)} className="h-9" />
                <Input placeholder="Your role" value={proj.role} onChange={(e) => updateArrayItem(projects, setProjects, idx, "role", e.target.value)} className="h-9" />
                <Input type="month" value={proj.startDate} onChange={(e) => updateArrayItem(projects, setProjects, idx, "startDate", e.target.value)} className="h-9" />
                <Input type="month" value={proj.endDate} onChange={(e) => updateArrayItem(projects, setProjects, idx, "endDate", e.target.value)} className="h-9" />
              </div>
              <Textarea placeholder="Project description" value={proj.description} onChange={(e) => updateArrayItem(projects, setProjects, idx, "description", e.target.value)} rows={2} className="resize-y" />
              <Input placeholder="Technologies (comma-separated)" value={(proj.technologies || []).join(", ")} onChange={(e) => updateArrayItem(projects, setProjects, idx, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))} className="h-9" />
              <Input placeholder="Project link (https://...)" value={proj.link} onChange={(e) => updateArrayItem(projects, setProjects, idx, "link", e.target.value)} className="h-9" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" /> Availability *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={availability.status} onValueChange={(v) => setAvailability({ ...availability, status: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{AVAIL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Type</Label>
              <Select value={availability.type} onValueChange={(v) => setAvailability({ ...availability, type: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>{AVAIL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Available From</Label>
              <Input type="date" value={availability.startDate || ""} onChange={(e) => setAvailability({ ...availability, startDate: e.target.value })} className="h-11" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end pb-8">
        <Button variant="hero" size="lg" onClick={updateProfile} disabled={saving} className="min-w-[200px]">
          <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSection;
