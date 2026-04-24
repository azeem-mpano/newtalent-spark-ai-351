import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Briefcase, Users, Zap, Eye, Plus, Edit, Trash2, FileText,
  Megaphone, Star, ChevronRight, Sparkles,
} from "lucide-react";
import JobFormDialog from "./JobFormDialog";
import ApplicantsView from "./ApplicantsView";
import AIScreeningDialog from "./AIScreeningDialog";
import MobileBottomNav, { type BottomNavItem } from "./MobileBottomNav";

type Job = {
  id: string; title: string; company: string; location: string; job_type: string;
  experience_level: string; salary_min: number | null; salary_max: number | null;
  currency: string | null; description: string; requirements: string[];
  responsibilities: string[]; benefits: string[]; skills_required: string[];
  require_linkedin: boolean | null; require_github: boolean | null;
  require_portfolio: boolean | null; status: string; deadline: string | null;
  created_at: string; recruiter_id: string;
};

type Announcement = {
  id: string;
  job_id: string;
  ai_score: number | null;
  is_shortlisted: boolean | null;
  is_announced: boolean | null;
  created_at: string;
  jobs?: { title: string; company: string } | null;
  profiles?: { full_name: string | null; email: string | null; headline: string | null; avatar_url: string | null } | null;
};

type RecruiterTab = "jobs" | "applicants" | "screening" | "announcements";

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Job | null>(null);
  const [selectedJobForAI, setSelectedJobForAI] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RecruiterTab>(() => {
    return (sessionStorage.getItem("recruiter_tab") as RecruiterTab) || "jobs";
  });

  useEffect(() => {
    sessionStorage.setItem("recruiter_tab", activeTab);
  }, [activeTab]);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from("jobs").select("*").eq("recruiter_id", user.id).order("created_at", { ascending: false });
    const jobsList = data || [];
    setJobs(jobsList);
    setLoading(false);

    if (jobsList.length > 0) {
      const jobIds = jobsList.map(j => j.id);

      // Counts per job
      const { data: apps } = await supabase
        .from("applications")
        .select("job_id")
        .in("job_id", jobIds);
      const counts: Record<string, number> = {};
      (apps || []).forEach((a: any) => {
        counts[a.job_id] = (counts[a.job_id] || 0) + 1;
      });
      setAppCounts(counts);

      // Announcements (announced or shortlisted) with applicant + job info
      const { data: announced } = await supabase
        .from("applications")
        .select("id, job_id, ai_score, is_shortlisted, is_announced, created_at, jobs(title, company), profiles!applications_applicant_profile_fkey(full_name, email, headline, avatar_url)")
        .in("job_id", jobIds)
        .or("is_announced.eq.true,is_shortlisted.eq.true")
        .order("created_at", { ascending: false });
      setAnnouncements((announced as any) || []);
    } else {
      setAppCounts({});
      setAnnouncements([]);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!confirm("Delete this job? All applications will also be removed.")) return;
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);
    if (error) toast.error(error.message);
    else { toast.success("Job deleted"); fetchJobs(); }
  };

  const toggleJobStatus = async (job: Job) => {
    const newStatus = job.status === "active" ? "closed" : "active";
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
    if (error) toast.error(error.message);
    else { toast.success(`Job ${newStatus}`); fetchJobs(); }
  };

  const totalApps = Object.values(appCounts).reduce((a, b) => a + b, 0);
  const announcedCount = announcements.filter(a => a.is_announced).length;

  const stats = [
    { label: "Total Jobs", value: jobs.length, icon: Briefcase },
    { label: "Active Jobs", value: jobs.filter((j) => j.status === "active").length, icon: FileText },
    { label: "Total Applications", value: totalApps, icon: Users },
    { label: "Announced", value: announcedCount, icon: Megaphone },
  ];

  const titles: Record<RecruiterTab, string> = {
    jobs: "My Jobs",
    applicants: "Applicants",
    screening: "AI Screening",
    announcements: "Announcements",
  };

  const navItems: BottomNavItem<RecruiterTab>[] = [
    { key: "jobs", label: "Jobs", icon: Briefcase },
    { key: "applicants", label: "Applicants", icon: Users, badge: totalApps },
    { key: "screening", label: "AI Screen", icon: Sparkles },
    { key: "announcements", label: "Announce", icon: Megaphone, badge: announcedCount },
  ];

  // Helper: render a job picker list (for Applicants / AI / Announcements per-job entry)
  const renderJobPicker = (
    onPick: (job: Job) => void,
    emptyText: string,
    actionLabel: string,
    actionIcon: typeof Eye,
  ) => {
    const ActionIcon = actionIcon;
    if (loading) return <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>;
    if (jobs.length === 0) {
      return <Card className="p-6 sm:p-8 text-center text-muted-foreground text-sm">{emptyText}</Card>;
    }
    return (
      <div className="grid gap-3">
        {jobs.map((job) => {
          const count = appCounts[job.id] || 0;
          return (
            <Card key={job.id} className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-semibold text-base sm:text-lg truncate">{job.title}</h3>
                      <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-[10px]">{job.status}</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {job.company} • {job.location}
                    </p>
                    <Badge variant={count > 0 ? "default" : "outline"} className="mt-2 gap-1 text-[11px]">
                      <Users className="h-3 w-3" /> {count} Applicant{count !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant={count > 0 ? "default" : "outline"}
                    onClick={() => onPick(job)}
                    className="gap-1 shrink-0"
                  >
                    <ActionIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{actionLabel}</span>
                    <ChevronRight className="h-4 w-4 sm:hidden" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <DashboardLayout title={titles[activeTab]}>
      {/* Stats — compact on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="shadow-card">
            <CardContent className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg gradient-accent flex items-center justify-center shrink-0">
                <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-display font-bold leading-tight">{s.value}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as RecruiterTab)} className="space-y-5 sm:space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Desktop top tabs only — mobile uses bottom nav */}
          <TabsList className="hidden md:inline-flex">
            <TabsTrigger value="jobs">My Jobs</TabsTrigger>
            <TabsTrigger value="applicants">Applicants</TabsTrigger>
            <TabsTrigger value="screening">AI Screening</TabsTrigger>
            <TabsTrigger value="announcements">
              Announcements {announcedCount > 0 && <Badge className="ml-2 h-5">{announcedCount}</Badge>}
            </TabsTrigger>
          </TabsList>
          <Button variant="hero" size="sm" onClick={() => { setEditingJob(null); setShowJobForm(true); }} className="ml-auto md:ml-0">
            <Plus className="h-4 w-4 mr-1" /> Create Job
          </Button>
        </div>

        {/* JOBS */}
        <TabsContent value="jobs" className="space-y-4">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : jobs.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
              No jobs created yet. Tap "Create Job" to get started.
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {jobs.map((job) => {
                const count = appCounts[job.id] || 0;
                return (
                  <Card key={job.id} className="shadow-card">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-display font-semibold text-base sm:text-lg">{job.title}</h3>
                            <Badge variant={job.status === "active" ? "default" : "secondary"}>{job.status}</Badge>
                            <Badge variant="outline" className="hidden sm:inline-flex">{job.job_type}</Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground">{job.company} • {job.location} • {job.experience_level}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex gap-1.5 flex-wrap">
                              {job.skills_required.slice(0, 3).map((s, i) => <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>)}
                              {job.skills_required.length > 3 && <Badge variant="secondary" className="text-[10px]">+{job.skills_required.length - 3}</Badge>}
                            </div>
                            <Badge variant={count > 0 ? "default" : "outline"} className="gap-1 text-[11px]">
                              <Users className="h-3 w-3" /> {count}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setSelectedJobForApplicants(job)} className="gap-1">
                            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Applicants</span>
                            {count > 0 && <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1 justify-center text-[10px]">{count}</Badge>}
                          </Button>
                          <Button variant="default" size="sm" onClick={() => setSelectedJobForAI(job)} className="gap-1">
                            <Zap className="h-4 w-4" /> <span className="hidden sm:inline">AI Screen</span>
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setEditingJob(job); setShowJobForm(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toggleJobStatus(job)} className="hidden sm:inline-flex">
                            {job.status === "active" ? "Close" : "Reopen"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteJob(job.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* APPLICANTS — pick a job to view its applicants */}
        <TabsContent value="applicants" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Select a job to view its applicants</span>
          </div>
          {renderJobPicker(
            (job) => setSelectedJobForApplicants(job),
            "Create a job first to receive applications.",
            "View",
            Eye,
          )}
        </TabsContent>

        {/* AI SCREENING — pick a job to screen */}
        <TabsContent value="screening" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Select a job to run AI Screening on its applicants</span>
          </div>
          {renderJobPicker(
            (job) => setSelectedJobForAI(job),
            "Create a job and receive applications to start screening.",
            "Screen",
            Zap,
          )}
        </TabsContent>

        {/* ANNOUNCEMENTS — list of selected/shortlisted candidates */}
        <TabsContent value="announcements" className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Megaphone className="h-4 w-4" />
            <span>Candidates you've announced or shortlisted</span>
          </div>
          {announcements.length === 0 ? (
            <Card className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
              No announcements yet. Run AI Screening and announce top candidates.
            </Card>
          ) : (
            <div className="grid gap-3">
              {announcements.map((a) => {
                const initials = (a.profiles?.full_name || a.profiles?.email || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <Card
                    key={a.id}
                    className={`shadow-card ${a.is_announced ? "border-success/30 bg-success/5" : "border-primary/20"}`}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm sm:text-base truncate">
                              {a.profiles?.full_name || "Unnamed Candidate"}
                            </p>
                            {a.is_announced ? (
                              <Badge className="bg-success text-success-foreground text-[10px]">
                                <Megaphone className="h-3 w-3 mr-1" /> Announced
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                <Star className="h-3 w-3 mr-1" /> Shortlisted
                              </Badge>
                            )}
                            {a.ai_score !== null && (
                              <Badge variant="outline" className="text-[10px]">
                                {Number(a.ai_score).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          {a.profiles?.headline && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{a.profiles.headline}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">{a.jobs?.title}</span>
                            {a.jobs?.company ? ` • ${a.jobs.company}` : ""}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const job = jobs.find((j) => j.id === a.job_id);
                            if (job) setSelectedJobForApplicants(job);
                          }}
                          className="shrink-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showJobForm && (
        <JobFormDialog
          open={showJobForm}
          job={editingJob}
          onClose={() => { setShowJobForm(false); setEditingJob(null); }}
          onSaved={() => { fetchJobs(); setShowJobForm(false); setEditingJob(null); }}
        />
      )}

      {selectedJobForApplicants && (
        <ApplicantsView
          job={selectedJobForApplicants}
          open={!!selectedJobForApplicants}
          onClose={() => setSelectedJobForApplicants(null)}
        />
      )}

      {selectedJobForAI && (
        <AIScreeningDialog
          job={selectedJobForAI}
          open={!!selectedJobForAI}
          onClose={() => { setSelectedJobForAI(null); fetchJobs(); }}
        />
      )}

      {/* Mobile bottom navigation */}
      <MobileBottomNav<RecruiterTab>
        active={activeTab}
        items={navItems}
        onChange={setActiveTab}
      />
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
