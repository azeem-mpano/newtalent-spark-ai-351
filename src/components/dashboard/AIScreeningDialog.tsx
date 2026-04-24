import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Zap, Users, CheckCircle, Bell, Loader2, ArrowRight, Trophy, TrendingUp, TrendingDown, AlertTriangle, Star, Send } from "lucide-react";

type Application = {
  id: string; applicant_id: string; ai_score: number | null; ai_analysis: string | null;
  is_shortlisted: boolean | null; is_announced: boolean | null; status: string;
  cover_letter: string | null; linkedin_url: string | null; github_url: string | null;
  portfolio_url: string | null; resume_url: string | null;
  profiles?: {
    full_name: string | null; first_name: string | null; last_name: string | null;
    email: string | null; headline: string | null; location: string | null;
    skills: any[] | null; experience_years: number | null;
    languages: any[] | null; experience: any[] | null; education: any[] | null;
    certifications: any[] | null; projects: any[] | null; availability: any | null;
  } | null;
};

type ScreeningStep = "overview" | "configure" | "running" | "results";

const AIScreeningDialog = ({ job, open, onClose }: { job: { id: string; title: string; company: string; skills_required: string[]; requirements: string[]; description: string }; open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [shortlistCount, setShortlistCount] = useState(5);
  const [screeningStep, setScreeningStep] = useState<ScreeningStep>("overview");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedForAnnounce, setSelectedForAnnounce] = useState<Set<string>>(new Set());

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, profiles!applications_applicant_profile_fkey(full_name, first_name, last_name, email, headline, location, skills, experience_years, languages, experience, education, certifications, projects, availability)")
      .eq("job_id", job.id)
      .order("ai_score", { ascending: false, nullsFirst: false });
    setApplications((data as any) || []);
    setLoading(false);
    // If already screened, go to results
    if (data && data.some((a: any) => a.ai_score !== null)) {
      setScreeningStep("results");
    }
  };

  const runAIScreening = async () => {
    if (applications.length === 0) { toast.error("No applications to screen"); return; }
    setScreeningStep("running");
    setProgress(10);

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90));
    }, 800);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-screening`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          job_id: job.id,
          shortlist_count: shortlistCount,
          job_details: {
            title: job.title, company: job.company,
            skills_required: job.skills_required, requirements: job.requirements,
            description: job.description,
          },
          applications: applications.map((a) => ({
            id: a.id, cover_letter: a.cover_letter, linkedin_url: a.linkedin_url,
            github_url: a.github_url, portfolio_url: a.portfolio_url, profile: a.profiles,
          })),
        }),
      });

      clearInterval(interval);
      setProgress(100);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "AI screening failed");
      }

      toast.success("AI Screening complete!");
      await fetchApplications();
      setScreeningStep("results");
    } catch (err: any) {
      clearInterval(interval);
      toast.error(err.message);
      setScreeningStep("configure");
    }
  };

  const toggleAnnounceSelect = (id: string) => {
    setSelectedForAnnounce((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const announceSelected = async () => {
    if (selectedForAnnounce.size === 0) { toast.error("Select candidates to announce"); return; }

    for (const appId of selectedForAnnounce) {
      const app = applications.find((a) => a.id === appId);
      await supabase.from("applications").update({ is_announced: true, status: "accepted" }).eq("id", appId);

      // Create notification for the applicant
      if (app) {
        await supabase.from("notifications").insert({
          user_id: app.applicant_id,
          title: "🎉 Congratulations! You've been selected",
          message: `You have been selected for the next step for the position of ${job.title} at ${job.company}.`,
          type: "announcement",
          link: "/dashboard",
        });
      }
    }

    toast.success(`${selectedForAnnounce.size} candidate(s) announced!`);
    setSelectedForAnnounce(new Set());
    await fetchApplications();
  };

  const shortlisted = applications.filter((a) => a.is_shortlisted);
  const hasScores = applications.some((a) => a.ai_score !== null);

  const parseAnalysis = (analysis: string | null) => {
    if (!analysis) return { strengths: [], weaknesses: [], challenges: [], reason: "" };
    // Try to extract sections
    const sections = { strengths: [] as string[], weaknesses: [] as string[], challenges: [] as string[], reason: "" };
    const text = analysis;

    const strengthMatch = text.match(/(?:strengths?|strong points?)[:\s]*([\s\S]*?)(?=(?:weaknesses?|weak points?|challenges?|why selected|$))/i);
    const weaknessMatch = text.match(/(?:weaknesses?|weak points?)[:\s]*([\s\S]*?)(?=(?:challenges?|why selected|$))/i);
    const challengeMatch = text.match(/(?:challenges?)[:\s]*([\s\S]*?)(?=(?:why selected|$))/i);
    const reasonMatch = text.match(/(?:why selected|reason)[:\s]*([\s\S]*?)$/i);

    if (strengthMatch) sections.strengths = strengthMatch[1].split(/[•\-\n]/).map(s => s.trim()).filter(Boolean);
    if (weaknessMatch) sections.weaknesses = weaknessMatch[1].split(/[•\-\n]/).map(s => s.trim()).filter(Boolean);
    if (challengeMatch) sections.challenges = challengeMatch[1].split(/[•\-\n]/).map(s => s.trim()).filter(Boolean);
    if (reasonMatch) sections.reason = reasonMatch[1].trim();

    // If no structured sections found, just return the raw text as reason
    if (!sections.strengths.length && !sections.weaknesses.length) {
      sections.reason = text;
    }

    return sections;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 text-primary" /> AI Screening — {job.title}
          </DialogTitle>
          <DialogDescription>
            Use AI to analyze and shortlist candidates based on job requirements.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No applications received yet.</p>
            </div>
          ) : (
            <>
              {/* Step: Overview */}
              {screeningStep === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <Card>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-3xl font-bold font-display">{applications.length}</p>
                          <p className="text-sm text-muted-foreground">Total Applicants</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold font-display text-primary">{hasScores ? shortlisted.length : "—"}</p>
                          <p className="text-sm text-muted-foreground">Shortlisted</p>
                        </div>
                        <div>
                          <p className="text-3xl font-bold font-display">{applications.filter(a => a.is_announced).length}</p>
                          <p className="text-sm text-muted-foreground">Announced</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">All Applicants</h3>
                    {applications.map((app, idx) => (
                      <div key={app.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                        <span className="text-sm font-mono text-muted-foreground w-6">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{app.profiles?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{app.profiles?.headline || app.profiles?.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.profiles?.experience_years != null && (
                            <Badge variant="outline" className="text-xs">{app.profiles.experience_years}y exp</Badge>
                          )}
                          {app.ai_score !== null && <Badge variant="secondary">{Number(app.ai_score).toFixed(0)}%</Badge>}
                          {app.is_announced && <Badge className="bg-success text-success-foreground text-xs">Selected</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button variant="hero" onClick={() => hasScores ? setScreeningStep("results") : setScreeningStep("configure")} className="gap-2">
                      {hasScores ? "View Results" : "Continue to Screening"} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Configure */}
              {screeningStep === "configure" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <Card className="border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">Configure AI Screening</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="font-medium">How many candidates to shortlist?</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min={1}
                            max={applications.length}
                            value={shortlistCount}
                            onChange={(e) => setShortlistCount(parseInt(e.target.value) || 1)}
                            className="w-24 h-11 text-center text-lg font-bold"
                          />
                          <span className="text-sm text-muted-foreground">out of {applications.length} applicants</span>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-sm font-medium">AI will evaluate candidates based on:</p>
                        <div className="flex flex-wrap gap-2">
                          {job.skills_required.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{job.requirements.length} requirements • {applications.length} candidates to evaluate</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => setScreeningStep("overview")}>← Back</Button>
                    <Button variant="hero" onClick={runAIScreening} className="gap-2 min-w-[180px]">
                      <Zap className="h-4 w-4" /> Run AI Screening
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Running */}
              {screeningStep === "running" && (
                <div className="space-y-6 py-8 text-center animate-in fade-in duration-300">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold font-display">AI is analyzing candidates...</h3>
                    <p className="text-sm text-muted-foreground mt-1">Evaluating skills, experience, and fit for {job.title}</p>
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <Progress value={progress} className="h-3" />
                    <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📊 Scoring {applications.length} candidates</p>
                    <p>🎯 Shortlisting top {shortlistCount}</p>
                    <p>🧠 Generating detailed analysis</p>
                  </div>
                </div>
              )}

              {/* Step: Results */}
              {screeningStep === "results" && hasScores && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Shortlisted candidates */}
                  {shortlisted.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-yellow-500" /> Top Candidates ({shortlisted.length})
                        </h3>
                        {selectedForAnnounce.size > 0 && (
                          <Button variant="hero" size="sm" onClick={announceSelected} className="gap-1.5">
                            <Send className="h-4 w-4" /> Announce {selectedForAnnounce.size} Selected
                          </Button>
                        )}
                      </div>

                      {shortlisted.map((app, idx) => {
                        const analysis = parseAnalysis(app.ai_analysis);
                        const isSelected = selectedForAnnounce.has(app.id);

                        return (
                          <Card key={app.id} className={`shadow-card transition-all ${isSelected ? "ring-2 ring-primary" : ""} ${app.is_announced ? "border-success/40" : "border-primary/20"}`}>
                            <CardContent className="p-5 space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-lg">{app.profiles?.full_name || "Unknown"}</h4>
                                    <p className="text-sm text-muted-foreground">{app.profiles?.email} • {app.profiles?.headline}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {app.is_announced ? (
                                    <Badge className="bg-success text-success-foreground">🎉 Announced</Badge>
                                  ) : (
                                    <Button
                                      variant={isSelected ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => toggleAnnounceSelect(app.id)}
                                      className="gap-1"
                                    >
                                      <CheckCircle className="h-3.5 w-3.5" />
                                      {isSelected ? "Selected" : "Select"}
                                    </Button>
                                  )}
                                  <Badge variant="outline" className="text-xl font-bold px-3 py-1">{Number(app.ai_score).toFixed(0)}%</Badge>
                                </div>
                              </div>

                              <Progress value={Number(app.ai_score)} className="h-2" />

                              {/* Detailed Analysis */}
                              <div className="grid md:grid-cols-2 gap-3">
                                {analysis.strengths.length > 0 && (
                                  <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                                    <p className="text-xs font-semibold text-success flex items-center gap-1 mb-2"><TrendingUp className="h-3 w-3" /> Strengths</p>
                                    <ul className="text-sm space-y-1">
                                      {analysis.strengths.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-success shrink-0">✓</span> {s}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {analysis.weaknesses.length > 0 && (
                                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                                    <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-2"><TrendingDown className="h-3 w-3" /> Weaknesses</p>
                                    <ul className="text-sm space-y-1">
                                      {analysis.weaknesses.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-destructive shrink-0">✗</span> {s}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {analysis.challenges.length > 0 && (
                                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                                    <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1 mb-2"><AlertTriangle className="h-3 w-3" /> Challenges</p>
                                    <ul className="text-sm space-y-1">
                                      {analysis.challenges.map((s, i) => <li key={i} className="flex gap-1.5"><span className="text-yellow-600 shrink-0">⚠</span> {s}</li>)}
                                    </ul>
                                  </div>
                                )}
                                {analysis.reason && (
                                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <p className="text-xs font-semibold text-primary flex items-center gap-1 mb-2"><Star className="h-3 w-3" /> Why Selected</p>
                                    <p className="text-sm">{analysis.reason}</p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  <Separator />

                  {/* All ranked */}
                  <div className="space-y-3">
                    <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">All Candidates (Ranked)</h3>
                    {applications.map((app, idx) => (
                      <div key={app.id} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${app.is_shortlisted ? "border-primary/30 bg-primary/5" : ""}`}>
                        <span className="text-sm font-mono text-muted-foreground w-6">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{app.profiles?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{app.profiles?.headline}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {app.is_shortlisted && <Badge variant="secondary" className="text-xs">⭐ Shortlisted</Badge>}
                          {app.is_announced && <Badge className="bg-success text-success-foreground text-xs">🎉 Selected</Badge>}
                          {app.ai_score !== null && <Badge variant="outline">{Number(app.ai_score).toFixed(0)}%</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setScreeningStep("overview")}>← Overview</Button>
                    <Button variant="outline" onClick={() => setScreeningStep("configure")}>Re-run Screening</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIScreeningDialog;
