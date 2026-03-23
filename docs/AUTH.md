# Auth Setup (Supabase)

This project uses Supabase for authentication.

1. Create a Supabase project.
2. In project settings, copy your URL and anon key.
3. Add these to your local env:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run frontend with `npm run dev`.

Notes:
- Login, register, forgot password, reset password, and session management are handled in JavaScript via Supabase.
- Role checks are applied in frontend routes/pages based on user role metadata/profile.
