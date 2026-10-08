BEGIN;

CREATE OR REPLACE FUNCTION public.admin_list_seat_qr_labels(p_section_id text DEFAULT NULL)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active administrator account is required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT jsonb_build_object(
    'id', seat.id,
    'section_id', section.id,
    'section_name', section.name,
    'seat_code', seat.seat_code,
    'qr_identifier', seat.qr_identifier
  )
  FROM public.seats AS seat
  JOIN public.sections AS section ON section.id = seat.section_id
  WHERE p_section_id IS NULL OR section.id = p_section_id
  ORDER BY section.name, seat.seat_code;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_seat_qr_labels(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_seat_qr_labels(text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
