import { useState, useCallback, useRef, KeyboardEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Save, Briefcase, MapPin, DollarSign, Calendar, GraduationCap, Link, X, Check, FileText, Sparkles } from "lucide-react";

type Job = {
  id: string; title: string; company: string; location: string; job_type: string;
  experience_level: string; salary_min: number | null; salary_max: number | null;
  currency: string | null; description: string; requirements: string[];
  responsibilities: string[]; benefits: string[]; skills_required: string[];
  require_linkedin: boolean | null; require_github: boolean | null;
  require_portfolio: boolean | null; status: string; deadline: string | null;
  created_at: string; recruiter_id: string;
};

type FormState = {
  title: string; company: string; location: string; job_type: string;
  experience_level: string; salary_min: number | null; salary_max: number | null;
  currency: string; description: string; requirements: string[];
  responsibilities: string[]; benefits: string[]; skills_required: string[];
  require_linkedin: boolean; require_github: boolean; require_portfolio: boolean;
  deadline: string | null;
};

const emptyJob: FormState = {
  title: "", company: "", location: "", job_type: "Full-time", experience_level: "Mid-level",
  salary_min: null, salary_max: null, currency: "USD",
  description: "", requirements: [], responsibilities: [],
  benefits: [], skills_required: [],
  require_linkedin: false, require_github: false, require_portfolio: false,
  deadline: null,
};

const steps = [
  { label: "Basic Info", icon: Briefcase, desc: "Job title, location & salary" },
  { label: "Description", icon: FileText, desc: "Role details & benefits" },
  { label: "Requirements", icon: Sparkles, desc: "Skills & professional links" },
];

