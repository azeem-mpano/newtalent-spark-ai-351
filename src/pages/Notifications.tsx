import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCheck, Briefcase, Zap, Users, Star, ArrowLeft, BellOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const typeIcons: Record<string, typeof Bell> = {
  new_application: Users,
  screening_result: Zap,
  announcement: Star,
  job_posted: Briefcase,
  general: Bell,
};

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) {
      supabase.from("notifications").update({ is_read: true }).eq("id", n.id).then();
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <DashboardLayout title="">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5 sm:mb-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight truncate">Notifications</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5 shrink-0">
              <CheckCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Read all</span>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-10 text-center">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">You'll be notified about new jobs, applications, and updates here.</p>
          </Card>
        ) : (
          <Card className="shadow-card overflow-hidden">
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => handleClick(n)}
                      className={`w-full text-left p-4 sm:p-5 hover:bg-muted/40 transition-colors flex gap-3 sm:gap-4 ${!n.is_read ? "bg-primary/5" : ""}`}
                    >
                      <div
                        className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0 ${
                          !n.is_read ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm sm:text-base ${!n.is_read ? "font-semibold" : "font-medium"}`}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <Badge className="h-2 w-2 p-0 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notifications;
