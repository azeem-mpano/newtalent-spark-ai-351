import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Mail, Eye, EyeOff, ShieldCheck } from "lucide-react";

const CredentialsSection = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [changingEmail, setChangingEmail] = useState(false);

  const changePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    setChangingPassword(true);

    // Verify current password by attempting a sign-in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user!.email!,
      password: currentPassword,
    });

    if (verifyError) {
      toast.error("Current password is incorrect");
      setChangingPassword(false);
      return;
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const changeEmail = async () => {
    if (!newEmail || newEmail === user?.email) {
      toast.error("Please enter a different email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else toast.success("Confirmation sent — check your new email to verify.");
    setChangingEmail(false);
  };

  const PwField = ({
    value, onChange, show, setShow, label, autoComplete, placeholder,
  }: {
    value: string; onChange: (v: string) => void; show: boolean;
    setShow: (b: boolean) => void; label: string; autoComplete: string; placeholder: string;
  }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <ShieldCheck className="h-5 w-5 text-primary" /> Change Password
          </CardTitle>
          <p className="text-xs text-muted-foreground">Enter your current password and choose a new one.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <PwField
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            setShow={setShowCurrent}
            label="Current Password"
            autoComplete="current-password"
            placeholder="Your current password"
          />
          <PwField
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            setShow={setShowNew}
            label="New Password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
          <PwField
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            setShow={setShowConfirm}
            label="Confirm New Password"
            autoComplete="new-password"
            placeholder="Re-enter new password"
          />
          <Button
            variant="hero"
            onClick={changePassword}
            disabled={changingPassword}
            className="w-full sm:w-auto"
          >
            <Lock className="h-4 w-4 mr-1.5" />
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-display">
            <Mail className="h-5 w-5 text-primary" /> Email Address
          </CardTitle>
          <p className="text-xs text-muted-foreground">A confirmation link will be sent to your new email.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Current Email</Label>
            <Input value={user?.email || ""} disabled className="bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">New Email</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new@email.com"
              autoComplete="email"
            />
          </div>
          <Button
            variant="hero"
            onClick={changeEmail}
            disabled={changingEmail || newEmail === user?.email}
            className="w-full sm:w-auto"
          >
            <Mail className="h-4 w-4 mr-1.5" />
            {changingEmail ? "Updating..." : "Update Email"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialsSection;
