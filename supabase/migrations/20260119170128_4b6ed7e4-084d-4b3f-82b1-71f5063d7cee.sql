-- Add accompaniments column to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN accompaniments jsonb DEFAULT NULL;

-- Add a comment to describe the column
COMMENT ON COLUMN public.menu_items.accompaniments IS 'JSON array of accompaniments with name and price, e.g., [{"name": "Rice", "price": 5.00}]';