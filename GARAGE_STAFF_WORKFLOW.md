# Garage Owner & Staff Login Workflow - Complete Guide

## System Overview

This document explains the complete workflow for the Garage Login system where:
1. **Admin** adds garages and provides credentials
2. **Garage Owner** logs in and manages the garage
3. **Garage Owner** adds staff members
4. **Staff** logs in and updates task progress
5. **Customers** track bookings in real-time with staff progress

---

## 📋 Step-by-Step Workflow

### STEP 1: Admin Creates Garage

**Location:** `/admin` → "Manage Garage" tab

**Process:**
1. Go to Admin Panel
2. Click "Manage Garage" tab
3. Click "Add New Garage" button
4. Fill form:
   - **Garage Name** (required): e.g., "Elite Auto Repairs"
   - **Contact Phone**: e.g., "+91-9876543210"
   - **City/State**: e.g., "Mumbai, Maharashtra"
   - **Description**: e.g., "Full-service auto repair shop"
5. Click "Create Garage" button
6. Garage appears in the list below

**Result:** Garage is created and assigned a unique ID

---

### STEP 2: Admin Views & Shares Garage Credentials

**Location:** `/admin` → "Manage Garage" tab → View Existing Garages

**Credentials Displayed:**
```
Email/Username: garage.{first-8-chars-of-id}@autogarage.local
Password: Garage@{current-year}
```

**Features:**
- **Copy buttons** for easy sharing
- **Clickable code fields** to copy credentials
- Instructions: "Share these credentials with the garage owner. They can login at /garage/login"

**Example:**
```
Email: garage.abc12345@autogarage.local
Password: Garage@2026
```

**How to Send Credentials:**
- ✉️ Email to garage owner
- 📱 SMS/WhatsApp message
- 📋 Print and hand over in person

---

### STEP 3: Garage Owner Logs In

**URL:** `http://localhost:5173/garage/login`

**Login Process:**
1. Navigate to `/garage/login`
2. Enter **Email/Username** (from admin)
3. Enter **Password** (from admin)
4. Click "Login" button
5. If credentials are correct → Redirects to `/garagehost`

**Authentication:**
- ✅ Validates against Firebase Authentication
- ✅ Assigns "manager" role
- ✅ Creates session cookie (remembers login)
- ✅ Sets HTTP-only cookie for security

**Expected Result:**
- Garage owner dashboard loads
- Shows garage info and bookings
- User can access staff management

---

### STEP 4: Garage Owner Dashboard

**URL:** `http://localhost:5173/garagehost`

**Available Tabs:**

#### Tab 1: Overview
Shows key metrics:
- **Average Service Value**: ₹ amount
- **Due Amount**: Pending payments
- **Total Services**: Count
- **Due/Incomplete Payments**: List of pending tasks
- **Recent Activity**: Color-coded status updates

#### Tab 2: Staff Management
Features:
- **Add Staff Form**: Enter staff member's registered email
- **Team List**: Shows all staff members with names and emails
- **Remove Option**: Delete staff from garage (hover shows delete button)

#### Tab 3: Bookings
Features:
- **Filter Buttons**: All, Pending, In Progress, Completed, Unassigned
- **Live Counts**: Each filter shows count of bookings
- **Status Badges**: Color-coded (Green=Completed, Blue=In Progress, Yellow=Pending)
- **Task Assignment**: Assign booking to staff member
- **Task Details**: View customer info, vehicle, services

#### Tab 4: Settings
Features:
- Edit garage name, phone, address
- Save changes

---

### STEP 5: Garage Owner Adds Staff Members

**Location:** Garage Owner Dashboard → "Staff" tab → "Add Staff Member"

**Prerequisites:**
- Staff member must have an account on the platform
- Staff must be registered with email and password

**Process:**
1. Go to Staff tab in GarageHost dashboard
2. In "Add Staff Member" form, enter staff email
3. Click "Add Staff" button
4. Success toast appears
5. Staff member appears in "Your Team" section below

