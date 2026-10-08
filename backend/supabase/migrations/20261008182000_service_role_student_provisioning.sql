BEGIN;

GRANT SELECT, INSERT ON TABLE public.users TO service_role;

COMMIT;
