# Auto Garage Project

Auto Garage is a web-based garage booking and workshop management platform.

## Features
- Role-based authentication (Customer, Staff/Mechanic, Manager, Admin)
- Garage discovery and booking flow
- Booking tracking with tracking ID
- Staff work order management
- Admin operations and analytics dashboard

## Tech Stack
- Frontend: React + TypeScript + Vite
- UI: Tailwind CSS + shadcn/ui
- Backend: Express
- Database/Auth: Supabase + Prisma
- Testing: Vitest

## Run Project
1. Install dependencies:
	- `npm install`
2. Start frontend:
	- `npm run dev`
3. Start backend:
	- `npm run dev:server`
4. Start both together:
	- `npm run dev:all`

## All Pages (Source Files)
- `src/pages/Index.tsx`
- `src/pages/About.tsx`
- `src/pages/Booking.tsx`
- `src/pages/Contact.tsx`
- `src/pages/Register.tsx`
- `src/pages/ServicesPage.tsx`
- `src/pages/Admin.tsx`
- `src/pages/AdminLogin.tsx`
- `src/pages/MechanicDashboard.tsx`
- `src/pages/StaffLogin.tsx`
- `src/pages/NotFound.tsx`
- `src/pages/Track.tsx`
- `src/pages/GarageListing.tsx`
- `src/pages/GarageDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/Pricing.tsx`
- `src/pages/AddGarage.tsx`
- `src/pages/GarageHost.tsx`
- `src/pages/AddStaff.tsx`
- `src/pages/GarageLogin.tsx`
- `src/pages/CustomerLogin.tsx`
- `src/pages/ForgotPassword.tsx`
- `src/pages/ResetPassword.tsx`

## Routes Map
- `/` → Home
- `/about` → About
- `/services` → Services
- `/pricing` → Pricing
- `/contact` → Contact
- `/garages` → Garage Listing
- `/garage/:id` → Garage Detail
- `/booking` → Booking (auth)
- `/track` → Track Booking (auth)
- `/dashboard` → Customer Dashboard (auth)
- `/garagehost` → Garage Host Dashboard (manager/admin)
- `/garage/add` → Add Garage (auth)
- `/garage/staff/add` → Add Staff (auth)
- `/staff` → Mechanic Dashboard (staff/mechanic)
- `/admin/login` → Admin Login
- `/admin` → Admin Dashboard
- `/login` → Customer Login
- `/register` → Register
- `/forgot-password` → Forgot Password
- `/reset-password` → Reset Password
- `/garage/login` → Garage Login

## Important Docs
- `README.md`
- `QUICK_START.md`
- `PRISMA_SETUP.md`
- `BOOKING_SYSTEM.md`
- `docs/FIREBASE_IMPORT.md`
- `docs/AUTH.md`
- `docs/SUPABASE_FULL_SINGLE_SETUP.sql`
- `docs/SUPABASE_DEMO_SEED.sql`

## NPM Scripts
- `npm run dev`
- `npm run dev:server`
- `npm run dev:all`
- `npm run test`
- `npm run lint`
- `npm run build`
- `npm run import:firestore`
- `npm run import:firestore:dry`

## Notes
- Run Supabase setup SQL first, then demo seed SQL.
- Use `.env` values for API, Supabase, and Prisma before running production flows.
