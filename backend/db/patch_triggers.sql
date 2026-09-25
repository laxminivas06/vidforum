-- =====================================================================
-- Trigger fixes for audit logging and tenant consistency
-- =====================================================================

create or replace function log_audit_event()
returns trigger language plpgsql as $$
declare
  v_institution_id uuid;
begin
  if tg_table_name = 'institutions' then
    v_institution_id := coalesce(new.id, old.id);
  else
    begin
      v_institution_id := coalesce(new.institution_id, old.institution_id);
    exception when others then
      v_institution_id := null;
    end;
  end if;

  insert into audit_logs (institution_id, actor_id, action, resource_table, resource_id, old_value, new_value)
  values (
    v_institution_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE','INSERT') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create or replace function enforce_tenant_consistency()
returns trigger language plpgsql as $$
declare parent_institution_id uuid;
begin
  if tg_table_name = 'students' then
    if new.admission_id is not null then
      select institution_id into parent_institution_id from admissions where id = new.admission_id;
      if parent_institution_id is not null and parent_institution_id <> new.institution_id then
        raise exception 'Tenant mismatch: students.institution_id must match admissions.institution_id';
      end if;
    end if;
  elsif tg_table_name = 'sections' then
    select institution_id into parent_institution_id from classes where id = new.class_id;
    if parent_institution_id <> new.institution_id then
      raise exception 'Tenant mismatch: sections.institution_id must match classes.institution_id';
    end if;
  end if;
  return new;
end;
$$;
