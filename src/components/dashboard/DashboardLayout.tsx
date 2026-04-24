import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "./NotificationBell";

const DashboardLayout = ({ children, title }: { children: React.ReactNode; title: string }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-base sm:text-lg tracking-tight">Talent 4G AI</span>
            </div>
            <Badge variant="outline" className="hidden sm:flex capitalize text-xs font-medium">
              {role}
            </Badge>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-sm text-muted-foreground hidden md:inline mr-2 truncate max-w-[200px]">{user?.email}</span>
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-9 gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-5 md:py-8 px-4 md:px-8 pb-24 md:pb-8">
        {title && <h1 className="text-xl md:text-3xl font-display font-bold mb-5 md:mb-8 tracking-tight">{title}</h1>}
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
