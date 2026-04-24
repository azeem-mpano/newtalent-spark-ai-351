import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ExternalLink, CheckCircle, Bell, Users, Briefcase } from "lucide-react";

type Application = {
  id: string; applicant_id: string; cover_letter: string | null;
  resume_url: string | null; linkedin_url: string | null; github_url: string | null;
  portfolio_url: string | null; status: string; ai_score: number | null;
  ai_analysis: string | null; is_shortlisted: boolean | null; is_announced: boolean | null;
  created_at: string;
  profiles?: { full_name: string | null; email: string | null; headline: string | null; skills: string[] | null; experience_years: number | null } | null;
};

const ApplicantsView = ({ job, open, onClose }: { job: { id: string; title: string; company: string }; open: boolean; onClose: () => void }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, profiles!applications_applicant_profile_fkey(full_name, first_name, last_name, email, headline, skills, experience_years, location)")
      .eq("job_id", job.id)
      .order("ai_score", { ascending: false, nullsFirst: false });
    setApplications((data as any) || []);
    setLoading(false);
  };

  const announceCandidate = async (app: Application) => {
    const { error } = await supabase.from("applications").update({ is_announced: true, status: "accepted" }).eq("id", app.id);
    if (error) { toast.error(error.message); return; }

    // Send notification to applicant
    await supabase.from("notifications").insert({
      user_id: app.applicant_id,
      title: "🎉 Congratulations! You've been selected",
      message: `You have been selected for the next step for ${job.title} at ${job.company}.`,
      type: "announcement",
      link: "/dashboard",
    });

    toast.success("Candidate announced as selected!");
    fetchApplications();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Applicants for {job.title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No applications received yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{applications.length} applicant(s)</p>
              {applications.map((app) => (
                <Card key={app.id} className={`shadow-card transition-all ${app.is_announced ? "border-success/30" : ""}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-lg">{app.profiles?.full_name || "Unknown"}</h4>
                        <p className="text-sm text-muted-foreground">{app.profiles?.email} • {app.profiles?.headline || "No headline"}</p>
                        {app.profiles?.experience_years != null && (
                          <p className="text-xs text-muted-foreground mt-0.5">{app.profiles.experience_years} years experience</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {app.is_announced && <Badge className="bg-success text-success-foreground">🎉 Selected</Badge>}
                        {app.is_shortlisted && !app.is_announced && <Badge variant="secondary">⭐ Shortlisted</Badge>}
                        {app.ai_score !== null && (
                          <Badge variant="outline" className="font-bold">{Number(app.ai_score).toFixed(0)}%</Badge>
                        )}
                      </div>
                    </div>

                    {app.ai_score !== null && <Progress value={Number(app.ai_score)} className="h-1.5" />}

                    {app.profiles?.skills && app.profiles.skills.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {app.profiles.skills.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                    )}

                    {app.cover_letter && (
                      <div className="text-sm bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs font-semibold mb-1 text-muted-foreground">Cover Letter</p>
                        <p className="line-clamp-3">{app.cover_letter}</p>
                      </div>
                    )}

                    {app.ai_analysis && (
                      <div className="text-sm bg-primary/5 p-3 rounded-lg border border-primary/10">
                        <p className="text-xs font-semibold mb-1 text-primary">AI Analysis</p>
                        <p className="whitespace-pre-wrap text-sm">{app.ai_analysis}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-3 flex-wrap pt-1">
                      {app.linkedin_url && (
                        <a href={app.linkedin_url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> LinkedIn
                        </a>
                      )}
                      {app.github_url && (
                        <a href={app.github_url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> GitHub
                        </a>
                      )}
                      {app.portfolio_url && (
                        <a href={app.portfolio_url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Portfolio
                        </a>
                      )}
                      {app.resume_url && (
                        <a href={app.resume_url} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1 hover:underline">
                          <ExternalLink className="h-3 w-3" /> Resume
                        </a>
                      )}
                      {!app.is_announced && (
                        <Button variant="success" size="sm" className="ml-auto gap-1.5" onClick={() => announceCandidate(app)}>
                          <Bell className="h-3.5 w-3.5" /> Announce Selected
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantsView;
