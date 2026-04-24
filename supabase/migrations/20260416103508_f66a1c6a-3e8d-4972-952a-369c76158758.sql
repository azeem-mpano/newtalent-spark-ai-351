
-- Add FK from applications.applicant_id to profiles.user_id for PostgREST joins
ALTER TABLE public.applications
  ADD CONSTRAINT applications_applicant_profile_fkey
  FOREIGN KEY (applicant_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
