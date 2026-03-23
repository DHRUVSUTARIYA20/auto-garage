# Quick Reference - Garage & Staff System

## 🚀 Quick Start Guide

### SCENARIO 1: How Admin Creates a Garage

```
Admin Dashboard
    ↓
Click "Manage Garage" tab
    ↓
Click "Add New Garage" button
    ↓
Fill form:
  • Garage Name: "Elite Auto Repairs"
  • Contact Phone: "+91-9876543210"
  • City/State: "Mumbai"
  • Description: "Full service..."
    ↓
Click "Create Garage"
    ↓
✅ Garage appears in list
✅ Copy Email: garage.abc123@autogarage.local
✅ Copy Password: Garage@2026
    ↓
Send to garage owner
```

---

### SCENARIO 2: Garage Owner Login & Add Staff

```
Garage Owner
    ↓
Go to: /garage/login
    ↓
Enter Email: garage.abc123@autogarage.local
Enter Password: Garage@2026
    ↓
Click "Login"
    ↓
✅ Redirects to: /garagehost
    ↓
See Dashboard with tabs:
  • Overview (stats)
  • Staff (management)
  • Bookings (task assignment)
  • Settings (edit info)
    ↓
Go to "Staff" tab
    ↓
Find "Add Staff Member" form
  • Enter staff email: mechanic@example.com
  • Click "Add Staff"
    ↓
✅ Staff appears in "Your Team" section
```

---

### SCENARIO 3: Staff Login & Update Tasks

```
Mechanic/Staff Member
    ↓
Go to: /staff/login
    ↓
Enter Email: mechanic@example.com
Enter Password: [their password]
    ↓
Click "Login"
    ↓
✅ Redirects to: /staff/dashboard
    ↓
See:
  • Stats: Total, Pending, In Progress, Completed
  • Task List: All assigned bookings from garage
    ↓
Click any task card to expand
    ↓
Update form appears:
  • Status: Assigned → In Progress → Completed
  • Progress: Enter 0-100%
  • Notes: "Engine oil changed..."
    ↓
Click "Save"
    ↓
✅ Task updated in real-time
✅ Garage owner sees updated task
✅ Customer sees progress on tracking page
```

---

### SCENARIO 4: Customer Tracks Booking

```
Customer (No login needed)
    ↓
Go to: /track
    ↓
Enter Tracking ID: GAR-ABC123XYZ
    ↓
Click "Track"
    ↓
See Booking Details:
  • Customer info
  • Vehicle details
  • Services booked
    ↓
NEW: "Task Progress" Section
  ┌─────────────────────────────┐
  │ ✓ Task Status: In Progress  │
  │ Progress: ████████░ 80%     │
  │ Notes: "Engine work done"   │
  └─────────────────────────────┘
    ↓
When Status = "Completed":
  ├─ Shows green "Completed" badge
  ├─ Displays final bill
  ├─ Shows print button
  └─ Shows download button
    ↓
✅ Customer can print invoice
✅ Customer can download PDF
```

---

## 🔑 Key URLs

| User Type | Login URL | Dashboard URL |
|-----------|-----------|---------------|
| **Admin** | `/admin/login` | `/admin` |
| **Garage Owner** | `/garage/login` | `/garagehost` |
| **Staff/Mechanic** | `/staff/login` | `/staff/dashboard` |
| **Customer** | `/login` | `/dashboard` |
| **Public Tracking** | N/A | `/track` |

---

## 🎯 What Each User Can Do

### Admin
- ✅ Create garages
- ✅ View garage credentials
- ✅ Copy & share credentials
- ✅ View all system analytics
- ✅ Manage users

### Garage Owner
- ✅ Log in with provided credentials
- ✅ View garage dashboard & analytics
- ✅ Add staff members
- ✅ Assign bookings to staff
- ✅ View task progress
- ✅ See due payments
- ✅ Track completion rates

### Staff/Mechanic
- ✅ Log in with their account
- ✅ View assigned tasks/bookings
- ✅ Mark task as "In Progress"
- ✅ Update progress percentage
- ✅ Add notes about work
- ✅ Mark task as "Completed"

### Customer
- ✅ Create bookings
- ✅ Track booking status (public link)
- ✅ See mechanic's progress
- ✅ View staff notes
- ✅ Download bill when complete
- ✅ Print invoice

---

## 📊 Data Flow

```
Admin Creates Garage
    ↓
    ├─→ Firestore: garages collection
    ├─→ Email: garage.{id}@autogarage.local
    └─→ Password: Auto-generated
    
    ↓
Garage Owner Logs In
    ├─→ Firebase Auth validation
    ├─→ Session cookie set
    └─→ Role: "manager"
    
    ↓
Owner Adds Staff (by email)
    ├─→ Links staff to garage
    ├─→ Firestore: garageStaff collection
    └─→ Staff still uses own login
    
    ↓
Staff Logs In
    ├─→ Firebase Auth (own account)
    ├─→ Shows only assigned bookings
    └─→ Role: "staff"
    
    ↓
Staff Updates Task
    ├─→ Firestore: bookings collection
    ├─→ Sets: taskStatus, progressPercentage, notes
    └─→ Real-time update
    
    ↓
Customer Tracks Booking
    ├─→ Public /track page
    ├─→ Fetches booking with task progress
    └─→ Shows progress bar, notes, bill
```

