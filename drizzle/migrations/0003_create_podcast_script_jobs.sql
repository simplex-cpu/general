CREATE TABLE public.podcast_script_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id TEXT NOT NULL,
  long_form_id TEXT NOT NULL,
  counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'submitted',
  request JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.podcast_script_jobs TO service_role;

ALTER TABLE public.podcast_script_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.podcast_script_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX podcast_script_jobs_owner_idx ON public.podcast_script_jobs (owner_id, created_at DESC);
CREATE INDEX podcast_script_jobs_long_form_idx ON public.podcast_script_jobs (long_form_id, created_at DESC);