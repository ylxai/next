# 🔧 Event Form Troubleshooting Guide

## ❌ **Problem: Cannot Submit Event Form**

**Symptoms**: 
- Form fills completely but won't submit
- Loading state appears but nothing happens
- Error messages appear after submission
- Form seems to submit but no event created

---

## ✅ **Fixes Applied**

### **1. Database Schema Fix**
- **File**: `database/events_schema_fix.sql`
- **Issue**: `client_id` referenced wrong table (`users` instead of `clients`)
- **Fix**: Updated foreign key constraint to reference `clients(id)`

### **2. Form Data Handling**
- **File**: `app/components/admin/event-form.tsx`
- **Issues**: 
  - Empty strings not converted to `null` for optional fields
  - Poor error handling and debugging
  - Data type conversion issues
- **Fixes**:
  - ✅ Clean data preparation with proper null handling
  - ✅ Enhanced error messages with specific database error detection
  - ✅ Debug logging for troubleshooting
  - ✅ Proper type conversion for numbers and booleans

### **3. Validation Schema**
- **File**: `app/lib/validations/event.ts`
- **Issue**: Optional fields couldn't handle empty strings
- **Fix**: Added `.or(z.literal(""))` for optional string fields

### **4. Debug Tools**
- **File**: `app/(routes)/debug-event-form/page.tsx`
- **Purpose**: Comprehensive debugging page to identify issues
- **Features**:
  - ✅ Database connection testing
  - ✅ User role verification
  - ✅ Manual event insert testing
  - ✅ RLS policy checking
  - ✅ Table structure verification

---

## 🛠️ **Setup & Fix Instructions**

### **Step 1: Apply Database Fixes**

Run this in **Supabase SQL Editor**:

```sql
-- Fix 1: Update client_id foreign key constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_client_id_fkey;
ALTER TABLE events 
ADD CONSTRAINT events_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL;

-- Fix 2: Temporarily disable RLS for testing
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Fix 3: Test insert with minimal data
INSERT INTO events (
  title, description, event_type, date, start_time, end_time, 
  location, max_participants, price
) VALUES (
  'Test Event', 'Test description for debugging', 'other',
  '2024-12-25', '10:00', '16:00', 'Test Location', 50, 100000
);

-- Fix 4: Check if insert worked
SELECT * FROM events WHERE title = 'Test Event';

-- Fix 5: Clean up test data
DELETE FROM events WHERE title = 'Test Event';

-- Fix 6: Re-enable RLS with proper policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Fix 7: Create proper admin policy
DROP POLICY IF EXISTS "Admin can manage events" ON events;
CREATE POLICY "Admin can manage events" ON events
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### **Step 2: Test Database Access**

1. **Navigate to debug page**: `http://localhost:3000/debug-event-form`
2. **Check database connection** (should be green)
3. **Verify user role** (must be "admin")
4. **Click "Test Event Insert"** - should show success
5. **Check console logs** for any error details

### **Step 3: Test Event Form**

1. **Go to create event**: `http://localhost:3000/admin/events/create`
2. **Fill minimal required fields**:
   ```
   Title: Test Wedding Event
   Event Type: Wedding  
   Date: Tomorrow's date
   Start Time: 09:00
   End Time: 17:00
   Location: Test Studio Location
   Max Participants: 50
   Price: 0
   Description: Test event description for validation
   ```
3. **Submit form** and check browser console
4. **Look for debug logs** showing form data and response

---

## 🔍 **Troubleshooting Specific Issues**

### **Issue 1: "Permission Denied" Error**
**Cause**: RLS policies blocking admin access

**Solution**:
```sql
-- Check current user role
SELECT id, email, role FROM users WHERE id = auth.uid();

-- Temporarily disable RLS
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Test form submission, then re-enable with proper policy
```

### **Issue 2: "Violates Check Constraint" Error**
**Cause**: Data doesn't meet database validation rules

