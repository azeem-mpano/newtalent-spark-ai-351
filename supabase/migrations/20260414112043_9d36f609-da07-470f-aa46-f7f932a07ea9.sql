
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _full_name text;
BEGIN
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '');
  INSERT INTO public.profiles (user_id, email, full_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    split_part(_full_name, ' ', 1),
    CASE WHEN position(' ' in _full_name) > 0
      THEN substring(_full_name from position(' ' in _full_name) + 1)
      ELSE ''
    END
  );
  RETURN NEW;
END;
$function$;
