
-- Function to notify all applicants when a new job is posted
CREATE OR REPLACE FUNCTION public.notify_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT 
    ur.user_id,
    '🚀 New Job: ' || NEW.title,
    NEW.company || ' is hiring for ' || NEW.title || ' (' || NEW.location || ', ' || NEW.job_type || '). Apply now!',
    'job_posted',
    '/jobs/' || NEW.id
  FROM public.user_roles ur
  WHERE ur.role = 'applicant'
    AND ur.user_id != NEW.recruiter_id;
  RETURN NEW;
END;
$$;

-- Function to notify recruiter when someone applies
CREATE OR REPLACE FUNCTION public.notify_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job record;
  _applicant_name text;
BEGIN
  SELECT title, company, recruiter_id INTO _job FROM public.jobs WHERE id = NEW.job_id;
  SELECT COALESCE(first_name || ' ' || last_name, full_name, email, 'Someone') INTO _applicant_name
    FROM public.profiles WHERE user_id = NEW.applicant_id;
  
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (
    _job.recruiter_id,
    '📩 New Application',
    _applicant_name || ' applied for ' || _job.title || ' at ' || _job.company,
    'new_application',
    '/dashboard'
  );
  RETURN NEW;
END;
$$;

-- Trigger: notify applicants on new job
CREATE TRIGGER on_job_created
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_job();

-- Trigger: notify recruiter on new application
CREATE TRIGGER on_application_created
  AFTER INSERT ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_application();
