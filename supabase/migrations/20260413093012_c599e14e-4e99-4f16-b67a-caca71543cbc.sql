
-- Drop the overly permissive policy
DROP POLICY "Authenticated users can create notifications" ON public.notifications;

-- Recruiters can create notifications for anyone (e.g. announcing candidates)
CREATE POLICY "Recruiters can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR has_role(auth.uid(), 'recruiter'::app_role)
);