**Important:**
- Staff must have an existing account registered on `/register`
- Staff's email must match their registered email
- Staff is then linked to this garage

**Example Staff Email:**
- mechanic1@gmail.com
- john.smith@email.com
- service@garage.com

---

### STEP 6: Staff Logs In

**URL:** `http://localhost:5173/staff/login`

**Login Process:**
1. Navigate to `/staff/login`
2. Enter **Email** (their registered account email)
3. Enter **Password** (their registered password)
4. Click "Login" button
5. If credentials correct → Redirects to `/staff/dashboard`

**Authentication:**
- ✅ Uses their registered account (not garage-specific)
- ✅ Validates against Firebase Authentication
- ✅ Assigns "staff" role
- ✅ Shows only bookings assigned to them

---

### STEP 7: Staff Dashboard

**URL:** `http://localhost:5173/staff/dashboard`

**Overview Section:**
Shows statistics:
- **Total Tasks**: Count of all assignments
- **Pending**: Assigned but not started
- **In Progress**: Currently working on
- **Completed**: Finished tasks

**Tasks List:**
Each task card shows:
- **Tracking ID**: e.g., "GAR-ABC123XYZ"
- **Status Badge**: Assigned / In Progress / Completed (color-coded)
- **Vehicle Info**: Vehicle name/model
- **Customer Details**: Name, email, phone
- **Date & Time**: Service booking date and time
- **Services**: List of services booked
- **Total Price**: Service cost

---

### STEP 8: Staff Updates Task Progress

**Location:** Staff Dashboard → Click any task card to expand

**Update Form Appears:**
1. **Task Status Dropdown**: 3 options
   - Assigned (default)
   - In Progress (working on it now)
   - Completed (finished the service)

2. **Progress % Input**: 0-100
   - Used to show how far along they are
   - Example: 50% = half done

3. **Notes Field**: Optional text
   - "Engine oil changed, filter replaced"
   - "Waiting for customer confirmation"
   - "Needs spare part, order placed"

4. **Save Button**: Submits the update

**Process:**
1. Click task card to expand
2. Select task status from dropdown
3. Enter progress percentage (0-100)
4. Add optional notes
5. Click "Save" button
6. Success toast appears
7. Task reloads with updated info

**Real-time Updates:**
- Updates are saved immediately to Firestore
- Available to garage owner in dashboard
- Available to customer on tracking page

---

### STEP 9: Customer Sees Real-Time Progress

**URL:** `http://localhost:5173/track` (No login required)

**How to Access:**
1. Customer enters their **Tracking ID** in search form
2. Clicks "Track" button
3. All booking details appear with **real-time task progress**

**Task Progress Section** (NEW):
Shows:
- **Task Status Badge**: Assigned / In Progress / Completed
  - Yellow = Assigned (not started)
  - Blue = In Progress (working on it)
  - Green = Completed (finished)

- **Progress Bar**: Visual representation
  - Shows percentage (0-100%)
  - Animated updates when staff updates

- **Staff Notes**: Latest notes from mechanic
  - "Engine oil changed"
  - "Waiting for customer"
  - "Service complete, ready for pickup"

**Example View:**
```
Current Task Status:         [In Progress Badge]
Progress: ████████░ 80%
Staff Notes: "Most of the service completed. Final checks in progress."
```

**Bill Section:**
- Shows only when status = "completed"
- Customer can print or download invoice
- Shows itemized services and total cost

---

## 🔐 Authentication & Role-Based Access

### User Roles:
1. **admin**: System administrator, creates garages
2. **manager**: Garage owner, manages garage and staff
3. **staff**: Mechanic/technician, updates task progress
4. **customer**: Regular user, creates bookings

### Access Control:
| Route | Required Role | Redirect If Not |
|-------|---------------|-----------------|
| `/admin` | admin | `/` |
| `/garage/login` | none (guest only) | `/garagehost` if already logged in |
| `/garagehost` | manager or admin | `/garage/login` |
| `/staff/login` | none (guest only) | `/staff/dashboard` if already logged in |
| `/staff/dashboard` | staff or admin | `/staff/login` |
| `/track` | none (public) | N/A |

