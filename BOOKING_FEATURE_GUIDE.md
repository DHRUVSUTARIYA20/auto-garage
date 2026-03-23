# 📋 User Login & Service Booking Feature Guide

## Overview
The auto garage system now provides a seamless booking experience where logged-in users don't need to re-enter their information every time they book a service. All user data is stored in the dashboard for easy access.

---

## ✨ Features Implemented

### 1. **Smart Profile Storage**
- User information is stored securely in Firestore after registration/login
- Stored data includes:
  - Name
  - Email
  - Phone Number
  - Address (Line 1 & 2)
  - City, State, Country, Pincode
  - Profile Photo
  - Bio/Notes

### 2. **Pre-filled Booking Form**
When a logged-in user navigates to the booking page:
- ✅ **Name** is automatically filled from profile
- ✅ **Email** is automatically filled from profile
- ✅ **Phone Number** is automatically filled from profile
- ✅ **Home Address** is automatically filled from profile
- ✅ Users can edit these fields before booking

### 3. **Booking History in Dashboard**
The customer dashboard displays:
- ✅ Complete booking history with all details
- ✅ Booking status (Pending, Confirmed, In Progress, Completed)
- ✅ Service details and pricing
- ✅ Booking date and time
- ✅ Delivery options selected
- ✅ Total cost
- ✅ Ability to track bookings and view bills

---

## 🔄 User Workflow

### Step 1: Register/Login
```
1. User registers with Name + Email + Password
   OR
   User logs in with Email/Mobile + Password
```

**What happens:**
- User credentials verified in Firebase Auth
- User profile automatically created in Firestore
- Full profile data loaded into the app
- User redirected to dashboard

### Step 2: View Profile Information
```
Visit: /customer/dashboard
```

**Profile Section shows:**
- User's name with avatar
- Email address
- Current role (Customer)
- Option to edit profile with more details

### Step 3: Book a Service
```
Click: "Book Service" button on dashboard
OR Visit: /booking
```

**Pre-filled Information:**
- Your Name ✓ (from profile)
- Your Email ✓ (from profile)
- Your Phone ✓ (from profile)
- Your Address ✓ (from profile)
- Vehicle Information (user enters)
- Delivery Options (user selects)
- Additional Notes (user enters)

### Step 4: Confirm Booking
```
1. Fill in remaining required fields (vehicle, services, date/time)
2. Select delivery option
3. Click "Confirm Booking"
```

**Result:**
- Booking created in database
- Tracking ID generated
- Booking appears in dashboard history
- User can track status anytime

### Step 5: Track & Manage Bookings
```
Visit: /customer/dashboard
```

**View:**
- All booking history
- Booking status with colored badges
- Service details and pricing
- Date and time scheduled
- Delivery option selected
- Total amount paid
- View bill (for completed bookings)
- Track active bookings

---

## 📊 Data Storage Structure

### User Profile (Firestore `profiles` collection)
```typescript
{
  id: "uid",
  email: "user@example.com",
  name: "John Doe",
  full_name: "John Doe",
  role: "customer",
  mobileNumber: "+91 99999 99999",
  addressLine1: "123 Main Street",
  addressLine2: "Apartment 4B",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  pincode: "400001",
  bio: "Regular customer",
  photoUrl: "/uploads/profiles/...",
  createdAt: "2024-03-21T...",
  updatedAt: "2024-03-21T..."
}
```

### Booking Record (PostgreSQL with Prisma)
```typescript
{
  id: "uuid",
  trackingId: "GAR-XXXXX",
  userId: "firebaseUid",
  garageId: "garageId",
  name: "John Doe",
  email: "user@example.com",
  phone: "+91 99999 99999",
  vehicle: "2020 Toyota Camry",
  date: "2024-04-15",
  time: "10:00 AM",
  services: [
    { id: "svc1", name: "Oil Change", price: 500 },
    { id: "svc2", name: "Tire Rotation", price: 800 }
  ],
  deliveryOption: "pickup",
  deliveryFee: 299,
  homeAddress: "123 Main St, Apt 4B",
  subtotal: 1300,
  total: 1599,
  status: "Pending",
  createdAt: "2024-03-21T...",
  updatedAt: "2024-03-21T..."
}
```

