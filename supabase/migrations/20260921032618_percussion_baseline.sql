SET local check_function_bodies = off;

CREATE EXTENSION "btree_gist" SCHEMA "public";

CREATE TABLE "public"."announcements" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"        text                     NOT NULL,
  "slug"         text                     NOT NULL,
  "summary"      text                     NOT NULL,
  "content"      text                     NOT NULL,
  "is_pinned"    boolean                  NOT NULL DEFAULT false,
  "published_at" timestamp with time zone,
  "expires_at"   timestamp with time zone,
  "archived_at"  timestamp with time zone,
  "created_by"   uuid,
  "created_at"   timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"   timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "announcements_pkey" PRIMARY KEY (id),
  CONSTRAINT "announcements_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."announcements"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."borrow_requests" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "member_id"             uuid                     NOT NULL,
  "instrument_id"         uuid                     NOT NULL,
  "purpose"               text                     NOT NULL,
  "requested_borrow_date" date                     NOT NULL,
  "requested_return_date" date                     NOT NULL,
  "admin_note"            text,
  "reviewed_by"           uuid,
  "reviewed_at"           timestamp with time zone,
  "actual_borrow_date"    date,
  "actual_return_date"    date,
  "return_photo_url"      text,
  "return_notes"          text,
  "damage_reported"       boolean                  NOT NULL DEFAULT false,
  "damage_notes"          text,
  "damage_reported_at"    timestamp with time zone,
  "verified_by"           uuid,
  "verified_at"           timestamp with time zone,
  "created_at"            timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "borrow_dates_valid" CHECK ((requested_return_date >= requested_borrow_date)),
  CONSTRAINT "borrow_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "purpose_not_blank" CHECK ((length(TRIM(BOTH FROM purpose)) > 0))
);

ALTER TABLE "public"."borrow_requests"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contact_messages" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "full_name"  text                     NOT NULL,
  "email"      text                     NOT NULL,
  "subject"    text,
  "message"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "contact_messages_email_length" CHECK (((char_length(TRIM(BOTH FROM email)) > 0) AND (char_length(TRIM(BOTH FROM email)) <= 254))),
  CONSTRAINT "contact_messages_full_name_length" CHECK (((char_length(TRIM(BOTH FROM full_name)) >= 2) AND (char_length(TRIM(BOTH FROM full_name)) <= 100))),
  CONSTRAINT "contact_messages_message_length" CHECK (((char_length(TRIM(BOTH FROM message)) >= 10) AND (char_length(TRIM(BOTH FROM message)) <= 5000))),
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY (id),
  CONSTRAINT "contact_messages_subject_length" CHECK (((subject IS NULL) OR (char_length(subject) <= 150)))
);

ALTER TABLE "public"."contact_messages"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."events" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"             text                     NOT NULL,
  "slug"              text                     NOT NULL,
  "short_description" text,
  "description"       text,
  "event_date"        date                     NOT NULL,
  "start_time"        time without time zone,
  "end_time"          time without time zone,
  "location"          text,
  "banner_url"        text,
  "registration_url"  text,
  "is_featured"       boolean                  NOT NULL DEFAULT false,
  "published_at"      timestamp with time zone,
  "archived_at"       timestamp with time zone,
  "created_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"        timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "events_pkey" PRIMARY KEY (id),
  CONSTRAINT "events_slug_format" CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text)),
  CONSTRAINT "events_time_order" CHECK (((start_time IS NULL) OR (end_time IS NULL) OR (start_time < end_time))),
  "created_by"        uuid                     DEFAULT auth.uid()
);

ALTER TABLE "public"."events"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."gallery_albums" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "title"           text                     NOT NULL,
  "slug"            text                     NOT NULL,
  "description"     text,
  "cover_image_url" text,
  "event_id"        uuid,
  "is_featured"     boolean                  NOT NULL DEFAULT false,
  "published_at"    timestamp with time zone,
  "archived_at"     timestamp with time zone,
  "created_by"      uuid,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gallery_albums_pkey" PRIMARY KEY (id),
  CONSTRAINT "gallery_albums_slug_key" UNIQUE (slug)
);

