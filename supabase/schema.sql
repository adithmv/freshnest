-- ============================================================
--  FRESHNEST — SUPABASE SCHEMA
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text unique,
  avatar_url    text,
  role          text not null check (role in ('buyer', 'seller', 'rider', 'admin')),
  address       text,
  location      geography(point, 4326),
  city          text,
  pincode       text,
  is_verified   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User'),
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. SELLER PROFILES
-- ============================================================
create table public.seller_profiles (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid unique not null references public.profiles(id) on delete cascade,
  shop_name       text not null,
  shop_type       text check (shop_type in ('home_cook', 'bakery', 'tiffin', 'sweet_shop', 'other')),
  description     text,
  banner_url      text,
  fssai_number    text,
  avg_rating      numeric(3,2) default 0,
  total_reviews   integer default 0,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
create table public.categories (
  id    serial primary key,
  name  text unique not null,
  icon  text
);

insert into public.categories (name, icon) values
  ('Rice & Biryani', 'UtensilsCrossed'),
  ('Breads & Bakery', 'Croissant'),
  ('Sweets & Desserts', 'Cake'),
  ('Snacks', 'Package'),
  ('Thali & Meals', 'LayoutGrid'),
  ('Grilled & BBQ', 'Flame'),
  ('Beverages', 'Coffee'),
  ('Other', 'MoreHorizontal');

-- ============================================================
-- 4. LISTINGS
-- ============================================================
create table public.listings (
  id              uuid primary key default uuid_generate_v4(),
  seller_id       uuid not null references public.profiles(id) on delete cascade,
  category_id     integer references public.categories(id),
  title           text not null,
  description     text,
  price           numeric(10,2) not null check (price > 0),
  original_price  numeric(10,2),
  unit_label      text default 'packet',
  total_quantity  integer not null check (total_quantity > 0),
  available_qty   integer not null,
  sold_qty        integer default 0,
  images          text[],
  tags            text[],
  is_veg          boolean default true,
  location        geography(point, 4326),
  address_hint    text,
  expires_at      timestamptz not null,
  status          text default 'active' check (status in ('active', 'sold_out', 'expired', 'removed')),
  is_featured     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index listings_location_idx on public.listings using gist(location);
create index listings_expires_idx  on public.listings(expires_at);
create index listings_seller_idx   on public.listings(seller_id);
create index listings_status_idx   on public.listings(status);

create or replace function public.expire_listings()
returns void as $$
  update public.listings
  set status = 'expired'
  where expires_at < now()
    and status = 'active';
$$ language sql;

-- ============================================================
-- 5. ORDERS
-- ============================================================
create table public.orders (
  id                uuid primary key default uuid_generate_v4(),
  buyer_id          uuid not null references public.profiles(id),
  listing_id        uuid not null references public.listings(id),
  seller_id         uuid not null references public.profiles(id),
  rider_id          uuid references public.profiles(id),
  quantity          integer not null default 1 check (quantity > 0),
  unit_price        numeric(10,2) not null,
  total_amount      numeric(10,2) not null,
  delivery_address  text not null,
  delivery_location geography(point, 4326),
  delivery_notes    text,
  payment_method    text default 'cod' check (payment_method in ('cod', 'upi')),
  payment_status    text default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  status            text default 'placed' check (status in (
    'placed', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'
  )),
  placed_at         timestamptz default now(),
  confirmed_at      timestamptz,
  ready_at          timestamptz,
  picked_up_at      timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text
);

create index orders_buyer_idx  on public.orders(buyer_id);
create index orders_seller_idx on public.orders(seller_id);
create index orders_rider_idx  on public.orders(rider_id);
create index orders_status_idx on public.orders(status);

create or replace function public.handle_new_order()
returns trigger as $$
begin
  update public.listings
  set
    available_qty = available_qty - new.quantity,
    sold_qty      = sold_qty + new.quantity,
    status = case
      when (available_qty - new.quantity) <= 0 then 'sold_out'
      else status
    end
  where id = new.listing_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_placed
  after insert on public.orders
  for each row execute procedure public.handle_new_order();

create or replace function public.handle_order_cancelled()
returns trigger as $$
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    update public.listings
    set
      available_qty = available_qty + old.quantity,
      sold_qty      = sold_qty - old.quantity,
      status        = 'active'
    where id = old.listing_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_order_cancelled
  after update on public.orders
  for each row execute procedure public.handle_order_cancelled();

-- ============================================================
-- 6. REVIEWS
-- ============================================================
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid unique not null references public.orders(id),
  reviewer_id uuid not null references public.profiles(id),
  seller_id   uuid not null references public.profiles(id),
  listing_id  uuid not null references public.listings(id),
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

create or replace function public.update_seller_rating()
returns trigger as $$
begin
  update public.seller_profiles
  set
    avg_rating    = (select round(avg(rating)::numeric, 2) from public.reviews where seller_id = new.seller_id),
    total_reviews = (select count(*) from public.reviews where seller_id = new.seller_id)
  where user_id = new.seller_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_review_created
  after insert on public.reviews
  for each row execute procedure public.update_seller_rating();

-- ============================================================
-- 7. NOTIFICATIONS
-- ============================================================
create table public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text,
  type       text check (type in ('order_update', 'new_listing', 'review', 'system')),
  ref_id     uuid,
  is_read    boolean default false,
  created_at timestamptz default now()
);

create index notifications_user_idx on public.notifications(user_id, is_read);

-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.listings      enable row level security;
alter table public.orders        enable row level security;
alter table public.reviews       enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles viewable by all"        on public.profiles        for select using (true);
create policy "Users update own profile"        on public.profiles        for update using (auth.uid() = id);
create policy "Seller profiles viewable by all" on public.seller_profiles for select using (true);
create policy "Sellers manage own profile"      on public.seller_profiles for all    using (auth.uid() = user_id);
create policy "Active listings viewable by all" on public.listings        for select using (status = 'active');
create policy "Sellers manage own listings"     on public.listings        for all    using (auth.uid() = seller_id);
create policy "Buyers see own orders"           on public.orders          for select using (auth.uid() = buyer_id);
create policy "Sellers see their orders"        on public.orders          for select using (auth.uid() = seller_id);
create policy "Buyers place orders"             on public.orders          for insert with check (auth.uid() = buyer_id);
create policy "Update order status"             on public.orders          for update using (auth.uid() = seller_id or auth.uid() = rider_id);
create policy "Reviews viewable by all"         on public.reviews         for select using (true);
create policy "Buyers post reviews"             on public.reviews         for insert with check (auth.uid() = reviewer_id);
create policy "Users see own notifications"     on public.notifications   for all    using (auth.uid() = user_id);

-- ============================================================
-- 9. NEARBY LISTINGS FUNCTION
-- ============================================================
create or replace function public.nearby_listings(
  lat float,
  lng float,
  radius_meters float default 3000
)
returns table (
  id uuid, title text, price numeric, available_qty integer,
  expires_at timestamptz, distance_meters float,
  seller_name text, avg_rating numeric
)
language sql stable as $$
  select
    l.id, l.title, l.price, l.available_qty, l.expires_at,
    st_distance(l.location, st_point(lng, lat)::geography) as distance_meters,
    sp.shop_name as seller_name,
    sp.avg_rating
  from public.listings l
  join public.seller_profiles sp on sp.user_id = l.seller_id
  where
    l.status = 'active'
    and l.expires_at > now()
    and st_dwithin(l.location, st_point(lng, lat)::geography, radius_meters)
  order by distance_meters asc;
$$;

-- ============================================================
-- 10. REALTIME
-- ============================================================
alter publication supabase_realtime add table public.listings;
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;