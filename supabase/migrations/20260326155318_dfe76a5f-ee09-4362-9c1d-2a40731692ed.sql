
CREATE TABLE public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text,
  shop_name text,
  shop_phone text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active advertisements" ON public.advertisements
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Admins can view all advertisements" ON public.advertisements
  FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert advertisements" ON public.advertisements
  FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update advertisements" ON public.advertisements
  FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete advertisements" ON public.advertisements
  FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO storage.buckets (id, name, public) VALUES ('advertisements', 'advertisements', true);

CREATE POLICY "Anyone can view advertisement images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'advertisements');

CREATE POLICY "Admins can upload advertisement images" ON storage.objects
  FOR INSERT TO public WITH CHECK (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete advertisement images" ON storage.objects
  FOR DELETE TO public USING (bucket_id = 'advertisements' AND has_role(auth.uid(), 'admin'::app_role));