ALTER TABLE "public"."gallery_albums"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."gallery_images" (
  "id"            uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "album_id"      uuid                     NOT NULL,
  "image_url"     text                     NOT NULL,
  "storage_path"  text                     NOT NULL,
  "caption"       text,
  "alt_text"      text,
  "display_order" integer                  NOT NULL DEFAULT 0,
  "created_at"    timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "gallery_images_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."gallery_images"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."instruments" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "instrument_code" text                     NOT NULL,
  "name"            text                     NOT NULL,
  "category"        text                     NOT NULL,
  "description"     text,
  "image_url"       text,
  "purchase_date"   date,
  "notes"           text,
  "archived_at"     timestamp with time zone,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "instruments_code_format" CHECK ((instrument_code ~ '^[a-z0-9]+(_[a-z0-9]+)*$'::text)),
  CONSTRAINT "instruments_instrument_code_key" UNIQUE (instrument_code),
  CONSTRAINT "instruments_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."instruments"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."profiles" (
  "id"         uuid                     NOT NULL,
  "full_name"  text,
  "avatar_url" text,
  "phone"      text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."profiles"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."site_settings" (
  "id"                     integer                  NOT NULL DEFAULT 1,
  "club_name"              text                     NOT NULL,
  "short_name"             text                     NOT NULL,
  "tagline"                text                     NOT NULL,
  "description"            text                     NOT NULL,
  "logo_url"               text,
  "favicon_url"            text,
  "email"                  text                     NOT NULL,
  "phone"                  text,
  "whatsapp"               text,
  "instagram"              text,
  "facebook"               text,
  "youtube"                text,
  "location"               text                     NOT NULL,
  "rehearsal_schedule"     text                     NOT NULL,
  "hero_heading"           text                     NOT NULL,
  "hero_subheading"        text                     NOT NULL,
  "about_heading"          text                     NOT NULL,
  "about_text"             text                     NOT NULL,
  "join_us_url"            text                     NOT NULL,
  "contact_cta_text"       text                     NOT NULL,
  "primary_color"          text                     NOT NULL,
  "accent_color"           text                     NOT NULL,
  "background_color"       text                     NOT NULL,
  "text_color"             text                     NOT NULL,
  "allow_public_gallery"   boolean                  NOT NULL,
  "allow_public_events"    boolean                  NOT NULL,
  "allow_member_borrowing" boolean                  NOT NULL,
  "maintenance_mode"       boolean                  NOT NULL,
  "created_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"             timestamp with time zone NOT NULL DEFAULT now(),
  "hero_image_1_url"       text,
  "hero_image_2_url"       text,
  "hero_image_3_url"       text,
  "hero_image_4_url"       text,
  "about_image_url"        text,
  CONSTRAINT "site_settings_id_check" CHECK ((id = 1)),
  CONSTRAINT "site_settings_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."site_settings"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."borrow_requests"
  ADD COLUMN "borrow_period" daterange GENERATED ALWAYS AS (daterange(requested_borrow_date, requested_return_date, '[]'::text)) STORED;

CREATE TYPE "public"."announcement_priority" AS ENUM (
  'normal',
  'important',
  'urgent'
);

ALTER TABLE "public"."announcements"
  ADD COLUMN "priority" public.announcement_priority NOT NULL DEFAULT 'normal'::public.announcement_priority;

CREATE TYPE "public"."announcement_status" AS ENUM (
  'draft',
  'published'
);

ALTER TABLE "public"."announcements"
  ADD COLUMN "status" public.announcement_status NOT NULL DEFAULT 'draft'::public.announcement_status;

CREATE TYPE "public"."borrow_request_status" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'active',
  'return_submitted',
  'completed',
  'overdue'
);

ALTER TABLE "public"."borrow_requests"
  ADD COLUMN "status" public.borrow_request_status NOT NULL DEFAULT 'pending'::public.borrow_request_status;

CREATE TYPE "public"."event_status" AS ENUM (
  'draft',
  'published',
  'cancelled',
  'completed'
);

ALTER TABLE "public"."events"
  ADD COLUMN "status" public.event_status NOT NULL DEFAULT 'draft'::public.event_status;

CREATE TYPE "public"."gallery_album_status" AS ENUM (
  'draft',
  'published'
);

ALTER TABLE "public"."gallery_albums"
  ADD COLUMN "status" public.gallery_album_status NOT NULL DEFAULT 'draft'::public.gallery_album_status;

CREATE TYPE "public"."instrument_condition" AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor'
);

