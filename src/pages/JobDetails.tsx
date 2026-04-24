import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Clock, DollarSign, Building, Briefcase, Send, CheckCircle, Globe, ExternalLink } from "lucide-react";
import ApplyDialog from "@/components/dashboard/ApplyDialog";

type Job = {
  id: string; title: string; company: string; location: string; job_type: string;
  experience_level: string; salary_min: number | null; salary_max: number | null;
  currency: string | null; description: string; requirements: string[];
  responsibilities: string[]; benefits: string[]; skills_required: string[];
  require_linkedin: boolean | null; require_github: boolean | null;
  require_portfolio: boolean | null; status: string; deadline: string | null;
  created_at: string; recruiter_id: string;
};

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    if (id) { fetchJob(); checkApplication(); }
  }, [id]);

  const fetchJob = async () => {
    const { data } = await supabase.from("jobs").select("*").eq("id", id!).single();
    setJob(data);
    setLoading(false);
  };

  const checkApplication = async () => {
    if (!user) return;
    const { data } = await supabase.from("applications").select("id").eq("job_id", id!).eq("applicant_id", user.id).maybeSingle();
    setHasApplied(!!data);
  };

  if (loading) return <DashboardLayout title="Loading..."><div className="text-muted-foreground">Loading job details...</div></DashboardLayout>;
  if (!job) return <DashboardLayout title="Not Found"><div className="text-muted-foreground">Job not found.</div></DashboardLayout>;

  return (
    <DashboardLayout title="">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-display font-bold">{job.title}</h1>
                  <div className="flex items-center gap-4 text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Building className="h-4 w-4" /> {job.company}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location}</span>
                  </div>
                </div>
                <Badge variant={job.status === "active" ? "default" : "secondary"} className="text-sm">{job.status}</Badge>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{job.job_type}</Badge>
                <Badge variant="outline">{job.experience_level}</Badge>
                {job.salary_min && job.salary_max && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" /> {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}
                  </Badge>
                )}
                {job.deadline && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-display">Description</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p></CardContent>
          </Card>

          {job.responsibilities.length > 0 && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display">Responsibilities</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mt-1 text-accent shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.requirements.length > 0 && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display">Requirements</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mt-1 text-primary shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {job.benefits.length > 0 && (
            <Card className="shadow-card">
              <CardHeader><CardTitle className="font-display">Benefits</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {job.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mt-1 text-success shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="shadow-card sticky top-24">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-display font-semibold text-lg">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Posted</span><span>{new Date(job.created_at).toLocaleDateString()}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{job.job_type}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span>{job.experience_level}</span></div>
                {job.salary_min && job.salary_max && (
                  <>
                    <Separator />
                    <div className="flex justify-between"><span className="text-muted-foreground">Salary</span><span>{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} {job.currency}</span></div>
                  </>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.skills_required.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Required Links</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {job.require_linkedin && <p className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> LinkedIn Profile</p>}
                  {job.require_github && <p className="flex items-center gap-1"><ExternalLink className="h-3 w-3" /> GitHub Profile</p>}
                  {job.require_portfolio && <p className="flex items-center gap-1"><Globe className="h-3 w-3" /> Portfolio Website</p>}
                  {!job.require_linkedin && !job.require_github && !job.require_portfolio && <p>No specific links required</p>}
                </div>
              </div>

              {role === "applicant" && (
                <>
                  <Separator />
                  {hasApplied ? (
                    <Badge className="w-full justify-center py-2 bg-success text-success-foreground">Applied ✓</Badge>
                  ) : (
                    <Button variant="hero" className="w-full" onClick={() => setShowApply(true)}>
                      <Send className="h-4 w-4 mr-2" /> Apply Now
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showApply && (
        <ApplyDialog
          job={job}
          open={showApply}
          onClose={() => setShowApply(false)}
          onApplied={() => { setShowApply(false); setHasApplied(true); }}
        />
      )}
    </DashboardLayout>
  );
};

export default JobDetails;
