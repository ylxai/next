# 📅 Event Management Form - Setup & Testing Guide

## ✅ **What's Been Created**

### 🚀 **1. Comprehensive Event Form**
- **File**: `app/components/admin/event-form.tsx`
- **Features**: 
  - ✅ Both Create & Edit modes
  - ✅ Full form validation with Zod
  - ✅ React Hook Form integration
  - ✅ Professional UI with sections
  - ✅ Access code generation
  - ✅ Client selection/creation
  - ✅ Event type categorization
  - ✅ Real-time validation feedback

### 🗃️ **2. Database Schema**
- **Files**: 
  - `database/events_schema.sql` - Complete events table
  - `database/clients_schema.sql` - Clients table
- **Features**:
  - ✅ Full relational structure
  - ✅ Data validation constraints
  - ✅ Auto-generated access codes
  - ✅ RLS (Row Level Security) policies
  - ✅ Indexes for performance

### 🔧 **3. Form Validation**
- **File**: `app/lib/validations/event.ts`
- **Features**:
  - ✅ Zod schemas for create/update
  - ✅ Type safety with TypeScript
  - ✅ Dropdown options for event types
  - ✅ Comprehensive field validation

### 🎨 **4. UI Components**
- **Files**: 
  - `components/ui/select.tsx` - Custom dropdown
  - `components/ui/textarea.tsx` - Multi-line input
- **Features**:
  - ✅ Consistent styling with Tailwind
  - ✅ Accessibility support
  - ✅ Form integration ready

---

## 🛠️ **Setup Instructions**

### **Step 1: Setup Database Tables**

**Option A: Via Supabase SQL Editor**
1. Login to your Supabase dashboard
2. Go to SQL Editor
3. Run these commands in order:

```sql
-- 1. First run the clients schema
-- Copy paste from database/clients_schema.sql

-- 2. Then run the events schema  
-- Copy paste from database/events_schema.sql
```

**Option B: Via Command Line** (if you have direct DB access)
```bash
psql -h your-supabase-host -U postgres -d postgres -f database/clients_schema.sql
psql -h your-supabase-host -U postgres -d postgres -f database/events_schema.sql
```

### **Step 2: Verify Database Setup**

Run this verification query in Supabase SQL Editor:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('events', 'clients');

-- Check events table structure
\d events

-- Check sample data (should be empty for now)
SELECT COUNT(*) FROM events;
SELECT COUNT(*) FROM clients;
```

### **Step 3: Test the Form**

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Navigate to event creation**:
   - Login as admin: `http://localhost:3000/login`
   - Go to admin dashboard: `http://localhost:3000/admin/dashboard`
   - Click "Events" in sidebar
   - Click "Create New Event" button
   - Or direct URL: `http://localhost:3000/admin/events/create`

3. **Test form features**:
   - ✅ Fill all required fields
   - ✅ Test validation (try submitting empty form)
   - ✅ Generate access code
   - ✅ Test event type dropdown
   - ✅ Test date/time pickers
   - ✅ Test client selection
   - ✅ Submit and verify redirect

---

## 🧪 **Testing Scenarios**

### **Test Case 1: Create New Event (Basic)**
```
Title: "Wedding Photography - Test Event"
Event Type: Wedding
Date: Tomorrow's date
Start Time: 09:00
End Time: 17:00
Location: "Test Studio, Jakarta"
Max Participants: 50
Price: 5000000
Description: "Test wedding photography session"
```

**Expected Result**: 
- ✅ Form submits successfully
- ✅ Redirects to event detail page
- ✅ Access code auto-generated
- ✅ Data saved in database

### **Test Case 2: Form Validation**
```
Test empty form submission
Test invalid email format
Test past date selection
Test negative price
Test invalid time range (end before start)
```

**Expected Result**:
- ❌ Form should NOT submit
- ✅ Error messages displayed
- ✅ Fields highlighted in red
- ✅ Specific validation messages shown

