CREATE TABLE public.long_form_operations (
  operation_key text PRIMARY KEY,
  owner_id text NOT NULL,
  long_form_id text NOT NULL,
  lease_token uuid,
  lease_until timestamptz,
  state text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.long_form_operations TO service_role;
ALTER TABLE public.long_form_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON public.long_form_operations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE FUNCTION public.acquire_long_form_operation(p_key text, p_owner text, p_long text, p_token uuid, p_seconds integer DEFAULT 600)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE acquired text;
BEGIN
  INSERT INTO public.long_form_operations(operation_key, owner_id, long_form_id, lease_token, lease_until)
  VALUES(p_key, p_owner, p_long, p_token, now() + make_interval(secs => least(greatest(p_seconds, 30), 900)))
  ON CONFLICT(operation_key) DO UPDATE SET lease_token = EXCLUDED.lease_token, lease_until = EXCLUDED.lease_until, updated_at = now()
  WHERE long_form_operations.owner_id = p_owner AND long_form_operations.long_form_id = p_long
    AND (long_form_operations.lease_until IS NULL OR long_form_operations.lease_until < now())
  RETURNING operation_key INTO acquired;
  RETURN acquired IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.acquire_long_form_operation(text,text,text,uuid,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_long_form_operation(text,text,text,uuid,integer) TO service_role;