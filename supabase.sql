-- Pega todo este archivo en Supabase > SQL Editor > Run

create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 40),
  tel text not null check (tel ~ '^[0-9]{8,15}$'),
  rol text not null default 'cliente' check (rol in ('cliente','vendedor')),
  creado timestamptz default now()
);

create table public.vendedores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 40),
  nota text default '' check (char_length(nota) <= 60),
  hora numeric not null check (hora >= 0),
  margen numeric not null default 0 check (margen between 0 and 200),
  tel text not null check (tel ~ '^[0-9]{8,15}$'),
  mat jsonb not null default '{}'::jsonb,
  creado timestamptz default now()
);

alter table public.perfiles enable row level security;
alter table public.vendedores enable row level security;

-- Perfiles: cada persona solo ve y modifica el suyo
create policy "perfil: leer el propio" on public.perfiles for select using (auth.uid() = id);
create policy "perfil: crear el propio" on public.perfiles for insert with check (auth.uid() = id);
create policy "perfil: editar el propio" on public.perfiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "perfil: borrar el propio" on public.perfiles for delete using (auth.uid() = id);

-- Vendedores: todos pueden verlos, cada vendedor solo modifica el suyo
create policy "vendedores: todos leen" on public.vendedores for select using (true);
create policy "vendedores: crear el propio" on public.vendedores for insert with check (auth.uid() = id);
create policy "vendedores: editar el propio" on public.vendedores for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "vendedores: borrar el propio" on public.vendedores for delete using (auth.uid() = id);

-- Función para que cada persona pueda borrar su propia cuenta
create or replace function public.borrar_mi_cuenta()
returns void
language sql
security definer
set search_path = public
as $$
  delete from auth.users where id = auth.uid();
$$;
revoke all on function public.borrar_mi_cuenta() from public, anon;
grant execute on function public.borrar_mi_cuenta() to authenticated;