ALTER TABLE "public"."borrow_requests"
  ADD COLUMN "condition_before" public.instrument_condition;

ALTER TABLE "public"."borrow_requests"
  ADD COLUMN "condition_after" public.instrument_condition;

ALTER TABLE "public"."instruments"
  ADD COLUMN "condition" public.instrument_condition NOT NULL DEFAULT 'good'::public.instrument_condition;

CREATE TYPE "public"."instrument_status" AS ENUM (
  'available',
  'pending',
  'borrowed',
  'damaged',
  'not_ready',
  'maintenance'
);

ALTER TABLE "public"."instruments"
  ADD COLUMN "status" public.instrument_status NOT NULL DEFAULT 'available'::public.instrument_status;

CREATE TYPE "public"."user_role" AS ENUM (
  'member',
  'admin'
);

ALTER TABLE "public"."profiles"
  ADD COLUMN "role" public.user_role NOT NULL DEFAULT 'member'::public.user_role;

CREATE OR REPLACE FUNCTION public.approve_borrow_request (
  p_request_id uuid,
  p_admin_note text DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ declare v_request public.borrow_requests%rowtype; v_instrument public.instruments%rowtype; begin if not public.is_admin() then raise exception 'Only admins can approve borrow requests.'; end if; select * into v_request from public.borrow_requests where id = p_request_id for update; if not found then raise exception 'Borrow request not found.'; end if; if v_request.status <> 'pending' then raise exception 'Only pending requests can be approved.'; end if; select * into v_instrument from public.instruments where id = v_request.instrument_id for update; if not found then raise exception 'Instrument not found.'; end if; if v_instrument.archived_at is not null then raise exception 'This instrument has been archived.'; end if; if v_instrument.status <> 'available' then raise exception 'This instrument is no longer available to borrow.'; end if; update public.borrow_requests set status = 'active', admin_note = p_admin_note, reviewed_by = auth.uid(), reviewed_at = now(), actual_borrow_date = current_date, condition_before = v_instrument.condition where id = p_request_id; update public.instruments set status = 'borrowed' where id = v_request.instrument_id; end; $function$;

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

CREATE OR REPLACE FUNCTION public.complete_return (
  p_request_id              uuid,
  p_verification_note       text,
  p_condition_after         public.instrument_condition,
  p_final_instrument_status public.instrument_status,
  p_damage_reported         boolean                     DEFAULT false,
  p_damage_notes            text                        DEFAULT NULL::text
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ declare v_request public.borrow_requests%rowtype; v_instrument public.instruments%rowtype; begin if not public.is_admin() then raise exception 'Only admins can complete a return.'; end if; select * into v_request from public.borrow_requests where id = p_request_id for update; if not found then raise exception 'Borrow request not found.'; end if; if v_request.status not in ('return_submitted', 'active', 'overdue') then raise exception 'This borrowing is not ready to be completed.'; end if; if p_final_instrument_status not in ('available','damaged','maintenance','not_ready') then raise exception 'Invalid final instrument status.'; end if; select * into v_instrument from public.instruments where id = v_request.instrument_id for update; if not found then raise exception 'Instrument not found.'; end if; update public.borrow_requests set status = 'completed', verified_by = auth.uid(), verified_at = now(), condition_after = p_condition_after, admin_note = coalesce(p_verification_note, admin_note), damage_reported = damage_reported or p_damage_reported, damage_notes = coalesce(p_damage_notes, damage_notes), damage_reported_at = case when p_damage_reported then now() else damage_reported_at end where id = p_request_id; update public.instruments set status = p_final_instrument_status, condition = p_condition_after where id = v_request.instrument_id; end; $function$;

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

CREATE OR REPLACE FUNCTION public.is_club_member()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$ select exists (select 1 from public.profiles where id = auth.uid() and role in ('member', 'admin')); $function$;

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
  AS $function$ declare v_request public.borrow_requests%rowtype; begin if not public.is_admin() then raise exception 'Only admins can reject borrow requests.'; end if; select * into v_request from public.borrow_requests where id = p_request_id for update; if not found then raise exception 'Borrow request not found.'; end if; if v_request.status <> 'pending' then raise exception 'Only pending requests can be rejected.'; end if; update public.borrow_requests set status = 'rejected', admin_note = p_admin_note, reviewed_by = auth.uid(), reviewed_at = now() where id = p_request_id; update public.instruments set status = 'available' where id = v_request.instrument_id; end; $function$;

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

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$ begin new.updated_at = now(); return new; end; $function$;

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

CREATE OR REPLACE FUNCTION public.update_member_role (
  target_id uuid,
  new_role  public.user_role
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$ begin if not public.is_admin() then raise exception 'Only admins can change member roles.'; end if; if target_id = auth.uid() then raise exception 'You cannot change your own role.'; end if; if not exists (select 1 from public.profiles where id = target_id) then raise exception 'Member not found.'; end if; update public.profiles set role = new_role where id = target_id; end; $function$;

ALTER TABLE "public"."borrow_requests"
  ADD CONSTRAINT "no_overlapping_active_borrows" EXCLUDE USING gist (instrument_id WITH =, borrow_period WITH &&)
    WHERE ((status = ANY (ARRAY['approved'::public.borrow_request_status, 'active'::public.borrow_request_status])));

ALTER TABLE "public"."gallery_albums"
  ADD CONSTRAINT "gallery_albums_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE SET NULL;

ALTER TABLE "public"."gallery_images"
  ADD CONSTRAINT "gallery_images_album_id_fkey" FOREIGN KEY (album_id) REFERENCES public.gallery_albums(id) ON DELETE CASCADE;

ALTER TABLE "public"."borrow_requests"
  ADD CONSTRAINT "borrow_requests_instrument_id_fkey" FOREIGN KEY (instrument_id) REFERENCES public.instruments(id) ON DELETE RESTRICT;

ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."announcements"
  ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."borrow_requests"
  ADD CONSTRAINT "borrow_requests_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE "public"."borrow_requests"
  ADD CONSTRAINT "borrow_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."borrow_requests"
  ADD CONSTRAINT "borrow_requests_verified_by_fkey" FOREIGN KEY (verified_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE "public"."gallery_albums"
  ADD CONSTRAINT "gallery_albums_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX events_archived_at_idx ON public.events USING btree (archived_at);

CREATE INDEX events_event_date_idx ON public.events USING btree (event_date);

CREATE INDEX events_featured_idx ON public.events USING btree (is_featured)
  WHERE (is_featured = true);

CREATE UNIQUE INDEX events_slug_key ON public.events USING btree (slug);

CREATE INDEX events_status_idx ON public.events USING btree (status);

CREATE INDEX idx_announcements_pinned ON public.announcements USING btree (is_pinned);

CREATE INDEX idx_announcements_status_archived ON public.announcements USING btree (status, archived_at);

CREATE INDEX idx_borrow_requests_instrument_id ON public.borrow_requests USING btree (instrument_id);

CREATE INDEX idx_borrow_requests_member_id ON public.borrow_requests USING btree (member_id);

CREATE INDEX idx_borrow_requests_status_created ON public.borrow_requests USING btree (status, created_at DESC);

CREATE INDEX idx_borrow_requests_status ON public.borrow_requests USING btree (status);

CREATE INDEX idx_gallery_albums_event_id ON public.gallery_albums USING btree (event_id);

CREATE INDEX idx_gallery_albums_status_archived ON public.gallery_albums USING btree (status, archived_at);

CREATE INDEX idx_gallery_images_album_id_display_order ON public.gallery_images USING btree (album_id, display_order);

CREATE INDEX idx_instruments_archived_at ON public.instruments USING btree (archived_at);

CREATE INDEX idx_instruments_category ON public.instruments USING btree (category);

CREATE INDEX idx_instruments_status ON public.instruments USING btree (status);

CREATE UNIQUE INDEX one_active_borrow_per_instrument ON public.borrow_requests USING btree (instrument_id)
  WHERE (status = 'active'::public.borrow_request_status);

CREATE UNIQUE INDEX one_pending_request_per_member_instrument ON public.borrow_requests USING btree (member_id, instrument_id)
  WHERE (status = 'pending'::public.borrow_request_status);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_borrow_requests_set_updated_at
  BEFORE UPDATE ON public.borrow_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_gallery_albums_updated_at
  BEFORE UPDATE ON public.gallery_albums
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_gallery_images_updated_at
  BEFORE UPDATE ON public.gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_instruments_set_updated_at
  BEFORE UPDATE ON public.instruments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_prevent_profile_protected_field_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_protected_field_changes();

CREATE TRIGGER trg_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins can insert announcements" ON "public"."announcements"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update announcements" ON "public"."announcements"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all announcements" ON "public"."announcements"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Members can view published announcements" ON "public"."announcements"
  FOR SELECT
  TO "authenticated"
  USING (((status = 'published'::public.announcement_status) AND (archived_at IS NULL) AND ((expires_at IS NULL) OR (expires_at > now()))));

CREATE POLICY "Members can view their own requests" ON "public"."borrow_requests"
  FOR SELECT
  TO "authenticated"
  USING (((member_id = auth.uid()) OR public.is_admin()));

CREATE POLICY "Admins can view contact messages" ON "public"."contact_messages"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Admins can insert events" ON "public"."events"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update events" ON "public"."events"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all events" ON "public"."events"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Anyone can view published events" ON "public"."events"
  FOR SELECT
  TO PUBLIC
  USING (((status = ANY (ARRAY['published'::public.event_status, 'cancelled'::public.event_status, 'completed'::public.event_status])) AND (archived_at IS NULL)));

CREATE POLICY "Admins can insert albums" ON "public"."gallery_albums"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update albums" ON "public"."gallery_albums"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all albums" ON "public"."gallery_albums"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Public can view published albums" ON "public"."gallery_albums"
  FOR SELECT
  TO PUBLIC
  USING (((status = 'published'::public.gallery_album_status) AND (archived_at IS NULL)));

CREATE POLICY "Admins can delete images" ON "public"."gallery_images"
  FOR DELETE
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Admins can insert images" ON "public"."gallery_images"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update images" ON "public"."gallery_images"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can view all images" ON "public"."gallery_images"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Public can view images of visible albums" ON "public"."gallery_images"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.gallery_albums a
  WHERE ((a.id = gallery_images.album_id) AND (a.status = 'published'::public.gallery_album_status) AND (a.archived_at IS NULL)))));

CREATE POLICY "Admins can insert instruments" ON "public"."instruments"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update instruments" ON "public"."instruments"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Members and admins can view instruments" ON "public"."instruments"
  FOR SELECT
  TO "authenticated"
  USING (public.is_club_member());

CREATE POLICY "Admins can view all profiles" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING (public.is_admin());

CREATE POLICY "Users can update their own profile" ON "public"."profiles"
  FOR UPDATE
  TO "authenticated"
  USING ((auth.uid() = id))
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Users can view their own profile" ON "public"."profiles"
  FOR SELECT
  TO "authenticated"
  USING ((auth.uid() = id));

CREATE POLICY "Admins can update site settings" ON "public"."site_settings"
  FOR UPDATE
  TO "authenticated"
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Site settings are publicly readable" ON "public"."site_settings"
  FOR SELECT
  TO "anon", "authenticated"
  USING (true);

CREATE POLICY "Admins can delete event images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'event-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can delete gallery images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'gallery-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can delete instrument images" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'instrument-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can delete site assets" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'site-assets'::text) AND public.is_admin()));

CREATE POLICY "Admins can update event images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'event-images'::text) AND public.is_admin()))
  WITH CHECK (((bucket_id = 'event-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can update gallery images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'gallery-images'::text) AND public.is_admin()))
  WITH CHECK (((bucket_id = 'gallery-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can update instrument images" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'instrument-images'::text) AND public.is_admin()))
  WITH CHECK (((bucket_id = 'instrument-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can update site assets" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'site-assets'::text) AND public.is_admin()))
  WITH CHECK (((bucket_id = 'site-assets'::text) AND public.is_admin()));

CREATE POLICY "Admins can upload event images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'event-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can upload gallery images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'gallery-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can upload instrument images" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'instrument-images'::text) AND public.is_admin()));

CREATE POLICY "Admins can upload site assets" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'site-assets'::text) AND public.is_admin()));

CREATE POLICY "Avatar images are publicly accessible" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'avatars'::text));

CREATE POLICY "Event images are publicly accessible" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'event-images'::text));