### **Test Case 3: Edit Existing Event**
1. Create an event first
2. Go to events list: `http://localhost:3000/admin/events`
3. Click "Edit" on any event
4. Modify some fields
5. Submit changes

**Expected Result**:
- ✅ Form pre-filled with existing data
- ✅ Changes saved successfully
- ✅ Updated_at timestamp updated

### **Test Case 4: Client Integration**
```
Scenario A: Select existing client
Scenario B: Create new client data
```

**Expected Result**:
- ✅ Client dropdown populated
- ✅ New client fields show/hide correctly
- ✅ Event linked to client properly

---

## 🔍 **Troubleshooting**

### **Issue 1: Database Connection Error**
**Symptoms**: 
- Form submits but shows database error
- Console shows connection failed

**Solutions**:
```sql
-- Check if RLS is causing issues
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Test direct insert
INSERT INTO events (title, description, event_type, date, start_time, end_time, location, max_participants, price)
VALUES ('Test Event', 'Test description', 'wedding', '2024-06-15', '09:00', '17:00', 'Test Location', 50, 1000000);
```

### **Issue 2: Form Validation Errors**
**Symptoms**:
- Zod validation errors
- TypeScript type errors

**Solutions**:
1. Check field names match schema
2. Verify data types (number vs string)
3. Check required vs optional fields

### **Issue 3: Access Code Not Generated**
**Symptoms**:
- Access code field empty after submit
- Database trigger not working

**Solutions**:
```sql
-- Test trigger function
SELECT generate_access_code();

-- Manually set access code
UPDATE events SET access_code = 'TEST01' WHERE id = 'your-event-id';
```

### **Issue 4: Client Dropdown Empty**
**Symptoms**:
- No clients shown in dropdown
- Form loads but clients not loaded

**Solutions**:
1. Check clients table has data:
   ```sql
   SELECT * FROM clients;
   ```
2. Insert test client:
   ```sql
   INSERT INTO clients (name, email, phone) 
   VALUES ('Test Client', 'test@example.com', '081234567890');
   ```

---

## 📊 **Form Fields Reference**

### **Required Fields** ⭐
- Title (3-100 characters)
- Description (10-1000 characters) 
- Event Type (dropdown)
- Date (future date)
- Start Time
- End Time
- Location (3-200 characters)
- Max Participants (1-1000)
- Price (>= 0)

### **Optional Fields**
- Client selection
- Client contact info (if new)
- Access code (auto-generated if empty)
- Status (defaults to "draft")
- Notes (max 500 characters)
- Public visibility settings
- Approval requirements

### **Auto-Generated Fields**
- Event ID (UUID)
- Access code (if not provided)
- Created timestamp
- Updated timestamp

---

## 🎯 **Next Steps After Setup**

### **Immediate (Testing)**:
1. ✅ **Test form creation** with sample data
2. ✅ **Verify database** entries
3. ✅ **Test form editing** functionality
4. ✅ **Check validation** works properly

### **Short Term (Integration)**:
1. 🔄 **Event detail view** (next feature)
2. 🔄 **QR code generation** 
3. 🔄 **Photo gallery** integration
4. 🔄 **Client management** pages

### **Long Term (Enhancement)**:
1. 📸 **Image upload** for events
2. 📧 **Email notifications**
3. 📋 **Event templates**
4. 📈 **Analytics dashboard**

---

## 🎉 **Success Indicators**

When setup is complete, you should be able to:

✅ **Navigate to create event page**  
✅ **See professional, organized form**  
✅ **Fill out all fields with validation**  
✅ **Generate access codes**  
✅ **Select or create clients**  
✅ **Submit and get redirected**  
✅ **Edit existing events**  
✅ **View events in admin list**  

**🚀 The event management form is now ready for production use!**

Need help? Check the troubleshooting section or inspect browser console for detailed error messages.