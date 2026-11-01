CREATE UNIQUE INDEX IF NOT EXISTS podcast_script_jobs_one_active ON public.podcast_script_jobs (owner_id, long_form_id) WHERE status IN ('submitting', 'processing', 'submission_uncertain');

CREATE TABLE public.podcast_unmatched_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id TEXT,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.podcast_unmatched_events TO service_role;
ALTER TABLE public.podcast_unmatched_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON public.podcast_unmatched_events FOR ALL TO service_role USING (true) WITH CHECK (true);