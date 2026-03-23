# Auto Garage - Folder Structure & URL Mapping

## ✅ Clean Role-Based Organization

### 📂 **CUSTOMER MODULE** (`/src/customer/`)
All customer/user related pages

| File | URL | Purpose |
|------|-----|---------|
| `CustomerLogin.tsx` | `/customer/login` | Customer login page |
| `Register.tsx` | `/register` | Customer registration |
| `Index.tsx` | `/` | Home page |
| `Dashboard.tsx` | `/dashboard` | Customer dashboard |
| `Booking.tsx` | `/booking` | Create booking |
| `Tracking.tsx` | `/track` | Track bookings |
| `ForgotPassword.tsx` | `/customer/forgot-password` | Forgot password |
| `ResetPassword.tsx` | `/customer/reset-password` | Reset password |
| `About.tsx` | `/about` | About page |
| `Contact.tsx` | `/contact` | Contact page |
| `ServicesPage.tsx` | `/services` | Services listing |
| `Pricing.tsx` | `/pricing` | Pricing page |

**Example URLs:**
- Login: `http://localhost:5175/customer/login`
- Register: `http://localhost:5175/register`
- Dashboard: `http://localhost:5175/dashboard`

---

### 📂 **ADMIN MODULE** (`/src/admin/`)
Admin/Super Admin pages

| File | URL | Purpose |
|------|-----|---------|
| `AdminLogin.tsx` | `/admin/login` | Admin login page |
| `Admin.tsx` | `/admin` | Admin dashboard (add garages, manage system) |

**Example URLs:**
- Login: `http://localhost:5175/admin/login`
- Dashboard: `http://localhost:5175/admin`

---

### 📂 **GARAGE MANAGER MODULE** (`/src/garage/`)
Garage owner/manager pages

| File | URL | Purpose |
|------|-----|---------|
| `GarageLogin.tsx` | `/garage/login` | Garage manager login |
| `GarageHost.tsx` | `/garagehost` | Garage dashboard (manage staff, bookings) |
| `AddGarage.tsx` | `/garage/add` | Add new garage |
| `GarageListing.tsx` | `/garages` | List all garages |
| `GarageDetail.tsx` | `/garage/:id` | Garage details page |
| `AddStaff.tsx` | `/garage/staff/add` | Add mechanic to garage |

**Example URLs:**
- Login: `http://localhost:5175/garage/login`
- Dashboard: `http://localhost:5175/garagehost`
- Add Garage: `http://localhost:5175/garage/add`
- List Garages: `http://localhost:5175/garages`

---

### 📂 **MECHANIC/STAFF MODULE** (`/src/mechanic/`)
Mechanic staff pages

| File | URL | Purpose |
|------|-----|---------|
| `StaffLogin.tsx` | `/staff/login` | Staff/Mechanic login |
| `MechanicDashboard.tsx` | `/staff` | Mechanic dashboard (view tasks) |
| `StaffDashboard.tsx` | `/staff/dashboard` | Staff dashboard |
| `AddStaff.tsx` | `/garage/staff/add` | Add mechanic to garage |
| `Staff.tsx` | - | Staff utility component |

**Example URLs:**
- Login: `http://localhost:5175/staff/login`
- Dashboard: `http://localhost:5175/staff`

---

### 📂 **SHARED MODULES**

#### `/src/components/` - Reusable UI Components
- `Navbar.tsx`, `Footer.tsx`, `MainLayout.tsx`
- UI Components (buttons, cards, inputs, etc.)
- 3D Car components

#### `/src/context/` - Global State Management
- `AuthContext.tsx` - Authentication context provider
- `useAuth.ts` - Auth hook

#### `/src/lib/` - Utilities & Configurations
- `api-client.ts` - API communication
- `firebase.ts` - Firebase configuration
- `firebase-db.ts` - Firestore operations
- `defaultCredentials.ts` - Default test credentials

#### `/src/hooks/` - Custom React Hooks
- `use-toast.ts` - Toast notifications
- `use-mobile.tsx` - Mobile detection

#### `/src/pages/` - Shared Pages
- `NotFound.tsx` - 404 page

---

## 🔐 User Roles & Login Flows

### 1️⃣ **CUSTOMER**
- **URL:** `/customer/login`
- **Credentials:** Email + Password OR Mobile + Password
- **After Login:** Redirects to `/dashboard`
- **Permissions:** Book services, track orders, view profile

### 2️⃣ **ADMIN**
- **URL:** `/admin/login`
- **Credentials:** Email + Password OR Mobile + Password
- **After Login:** Redirects to `/admin`
- **Permissions:** Add garages, manage users, system settings

### 3️⃣ **GARAGE MANAGER**
- **URL:** `/garage/login`
- **Credentials:** Email + Password OR Mobile + Password
- **After Login:** Redirects to `/garagehost`
- **Permissions:** Manage garage staff, view bookings, update garage profile

### 4️⃣ **STAFF/MECHANIC**
- **URL:** `/staff/login`
- **Credentials:** Email + Password OR Mobile + Password
- **After Login:** Redirects to `/staff`
- **Permissions:** View assigned tasks, update booking status

---

## 📋 File Organization Rules

✅ **Each role has dedicated folder:**
- `/src/admin/` - Admin only pages
- `/src/customer/` - Customer only pages
- `/src/garage/` - Garage manager pages
- `/src/mechanic/` - Mechanic/Staff pages

✅ **Login pages in same folder as role:**
- Customer login → `/src/customer/CustomerLogin.tsx`
- Admin login → `/src/admin/AdminLogin.tsx`
- Garage login → `/src/garage/GarageLogin.tsx`
- Staff login → `/src/mechanic/StaffLogin.tsx`

✅ **URLs match folder structure:**
- `/customer/*` → Files in `/src/customer/`
- `/admin/*` → Files in `/src/admin/`
- `/garage/*` → Files in `/src/garage/`
- `/staff/*` → Files in `/src/mechanic/`

✅ **No old/duplicate files outside role folders**

---

## 🚀 Quick Links

### Default Credentials (for testing)

**Customer:**
```
Email: customer@test.com
Password: Test@123
```

**Admin:**
```
Email: admin@test.com
Password: Test@123
```

**Garage Manager:**
```
Email: manager@test.com
Password: Test@123
```

**Staff/Mechanic:**
```
Email: staff@test.com
Password: Test@123
```

---

## 🔄 Mobile Authentication

All login pages support:
- **Email Mode:** Email + Password
- **Mobile Mode:** Mobile Number + Password

Mobile numbers are stored in Firestore `profiles` collection under `mobileNumber` field.

Format: `+91 9876543210` (Indian format)