---

## 📱 Mobile/UI Features

### Admin Panel
- Clean card design for each garage
- Copy buttons with hover effects
- Color-coded status indicators
- Responsive grid layout

### Garage Owner Dashboard
- Tab-based interface
- Real-time filtering with live counts
- Collapsible task assignment forms
- Status badges with icons

### Staff Dashboard
- Card-based task list
- Expandable cards for details
- Status dropdown with 3 options
- Progress percentage input (0-100)
- Notes textarea for communication

### Tracking Page
- Public access (no login needed)
- Timeline view of booking status
- Task progress section with percentage
- Staff notes display
- Bill section for completed services

---

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Admin Platform │
└────────┬────────┘
         │
         ├─→ Add Garage → Creates garage record
         ├─→ View Credentials → Shows email/password
         └─→ Send to Owner
         
┌─────────────────────┐
│ Garage Owner (email) │
└────────┬────────────┘
         │
         ├─→ Login: /garage/login
         ├─→ Dashboard: /garagehost
         └─→ Add Staff: Send their email
         
┌──────────────┐
│ Staff Member │
└────────┬─────┘
         │
         ├─→ Login: /staff/login (with own credentials)
         ├─→ Dashboard: /staff/dashboard
         ├─→ See Assigned Tasks
         └─→ Update Task Status/Progress/Notes
         
┌──────────────┐
│   Customer   │
└────────┬─────┘
         │
         ├─→ Track: /track (with booking ID)
         ├─→ See Real-time Task Progress
         ├─→ View Staff Notes
         └─→ Download Bill when completed
