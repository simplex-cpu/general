CREATE TABLE public.content_scrape_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code TEXT NOT NULL,
  platform TEXT NOT NULL,
  handle TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scraping',
  run_id TEXT,
  posts JSONB NOT NULL DEFAULT '[]'::jsonb,
  cursor INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.content_scrape_jobs TO service_role;

ALTER TABLE public.content_scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.content_scrape_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX content_scrape_jobs_access_code_idx ON public.content_scrape_jobs (access_code, created_at DESC);