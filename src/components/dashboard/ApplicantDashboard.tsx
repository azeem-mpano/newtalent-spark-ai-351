import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "./DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Briefcase, MapPin, Clock, DollarSign, Send, User, FileText, Building, Search, SlidersHorizontal, X, Star, CheckCircle, ArrowLeft } from "lucide-react";
import ApplyDialog from "./ApplyDialog";
import ProfileSection from "./ProfileSection";
import CredentialsSection from "./CredentialsSection";
import MobileBottomNav, { type BottomNavItem, type MobileTab } from "./MobileBottomNav";
import { UserCircle, KeyRound, Compass, User as UserIcon } from "lucide-react";

type Job = {
  id: string; title: string; company: string; location: string; job_type: string;
  experience_level: string; salary_min: number | null; salary_max: number | null;
  currency: string | null; description: string; requirements: string[];
  responsibilities: string[]; benefits: string[]; skills_required: string[];
  require_linkedin: boolean | null; require_github: boolean | null;
  require_portfolio: boolean | null; status: string; deadline: string | null;
  created_at: string; recruiter_id: string;
};

type Application = {
  id: string; job_id: string; status: string; created_at: string;
  is_shortlisted: boolean | null; is_announced: boolean | null;
  ai_score: number | null; ai_analysis: string | null;
  jobs?: { title: string; company: string } | null;
};

const ApplicantDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("applicant_tab") || "jobs";
  });

  // Filters — persist to sessionStorage
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("job_search") || "");
  const [locationFilter, setLocationFilter] = useState(() => sessionStorage.getItem("job_location") || "all");
  const [jobTypeFilter, setJobTypeFilter] = useState(() => sessionStorage.getItem("job_type") || "all");
  const [experienceFilter, setExperienceFilter] = useState(() => sessionStorage.getItem("job_exp") || "all");
  const [showFilters, setShowFilters] = useState(false);

  // Persist filters
  useEffect(() => {
    sessionStorage.setItem("job_search", searchTerm);
    sessionStorage.setItem("job_location", locationFilter);
    sessionStorage.setItem("job_type", jobTypeFilter);
    sessionStorage.setItem("job_exp", experienceFilter);
    sessionStorage.setItem("applicant_tab", activeTab);
  }, [searchTerm, locationFilter, jobTypeFilter, experienceFilter, activeTab]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();

    // Real-time subscription for application updates
    if (!user) return;
    const channel = supabase
      .channel("applicant-apps")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "applications",
        filter: `applicant_id=eq.${user.id}`,
      }, (payload) => {
        setApplications((prev) =>
          prev.map((a) => (a.id === payload.new.id ? { ...a, ...payload.new } : a))
        );
        const updated = payload.new as any;
        if (updated.is_announced) {
          toast.success("🎉 You've been selected for a position!");
        } else if (updated.is_shortlisted) {
          toast.info("⭐ You've been shortlisted!");
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchJobs = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("status", "active").order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  };

  const fetchApplications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("applications")
      .select("*, jobs(title, company)")
      .eq("applicant_id", user.id)
      .order("created_at", { ascending: false });
    setApplications((data as any) || []);
  };

  const locations = useMemo(() => [...new Set(jobs.map(j => j.location))].sort(), [jobs]);
  const jobTypes = useMemo(() => [...new Set(jobs.map(j => j.job_type))].sort(), [jobs]);
  const experienceLevels = useMemo(() => [...new Set(jobs.map(j => j.experience_level))].sort(), [jobs]);

  const appliedJobIds = applications.map((a) => a.job_id);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch = !searchTerm || j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.company.toLowerCase().includes(searchTerm.toLowerCase()) || j.skills_required.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLocation = locationFilter === "all" || j.location === locationFilter;
      const matchesType = jobTypeFilter === "all" || j.job_type === jobTypeFilter;
      const matchesExp = experienceFilter === "all" || j.experience_level === experienceFilter;
      return matchesSearch && matchesLocation && matchesType && matchesExp;
    });
  }, [jobs, searchTerm, locationFilter, jobTypeFilter, experienceFilter]);

  const activeFiltersCount = [locationFilter, jobTypeFilter, experienceFilter].filter(f => f !== "all").length;

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("all");
    setJobTypeFilter("all");
    setExperienceFilter("all");
  };

  // Stat focus drill-down
  type StatFocus = "active_jobs" | "applications" | "shortlisted" | "selected";
  const [statFocus, setStatFocus] = useState<StatFocus | null>(null);

  const stats: { label: string; value: number; icon: typeof Briefcase; focus: StatFocus }[] = [
    { label: "Active Jobs", value: jobs.length, icon: Briefcase, focus: "active_jobs" },
    { label: "Applications Sent", value: applications.length, icon: Send, focus: "applications" },
    { label: "Shortlisted", value: applications.filter((a) => a.is_shortlisted).length, icon: Star, focus: "shortlisted" },
    { label: "Selected", value: applications.filter((a) => a.is_announced).length, icon: CheckCircle, focus: "selected" },
  ];

  const focusMeta: Record<StatFocus, { title: string; subtitle: string; empty: string }> = {
    active_jobs: { title: "Active Jobs", subtitle: "Open opportunities right now", empty: "No active jobs available right now." },
    applications: { title: "Applications Sent", subtitle: "Every job you've applied to", empty: "You haven't applied to any jobs yet." },
    shortlisted: { title: "Shortlisted Applications", subtitle: "Recruiters who flagged your profile", empty: "No applications have been shortlisted yet." },
    selected: { title: "🎉 Selected Applications", subtitle: "You've been chosen for these roles", empty: "You haven't been selected yet — keep applying!" },
  };

  const focusedApps = statFocus === "applications"
    ? applications
    : statFocus === "shortlisted"
      ? applications.filter((a) => a.is_shortlisted)
      : statFocus === "selected"
        ? applications.filter((a) => a.is_announced)
        : [];

  const [profileSubTab, setProfileSubTab] = useState<"profile" | "credentials">("profile");

  const titles: Record<string, string> = {
    jobs: "Explore Jobs",
    applications: "My Jobs",
    profile: "Profile",
  };

  // Reusable application card renderer (used in My Jobs + drill-downs)
  const renderApplicationCard = (app: Application) => (
    <Card key={app.id} className={`shadow-card transition-all ${app.is_announced ? "border-success/30 bg-success/5" : app.is_shortlisted ? "border-primary/20" : ""}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-base sm:text-lg truncate">{app.jobs?.title || "Unknown Job"}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {app.jobs?.company} • Applied {new Date(app.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {app.is_announced ? (
              <Badge className="bg-success text-success-foreground gap-1"><CheckCircle className="h-3 w-3" /> Selected</Badge>
            ) : app.is_shortlisted ? (
              <Badge variant="secondary" className="gap-1"><Star className="h-3 w-3" /> Shortlisted</Badge>
            ) : (
              <Badge variant="outline" className="capitalize">{app.status}</Badge>
            )}
            {app.ai_score !== null && <Badge variant="outline">{Number(app.ai_score).toFixed(0)}%</Badge>}
          </div>
        </div>
        {app.is_announced && (
          <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20 text-xs sm:text-sm">
            🎉 Congratulations! You have been selected. The recruiter will contact you soon.
          </div>
        )}
        {app.ai_analysis && !app.is_announced && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 text-xs sm:text-sm">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1">AI Feedback</p>
            <p className="line-clamp-3 whitespace-pre-wrap">{app.ai_analysis}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Reusable job card (for Active Jobs drill-down + Explore tab)
  const renderJobCard = (job: Job) => (
    <Card key={job.id} className="shadow-card hover:shadow-elevated transition-all">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-semibold text-base sm:text-lg">{job.title}</h3>
              <Badge variant="secondary" className="text-[10px]">{job.job_type}</Badge>
              <Badge variant="outline" className="text-[10px]">{job.experience_level}</Badge>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {job.company}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
              {job.salary_min && job.salary_max && (
                <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}</span>
              )}
              {job.deadline && (
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(job.deadline).toLocaleDateString()}</span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{job.description}</p>
            <div className="flex gap-1.5 flex-wrap">
              {job.skills_required.slice(0, 5).map((s, i) => <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>)}
              {job.skills_required.length > 5 && <Badge variant="secondary" className="text-[10px]">+{job.skills_required.length - 5}</Badge>}
            </div>
          </div>
          <div className="flex md:flex-col gap-2 shrink-0">
            {appliedJobIds.includes(job.id) ? (
              <Badge className="bg-success text-success-foreground self-start">Applied ✓</Badge>
            ) : (
              <Button variant="hero" size="sm" onClick={() => { setSelectedJob(job); setShowApply(true); }}>
                <Send className="h-4 w-4 mr-1" /> Apply Now
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>View Details</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout title={titles[activeTab] || "Applicant Dashboard"}>
      {/* Clickable stats — drill-down on click */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s, i) => {
          const isActive = statFocus === s.focus;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setStatFocus(isActive ? null : s.focus)}
              className={`text-left rounded-lg border bg-card transition-all hover:shadow-elevated hover:-translate-y-0.5 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                isActive ? "border-primary ring-2 ring-primary/20 shadow-elevated" : "shadow-card"
              }`}
              aria-pressed={isActive}
            >
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-display font-bold leading-tight">{s.value}</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Drill-down focused view (overrides tabs when set) */}
      {statFocus ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" onClick={() => setStatFocus(null)} className="h-9 w-9 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg sm:text-xl truncate">{focusMeta[statFocus].title}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{focusMeta[statFocus].subtitle}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {statFocus === "active_jobs" ? jobs.length : focusedApps.length} total
            </Badge>
          </div>

          {statFocus === "active_jobs" ? (
            jobs.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground text-sm">{focusMeta.active_jobs.empty}</Card>
            ) : (
              <div className="grid gap-3 sm:gap-4">{jobs.map(renderJobCard)}</div>
            )
          ) : focusedApps.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm">
              <p>{focusMeta[statFocus].empty}</p>
              <Button variant="hero" size="sm" className="mt-4" onClick={() => { setStatFocus(null); setActiveTab("jobs"); }}>
                <Compass className="h-4 w-4 mr-1.5" /> Find Jobs
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">{focusedApps.map(renderApplicationCard)}</div>
          )}
        </div>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Desktop top tabs only — mobile uses bottom nav */}
        <TabsList className="hidden md:inline-flex">
          <TabsTrigger value="jobs">Browse Jobs</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          <TabsTrigger value="profile">My Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title, company, or skill..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Button variant={showFilters ? "secondary" : "outline"} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 shrink-0">
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFiltersCount > 0 && <Badge className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">{activeFiltersCount}</Badge>}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground shrink-0">
                  <X className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap gap-3 p-4 rounded-xl border bg-muted/30">
                <div className="space-y-1.5 min-w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground">Location</label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Locations" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground">Job Type</label>
                  <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {jobTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 min-w-[160px]">
                  <label className="text-xs font-medium text-muted-foreground">Experience Level</label>
                  <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Levels" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      {experienceLevels.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Showing {filteredJobs.length} of {jobs.length} jobs
              {activeFiltersCount > 0 && " (filtered)"}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <p>No jobs match your filters.</p>
              {activeFiltersCount > 0 && <Button variant="link" onClick={clearFilters} className="mt-2">Clear all filters</Button>}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="shadow-card hover:shadow-elevated transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-semibold text-lg">{job.title}</h3>
                          <Badge variant="secondary">{job.job_type}</Badge>
                          <Badge variant="outline">{job.experience_level}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {job.company}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>
                          {job.salary_min && job.salary_max && (
                            <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}</span>
                          )}
                          {job.deadline && (
                            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {job.skills_required.slice(0, 5).map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                          {job.skills_required.length > 5 && <Badge variant="secondary" className="text-xs">+{job.skills_required.length - 5}</Badge>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {appliedJobIds.includes(job.id) ? (
                          <Badge className="bg-success text-success-foreground">Applied ✓</Badge>
                        ) : (
                          <Button variant="hero" size="sm" onClick={() => { setSelectedJob(job); setShowApply(true); }}>
                            <Send className="h-4 w-4 mr-1" /> Apply Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>View Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {applications.length === 0 ? (
            <Card className="p-8 sm:p-10 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-medium">You haven't applied to any jobs yet</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Start exploring opportunities and apply to land your next role.</p>
              <Button variant="hero" size="lg" onClick={() => setActiveTab("jobs")} className="gap-1.5">
                <Compass className="h-4 w-4" /> Find Jobs
              </Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:gap-4">{applications.map(renderApplicationCard)}</div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <div className="flex gap-1 p-1 rounded-xl bg-muted/40 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setProfileSubTab("profile")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                profileSubTab === "profile"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCircle className="h-4 w-4" /> Profile Info
            </button>
            <button
              type="button"
              onClick={() => setProfileSubTab("credentials")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                profileSubTab === "credentials"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="h-4 w-4" /> Credentials
            </button>
          </div>

          {profileSubTab === "profile" ? <ProfileSection /> : <CredentialsSection />}
        </TabsContent>
      </Tabs>
      )}

      {showApply && selectedJob && (
        <ApplyDialog
          job={selectedJob}
          open={showApply}
          onClose={() => { setShowApply(false); setSelectedJob(null); }}
          onApplied={() => { fetchApplications(); setShowApply(false); setSelectedJob(null); }}
        />
      )}

      {/* Mobile bottom navigation */}
      <MobileBottomNav<MobileTab>
        active={activeTab as MobileTab}
        items={[
          { key: "jobs", label: "Explore Jobs", icon: Compass },
          { key: "applications", label: "My Jobs", icon: Briefcase },
          { key: "profile", label: "Profile", icon: UserIcon },
        ]}
        onChange={(t) => { setStatFocus(null); setActiveTab(t); }}
      />
    </DashboardLayout>
  );
};

export default ApplicantDashboard;
