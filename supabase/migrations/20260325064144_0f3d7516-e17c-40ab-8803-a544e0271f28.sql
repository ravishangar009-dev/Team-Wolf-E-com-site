
-- Allow delivery agents to view orders assigned to them
CREATE POLICY "Delivery agents can view their assigned orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_agents
    WHERE delivery_agents.id = orders.delivery_agent_id
      AND delivery_agents.user_id = auth.uid()
  )
);

-- Allow delivery agents to update orders assigned to them (status changes)
CREATE POLICY "Delivery agents can update their assigned orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.delivery_agents
    WHERE delivery_agents.id = orders.delivery_agent_id
      AND delivery_agents.user_id = auth.uid()
  )
);
