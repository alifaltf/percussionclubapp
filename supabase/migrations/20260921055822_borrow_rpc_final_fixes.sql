SET local check_function_bodies = off;

REVOKE ALL ON FUNCTION "public"."approve_borrow_request"(uuid, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."cancel_borrow_request"(uuid) FROM "anon";

REVOKE ALL ON FUNCTION "public"."complete_return"(uuid, text, public.instrument_condition, public.instrument_status, boolean, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."reject_borrow_request"(uuid, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."report_damage"(uuid, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."submit_borrow_request"(uuid, text, date, date) FROM "anon";

REVOKE ALL ON FUNCTION "public"."submit_return"(uuid, text, text) FROM "anon";

REVOKE ALL ON FUNCTION "public"."update_member_role"(uuid, public.user_role) FROM "anon";

CREATE OR REPLACE FUNCTION public.approve_borrow_request (
  p_request_id uuid,
  p_admin_note text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_request public.borrow_requests%rowtype;
  v_instrument public.instruments%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve borrow requests.';
  end if;

  select *
  into v_request
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Borrow request not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be approved.';
  end if;

  select *
  into v_instrument
  from public.instruments
  where id = v_request.instrument_id
  for update;

  if not found then
    raise exception 'Instrument not found.';
  end if;

  if v_instrument.archived_at is not null then
    raise exception 'This instrument has been archived.';
  end if;

  if v_instrument.status <> 'available' then
    raise exception 'This instrument is no longer available to borrow.';
  end if;

  update public.borrow_requests
  set
    status = 'active',
    admin_note = p_admin_note,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    actual_borrow_date =
      (now() at time zone 'Asia/Kuala_Lumpur')::date,
    condition_before = v_instrument.condition
  where id = p_request_id;

  update public.instruments
  set status = 'borrowed'
  where id = v_request.instrument_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_borrow_request (
  p_request_id uuid
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_request public.borrow_requests%rowtype;
begin
  select *
  into v_request
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Borrow request not found.';
  end if;

  -- NULL-safe ownership check
  if v_request.member_id is distinct from auth.uid() then
    raise exception 'You can only cancel your own requests.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be cancelled.';
  end if;

  update public.borrow_requests
  set status = 'cancelled'
  where id = p_request_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_instrument_by_code (
  p_code text
)
  RETURNS TABLE (
    instrument_code text,
    name            text,
    category        text,
    image_url       text,
    status          public.instrument_status,
    condition       public.instrument_condition
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
BEGIN
  IF p_code IS NULL
     OR p_code !~ '^[a-z0-9]+(_[a-z0-9]+)*$'
  THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i.instrument_code,
    i.name,
    i.category,
    i.image_url,
    i.status,
    i.condition
  FROM public.instruments i
  WHERE i.instrument_code = p_code
    AND i.archived_at IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'member'
  );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.prevent_profile_protected_field_changes()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin

  -- ID must never change
  if NEW.id is distinct from OLD.id then
    raise exception 'Profile id cannot be changed.'
      using errcode = '42501';
  end if;

  -- Only admins may change roles
  if NEW.role is distinct from OLD.role then
    if not public.is_admin() then
      raise exception 'You do not have permission to change role.'
        using errcode = '42501';
    end if;
  end if;

  -- Only admins may change created_at
  if NEW.created_at is distinct from OLD.created_at then
    if not public.is_admin() then
      raise exception 'You do not have permission to change created_at.'
        using errcode = '42501';
    end if;
  end if;

  return NEW;
end;
$function$;

CREATE OR REPLACE FUNCTION public.reject_borrow_request (
  p_request_id uuid,
  p_admin_note text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_request public.borrow_requests%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can reject borrow requests.';
  end if;

  select *
  into v_request
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Borrow request not found.';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only pending requests can be rejected.';
  end if;

  update public.borrow_requests
  set
    status = 'rejected',
    admin_note = p_admin_note,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  where id = p_request_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.report_damage (
  p_request_id   uuid,
  p_damage_notes text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_request public.borrow_requests%rowtype;
begin
  select *
  into v_request
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Borrow request not found.';
  end if;

  -- NULL-safe authorization check
  if not (
    public.is_admin()
    or v_request.member_id is not distinct from auth.uid()
  ) then
    raise exception 'You are not authorized to report damage on this borrowing.';
  end if;

  if not public.is_admin()
     and v_request.status not in ('active', 'overdue') then
    raise exception 'Damage can only be self-reported while a borrowing is active.';
  end if;

  update public.borrow_requests
  set
    damage_reported = true,
    damage_notes = coalesce(p_damage_notes, damage_notes),
    damage_reported_at = now()
  where id = p_request_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_borrow_request (
  p_instrument_id         uuid,
  p_purpose               text,
  p_requested_borrow_date date,
  p_requested_return_date date
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_instrument_status public.instrument_status;
  v_archived timestamptz;
  v_request_id uuid;
  v_malaysia_today date;
begin
  if not public.is_club_member() then
    raise exception 'Only members can submit borrow requests.';
  end if;

  v_malaysia_today :=
    (now() at time zone 'Asia/Kuala_Lumpur')::date;

  select status, archived_at
    into v_instrument_status, v_archived
  from public.instruments
  where id = p_instrument_id
  for update;

  if not found then
    raise exception 'Instrument not found.';
  end if;

  if v_archived is not null then
    raise exception 'This instrument is not available.';
  end if;

  if v_instrument_status <> 'available' then
    raise exception 'This instrument is not currently available.';
  end if;

  if p_requested_borrow_date < v_malaysia_today then
    raise exception 'Borrow date cannot be in the past.';
  end if;

  if p_requested_return_date < p_requested_borrow_date then
    raise exception 'Return date must be on or after the borrow date.';
  end if;

  insert into public.borrow_requests (
    member_id,
    instrument_id,
    purpose,
    requested_borrow_date,
    requested_return_date,
    status
  )
  values (
    auth.uid(),
    p_instrument_id,
    p_purpose,
    p_requested_borrow_date,
    p_requested_return_date,
    'pending'
  )
  returning id into v_request_id;

  -- IMPORTANT:
  -- Do NOT change instruments.status here.
  -- A pending request does not mean the instrument is borrowed.
  -- approve_borrow_request owns the available -> borrowed transition.

  return v_request_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_contact_message (
  p_full_name text,
  p_email     text,
  p_subject   text,
  p_message   text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare v_recent_count integer;
begin
select count(*) into v_recent_count from public.contact_messages where email = p_email and created_at >= now() - interval '60 seconds';
if v_recent_count > 0 then
raise exception 'rate_limited' using errcode = 'P0001';
end if;
insert into public.contact_messages (full_name, email, subject, message) values (p_full_name, p_email, p_subject, p_message);
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_return (
  p_request_id       uuid,
  p_return_photo_url text,
  p_return_notes     text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
declare
  v_request public.borrow_requests%rowtype;
begin
  select *
  into v_request
  from public.borrow_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Borrow request not found.';
  end if;

  -- NULL-safe ownership check
  if v_request.member_id is distinct from auth.uid() then
    raise exception 'You can only submit a return for your own borrowing.';
  end if;

  if v_request.status not in ('active', 'overdue') then
    raise exception 'This borrowing is not currently active.';
  end if;

  if p_return_photo_url is null
     or length(trim(p_return_photo_url)) = 0 then
    raise exception 'A return photo is required.';
  end if;

  update public.borrow_requests
  set
    status = 'return_submitted',
    actual_return_date =
      (now() at time zone 'Asia/Kuala_Lumpur')::date,
    return_photo_url = p_return_photo_url,
    return_notes = p_return_notes
  where id = p_request_id;
end;
$function$;

