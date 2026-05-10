-- Foreign keys for reviews so embedded profile lookups work
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_reviewer_id_fkey
    FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT reviews_reviewee_id_fkey
    FOREIGN KEY (reviewee_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT reviews_request_id_fkey
    FOREIGN KEY (request_id) REFERENCES public.requests(id) ON DELETE CASCADE;

-- Applications table
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  volunteer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (request_id, volunteer_id)
);

CREATE INDEX idx_applications_request ON public.applications (request_id, status);
CREATE INDEX idx_applications_volunteer ON public.applications (volunteer_id, status);

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applications viewable by everyone signed in"
  ON public.applications FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Volunteers can apply as themselves"
  ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = volunteer_id);

CREATE POLICY "Caregiver or volunteer can update application"
  ON public.applications FOR UPDATE
  USING (
    auth.uid() = volunteer_id
    OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = applications.request_id AND r.requester_id = auth.uid()
    )
  );

CREATE POLICY "Volunteer can withdraw application"
  ON public.applications FOR DELETE
  USING (auth.uid() = volunteer_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;