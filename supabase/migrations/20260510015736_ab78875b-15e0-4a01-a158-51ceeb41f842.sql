
-- Add priority field to requests
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System inserts notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);

-- Trigger: when application is accepted, notify the volunteer
CREATE OR REPLACE FUNCTION public.notify_application_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_title text;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    SELECT title INTO req_title FROM public.requests WHERE id = NEW.request_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.volunteer_id,
      'application_accepted',
      'Your application was accepted',
      COALESCE('You''re confirmed for: ' || req_title, 'You''re confirmed for a task'),
      '/requests/' || NEW.request_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_application_accepted ON public.applications;
CREATE TRIGGER trg_notify_application_accepted
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_application_accepted();

-- Trigger: when a review is created, notify the reviewee
CREATE OR REPLACE FUNCTION public.notify_review_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name text;
BEGIN
  SELECT name INTO reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.reviewee_id,
    'review_received',
    'You received a new review',
    COALESCE(reviewer_name || ' rated you ' || NEW.rating || '/5', 'A new review was posted'),
    '/profile'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_review_created ON public.reviews;
CREATE TRIGGER trg_notify_review_created
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_review_created();
