-- NEXORA Phase 2 schema for a Supabase project.
-- Run this migration in the Supabase SQL editor or migration runner.
-- The Replit Supabase connector exposes PostgREST, not arbitrary DDL.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_nexora_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  brand text not null,
  short_description text not null default '',
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  original_price numeric(12, 2) not null check (original_price >= 0),
  sku text not null unique,
  stock integer not null default 0 check (stock >= 0),
  rating numeric(3, 2) not null default 0 check (rating >= 0 and rating <= 5),
  review_count integer not null default 0 check (review_count >= 0),
  featured boolean not null default false,
  new_arrival boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (product_id, sort_order)
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_type text not null,
  variant_value text not null,
  price_adjustment numeric(12, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0),
  sku text unique,
  unique (product_id, variant_type, variant_value)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text not null default 'India',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists cart_items_product_without_variant
  on public.cart_items (cart_id, product_id)
  where variant_id is null;
create unique index if not exists cart_items_product_with_variant
  on public.cart_items (cart_id, product_id, variant_id)
  where variant_id is not null;

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  unique (wishlist_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  address_id uuid references public.addresses(id) on delete set null,
  order_number text not null unique,
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  delivery_fee numeric(12, 2) not null default 0 check (delivery_fee >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null check (total >= 0),
  payment_method text not null check (payment_method in ('card', 'upi', 'cod', 'test')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  order_status text not null default 'confirmed' check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  address_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  total_price numeric(12, 2) not null check (total_price >= 0)
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text not null default '',
  review text not null,
  verified_purchase boolean not null default false,
  helpful_count integer not null default 0 check (helpful_count >= 0),
  approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12, 2) not null check (discount_value >= 0),
  minimum_order numeric(12, 2) not null default 0 check (minimum_order >= 0),
  maximum_discount numeric(12, 2),
  start_date timestamptz,
  expiry_date timestamptz,
  usage_limit integer,
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true
);

create table if not exists public.coupon_usage (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.coupons(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  used_at timestamptz not null default timezone('utc', now()),
  unique (coupon_id, user_id, order_id)
);

create table if not exists public.recently_viewed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  viewed_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_brand_idx on public.products(brand);
create index if not exists products_active_idx on public.products(active);
create index if not exists products_slug_idx on public.products(slug);
create index if not exists products_search_idx on public.products using gin (to_tsvector('simple', name || ' ' || brand || ' ' || description));
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists orders_user_idx on public.orders(user_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists recently_viewed_user_idx on public.recently_viewed(user_id, viewed_at desc);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at before update on public.addresses
for each row execute function public.set_updated_at();
drop trigger if exists carts_set_updated_at on public.carts;
create trigger carts_set_updated_at before update on public.carts
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_usage enable row level security;
alter table public.recently_viewed enable row level security;
alter table public.notifications enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_nexora_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());

create policy categories_public_read on public.categories for select using (active = true or public.is_nexora_admin());
create policy categories_admin_write on public.categories for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy products_public_read on public.products for select using (active = true or public.is_nexora_admin());
create policy products_admin_write on public.products for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy product_images_public_read on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and (p.active = true or public.is_nexora_admin())));
create policy product_images_admin_write on public.product_images for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy product_variants_public_read on public.product_variants for select using (exists (select 1 from public.products p where p.id = product_id and (p.active = true or public.is_nexora_admin())));
create policy product_variants_admin_write on public.product_variants for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());

create policy addresses_self_all on public.addresses for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy carts_self_all on public.carts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cart_items_self_all on public.cart_items for all using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())) with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));
create policy wishlists_self_all on public.wishlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy wishlist_items_self_all on public.wishlist_items for all using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())) with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));
create policy orders_self_select on public.orders for select using (user_id = auth.uid() or public.is_nexora_admin());
create policy orders_self_insert on public.orders for insert with check (user_id = auth.uid());
create policy orders_self_update on public.orders for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy orders_admin_all on public.orders for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy order_items_self_select on public.order_items for select using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_nexora_admin())));
create policy reviews_public_read on public.reviews for select using (approved = true or user_id = auth.uid() or public.is_nexora_admin());
create policy reviews_self_insert on public.reviews for insert with check (user_id = auth.uid());
create policy reviews_self_update on public.reviews for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reviews_admin_all on public.reviews for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy coupons_public_read on public.coupons for select using (active = true);
create policy coupons_admin_all on public.coupons for all using (public.is_nexora_admin()) with check (public.is_nexora_admin());
create policy coupon_usage_self_select on public.coupon_usage for select using (user_id = auth.uid() or public.is_nexora_admin());
create policy recently_viewed_self_all on public.recently_viewed for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_self_all on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());