CREATE POLICY "Instrument images are publicly accessible" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'instrument-images'::text));

CREATE POLICY "Members and admins can view relevant return photos" ON "storage"."objects"
  FOR SELECT
  TO "authenticated"
  USING (((bucket_id = 'return-photos'::text) AND (public.is_admin() OR (EXISTS ( SELECT 1
   FROM public.borrow_requests br
  WHERE (((br.id)::text = (storage.foldername(objects.name))[1]) AND (br.member_id = auth.uid())))))));

CREATE POLICY "Members can replace their return photo before verification" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'return-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.borrow_requests br
  WHERE
    (((br.id)::text = (storage.foldername(objects.name))[1]) AND (br.member_id = auth.uid()) AND (br.status = ANY (ARRAY['active'::public.borrow_request_status,
    'return_submitted'::public.borrow_request_status])))))));

CREATE POLICY "Members can upload their own return photos" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'return-photos'::text) AND (EXISTS ( SELECT 1
   FROM public.borrow_requests br
  WHERE
    (((br.id)::text = (storage.foldername(objects.name))[1]) AND (br.member_id = auth.uid()) AND (br.status = ANY (ARRAY['active'::public.borrow_request_status,
    'return_submitted'::public.borrow_request_status])))))));

CREATE POLICY "Public can view gallery images" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'gallery-images'::text));

