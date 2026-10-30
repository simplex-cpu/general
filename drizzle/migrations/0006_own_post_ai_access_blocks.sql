CREATE TABLE public.own_post_ai_access_blocks (
  model text PRIMARY KEY,
  reason text NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.own_post_ai_access_blocks TO service_role;
ALTER TABLE public.own_post_ai_access_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service manages own post provider blocks" ON public.own_post_ai_access_blocks FOR ALL TO service_role USING (true) WITH CHECK (true);