const JobFormDialog = ({ open, job, onClose, onSaved }: { open: boolean; job: Job | null; onClose: () => void; onSaved: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(job ? {
    title: job.title, company: job.company, location: job.location, job_type: job.job_type,
    experience_level: job.experience_level, salary_min: job.salary_min, salary_max: job.salary_max,
    currency: job.currency || "USD", description: job.description,
    requirements: job.requirements, responsibilities: job.responsibilities,
    benefits: job.benefits, skills_required: job.skills_required,
    require_linkedin: job.require_linkedin ?? false, require_github: job.require_github ?? false,
    require_portfolio: job.require_portfolio ?? false, deadline: job.deadline ? job.deadline.split("T")[0] : null,
  } : emptyJob);
  const [loading, setLoading] = useState(false);

  // Stable field updater — prevents re-render focus issues
  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addToArray = useCallback((field: "requirements" | "responsibilities" | "benefits" | "skills_required", value: string) => {
    const val = value.trim();
    if (!val) return;
    setForm((prev) => {
      if (prev[field].includes(val)) return prev;
      return { ...prev, [field]: [...prev[field], val] };
    });
  }, []);

  const removeFromArray = useCallback((field: "requirements" | "responsibilities" | "benefits" | "skills_required", val: string) => {
    setForm((prev) => ({ ...prev, [field]: prev[field].filter((v) => v !== val) }));
  }, []);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.title || !form.company || !form.location || !form.description) {
      toast.error("Please fill in all required fields");
      setStep(0);
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        recruiter_id: user.id,
      };
      if (job) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", job.id);
        if (error) throw error;
        toast.success("Job updated successfully!");
      } else {
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) throw error;
        toast.success("Job created successfully!");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const progressValue = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-xl">{job ? "Edit Job Posting" : "Create New Job Posting"}</DialogTitle>
          <DialogDescription>Fill in the details to {job ? "update" : "publish"} your job listing.</DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="px-6 pt-2">
          <Progress value={progressValue} className="h-1.5" />
        </div>

        {/* Step indicators */}
        <div className="px-6 pt-3">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                  step === i
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : i < step
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">{steps[step].desc}</p>
        </div>

        <div className="p-6 space-y-5">
          {step === 0 && <StepBasicInfo form={form} updateField={updateField} />}
          {step === 1 && <StepDetails form={form} updateField={updateField} addToArray={addToArray} removeFromArray={removeFromArray} />}
          {step === 2 && <StepRequirements form={form} updateField={updateField} addToArray={addToArray} removeFromArray={removeFromArray} />}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              ← Previous
            </Button>
            {step < 2 ? (
              <Button type="button" variant="default" onClick={() => setStep(step + 1)}>
                Next →
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={loading} className="min-w-[160px] shadow-md">
                <Save className="h-4 w-4 mr-2" /> {loading ? "Saving..." : job ? "Update Job" : "Publish Job"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── Step Components (stable — no inline re-definitions) ─── */

const StepBasicInfo = ({ form, updateField }: { form: FormState; updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) => (
  <div className="space-y-5 animate-in fade-in duration-200">
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Job Title <span className="text-destructive">*</span></Label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="e.g. Senior Frontend Developer" className="pl-10 h-11" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Company <span className="text-destructive">*</span></Label>
        <Input value={form.company} onChange={(e) => updateField("company", e.target.value)} placeholder="Company name" className="h-11" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Location <span className="text-destructive">*</span></Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="e.g. Remote, Nairobi, Lagos" className="pl-10 h-11" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Job Type</Label>
        <Select value={form.job_type} onValueChange={(v) => updateField("job_type", v)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Experience Level</Label>
        <Select value={form.experience_level} onValueChange={(v) => updateField("experience_level", v)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["Entry-level", "Mid-level", "Senior", "Lead", "Executive"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Application Deadline</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input type="date" value={form.deadline || ""} onChange={(e) => updateField("deadline", e.target.value || null)} className="pl-10 h-11" />
        </div>
      </div>
    </div>

    <Separator />

    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4" /> Salary Range</Label>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Minimum</Label>
          <Input type="number" value={form.salary_min ?? ""} onChange={(e) => updateField("salary_min", e.target.value ? parseInt(e.target.value) : null)} placeholder="50,000" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Maximum</Label>
          <Input type="number" value={form.salary_max ?? ""} onChange={(e) => updateField("salary_max", e.target.value ? parseInt(e.target.value) : null)} placeholder="80,000" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Currency</Label>
          <Select value={form.currency} onValueChange={(v) => updateField("currency", v)}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["USD", "EUR", "GBP", "KES", "NGN", "ZAR", "RWF", "TZS", "UGX", "CAD", "AUD"].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </div>
);

const TagInput = ({ label, items, onAdd, onRemove, placeholder }: {
  label: string; items: string[]; onAdd: (v: string) => void; onRemove: (v: string) => void; placeholder: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          className="h-11"
        />
        <Button type="button" variant="outline" onClick={handleAdd} className="h-11 px-4 shrink-0">
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((v, i) => (
            <Badge key={`${v}-${i}`} variant="secondary" className="pl-3 pr-1.5 py-1.5 text-sm flex items-center gap-1.5">
              {v}
              <button type="button" onClick={() => onRemove(v)} className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-destructive/20 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const StepDetails = ({ form, updateField, addToArray, removeFromArray }: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  addToArray: (field: "requirements" | "responsibilities" | "benefits" | "skills_required", v: string) => void;
  removeFromArray: (field: "requirements" | "responsibilities" | "benefits" | "skills_required", v: string) => void;
}) => (
  <div className="space-y-5 animate-in fade-in duration-200">
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Job Description <span className="text-destructive">*</span></Label>
      <Textarea
        value={form.description}
        onChange={(e) => updateField("description", e.target.value)}
        rows={6}
        placeholder="Describe what the role involves, team culture, growth opportunities..."
        className="resize-y min-h-[120px]"
      />
    </div>
    <TagInput
      label="Key Responsibilities"
      items={form.responsibilities}
      onAdd={(v) => addToArray("responsibilities", v)}
      onRemove={(v) => removeFromArray("responsibilities", v)}
      placeholder="e.g. Lead frontend architecture decisions"
    />
    <TagInput
      label="Benefits & Perks"
      items={form.benefits}
      onAdd={(v) => addToArray("benefits", v)}
      onRemove={(v) => removeFromArray("benefits", v)}
      placeholder="e.g. Health insurance, Remote work, Equity"
    />
  </div>
);

const StepRequirements = ({ form, updateField, addToArray, removeFromArray }: {
  form: FormState;
  updateField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  addToArray: (field: "requirements" | "responsibilities" | "benefits" | "skills_required", v: string) => void;
  removeFromArray: (field: "requirements" | "responsibilities" | "benefits" | "skills_required", v: string) => void;
}) => (
  <div className="space-y-5 animate-in fade-in duration-200">
    <TagInput
      label="Requirements"
      items={form.requirements}
      onAdd={(v) => addToArray("requirements", v)}
      onRemove={(v) => removeFromArray("requirements", v)}
      placeholder="e.g. 3+ years React experience"
    />
    <TagInput
      label="Required Skills (press Enter to add)"
      items={form.skills_required}
      onAdd={(v) => addToArray("skills_required", v)}
      onRemove={(v) => removeFromArray("skills_required", v)}
      placeholder="e.g. React, TypeScript, Node.js"
    />

    <Separator />

    <Card className="border-primary/20 bg-muted/30">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Link className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">Required Professional Links</Label>
        </div>
        <p className="text-xs text-muted-foreground">Toggle which professional links candidates must provide when applying.</p>
        <div className="space-y-3">
          {[
            { key: "require_linkedin" as const, label: "LinkedIn Profile", desc: "Professional network & experience" },
            { key: "require_github" as const, label: "GitHub Profile", desc: "Code repositories & contributions" },
            { key: "require_portfolio" as const, label: "Portfolio Website", desc: "Work samples & case studies" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={form[item.key]} onCheckedChange={(v) => updateField(item.key, v)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default JobFormDialog;