**Common Causes & Fixes**:
- **Title too short**: Must be 3-100 characters
- **Description too short**: Must be 10-1000 characters  
- **Location too short**: Must be 3-200 characters
- **Invalid event_type**: Must be one of: wedding, birthday, corporate, graduation, engagement, family, other
- **Invalid max_participants**: Must be 1-1000
- **Invalid price**: Must be >= 0

### **Issue 3: "Violates Foreign Key Constraint"**
**Cause**: client_id references non-existent client

**Solution**:
```sql
-- Check if clients table exists and has data
SELECT * FROM clients LIMIT 5;

-- If client_id is provided, verify it exists
SELECT * FROM clients WHERE id = 'your-client-id';

-- Or just leave client_id empty for new events
```

### **Issue 4: "Duplicate Key Value" Error**
**Cause**: access_code already exists

**Solution**:
- Click "Generate" button to create new access code
- Or leave empty - system will auto-generate

### **Issue 5: Form Validation Errors**
**Cause**: Zod validation failing

**Debug Steps**:
1. Check browser console for validation errors
2. Ensure all required fields are filled
3. Check field formats (email, phone number)
4. Verify date is not in the past

---

## 🧪 **Testing Checklist**

### **Database Level**:
- [ ] Tables `events` and `clients` exist
- [ ] Foreign key constraint points to `clients(id)`
- [ ] RLS policies allow admin access
- [ ] Manual insert works via SQL

### **Authentication Level**:
- [ ] User is logged in
- [ ] User has `admin` role
- [ ] Session is valid and not expired

### **Form Level**:
- [ ] All required fields are filled
- [ ] Data formats are correct (email, phone, date)
- [ ] No validation errors in console
- [ ] Form submits without JavaScript errors

### **Backend Level**:
- [ ] Supabase connection works
- [ ] Debug logs show data being sent
- [ ] Response indicates success or specific error

---

## 📊 **Debug Console Commands**

### **Check Current User**:
```javascript
// Run in browser console
const supabase = createClient();
const { data } = await supabase.auth.getUser();
console.log('Current user:', data.user);
```

### **Test Manual Insert**:
```javascript
// Run in browser console
const testEvent = {
  title: 'Console Test Event',
  description: 'Testing from browser console',
  event_type: 'other',
  date: '2024-12-25',
  start_time: '10:00',
  end_time: '16:00',
  location: 'Console Test Location',
  max_participants: 25,
  price: 0,
  status: 'draft'
};

const { data, error } = await supabase
  .from('events')
  .insert([testEvent])
  .select();

console.log('Insert result:', { data, error });
```

---

## 🎯 **Common Solutions Summary**

### **Quick Fixes** (try in order):

1. **Refresh page** and try again
2. **Check required fields** are all filled
3. **Clear browser cache** and reload
4. **Check browser console** for errors
5. **Use debug page** to test database access
6. **Run SQL fixes** in Supabase if database issues
7. **Disable RLS temporarily** for testing

### **Database Fixes**:
```sql
-- One-liner to fix most common issues
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
```

### **Form Fixes**:
- Fill all required fields completely
- Use valid email format for client email
- Use future date for event date
- Generate new access code if duplicate error

---

## 🚀 **After Fixes Are Applied**

### **Success Indicators**:
✅ Debug page shows "Connected" database  
✅ User role shows "admin"  
✅ Test insert button shows success  
✅ Event form submits without errors  
✅ New event appears in events list  
✅ Event detail page loads correctly  

### **Production Checklist**:
1. ✅ Re-enable RLS after testing
2. ✅ Remove debug logs from production
3. ✅ Test with multiple event types
4. ✅ Verify client integration works
5. ✅ Test edit functionality

---

## 📞 **Still Having Issues?**

If problems persist after applying all fixes:

1. **Check debug page**: `http://localhost:3000/debug-event-form`
2. **Review browser console** for detailed error messages
3. **Test manual SQL insert** in Supabase SQL Editor
4. **Verify user permissions** and role settings
5. **Check network connectivity** to Supabase

**Most common cause**: RLS policies blocking admin access  
**Most common fix**: Temporarily disable RLS for testing  

**🎊 Event form should work perfectly after applying these fixes!**