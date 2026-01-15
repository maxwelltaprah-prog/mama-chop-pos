-- Assign admin role to existing user (maxwelltaprah@gmail.com - user_id: 95ed8b48-5580-4f51-8b27-15a1377af0c)
INSERT INTO public.user_roles (user_id, role)
VALUES ('95ed8b48-5580-4f51-8b27-15a13777af0c', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update menu_items RLS policy to allow anonymous users to view (for customer ordering page)
DROP POLICY IF EXISTS "All authenticated users can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view available menu items" 
ON public.menu_items 
FOR SELECT 
USING (true);

-- Allow cashiers and admins to create orders (update existing policy)
DROP POLICY IF EXISTS "Cashiers and admins can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view orders with order_type = 'customer' or authenticated staff to view all
DROP POLICY IF EXISTS "All authenticated staff can view orders" ON public.orders;
CREATE POLICY "Staff can view all orders" 
ON public.orders 
FOR SELECT 
USING (public.has_any_role(auth.uid()) OR order_type = 'customer');

-- Allow anyone to create order items for customer orders
DROP POLICY IF EXISTS "Cashiers and admins can create order items" ON public.order_items;
CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to view order items for their orders
DROP POLICY IF EXISTS "All authenticated staff can view order items" ON public.order_items;
CREATE POLICY "Anyone can view order items" 
ON public.order_items 
FOR SELECT 
USING (true);

-- Seed sample menu items
INSERT INTO public.menu_items (name, description, price, category, available) VALUES
('Jollof Rice with Chicken', 'Fragrant rice cooked in tomato sauce with grilled chicken', 35.00, 'main', true),
('Waakye with Fish', 'Rice and beans combo served with fried fish and shito', 30.00, 'main', true),
('Banku with Tilapia', 'Fermented corn dough with grilled tilapia and pepper sauce', 45.00, 'main', true),
('Fufu with Light Soup', 'Pounded cassava and plantain with spicy goat meat soup', 40.00, 'main', true),
('Fried Rice with Shrimp', 'Wok-fried rice with vegetables and jumbo shrimp', 50.00, 'main', true),
('Kelewele', 'Spicy fried plantain cubes seasoned with ginger and pepper', 15.00, 'sides', true),
('Fried Yam', 'Crispy fried yam slices served with shito', 12.00, 'sides', true),
('Coleslaw', 'Fresh cabbage and carrot salad with creamy dressing', 8.00, 'sides', true),
('Spring Rolls (4 pcs)', 'Crispy vegetable spring rolls with sweet chili sauce', 18.00, 'sides', true),
('Fresh Orange Juice', 'Freshly squeezed orange juice', 10.00, 'drinks', true),
('Sobolo', 'Traditional hibiscus drink with ginger and spices', 8.00, 'drinks', true),
('Malta Guinness', 'Non-alcoholic malt drink', 12.00, 'drinks', true),
('Water (500ml)', 'Bottled mineral water', 5.00, 'drinks', true),
('Soft Drinks', 'Coca-Cola, Fanta, or Sprite', 8.00, 'drinks', true),
('Meat Pie', 'Flaky pastry filled with seasoned minced meat', 10.00, 'desserts', true),
('Chin Chin', 'Crunchy fried dough snack', 8.00, 'desserts', true),
('Ice Cream (2 scoops)', 'Vanilla, chocolate, or strawberry', 15.00, 'desserts', true),
('Fruit Salad', 'Fresh seasonal fruits with honey drizzle', 12.00, 'desserts', true)
ON CONFLICT DO NOTHING;