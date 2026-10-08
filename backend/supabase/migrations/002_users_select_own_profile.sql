BEGIN;

DROP POLICY IF EXISTS users_select_own_profile ON public.users;

CREATE POLICY users_select_own_profile
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

COMMIT;
