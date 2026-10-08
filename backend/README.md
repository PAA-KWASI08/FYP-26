# Scan2Seat Backend

This folder contains Scan2Seat backend and database work. The React frontend remains outside this folder.

The backend is isolated from the frontend prototype.

Do not store credentials, API keys, passwords, or other secrets here.

## Account provisioning

Public signup and anonymous authentication are disabled for the current prototype. Accounts are created only through a controlled Supabase administrative process performed by a trusted project operator. There are no student-registration or administrator-creation Edge Function endpoints, and the React frontend is not involved in provisioning.

For each approved account, the operator creates the Supabase Auth user and its corresponding `public.users` profile through the trusted administrative process. The profile `id` must match the Auth user UUID. The operator assigns the approved role in `public.users.role`: students receive `student`, and the initial administrator receives `admin`. The trusted process controls `account_status`.

Passwords are managed by Supabase Auth and must never be stored in `public.users`. The Supabase service-role key must remain server-side and must never be included in React source, Vite-exposed environment variables, browser code, client-side requests, committed documentation, or version control.

### Administrator creation

Administrator accounts are created through a trusted operator-controlled process. The current prototype does not expose an admin-creation endpoint to students, ordinary authenticated users, or the React frontend.

### Student creation

Student accounts are created through a controlled provisioning process rather than public self-registration.

### Future administrator provisioning

A later version could allow an existing authorized administrator to create another administrator through a protected server-side workflow:

`Existing Admin → Verified Supabase JWT → Active admin profile check → Protected server-side provisioning → Supabase Auth → public.users`

This workflow is not implemented and is out of scope for the current prototype. Any future implementation must authorize the caller using the trusted profile, not a client-supplied role or a shared provisioning secret alone.
