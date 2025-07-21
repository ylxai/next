# Admin Role Management System - Setup Guide

## Overview
This guide will help you set up a complete admin role management system for your photo studio project. The system allows admin users to manage user roles and includes proper authentication and authorization.

## 🏗️ System Components

### 1. Database Functions (`database/admin_role_functions.sql`)
- **`is_admin()`** - Check if current user is admin
- **`get_current_user_role()`** - Get current user's role
- **`set_user_role(user_email, new_role)`** - Set user role (admin only)
- **`get_all_users_with_roles()`** - Get all users with roles (admin only)
- **`remove_user_role(user_email)`** - Remove admin role (admin only)

### 2. Frontend Components
- **`AdminRoleManager`** - Main component for role management
- **Admin page** at `/admin/roles`
- **API routes** for role operations

### 3. Edge Function (`supabase/functions/admin-validation/index.ts`)
- Server-side role validation
- Admin-only operations
- CORS support

## 📝 Setup Instructions

### Step 1: Database Setup

1. **Execute the SQL functions** in your Supabase SQL Editor:
```sql
-- Copy and paste the entire content of database/admin_role_functions.sql
-- This will create all necessary functions, tables, and policies
```

2. **Create your first admin user** (replace with actual email):
```sql
INSERT INTO user_roles (user_id, role)
SELECT au.id, 'admin'
FROM auth.users au
WHERE au.email = 'your-admin@email.com'
ON CONFLICT (user_id) DO NOTHING;
```

### Step 2: Deploy Edge Function (Optional)

1. **Install Supabase CLI** if not already installed:
```bash
npm install -g supabase
```

2. **Deploy the Edge Function**:
```bash
supabase functions deploy admin-validation
```

3. **Set environment variables** in Supabase:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

### Step 3: Frontend Integration

1. **Access the admin role management**:
   - Navigate to `/admin/roles` (admin users only)
   - The component will automatically check admin status

2. **API Endpoints Available**:
   - `GET /api/admin/roles` - Get all users with roles
   - `POST /api/admin/roles` - Set user role
   - `PUT /api/admin/roles` - Update user role

## 🚀 Usage

### Managing User Roles

1. **View all users**: The system automatically displays all registered users
2. **Set roles**: Enter email and select role (admin/user)
3. **Quick actions**: Use "Jadikan Admin" or "Hapus Admin" buttons
4. **Real-time updates**: User list refreshes after each action

### Admin Access Control

- Only users with `admin` role can access role management
- Non-admin users see access denied message
- All operations are protected by RLS policies

## 🔒 Security Features

### Row Level Security (RLS)
- Users can only see their own role
- Admins can manage all roles
- All operations are logged

### Database Functions
- `SECURITY DEFINER` functions for controlled access
- Proper error handling and validation
- Protected against SQL injection

### API Protection
- Authentication required for all endpoints
- Admin role verification
- Comprehensive error handling

## 📊 Database Schema

### `user_roles` Table
```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🔧 API Reference

### Get All Users with Roles
```http
GET /api/admin/roles
Authorization: Bearer <supabase-access-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z",
      "last_sign_in_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Set User Role
```http
POST /api/admin/roles
Authorization: Bearer <supabase-access-token>
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Peran user@example.com berhasil diubah menjadi admin",
  "data": { ... }
}
```

## 🛠️ Customization

### Adding New Roles
1. Update the CHECK constraint in `user_roles` table
2. Modify the validation in database functions
3. Update the frontend role options

### Custom Permissions
1. Create new database functions for specific permissions
2. Add role-based conditionals in your components
3. Update API middleware for new permission checks

## 🚨 Troubleshooting

### Common Issues

1. **"Akses ditolak" Error**
   - Ensure user has admin role in `user_roles` table
   - Check if RLS policies are properly set up

2. **"Function does not exist" Error**
   - Run the SQL functions from `database/admin_role_functions.sql`
   - Ensure functions are created in the correct schema

3. **Database Connection Issues**
   - Verify Supabase environment variables
   - Check network connectivity to Supabase

### Debugging

1. **Check user role**:
```sql
SELECT ur.role 
FROM user_roles ur 
WHERE ur.user_id = auth.uid();
```

2. **Verify admin status**:
```sql
SELECT is_admin();
```

3. **List all users with roles**:
```sql
SELECT au.email, COALESCE(ur.role, 'user') as role
FROM auth.users au
LEFT JOIN user_roles ur ON au.id = ur.user_id;
```

## 📱 Mobile Responsiveness

The admin role management interface is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile devices

## 🔄 Migration

If upgrading from an existing system:

1. **Backup existing data**
2. **Run the SQL migrations**
3. **Migrate existing admin flags** to the new `user_roles` table
4. **Test thoroughly** before going live

## ✅ Testing

### Manual Testing Checklist
- [ ] Admin can access role management page
- [ ] Non-admin users see access denied
- [ ] Role changes are reflected immediately
- [ ] Email validation works correctly
- [ ] Error messages are user-friendly
- [ ] API endpoints return proper responses

### Automated Testing
Consider adding tests for:
- Database functions
- API endpoints
- Component rendering
- Permission checks

## 📈 Performance Considerations

- Database indexes are created for optimal query performance
- Functions use efficient queries
- Frontend components minimize re-renders
- API responses are cached where appropriate

## 🔐 Best Practices

1. **Always validate admin status** before sensitive operations
2. **Use parameterized queries** to prevent SQL injection
3. **Log admin actions** for audit trails
4. **Regular backup** of user roles data
5. **Monitor for suspicious activity**

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review the database logs
3. Verify all setup steps were completed
4. Test with minimal data first

---

**Note**: This system is designed for production use with proper security measures. Always test thoroughly in a staging environment before deploying to production.