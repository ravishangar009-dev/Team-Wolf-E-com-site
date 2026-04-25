-- Insert sample supplement products for Team Wolf Supplement
DO $$ 
DECLARE 
    store_id_var UUID;
BEGIN
    -- Get the store ID for Team Wolf Supplement
    SELECT id INTO store_id_var FROM public.stores WHERE name = 'Team Wolf Supplement' LIMIT 1;

    IF store_id_var IS NOT NULL THEN
        -- 1. Whey Protein
        INSERT INTO public.products (store_id, name, description, price, image_url, category, stock_count, flavors, usage_guide)
        VALUES (
            store_id_var,
            'Premium Whey Protein 2kg',
            'Advanced muscle recovery formula with 24g protein per serving. Perfect for post-workout growth.',
            3200,
            'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800',
            'Proteins',
            50,
            '[
                {"name": "Rich Chocolate", "image_url": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400", "stock": 15, "price": 3200},
                {"name": "French Vanilla", "image_url": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400", "stock": 15, "price": 3200},
                {"name": "Strawberry Blast", "image_url": "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400", "stock": 20, "price": 3200}
            ]'::jsonb,
            'Mix 1 scoop with 200-250ml of cold water or milk. Consume immediately after workout or between meals.'
        );

        -- 2. Creatine
        INSERT INTO public.products (store_id, name, description, price, image_url, category, stock_count, flavors, usage_guide)
        VALUES (
            store_id_var,
            'Micronized Creatine Monohydrate',
            'Purest form of creatine to increase muscle power, strength and size. No fillers or additives.',
            650,
            'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
            'Performance',
            100,
            '[
                {"name": "Unflavored", "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", "stock": 70, "price": 650},
                {"name": "Fruit Punch", "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", "stock": 30, "price": 680}
            ]'::jsonb,
            'Take 3-5g (1 scoop) daily with water or your favorite beverage. Stay well hydrated.'
        );

        -- 3. Pre-Workout
        INSERT INTO public.products (store_id, name, description, price, image_url, category, stock_count, flavors, usage_guide)
        VALUES (
            store_id_var,
            'Extreme Focus Pre-Workout',
            'High-stimulant formula for explosive energy, tunnel vision focus and skin-splitting pumps.',
            1800,
            'https://images.unsplash.com/photo-1579722820308-d74e5719d54e?w=800',
            'Energy',
            40,
            '[
                {"name": "Blue Raspberry", "image_url": "https://images.unsplash.com/photo-1579722820308-d74e5719d54e?w=400", "stock": 20, "price": 1800},
                {"name": "Watermelon", "image_url": "https://images.unsplash.com/photo-1579722820308-d74e5719d54e?w=400", "stock": 20, "price": 1800}
            ]'::jsonb,
            'Assess tolerance with half a scoop first. Take 1 full scoop 20-30 minutes before training. Do not exceed 1 scoop in 24 hours.'
        );

        -- 4. BCAA
        INSERT INTO public.products (store_id, name, description, price, image_url, category, stock_count, flavors, usage_guide)
        VALUES (
            store_id_var,
            'BCAA 2:1:1 Recovery',
            'Essential Branched Chain Amino Acids to support muscle preservation and reduce fatigue.',
            1200,
            'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800',
            'Recovery',
            60,
            '[
                {"name": "Mango Loco", "image_url": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400", "stock": 30, "price": 1200},
                {"name": "Lemonade", "image_url": "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400", "stock": 30, "price": 1200}
            ]'::jsonb,
            'Mix 1 scoop with 500ml of water and sip during your workout session.'
        );

        -- 5. Multivitamins
        INSERT INTO public.products (store_id, name, description, price, image_url, category, stock_count, flavors, usage_guide)
        VALUES (
            store_id_var,
            'Daily Multi-Vitamax',
            'Complete spectrum of vitamins, minerals and antioxidants for overall well-being and immunity.',
            850,
            'https://images.unsplash.com/photo-1584017947486-5c91288677a4?w=800',
            'Health',
            150,
            '[
                {"name": "90 Capsules", "image_url": "https://images.unsplash.com/photo-1584017947486-5c91288677a4?w=400", "stock": 150, "price": 850}
            ]'::jsonb,
            'Take 1 capsule daily with breakfast or as directed by your healthcare professional.'
        );
    END IF;
END $$;