```

---

## 💾 Database Structure

### 1. Firestore Collection: `bookings`
```javascript
{
  id: "booking_abc123",
  trackingId: "GAR-ABC123XYZ",
  name: "John Doe",
  email: "john@email.com",
  phone: "+91-9876543210",
  vehicle: "Honda City 2020",
  date: "2026-03-20",
  time: "10:00 AM",
  status: "confirmed",    // pending, confirmed, in progress, completed
  taskStatus: "in progress",  // assigned, in progress, completed
  progressPercentage: 80,     // 0-100
  notes: "Engine oil changed",
  assignedTo: "staff_user_id",  // Staff member assigned
  garageId: "garage_abc123",    // Which garage
  services: [
    { id: "svc1", name: "Oil Change", price: 500 }
  ],
  total: 1500,
  createdAt: "2026-03-19T10:30:00Z"
}
```

### 2. Firestore Collection: `profiles`
```javascript
{
  id: "user_id",
  name: "John Smith",
  email: "john@email.com",
  role: "staff",  // staff, manager, customer, admin
  phone: "+91-9876543210"
}
```

### 3. Firestore Collection: `garages`
```javascript
{
  id: "garage_abc123",
  name: "Elite Auto Repairs",
  contactPhone: "+91-9999999999",
  location: "Mumbai",
  ownerId: "user_id",  // Garage owner's user ID
  createdAt: "2026-03-19T10:00:00Z"
}
```

### 4. Firestore Collection: `garageStaff`
Linking staff to garages:
```javascript
{
  id: "staff_link_123",
  garageId: "garage_abc123",
  userId: "staff_user_id",
  assignedDate: "2026-03-19T10:00:00Z"
}
```

---

## 🧪 Testing the Complete Flow

### Test Case 1: Admin Creates Garage
1. Go to `/admin` (login as admin@garage.com / admin123)
2. Click "Manage Garage" tab
3. Click "Add New Garage" button
4. Fill form and create garage
5. **Expected**: Garage appears in list with edit/delete options

### Test Case 2: Copy Credentials
1. In Admin → Manage Garage
2. Find created garage
3. Click "Copy" button next to email
4. **Expected**: Toast shows "Email copied to clipboard"

### Test Case 3: Owner Logs In
1. Go to `/garage/login`
2. Use credentials from admin panel
3. Click "Login"
4. **Expected**: Redirects to `/garagehost`

### Test Case 4: Owner Adds Staff
1. In `/garagehost` → "Staff" tab
2. Enter staff email: mechanic@email.com
3. Click "Add Staff"
4. **Expected**: Staff appears in "Your Team" section

### Test Case 5: Staff Logs In
1. Go to `/staff/login`
2. Enter staff credentials (own registered account)
3. Click "Login"
4. **Expected**: Redirects to `/staff/dashboard`

### Test Case 6: Staff Updates Task
1. In `/staff/dashboard`
2. Click any task card (expands)
3. Select "In Progress" from status dropdown
4. Enter "75" in progress field
5. Add note: "Installing new battery"
6. Click "Save"
7. **Expected**: Task updates, toast shows success

### Test Case 7: Customer Tracks Booking
1. Go to `/track`
2. Enter booking tracking ID
3. Click "Track"
4. **Expected**: Shows task progress section with status badge, progress bar, and staff notes

### Test Case 8: Complete Task & See Bill
1. Go to `/staff/dashboard`
2. Click task, select "Completed" status
3. Set progress to 100%
4. Click "Save"
5. Go to `/track` with same booking ID
6. **Expected**: Shows green "Completed" badge and displays bill

---

## ⚙️ Configuration

### Backend API Endpoints Used:
- `POST /api/auth/login` - Authentication
- `GET /api/bookings` - Get garage bookings
- `POST /api/bookings/{id}/assign` - Assign to staff
- `PUT /api/bookings/{id}/progress` - Update progress
- `GET /api/staff/tasks` - Get staff tasks

### Frontend Routes:
| Path | Component | Role |
|------|-----------|------|
| `/garage/login` | GarageLogin.tsx | guest |
| `/garagehost` | GarageHost.tsx | manager/admin |
| `/staff/login` | StaffLogin.tsx | guest |
| `/staff/dashboard` | StaffDashboard.tsx | staff/admin |
| `/track` | Tracking.tsx | public |
| `/admin` | Admin.tsx | admin |

---

## 🎨 UI/UX Enhancements Made

### Admin Panel:
✅ Credentials card with copy buttons  
✅ Color-coded garage cards  
✅ Left border indicating important section  
✅ Muted background for credentials section  

### Tracking Page:
✅ Task Progress section with badge  
✅ Progress percentage bar (0-100%)  
✅ Color-coded status (Yellow/Blue/Green)  
✅ Staff notes display box  
✅ Real-time updates from staff changes  

### Staff Dashboard:
✅ Expandable task cards  
✅ Status dropdown with 3 options  
✅ Progress input field  
✅ Notes textarea  
✅ Task statistics overview

---

## 🔑 Key Features

✅ **Complete authentication system** - Different logins for different roles  
✅ **Garage Owner Dashboard** - Manage garage and staff  
✅ **Staff Management** - Add/remove staff from garage  
✅ **Task Assignment** - Owner assigns bookings to staff  
✅ **Real-time Progress Tracking** - Staff updates visible to customers  
✅ **Public Tracking** - Customers can track without login  
✅ **Progress Percentage** - Visual representation of work completion  
✅ **Staff Notes** - Communication between staff and customers  
✅ **Bill Generation** - Automatic billing on completion  
✅ **Session Persistence** - Remember me functionality  

---

## 📝 Notes

- All passwords are generated based on current year
- Email format: `garage.{id}@autogarage.local`
- Staff uses their own registered account email (not garage-specific)
- All updates are real-time using Firestore
- Tracking page is public (no authentication required)
- Bill shows only when booking status = "completed"

---

## 🚀 Next Steps / Future Enhancements

- [ ] SMS/Email notifications when staff assigned task
- [ ] Rate/Review system for completed services
- [ ] Payment integration for bill payment
- [ ] Attendance tracking for staff
- [ ] Performance metrics dashboard
- [ ] Multi-location garage support
- [ ] Admin approval for new garages
- [ ] Garage owner payment settlement
