
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS experience text,
  ADD COLUMN IF NOT EXISTS preferred_area text,
  ADD COLUMN IF NOT EXISTS preferred_lat numeric,
  ADD COLUMN IF NOT EXISTS preferred_lng numeric,
  ADD COLUMN IF NOT EXISTS motivation text,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS cert_url text,
  ADD COLUMN IF NOT EXISTS cert_status text NOT NULL DEFAULT 'none';

INSERT INTO storage.buckets (id, name, public)
VALUES ('certifications', 'certifications', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view own certifications"
ON storage.objects FOR SELECT
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own certifications"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own certifications"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);
