# FitCoach App Scaffold

Responsive coach/client fitness platform scaffold built with Next.js App Router, next-intl, and Supabase.

## What is now wired
- Locale-aware routing with English and Spanish
- Supabase browser/server helpers
- Login form wired to Supabase password auth
- Role-based route protection at the layout level
- Coach dashboard pulling live counts and recent check-ins
- Coach clients page pulling live client records
- Coach create/edit client flow with manual account creation
- Client dashboard pulling live streak, adherence, plan, and coach contact info
- Profile page wired to the `profiles` table
- Sign-out flow
- Middleware that refreshes Supabase auth cookies

## Stack
- Next.js App Router
- TypeScript
- next-intl for English/Spanish routing
- Supabase Auth + Database + Storage

## Environment variables
Copy `.env.example` to `.env.local` and fill in:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (required for coach-created client accounts and invitation activation)
- `NEXT_PUBLIC_APP_URL` (used to generate invitation links, e.g. `http://localhost:3000`)

## Expected database
This scaffold expects the SQL schema we defined earlier, including these tables:
- `profiles`
- `coaches`
- `clients`
- `plans`
- `plan_days`
- `daily_checkins`

## Important seed requirement
Before a real login works, each authenticated Supabase user must also have a matching row in `public.profiles`.

For coach dashboard and clients to work, the coach user also needs a row in `public.coaches`.

For client dashboard to work, the client user also needs:
- a row in `public.clients`
- an active plan in `public.plans`
- optional plan content in `public.plan_days`

## Get started
1. Create a Supabase project.
2. Run the SQL schema.
3. Create at least one coach user and one client user in Supabase Auth.
4. Insert matching rows in `profiles`, then `coaches` or `clients`.
5. Copy `.env.example` to `.env.local`.
6. Install dependencies with `npm install`.
7. Run `npm run dev`.

## Next build steps
- Add create/edit plan flow
- Add daily check-in submit form
- Add charts and reporting pages
- Add Supabase Storage uploads for profile/progress photos
- Add polished empty/loading states


## Client creation behavior
When a coach creates a client from the app, the scaffold also creates a Supabase Auth user for that client by using the service-role key. The current scaffold creates the account immediately and stores the client profile/client rows, but it does not yet include a polished invite/onboarding flow. For now, have the new client use the forgot-password screen on first login once that flow is implemented.


## Invitation flow
- When a coach creates a client, the scaffold also creates a pending invitation record.
- The coach can open the client edit screen and generate a fresh onboarding link plus a ready-to-send email draft.
- The client opens the link, creates a password, and is sent back to the login page.
- Run `supabase/client_invitations.sql` after the base schema.
