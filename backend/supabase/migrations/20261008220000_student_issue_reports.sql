BEGIN;

CREATE TABLE public.student_issue_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN (
    'Damaged seat',
    'Insufficient study space',
    'Cleanliness issue',
    'Noise or disturbance',
    'Furniture or equipment issue',
    'Other'
  )),
  seat_name text,
  details text NOT NULL CHECK (char_length(btrim(details)) BETWEEN 5 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX student_issue_reports_created_at_idx
  ON public.student_issue_reports (created_at DESC);

ALTER TABLE public.student_issue_reports ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION public.student_submit_issue_report(
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
    'Damaged seat',
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

CREATE FUNCTION public.admin_list_student_issue_reports()
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
    'id', report.id,
    'student_id', profile.student_id,
    'student_name', profile.full_name,
    'category', report.category,
    'seat_name', report.seat_name,
    'details', report.details,
    'created_at', report.created_at
  )
  FROM public.student_issue_reports AS report
  JOIN public.users AS profile ON profile.id = report.student_user_id
  ORDER BY report.created_at DESC;
END;
$$;

REVOKE ALL ON TABLE public.student_issue_reports FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.student_submit_issue_report(text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_list_student_issue_reports() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.student_submit_issue_report(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_student_issue_reports() TO authenticated;

COMMIT;