---

## 🎨 Task Status Colors

| Status | Color | Badge | Meaning |
|--------|-------|-------|---------|
| Assigned | Yellow | Yellow Badge | Task assigned, not started |
| In Progress | Blue | Blue Badge | Mechanic is working on it |
| Completed | Green | Green Badge | Task finished, ready for pickup |

---

## 📝 Task Update Form

When staff clicks a task to expand, they see:

```
┌─────────────────────────────────────────┐
│ Expand Task Card                        │
├─────────────────────────────────────────┤
│                                         │
│ Task Status Dropdown:                   │
│ ┌─────────────────────────────────────┐ │
│ │ Assigned                   ↓        │ │
│ │ → In Progress              ↓        │ │
│ │ → Completed                ↓        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Progress % Input:                       │
│ ┌─────────────────────────────────────┐ │
│ │ 75                                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Notes Textarea:                         │
│ ┌─────────────────────────────────────┐ │
│ │ Engine oil changed, filter installed│ │
│ │ Brake pads checked                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Save Button]         [Cancel Button]   │
└─────────────────────────────────────────┘
```

---

## 🧪 Testing Commands

### Test Admin
```
1. Go to: http://localhost:5173/admin
2. Default: admin@garage.com / admin123
3. Click: Manage Garage
4. Click: Add New Garage
5. Fill form, Create
6. See credentials appear
```

### Test Garage Owner
```
1. Go to: http://localhost:5173/garage/login
2. Email: garage.{id}@autogarage.local (from admin)
3. Password: Garage@2026 (from admin)
4. Click: Login
5. Add staff by email
```

### Test Staff
```
1. Go to: http://localhost:5173/staff/login
2. Email: mechanic@example.com
3. Password: [their password]
4. Click: Login
5. See tasks, expand, update
```

### Test Tracking
```
1. Go to: http://localhost:5173/track
2. Enter: Tracking ID (e.g., GAR-ABC123XYZ)
3. See: Task progress in real-time
4. Refresh: See latest updates from staff
```

---

## 🔐 Default Credentials

### Admin
```
Email: admin@garage.com
Password: admin123
(See /register page for default credentials display)
```

### Demo Garage Owner
```
Email: garage.abc12345@autogarage.local
Password: Garage@2026
(Generated when garage is created)
```

### Demo Staff
```
Email: (Must register first on /register)
Password: (Same password they set on registration)
```

### Demo Customer
```
Email: (Register on /register)
Password: (Same password they set)
```

---

## 📱 Mobile Responsive

All pages are mobile responsive:
- ✅ Admin panel works on tablet/mobile
- ✅ Garage owner dashboard mobile-friendly
- ✅ Staff dashboard works on phone
- ✅ Tracking page mobile-optimized
- ✅ Forms are easy to fill on any device

---

## 🎯 Common Actions

### I want to add a garage as admin:
→ Go to `/admin` → Manage Garage tab → Add New Garage

### I want to share garage credentials:
→ Go to `/admin` → Manage Garage → Click Copy button

### I want to add staff as garage owner:
→ Go to `/garagehost` → Staff tab → Add Staff Member

### I want to assign a task as garage owner:
→ Go to `/garagehost` → Bookings tab → Click Assign button

### I want to update task progress as staff:
→ Go to `/staff/dashboard` → Click task → Update status/progress/notes → Save

### I want to track my booking:
→ Go to `/track` → Enter tracking ID → Click Track

### I want to download my bill:
→ Go to `/track` → Find "Download PDF" button → Save invoice

---

## ⚡ Quick Tips

- **Copy Credentials:** Click the "Copy" button next to email/password
- **Expand Task:** Click anywhere on the task card to expand/collapse
- **Save Changes:** Always click "Save" after updating task info
- **Refresh Tracking:** Refresh browser to see latest updates from staff
- **Print Invoice:** Click "Print" in bill section or use Ctrl+P
- **Download Bill:** Use "Download PDF" button for invoice

---

## ✅ Success Indicators

Admin sees "Garage added" toast → ✅ Garage created successfully
Owner sees credentials in admin panel → ✅ Ready to share
Owner logs in → ✅ Owner authenticated
Owner sees bookings → ✅ Garage data loaded
Owner adds staff → ✅ Staff linked to garage
Staff logs in → ✅ Staff authenticated
Staff updates task → ✅ Task updated in real-time
Customer sees progress bar → ✅ Real-time tracking working
Bill appears when completed → ✅ Billing system working

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't log in as garage owner | Check email/password from admin panel (exact match) |
| Can't see tasks as staff | Make sure garage owner added you to their garage |
| Tracking page shows no data | Check tracking ID is correct (format: GAR-ABC123XYZ) |
| Progress bar not updating | Refresh page or wait 5 seconds for real-time update |
| Can't add staff | Staff email must be registered on platform first |
| Bill not showing | Check booking status is "completed" |
| Copy button not working | Check clipboard permissions in browser |

---

## 📞 Support Information

For issues or questions about:
- Creating garages → Contact Admin
- Staff management → Contact Garage Owner
- Task updates → Check Staff Dashboard
- Tracking issues → Verify tracking ID
- Billing → Check completion status

---

Total: **Complete Garage + Staff System LIVE** ✅
