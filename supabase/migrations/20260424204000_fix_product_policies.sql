-- Add missing DELETE policy for store admins
CREATE POLICY "Store admins can delete their store products"
ON public.products
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM store_admins
    WHERE store_admins.user_id = auth.uid()
      AND store_admins.store_id = products.store_id
  )
);

-- Ensure Store Admins can also UPDATE and INSERT correctly
-- These should already exist but we'll re-verify or add if missing
DROP POLICY IF EXISTS "Store admins can update their store products" ON public.products;
CREATE POLICY "Store admins can update their store products"
ON public.products
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM store_admins
    WHERE store_admins.user_id = auth.uid()
      AND store_admins.store_id = products.store_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_admins
    WHERE store_admins.user_id = auth.uid()
      AND store_admins.store_id = products.store_id
  )
);

DROP POLICY IF EXISTS "Store admins can insert products for their store" ON public.products;
CREATE POLICY "Store admins can insert products for their store"
ON public.products
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM store_admins
    WHERE store_admins.user_id = auth.uid()
    AND store_admins.store_id = products.store_id
  )
);
