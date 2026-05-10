-- Volunteers apply first; caregivers confirm one volunteer before the PIN flow starts.
CREATE TABLE IF NOT EXISTS public.request_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  volunteer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, volunteer_id)
);

ALTER TABLE public.request_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Request applications are viewable by request parties"
  ON public.request_applications FOR SELECT USING (
    auth.uid() = volunteer_id
    OR EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = request_applications.request_id
        AND requests.requester_id = auth.uid()
    )
  );

CREATE POLICY "Volunteers can apply to open requests"
  ON public.request_applications FOR INSERT WITH CHECK (
    auth.uid() = volunteer_id
    AND EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = request_applications.request_id
        AND requests.status = 'open'
        AND requests.claimed_by IS NULL
    )
  );

CREATE POLICY "Caregivers can update applications for their requests"
  ON public.request_applications FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.requests
      WHERE requests.id = request_applications.request_id
        AND requests.requester_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS request_applications_request_id_idx
  ON public.request_applications (request_id, status, created_at);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_request_id_fkey') THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_request_id_fkey
      FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_reviewer_id_fkey') THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewer_id_fkey
      FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_reviewee_id_fkey') THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_reviewee_id_fkey
      FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
