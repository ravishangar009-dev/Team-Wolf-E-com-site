
-- Create delivery_agents table
CREATE TABLE public.delivery_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  is_available boolean NOT NULL DEFAULT true,
  current_lat double precision,
  current_lng double precision,
  location_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add delivery_agent_id and assigned_at to orders
ALTER TABLE public.orders ADD COLUMN delivery_agent_id uuid REFERENCES public.delivery_agents(id);
ALTER TABLE public.orders ADD COLUMN assigned_at timestamptz;

-- Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins can do everything on delivery_agents"
ON public.delivery_agents FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- All authenticated users can read delivery_agents (for tracking)
CREATE POLICY "Authenticated users can read delivery_agents"
ON public.delivery_agents FOR SELECT
TO authenticated
USING (true);

-- Agents can update their own location and availability
CREATE POLICY "Agents can update own row"
ON public.delivery_agents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for delivery_agents
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_agents;
