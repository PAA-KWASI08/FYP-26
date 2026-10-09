# Scan2Seat Backend

This folder contains Scan2Seat backend and database work. The React frontend remains outside this folder.

The backend is isolated from the frontend prototype.

Do not store credentials, API keys, passwords, or other secrets here.

## Supabase Auth accounts

These ten student IDs use Supabase Auth rather than the browser-visible prototype PIN: `12345678`, `87654321`, `84995521`, `37815317`, `90758243`, `42339000`, `69805478`, `53430390`, `42469482`, `83801652`. Their `full_name` profile fields contain fictional demo display names, not verified identities; the ID remains the private login key and is not shown in the student UI. The first administrator uses ID `admin001`. The `student-login` Edge Function looks up the server-side account mapping and verifies the password with Supabase Auth. Internal Auth emails use the reserved `.invalid` domain and cannot receive mail; password recovery is not configured. The `public.users` profile stores the login ID and Auth UUID, never the password.

Apply the student authentication migrations, then deploy the `student-login` Edge Function. From the application root, set `SUPABASE_URL` in a secure interactive terminal and run `node backend/scripts/provision-student-accounts.mjs`. If `SUPABASE_SERVICE_ROLE_KEY` is not set, the script prompts for it without echoing. It creates a unique 24-character random temporary password for each new account, sets `must_change_password`, creates the Auth user and profile, and displays each generated credential once in the terminal. Copy the temporary passwords directly into an approved password manager and deliver each one privately to its intended student. The script does not write them to disk. Do not add temporary passwords to this README, source, SQL, screenshots, or shared logs. The script skips already-provisioned profile IDs and does not reset their passwords. To rotate a lost or exposed temporary password for one approved ID, run `node backend/scripts/reset-student-password.mjs <student-id>` from the application root. It prompts privately for the service-role key, requires a password change again, and prints the new one-time temporary password in the terminal.

The first successful login is restricted to a password-change page until the user chooses a replacement password of at least 8 characters, including uppercase and lowercase letters, a number, and a symbol. Password changes are processed by Supabase Auth; `public.users` stores only the `must_change_password` setup flag, never the password or PIN. Students can later change their password from Student Profile; administrators can use the account control in the admin header. Password recovery is not configured for these internal demo accounts.

The student sign-in page contains a clearly labeled, non-functional preview of the planned recovery flow. The future flow is: a student requests recovery; the library administrator checks and approves the active student account; the system sends a time-limited reset link to that student's own verified recovery email; the student sets a new password. Student database accounts currently have reserved `.invalid` Auth emails, so recovery stays disabled until unique real student emails are linked and Supabase Auth email delivery and reset-link handling are configured. The prototype recovery preview does not submit requests, check account status, send email, or change passwords.

The service-role key is used only by this local provisioning script and Supabase-managed Edge Function secrets. Never put it in React source, Vite-exposed environment variables, browser code, client-side requests, committed documentation, or version control. The Edge Function uses Supabase's server-side `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY` secrets.

## Student check-in and check-out

Authenticated students can read only their own profile and seat-session history. They cannot directly insert, update, or delete seat/session rows. The `student_check_in` and `student_check_out` security-definer functions derive the student identity from `auth.uid()`, validate the seat/session and current location parameters, then atomically record the session and update seat status. Check-in is permitted only when the reported device position plus its accuracy radius falls within 30 metres of Balme Library (`5.6511292, -0.1870251`). Check-in changes `available` to `occupied`; check-out completes the session and changes an occupied seat back to `available`. Historical sessions are retained.

Students can optionally save a planned study duration of 1 to 1,440 minutes at check-in. The duration is stored with the session and is not an automatic checkout: the student keeps the seat until they check out. The dashboard displays an in-app reminder five minutes before the planned end and another when the time is reached. Browser notifications can also be enabled from the active-session card and are delivered while the app is open; reminders are not delivered while the app is closed.

The authenticated-admin-only `admin_list_seat_sessions` RPC returns persisted session history joined with student, seat, and section details. Admin dashboards, active sessions, and analytics use this database history; they do not read a single browser user's local session as a substitute. Student access to other students' session records is not granted.

When enabled, a student with an active session has browser geolocation samples reported to the database. A continuously verified position outside the 30 m boundary starts the outside timer; a verified return inside resets it. After 10 minutes outside, an in-app admin alert appears. The administrator can release the seat, or a `pg_cron` job automatically completes the session and makes the seat available after 15 minutes outside. Automatic processing runs once per minute. Location monitoring requires the student browser/app page to remain open with location permission. Browser/device location can be spoofed or become unavailable, so this is a deterrent and workflow, not tamper-proof proof of physical presence.

Location verification is temporarily disabled for check-in testing by `20261008201500_temporary_location_verification_bypass.sql`. During this mode, authenticated students can check in without a location sample, new and active sessions are stored as `not_verified`, geofence alerts are suppressed, and automatic outside-geofence release is paused. To restore location verification later, update the single `public.application_settings` row to set `location_verification_enabled = true`; the check-in page reads the database setting, so no frontend rebuild is needed. Re-enabling restores the 30 m location check and geofence monitoring.

