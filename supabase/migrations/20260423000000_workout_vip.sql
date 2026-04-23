-- Workout Exercises table
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    video_url TEXT,
    targeted_muscles TEXT[], -- Array of muscles
    workout_type TEXT NOT NULL CHECK (workout_type IN ('cardio', 'weight training', 'weight loss', 'weight gain')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Workout Packages table
CREATE TABLE IF NOT EXISTS public.workout_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User Workout Access (Subscriptions)
CREATE TABLE IF NOT EXISTS public.user_workout_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.workout_packages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- User Workout Profiles (Assessment results)
CREATE TABLE IF NOT EXISTS public.user_workout_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fitness_goal TEXT NOT NULL, -- cardio, weight training, weight loss, weight gain
    experience_level TEXT,
    assessment_completed BOOLEAN DEFAULT FALSE,
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_workout_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admin policies
CREATE POLICY "Admins can manage exercises" ON public.workout_exercises FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage packages" ON public.workout_packages FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage user access" ON public.user_workout_access FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all profiles" ON public.user_workout_profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- User policies
CREATE POLICY "Everyone can view exercises" ON public.workout_exercises FOR SELECT USING (true);
CREATE POLICY "Everyone can view packages" ON public.workout_packages FOR SELECT USING (true);
CREATE POLICY "Users can view their own access" ON public.user_workout_access FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own profile" ON public.user_workout_profiles FOR ALL USING (auth.uid() = user_id);