CREATE POLICY "Site assets are publicly accessible" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'site-assets'::text));

CREATE POLICY "Users can delete their own avatar" ON "storage"."objects"
  FOR DELETE
  TO "authenticated"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can update their own avatar" ON "storage"."objects"
  FOR UPDATE
  TO "authenticated"
  USING (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)))
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "Users can upload their own avatar" ON "storage"."objects"
  FOR INSERT
  TO "authenticated"
  WITH CHECK (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

COMMENT ON EXTENSION "btree_gist" IS 'support for indexing common datatypes in GiST';

REVOKE ALL ON FUNCTION "public"."approve_borrow_request"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."approve_borrow_request"(uuid, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."cancel_borrow_request"(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."cancel_borrow_request"(uuid) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."complete_return"(uuid, text, public.instrument_condition, public.instrument_status, boolean, text) FROM PUBLIC;

GRANT EXECUTE
  ON FUNCTION "public"."complete_return"(uuid, text, public.instrument_condition, public.instrument_status, boolean, text)
  TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."get_public_instrument_by_code"(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."get_public_instrument_by_code"(text) TO "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."is_club_member"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."prevent_profile_protected_field_changes"() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."prevent_profile_protected_field_changes"() TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."reject_borrow_request"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."reject_borrow_request"(uuid, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."report_damage"(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."report_damage"(uuid, text) TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."submit_borrow_request"(uuid, text, date, date) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."submit_borrow_request"(uuid, text, date, date) TO "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."submit_contact_message"(text, text, text, text) TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."submit_return"(uuid, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."submit_return"(uuid, text, text) TO "authenticated", "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."update_member_role"(uuid, public.user_role) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION "public"."update_member_role"(uuid, public.user_role) TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."announcements" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."borrow_requests" TO "anon", "authenticated", "postgres", "service_role";

REVOKE ALL ON TABLE "public"."contact_messages" FROM "anon";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "anon";

REVOKE ALL ON TABLE "public"."contact_messages" FROM "authenticated";

GRANT DELETE, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "authenticated";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contact_messages" TO "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."events" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gallery_albums" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gallery_images" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."instruments" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."profiles" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."site_settings" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."announcement_priority" TO "postgres";

GRANT USAGE ON TYPE "public"."announcement_status" TO "postgres";

GRANT USAGE ON TYPE "public"."borrow_request_status" TO "postgres";

GRANT USAGE ON TYPE "public"."event_status" TO "postgres";

GRANT USAGE ON TYPE "public"."gallery_album_status" TO "postgres";

GRANT USAGE ON TYPE "public"."instrument_condition" TO "postgres";

GRANT USAGE ON TYPE "public"."instrument_status" TO "postgres";

GRANT USAGE ON TYPE "public"."user_role" TO "postgres";

ALTER TABLE "public"."events"
  ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

