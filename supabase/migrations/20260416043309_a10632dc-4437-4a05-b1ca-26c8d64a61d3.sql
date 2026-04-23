-- Create product audit log table
CREATE TABLE public.product_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL, -- 'added', 'edited', 'deleted'
  product_id UUID,
  product_name TEXT NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_email TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.product_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.product_audit_log FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Store admins (temp access) can insert audit logs
CREATE POLICY "Temp admins can insert audit logs"
  ON public.product_audit_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM store_admins WHERE store_admins.user_id = auth.uid()
  ));

-- Store admins (temp access) can view audit logs
CREATE POLICY "Temp admins can view audit logs"
  ON public.product_audit_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM store_admins WHERE store_admins.user_id = auth.uid()
  ));
