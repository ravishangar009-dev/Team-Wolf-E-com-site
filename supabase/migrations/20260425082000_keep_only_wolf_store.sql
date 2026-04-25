-- Delete all stores EXCEPT 'Team Wolf Supplement'
-- This will also cascade delete associated products, offline bills, and store admins if foreign keys are set up correctly.

DO $$
BEGIN
    -- Delete all stores that do not match the main store name
    DELETE FROM public.stores 
    WHERE name != 'Team Wolf Supplement';
END $$;
