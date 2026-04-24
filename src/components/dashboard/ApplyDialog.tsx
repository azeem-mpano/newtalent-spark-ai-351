import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Upload, Linkedin, Github, Globe } from "lucide-react";

type Job = {
  id: string; title: string; company: string; recruiter_id: string;
  require_linkedin: boolean | null; require_github: boolean | null;
  require_portfolio: boolean | null;
};

const ApplyDialog = ({ job, open, onClose, onApplied }: { job: Job; open: boolean; onClose: () => void; onApplied: () => void }) => {
  const { user } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let resumeUrl = "";
      if (resumeFile) {
        const ext = resumeFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("resumes").upload(path, resumeFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(path);
        resumeUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl || null,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        portfolio_url: portfolioUrl || null,
      });
      if (error) throw error;

      toast.success(`Application sent to ${job.company}!`);
      onApplied();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Apply to {job.title}</DialogTitle>
          <DialogDescription>at {job.company}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Cover Letter</Label>
            <Textarea value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={5} placeholder="Why are you a great fit for this role?" className="resize-y min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Upload className="h-3.5 w-3.5" /> Resume (PDF)</Label>
            <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files?.[0] || null)} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5" /> LinkedIn {job.require_linkedin && <span className="text-destructive">*</span>}</Label>
            <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." required={!!job.require_linkedin} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Github className="h-3.5 w-3.5" /> GitHub {job.require_github && <span className="text-destructive">*</span>}</Label>
            <Input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." required={!!job.require_github} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Portfolio {job.require_portfolio && <span className="text-destructive">*</span>}</Label>
            <Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://yourportfolio.com" required={!!job.require_portfolio} className="h-11" />
          </div>
          <Button type="submit" variant="hero" className="w-full h-11" disabled={loading}>
            <Send className="h-4 w-4 mr-2" /> {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