---

## 🔧 API Endpoints Used

### Authentication
- **POST** `/api/auth/login` - User login with automatic profile loading
- **POST** `/api/auth/register` - User registration with profile creation
- **POST** `/api/auth/logout` - User logout
- **GET** `/api/auth/me` - Get current user info
- **GET** `/api/auth/profile` - Get full profile details with address

### Profile Management
- **PATCH** `/api/auth/update-profile` - Update profile information
- **POST** `/api/auth/upload-profile-image` - Upload profile photo

### Bookings
- **POST** `/api/bookings` - Create new booking (uses userId from profile)
- **GET** `/api/bookings/user/:userId` - Get all bookings for user
- **GET** `/api/bookings/:trackingId` - Get booking details
- **PATCH** `/api/bookings/:trackingId/status` - Update booking status

---

## 📝 Form Validation

### Booking Form Requirements
| Field | Type | Rules | Pre-filled |
|-------|------|-------|-----------|
| Name | Text | Required, min 2 chars | ✓ Yes |
| Email | Email | Required, valid email | ✓ Yes |
| Phone | Tel | Optional, min 7 digits | ✓ Yes |
| Vehicle | Text | Required, min 2 chars | ✗ No |
| Garage | Select | Required | ✗ No |
| Service | Checkbox | Required, min 1 | ✗ No |
| Date | Date | Required, today or later | ✗ No |
| Time | Select | Required | ✗ No |
| Delivery | Radio | Required | ✗ No |
| Address | Text | Required if delivery | ✓ Yes |
| Notes | Textarea | Optional, max 500 chars | ✗ No |

---

## 🎯 User Benefits

✅ **Save Time** - No need to re-enter information for every booking
✅ **Accuracy** - Auto-filled data reduces input errors
✅ **Convenience** - Edit and update profile once, use everywhere
✅ **History** - Complete booking history always available
✅ **Tracking** - Real-time status updates for all bookings
✅ **Security** - Multi-role authentication with proper role guards

---

## 🚀 Quick Start

### For New Users:
1. Click "Register" on customer login page
2. Enter Name, Email, Phone
3. Set Password
4. Profile auto-created
5. Ready to book!

### For Existing Users:
1. Login with email/mobile + password
2. Profile data auto-loaded
3. Click "Book Service"
4. Pre-filled form appears
5. Select services & confirm

### To Update Profile:
1. Go to Dashboard
2. Click profile section
3. Click "Edit Profile"
4. Update any field
5. Auto-saved to database

---

## 📱 Mobile Experience

The booking form is fully responsive:
- ✓ Desktop: 3-column grid layout
- ✓ Tablet: Responsive grid
- ✓ Mobile: Single column, touch-friendly

---

## 🔐 Security Features

- ✓ Firebase Auth for secure authentication
- ✓ JWT tokens with httpOnly cookies
- ✓ Role-based access control
- ✓ Protected API endpoints
- ✓ Profile data encrypted at rest
- ✓ File uploads validated (image only, 5MB max)

---

## 📞 Support & FAQs

### Q: What if I want to book for a different person?
A: Edit the pre-filled fields with the other person's information before confirming.

### Q: Can I have multiple profiles?
A: No, one email = one profile. Use different emails for different users.

### Q: How do I cancel a booking?
A: Bookings once submitted cannot be auto-cancelled. Contact support to manage changes.

### Q: Where are my bookings stored?
A: All bookings are stored in the dashboard at `/customer/dashboard` and remain there indefinitely.

### Q: Can I see my booking history?
A: Yes! Full history is visible on the dashboard with all details and status updates.

---

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript + React Hook Form + Zod validation
- **Backend**: Express.js + Node.js
- **Auth**: Firebase Auth + JWT tokens
- **Database**: Firestore (profiles) + PostgreSQL (bookings)
- **Storage**: Firebase Storage + local file uploads

---

**Version**: 1.0.0  
**Last Updated**: March 21, 2024  
**Status**: ✅ Production Ready

