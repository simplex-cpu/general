CREATE TABLE public.pdf_extract_cache (
  attachment_id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  text TEXT NOT NULL,
  byte_size BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.pdf_extract_cache TO service_role;

ALTER TABLE public.pdf_extract_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON public.pdf_extract_cache FOR ALL TO service_role USING (true) WITH CHECK (true);