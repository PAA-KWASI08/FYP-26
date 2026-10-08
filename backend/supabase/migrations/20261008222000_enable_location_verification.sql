DO $$
DECLARE
  updated_rows integer;
BEGIN
  UPDATE public.application_settings
  SET location_verification_enabled = true
  WHERE id = true;

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  IF updated_rows <> 1 THEN
    RAISE EXCEPTION 'Expected exactly one application settings row, updated %', updated_rows;
  END IF;
END;
$$;
