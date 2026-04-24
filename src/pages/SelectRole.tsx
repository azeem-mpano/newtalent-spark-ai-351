import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase, Users, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SelectRole = () => {
  const navigate = useNavigate();
  const { user, role, refetchRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<"applicant" | "recruiter" | null>(null);

  // If user already has a role, redirect to dashboard immediately
  useEffect(() => {
    const checkExistingRole = async () => {
      if (!user) {
        setChecking(false);
        return;
      }
      if (role) {
        navigate("/dashboard", { replace: true });
        return;
      }
      // Double-check from DB in case context hasn't caught up
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.role) {
        await refetchRole();
        navigate("/dashboard", { replace: true });
        return;
      }
      setChecking(false);
    };
    checkExistingRole();
  }, [user, role, navigate, refetchRole]);

  const handleSelect = async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      // Check if role already exists
      const { data: existing } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing?.role) {
        // Role already set — just refresh and redirect
        await refetchRole();
        navigate("/dashboard", { replace: true });
        return;
      }

      const { error } = await supabase.from("user_roles").insert({ user_id: user.id, role: selected });
      if (error) throw error;
      const newRole = await refetchRole();
      toast.success(`Welcome! You're set up as a ${selected === "applicant" ? "Job Seeker" : "Recruiter"}.`);
      if (newRole) {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
      <Card className="w-full max-w-lg shadow-2xl border-0 relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-display tracking-tight">Choose Your Role</CardTitle>
          <CardDescription>How will you use Talent 4G AI?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelected("applicant")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                selected === "applicant"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Job Seeker</p>
                <p className="text-xs text-muted-foreground mt-1">Find and apply for jobs</p>
              </div>
            </button>
            <button
              onClick={() => setSelected("recruiter")}
              className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                selected === "recruiter"
                  ? "border-primary bg-primary/5 shadow-md"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="h-14 w-14 rounded-xl gradient-accent flex items-center justify-center shadow-sm">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">Recruiter</p>
                <p className="text-xs text-muted-foreground mt-1">Post jobs & hire talent</p>
              </div>
            </button>
          </div>
          <Button variant="hero" className="w-full h-11 shadow-md" onClick={handleSelect} disabled={!selected || loading}>
            {loading ? "Setting up..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectRole;
