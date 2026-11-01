CREATE TABLE public.community_posts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 author_id text NOT NULL,
 author_name text NOT NULL,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
 tags text[] NOT NULL DEFAULT '{}',
 support_url text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service access only" ON public.community_posts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX community_posts_created ON public.community_posts(created_at DESC, id DESC);
CREATE TABLE public.community_reactions (
 post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
 author_id text NOT NULL,
 reaction text NOT NULL CHECK (reaction IN ('like','celebrate','support')),
 PRIMARY KEY(post_id, author_id)
);
GRANT ALL ON public.community_reactions TO service_role;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service access only" ON public.community_reactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.community_comments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
 author_id text NOT NULL,
 author_name text NOT NULL,
 body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.community_comments TO service_role;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service access only" ON public.community_comments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE INDEX community_comments_post ON public.community_comments(post_id,created_at);