Seat availability and section information are read from the current database catalog. No fixed seat totals or sample seat-status fixtures are used for the live dashboard and seat-management views. Admin-only unavailable changes use the Auth-protected administrator seat-management RPC.

### First administrator creation

Apply the `20261008184000_secure_admin_authentication.sql` migration and deploy the updated login function before provisioning the first administrator. From the application root, set `SUPABASE_URL` in a secure interactive terminal and run `node backend/scripts/provision-admin-account.mjs`. If `SUPABASE_SERVICE_ROLE_KEY` is not set, the script prompts for it without echoing. It creates `admin001` with a random temporary password, an active administrator profile, and `must_change_password=true`; the temporary password is shown once in the terminal. Store it directly in a password manager and do not add it to this README, source, SQL, screenshots, or shared logs. The script does not reset an existing account.

The administrator signs in at `/admin` with ID `admin001` and the one-time password, then must choose a personal password of at least 8 characters before accessing administrative operations. Section, seat, announcement, and geofence alert/release RPCs require the signed-in Auth user to have an active administrator profile with the initial password change completed. The prior prototype ID/PIN RPC authorization has been removed.

If the administrator password is lost, reset it from a trusted terminal with the service-role key:

```sh
export SUPABASE_URL="https://<project>.supabase.co"
node backend/scripts/reset-admin-password.mjs admin001
```

The script prompts for the service-role key without echoing it, requires a new one-time password, and forces the admin to change it again on next login. Do not commit the generated password to source, screenshots, or shared logs.

The admin sign-in page includes a clearly labeled, non-functional preview of the planned recovery flow. It does not submit or store requests, verify identities, send email, or change passwords. Until a unique verified recovery email is linked to every admin account, a super-admin mailbox and approval process are configured, and Supabase Auth email delivery is enabled, maintainers must use the trusted-terminal reset procedure above and deliver the temporary password privately after independently verifying the administrator.

The planned recovery flow is: an admin submits a request; the system notifies one super-admin mailbox; the super-admin confirms that the ID belongs to an active admin account and approves the request; the system sends a time-limited password-reset link to that admin's own verified recovery email; the admin uses the link to choose a new password. The shared super-admin mailbox is for review notifications only and must not be used as the recovery email for every admin. Never trust an email address supplied in a request or expose whether an admin ID or email exists.

To apply the migrations and deploy the login function, run these from the `backend` directory after linking the intended Supabase project:

```sh
npx supabase db push
npx supabase functions deploy student-login
```

Administrator QR label selection and printing require the seat QR migrations, including `20261008213000_restore_admin_seat_qr_label_rpc.sql`. The `20261008204000_seat_qr_identifiers.sql` migration assigns the standardized unique QR IDs; after applying pending migrations, print fresh labels so the IDs on the seats match the database. Each printed QR encodes an absolute link to `/check-in` on the current site origin with that seat's ID. Phone-camera scans open the site, preserve the seat link through student sign-in and any required first-password change, and then ask the student to confirm check-in. Scanning the same seat while signed in with an active session offers a checkout confirmation. Print labels from the deployed site (not a localhost development server) for phones to reach the correct domain. Reprint labels after changing the site's domain or regenerating seat QR IDs.

Student issue reports are stored through the authenticated RPCs in `20261008220000_student_issue_reports.sql`. Students can submit a suggested issue type (including damaged seats and inability to check in), optional seat/location name and description from the Report an Issue page. Active administrators can review reports in Usage & Analytics; the raw table is not directly readable or writable by client roles. The `20261008220500_issue_report_checkin_category.sql` migration adds the inability-to-check-in category to database validation.

The Balme 30 m geofence and automatic 10-minute warning/15-minute seat release are implemented in `20261008190000_balme_geofence_enforcement.sql`. Admin-wide recorded session history is provided by `20261008200000_admin_session_history.sql`.

### Student creation

Student accounts are created through the local controlled provisioning script rather than public self-registration.

### Additional administrator provisioning

Creating additional administrators remains a trusted operator-controlled task. Do not expose service-role key operations or a public admin creation endpoint to the React frontend. A future workflow would require:

`Existing Admin → Verified Supabase JWT → Active admin profile check → Protected server-side provisioning → Supabase Auth → public.users`

This workflow is not implemented and is out of scope for the current prototype. Any future implementation must authorize the caller using the trusted profile, not a client-supplied role or a shared provisioning secret alone.

## Administrator operations

`admin_manage_sections`, `admin_manage_seats`, and `admin_manage_announcements` are authenticated-only RPCs. They derive the administrator from `auth.uid()` and require an active administrator profile whose initial password change is complete. Seat status cannot be changed to `occupied` by an administrator; student check-in and check-out own that transition.

The browser may read published, unexpired announcements through the narrow anon SELECT policy in `supabase/migrations/20261008164500_announcements_anon_select.sql`. Admin list/create/edit/publish/delete operations use the authenticated RPCs. Five all-student demo announcements are seeded by `supabase/migrations/20261008170900_seed_five_demo_announcements.sql`. Draft announcements are only available through the admin RPC.
