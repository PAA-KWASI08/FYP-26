BEGIN;

GRANT UPDATE (must_change_password) ON TABLE public.users TO service_role;

COMMIT;
