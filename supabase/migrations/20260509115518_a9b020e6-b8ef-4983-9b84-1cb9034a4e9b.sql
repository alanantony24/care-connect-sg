-- Add pin codes and in_progress status support to requests
ALTER TABLE public.requests 
  ADD COLUMN IF NOT EXISTS start_pin TEXT,
  ADD COLUMN IF NOT EXISTS end_pin TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Trigger to auto-generate 4-digit pins on insert
CREATE OR REPLACE FUNCTION public.set_request_pins()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.start_pin IS NULL THEN
    NEW.start_pin := lpad((floor(random()*10000))::int::text, 4, '0');
  END IF;
  IF NEW.end_pin IS NULL THEN
    NEW.end_pin := lpad((floor(random()*10000))::int::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_request_pins ON public.requests;
CREATE TRIGGER trg_set_request_pins
  BEFORE INSERT ON public.requests
  FOR EACH ROW EXECUTE FUNCTION public.set_request_pins();

-- Backfill pins for existing rows
UPDATE public.requests 
SET start_pin = lpad((floor(random()*10000))::int::text, 4, '0')
WHERE start_pin IS NULL;
UPDATE public.requests 
SET end_pin = lpad((floor(random()*10000))::int::text, 4, '0')
WHERE end_pin IS NULL;

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  reviewee_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, reviewer_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Users can submit own reviews"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
