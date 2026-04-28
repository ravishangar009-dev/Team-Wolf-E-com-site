-- ==========================================
-- COMPREHENSIVE FIX SCRIPT FOR MISSING TABLES
-- ==========================================

-- 1. ADD UPI_ID TO STORES
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- 2. CREATE OFFLINE BILLING TABLES
CREATE TABLE IF NOT EXISTS public.offline_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'upi',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offline_bill_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.offline_bills(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE RLS FOR BILLING
ALTER TABLE public.offline_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_bill_items ENABLE ROW LEVEL SECURITY;

-- POLICIES FOR OFFLINE BILLS (Including Admins)
DROP POLICY IF EXISTS "Admins can view all offline bills" ON public.offline_bills;
CREATE POLICY "Admins can view all offline bills" ON public.offline_bills FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert offline bills" ON public.offline_bills;
CREATE POLICY "Admins can insert offline bills" ON public.offline_bills FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Store admins can view their store's offline bills" ON public.offline_bills;
CREATE POLICY "Store admins can view their store's offline bills" ON public.offline_bills FOR SELECT USING (EXISTS (SELECT 1 FROM store_admins WHERE store_admins.user_id = auth.uid() AND store_admins.store_id = offline_bills.store_id));

DROP POLICY IF EXISTS "Store admins can insert offline bills" ON public.offline_bills;
CREATE POLICY "Store admins can insert offline bills" ON public.offline_bills FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM store_admins WHERE store_admins.user_id = auth.uid() AND store_admins.store_id = offline_bills.store_id));

-- POLICIES FOR OFFLINE BILL ITEMS
DROP POLICY IF EXISTS "Admins can view all offline bill items" ON public.offline_bill_items;
CREATE POLICY "Admins can view all offline bill items" ON public.offline_bill_items FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert offline bill items" ON public.offline_bill_items;
CREATE POLICY "Admins can insert offline bill items" ON public.offline_bill_items FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Store admins can view their store's offline bill items" ON public.offline_bill_items;
CREATE POLICY "Store admins can view their store's offline bill items" ON public.offline_bill_items FOR SELECT USING (EXISTS (SELECT 1 FROM public.offline_bills JOIN public.store_admins ON offline_bills.store_id = store_admins.store_id WHERE offline_bill_items.bill_id = offline_bills.id AND store_admins.user_id = auth.uid()));

DROP POLICY IF EXISTS "Store admins can insert offline bill items" ON public.offline_bill_items;
CREATE POLICY "Store admins can insert offline bill items" ON public.offline_bill_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.offline_bills JOIN public.store_admins ON offline_bills.store_id = store_admins.store_id WHERE offline_bill_items.bill_id = offline_bills.id AND store_admins.user_id = auth.uid()));

-- 3. CREATE WORKOUT TABLES
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    video_url TEXT,
    targeted_muscles TEXT[],
    workout_type TEXT NOT NULL CHECK (workout_type IN ('cardio', 'weight training', 'weight loss', 'weight gain')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workout_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_workout_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.workout_packages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.user_workout_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fitness_goal TEXT NOT NULL,
    experience_level TEXT,
    assessment_completed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- ENABLE RLS FOR WORKOUTS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_profiles ENABLE ROW LEVEL SECURITY;

-- WORKOUT POLICIES
DROP POLICY IF EXISTS "Admins can manage exercises" ON public.workout_exercises;
CREATE POLICY "Admins can manage exercises" ON public.workout_exercises FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage packages" ON public.workout_packages;
CREATE POLICY "Admins can manage packages" ON public.workout_packages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can manage user access" ON public.user_workout_access;
CREATE POLICY "Admins can manage user access" ON public.user_workout_access FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_workout_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_workout_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Everyone can view exercises" ON public.workout_exercises;
CREATE POLICY "Everyone can view exercises" ON public.workout_exercises FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone can view packages" ON public.workout_packages;
CREATE POLICY "Everyone can view packages" ON public.workout_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own access" ON public.user_workout_access;
CREATE POLICY "Users can view their own access" ON public.user_workout_access FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own profile" ON public.user_workout_profiles;
CREATE POLICY "Users can manage their own profile" ON public.user_workout_profiles FOR ALL USING (auth.uid() = user_id);

-- Ensure admins can update products (for stock deduction)
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add VIP discount percentage to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vip_discount_percentage numeric DEFAULT 0;
