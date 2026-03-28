  BIGBYT — Supabase Database Schema 
--  Run this entire file in: Supabase Dashboard → SQL Editor -- ============================================================ 
 -- ─── Extensions ────────────────────────────────────────────── 
create extension if not exists "uuid-ossp"; 
 -- ─── PROFILES 
──────────────────────────────────────────────── -- Extends Supabase auth.users with extra fields 
create table public.profiles ( 
  id           uuid references auth.users(id) on delete cascade primary key, 
  full_name    text not null, 
  phone        text, 
  date_of_birth date not null, 
  avatar_url   text, 
  created_at   timestamptz default now() 
); 
 
alter table public.profiles enable row level security; 
 
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id); 
 
create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id); 
 
create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id); 
 
 -- ─── ADDRESSES 
─────────────────────────────────────────────── 
create table public.addresses ( 
  id         uuid default uuid_generate_v4() primary key, 
  user_id    uuid references public.profiles(id) on delete cascade not null, 
  label      text not null,             -- e.g. "Home", "Work" 
  address    text not null, 
  city       text not null, 
  is_default boolean default false, 
  created_at timestamptz default now() 
); 
 
alter table public.addresses enable row level security; 
 
create policy "Users manage their own addresses" 
  on public.addresses for all 
  using (auth.uid() = user_id); 
 
 -- ─── RESTAURANTS 
───────────────────────────────────────────── 
create table public.restaurants ( 
  id            uuid default uuid_generate_v4() primary key, 
  name          text not null, 
  description   text, 
  cuisine_tags  text[],                 -- e.g. ['BBQ', 'Burgers'] 
  neighborhood  text not null,          -- used for "Nearby" sorting 
  city          text not null, 
  address       text, 
  phone         text, 
  email         text, 
  logo_url      text, 
  banner_url    text, 
  emoji         text default '
🍽
', 
  rating        numeric(2,1) default 0.0, 
  review_count  int default 0, 
  delivery_time text default '25–35 min', 
  delivery_fee  numeric(6,2) default 2.99, 
  min_order     numeric(6,2) default 8.00, 
  is_open       boolean default true, 
  is_featured   boolean default false, 
  created_at    timestamptz default now() 
); 
 
alter table public.restaurants enable row level security; 
 -- Public read — anyone can see restaurants 
create policy "Anyone can view restaurants" 
  on public.restaurants for select 
  using (true); 
 -- Only service role / admin can insert/update restaurants -- (Manage restaurants from Supabase Dashboard or a separate admin panel) 
 
 
-- ─── MENU CATEGORIES ───────────────────────────────────────── 
create table public.menu_categories ( 
  id            uuid default uuid_generate_v4() primary key, 
  restaurant_id uuid references public.restaurants(id) on delete cascade not null, 
  name          text not null,          -- e.g. "Burgers", "Sides", "Drinks" 
  sort_order    int default 0, 
  created_at    timestamptz default now() 
); 
 
alter table public.menu_categories enable row level security; 
 
create policy "Anyone can view menu categories" 
  on public.menu_categories for select 
  using (true); 
 
 -- ─── MENU ITEMS ────────────────────────────────────────────── 
create table public.menu_items ( 
  id            uuid default uuid_generate_v4() primary key, 
  restaurant_id uuid references public.restaurants(id) on delete cascade not null, 
  category_id   uuid references public.menu_categories(id) on delete set null, 
  name          text not null, 
  description   text, 
  price         numeric(8,2) not null, 
  image_url     text, 
  emoji         text default '
🍽
', 
  is_popular    boolean default false, 
  is_available  boolean default true, 
  allergens     text[],                 -- e.g. ['gluten', 'dairy'] 
  created_at    timestamptz default now() 
); 
 
alter table public.menu_items enable row level security; 
 
create policy "Anyone can view available menu items" 
  on public.menu_items for select 
  using (is_available = true); 
 
 -- ─── ORDERS 
────────────────────────────────────────────────── 
create type order_status as enum ( 
  'pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled' 
); 
 
create type payment_status as enum ( 
  'unpaid', 'paid', 'refunded' 
); 
 
create table public.orders ( 
  id              uuid default uuid_generate_v4() primary key, 
  user_id         uuid references public.profiles(id) on delete set null, 
  restaurant_id   uuid references public.restaurants(id) on delete set null, 
  delivery_address text not null, 
  subtotal        numeric(10,2) not null, 
  delivery_fee    numeric(6,2) not null, 
  tax             numeric(8,2) not null, 
  total           numeric(10,2) not null, 
  status          order_status default 'pending', 
  payment_status  payment_status default 'unpaid', 
  payment_ref     text,                 -- Paystack/Stripe reference 
  estimated_mins  int default 30, 
  notes           text, 
  placed_at       timestamptz default now(), 
  delivered_at    timestamptz, 
  updated_at      timestamptz default now() 
); 
 
alter table public.orders enable row level security; 
 
create policy "Users can view their own orders" 
  on public.orders for select 
  using (auth.uid() = user_id); 
 
create policy "Users can insert their own orders" 
  on public.orders for insert 
  with check (auth.uid() = user_id); 
 
create policy "Users can update their own orders (cancel)" 
  on public.orders for update 
  using (auth.uid() = user_id); 
 
 -- ─── ORDER ITEMS ───────────────────────────────────────────── 
