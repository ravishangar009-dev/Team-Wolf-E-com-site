-- Create VIP customers table
CREATE TABLE IF NOT EXISTS public.vip_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    global_discount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create VIP product specific discounts table
CREATE TABLE IF NOT EXISTS public.vip_product_discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vip_id UUID NOT NULL REFERENCES public.vip_customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    discount_percentage NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(vip_id, product_id)
);

-- Enable RLS
ALTER TABLE public.vip_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_product_discounts ENABLE ROW LEVEL SECURITY;

-- Policies for vip_customers
CREATE POLICY "Admins can manage all VIP customers"
    ON public.vip_customers
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own VIP status"
    ON public.vip_customers
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policies for vip_product_discounts
CREATE POLICY "Admins can manage all VIP product discounts"
    ON public.vip_product_discounts
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own VIP product discounts"
    ON public.vip_product_discounts
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vip_customers
        WHERE id = vip_product_discounts.vip_id AND user_id = auth.uid()
    ));

-- Add VIP activity log tags
-- No changes needed to activity log table, as it's generic.
