# Scan2Seat

## Authentication and location checks

The configured database student accounts and administrator authenticate through Supabase Auth. Admin database operations require an active administrator profile and are authorized on the server from the signed-in user's Auth identity; the former browser-visible admin ID/PIN authorization has been removed. Some unprovisioned legacy demo student identities may still use prototype authentication and must not be treated as secure accounts.

Student check-in requests a recent device location and checks it against a 30 m geofence centered on the configured Balme Library point in `src/lib/geofence.js`. The database repeats the boundary check before occupying a seat. While an authenticated student session is active, the browser reports location samples to Supabase. Ten continuous minutes outside triggers an in-app alert in the admin interface; the admin has five minutes to release the seat, after which a scheduled database job automatically ends the session and makes the seat available.

These checks depend on browser location permission, device positioning, network availability, and the student page remaining open to report movement. Device/browser locations can be inaccurate or spoofed; the point is not a surveyed building outline, so this is not tamper-proof proof of physical presence or an institutional production attestation.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
