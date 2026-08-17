-- Defends against a real landmine for the not-yet-built webhook/automation-run
-- insert flow: handle_automation_run_credits currently looks up cost ONLY by
-- automation_id (the uuid FK), and RAISES EXCEPTION -- failing the whole
-- insert -- if that's null, even when automation_key (the text column) was
-- set instead. This adds a fallback: resolve via automation_key when
-- automation_id wasn't provided, and only fail if neither resolves to a real
-- automation_catalog entry.

CREATE OR REPLACE FUNCTION public.handle_automation_run_credits()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    cost integer;
    resolved_automation_id uuid;
BEGIN
    IF NEW.idempotency_key IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM audit_logs
            WHERE metadata->>'idempotency_key' = NEW.idempotency_key
        ) THEN
            RETURN NEW;
        END IF;
    END IF;

    resolved_automation_id := NEW.automation_id;

    -- Fall back to resolving via automation_key if automation_id wasn't set.
    IF resolved_automation_id IS NULL AND NEW.automation_key IS NOT NULL THEN
        SELECT id INTO resolved_automation_id
        FROM automation_catalog
        WHERE key = NEW.automation_key;
    END IF;

    IF resolved_automation_id IS NULL THEN
        RAISE EXCEPTION 'No active automation_catalog entry found for automation_id % / automation_key %', NEW.automation_id, NEW.automation_key;
    END IF;

    SELECT credit_cost INTO cost
    FROM automation_catalog
    WHERE id = resolved_automation_id;

    IF cost IS NULL THEN
        RAISE EXCEPTION 'No active automation_catalog entry found for automation_id %', resolved_automation_id;
    END IF;

    PERFORM deduct_credits(NEW.user_id, cost);

    INSERT INTO audit_logs(user_id, action, entity_type, metadata)
    VALUES (
        NEW.user_id,
        'automation_billed',
        'automation',
        jsonb_build_object(
            'automation_id', resolved_automation_id,
            'cost', cost,
            'idempotency_key', NEW.idempotency_key
        )
    );

    RETURN NEW;
END;
$function$;
