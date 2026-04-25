-- Add missing DELETE policy for admins on product_audit_log
DROP POLICY IF EXISTS "Admins can delete audit logs" ON public.product_audit_log;
CREATE POLICY "Admins can delete audit logs"
  ON public.product_audit_log FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
