BEGIN;

UPDATE public.student_issue_reports
SET category = 'Damaged QR code'
WHERE category = 'Damaged seat';

ALTER TABLE public.student_issue_reports
  DROP CONSTRAINT IF EXISTS student_issue_reports_category_check;

ALTER TABLE public.student_issue_reports
  ADD CONSTRAINT student_issue_reports_category_check
  CHECK (category IN (
    'Damaged QR code',
    'Unable to check in',
    'Insufficient study space',
    'Cleanliness issue',
    'Noise or disturbance',
    'Furniture or equipment issue',
    'Other'
  ));

CREATE OR REPLACE FUNCTION public.student_submit_issue_report(
  p_category text,
  p_seat_name text,
  p_details text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  report_record public.student_issue_reports%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'student'
      AND account_status = 'active'
      AND must_change_password = false
  ) THEN
    RAISE EXCEPTION 'An active student account is required' USING ERRCODE = '42501';
  END IF;

  IF p_category NOT IN (
    'Damaged QR code',
    'Unable to check in',
    'Insufficient study space',
    'Cleanliness issue',
    'Noise or disturbance',
    'Furniture or equipment issue',
    'Other'
  ) OR char_length(btrim(coalesce(p_details, ''))) NOT BETWEEN 5 AND 2000
    OR char_length(btrim(coalesce(p_seat_name, ''))) > 100
  THEN
    RAISE EXCEPTION 'Issue report details are invalid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.student_issue_reports (student_user_id, category, seat_name, details)
  VALUES (
    auth.uid(),
    p_category,
    nullif(btrim(p_seat_name), ''),
    btrim(p_details)
  )
  RETURNING * INTO report_record;

  RETURN jsonb_build_object(
    'id', report_record.id,
    'category', report_record.category,
    'seat_name', report_record.seat_name,
    'details', report_record.details,
    'created_at', report_record.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.student_submit_issue_report(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_submit_issue_report(text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
