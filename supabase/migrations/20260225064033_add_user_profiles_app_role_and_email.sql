drop policy "Users can update own profile" on "public"."user_profiles";

alter table "public"."user_profiles" add column "app_role" text not null default 'authenticated'::text;

alter table "public"."user_profiles" add column "email" text;

alter table "public"."user_profiles" add constraint "profiles_username_check" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."user_profiles" validate constraint "profiles_username_check";

alter table "public"."user_profiles" add constraint "user_profiles_app_role_check" CHECK ((app_role = ANY (ARRAY['super_admin'::text, 'authenticated'::text]))) not valid;

alter table "public"."user_profiles" validate constraint "user_profiles_app_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.user_profiles (id, full_name, avatar_url, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', new.email)
  on conflict (id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_app_role_change_by_non_super_admin()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if old.app_role is distinct from new.app_role then
    if (select up.app_role from public.user_profiles up where up.id = auth.uid()) <> 'super_admin' then
      raise exception 'Only super_admin can change app_role.';
    end if;
  end if;
  return new;
end;
$function$
;


  create policy "Users can update own profile"
  on "public"."user_profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


CREATE TRIGGER prevent_app_role_change BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_app_role_change_by_non_super_admin();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


