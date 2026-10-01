# PadhaiHub
Student notes platform: Next.js + Tailwind + Supabase (Auth, Postgres, Storage), deployed on Vercel.

## Setup
1. **Supabase project**: create one at supabase.com → New project.
2. **Database, RLS, Storage**: open SQL Editor, paste `supabase/schema.sql`, run. It creates `subjects`, `notes`, `profiles`, RLS policies, and a private `notes` PDF bucket (readable only for published notes).
3. **Auth**: Authentication → Providers → Email enabled. Turn **off** "Allow new users to sign up" (Auth → Sign In / Providers settings) so only admins you create can exist.
4. **Super admin**: Authentication → Users → *Add user* → email `prabinsays@gmail.com`, choose your own strong password, tick *Auto confirm*. The DB trigger gives this email the `super_admin` role. (The password lives only in Supabase.) Create this user *before* disabling sign-ups if needed.
5. **Env vars**: copy `.env.example` to `.env.local`; fill from Project Settings → API: URL, anon key, and service_role key (server-only, never commit).
6. Local run: `npm install && npm run dev`.
7. **GitHub**: `git init && git add . && git commit -m init`, create a repo, `git remote add origin <url> && git push -u origin main`.
8. **Vercel**: Add New Project → import the repo → add the three env vars → Deploy.
Admins you add from the dashboard get a temporary password; ask them to keep it private.
