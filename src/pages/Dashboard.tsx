import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import ApplicantDashboard from "@/components/dashboard/ApplicantDashboard";
import RecruiterDashboard from "@/components/dashboard/RecruiterDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!role) return <Navigate to="/select-role" replace />;

  return role === "recruiter" ? <RecruiterDashboard /> : <ApplicantDashboard />;
};

export default Dashboard;