create table public.order_items ( 
  id           uuid default uuid_generate_v4() primary key, 
  order_id     uuid references public.orders(id) on delete cascade not null, 
  menu_item_id uuid references public.menu_items(id) on delete set null, 
  name         text not null,           -- snapshot of name at time of order 
  price        numeric(8,2) not null,   -- snapshot of price at time of order 
  qty          int not null check (qty > 0), 
  emoji        text, 
  subtotal     numeric(10,2) generated always as (price * qty) stored 
); 
 
alter table public.order_items enable row level security; 
 
create policy "Users can view their own order items" 
  on public.order_items for select 
  using ( 
    exists ( 
      select 1 from public.orders o 
      where o.id = order_id and o.user_id = auth.uid() 
    ) 
  ); 
 
create policy "Users can insert order items for their orders" 
  on public.order_items for insert 
  with check ( 
    exists ( 
      select 1 from public.orders o 
      where o.id = order_id and o.user_id = auth.uid() 
    ) 
  ); 
 
 -- ─── REVIEWS 
───────────────────────────────────────────────── 
create table public.reviews ( 
  id            uuid default uuid_generate_v4() primary key, 
  user_id       uuid references public.profiles(id) on delete cascade not null, 
  restaurant_id uuid references public.restaurants(id) on delete cascade not null, 
  order_id      uuid references public.orders(id) on delete set null, 
  rating        int check (rating between 1 and 5) not null, 
  comment       text, 
  created_at    timestamptz default now(), 
  unique (user_id, order_id)            -- one review per order 
); 
 
alter table public.reviews enable row level security; 
 
create policy "Anyone can view reviews" 
on public.reviews for select 
using (true); 
create policy "Users can write reviews for their own orders" 
on public.reviews for insert 
with check (auth.uid() = user_id); -- ─── FUNCTION: auto-update restaurant rating after review ──── 
create or replace function update_restaurant_rating() 
returns trigger language plpgsql as $$ 
begin 
update public.restaurants 
set 
rating       
= (select round(avg(rating)::numeric, 1) from public.reviews where restaurant_id = 
new.restaurant_id), 
review_count = (select count(*) from public.reviews where restaurant_id = new.restaurant_id) 
where id = new.restaurant_id; 
return new; 
end; 
$$; 
create trigger after_review_insert 
after insert on public.reviews 
for each row execute function update_restaurant_rating(); -- ─── FUNCTION: auto-create profile on signup ───────────────── -- Call this from your frontend after signup, OR use a Supabase trigger. -- The frontend approach (in authService.js) is safer and more flexible. -- ─── REALTIME: enable for order status tracking ────────────── 
alter publication supabase_realtime add table public.orders; -- ============================================================ --  SEED DATA — Replace with your own restaurants & menus --  Run after the schema above. -- ============================================================ -- !! REPLACE THESE with your real restaurant data !! 
insert into public.restaurants (name, description, cuisine_tags, neighborhood, city, emoji, 
delivery_time, delivery_fee, min_order, is_open, is_featured) 
values 
('Flames & Smoke',  'The best BBQ in the city',          
'Lagos', '
🔥
', '18–25 min', 1.99, 8.00,  true, true), 
('Sakura Express',  'Authentic Japanese cuisine',         
1',  'Lagos', '
🌸
', '22–30 min', 2.49, 12.00, true, false), 
('Nonna's Kitchen','Homestyle Italian cooking',          
array['BBQ','Burgers'],      
'Lekki Phase 1',  
array['Japanese','Sushi'],   'Lekki Phase 
array['Italian','Pasta'],    'Victoria 
Island','Lagos', '
🍝
', '28–38 min', 2.99, 15.00, true, false), 
('Spice Route',     
'Bold flavours from the subcontinent',array['Indian','Curry'],     
'Lagos', '
🌶
','25–35 min', 2.49, 10.00, true, false), 
('The Burger Lab',  'Experimental gourmet burgers',       
'Ikoyi',          
array['Burgers','Shakes'],   'Surulere',       
'Lagos', '
🧪
', '30–40 min', 1.99, 8.00,  false,false), 
('Green Bowl',      
'Clean, healthy, delicious bowls',    array['Healthy','Bowls'],    'Ajah',           
'Lagos', '
🥗
', '20–28 min', 1.49, 8.00,  true, false); -- !! After inserting restaurants, grab their UUIDs from the dashboard -- !! and insert menu_categories + menu_items for each one. -- !! Example pattern (repeat for each restaurant): -- -- insert into public.menu_categories (restaurant_id, name, sort_order) values --   ('<RESTAURANT_UUID>', 'Burgers', 1), --   ('<RESTAURANT_UUID>', 'Sides',   2), --   ('<RESTAURANT_UUID>', 'Drinks',  3); -- -- insert into public.menu_items (restaurant_id, category_id, name, description, price, emoji, 
is_popular) values --   ('<RESTAURANT_UUID>', '<CATEGORY_UUID>', 'Smash Burger', 'Double smash patty...', 
14.99, '
🍔
', true), --   ('<RESTAURANT_UUID>', '<CATEGORY_UUID>', 'Truffle Fries','Hand-cut, truffle oil',  7.99, 
'
🍟
', false); 
…