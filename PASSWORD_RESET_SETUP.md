# Password Reset Flow - Setup Guide

## ✅ What Was Fixed

### 1. **AuthContext Updates**
- Added `resetPassword()` function to send password reset emails
- Added `updatePassword()` function to update user passwords
- Configured redirect URL: `${window.location.origin}/auth?mode=reset`

### 2. **Auth Page Complete Overhaul**
- Added "Forgot Password?" link on the sign-in form
- Implemented forgot password form to request reset emails
- Implemented password reset form (triggered by `?mode=reset` URL parameter)
- Added proper validation and error handling
- Users now have a complete self-service password reset flow

### 3. **Admin/Teacher Password Reset Fix**
- Updated `useUserManagement.tsx` to use correct redirect URL
- Teachers and admins can now reset student passwords via User Management page
- Students receive email with proper redirect to `/auth?mode=reset`

## 🔧 Required Supabase Configuration

**CRITICAL**: You must whitelist redirect URLs in your Supabase dashboard, otherwise users will be redirected to localhost.

### Steps:

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: `tmkahguevsrvrrlkjzax`
3. Navigate to: **Authentication** → **URL Configuration**
4. Add these URLs to **Redirect URLs**:

```
https://your-production-domain.com/auth?mode=reset
http://localhost:5173/auth?mode=reset
http://localhost:3000/auth?mode=reset
```

**Replace `your-production-domain.com` with your actual production URL** (e.g., `middle-school-track.vercel.app` or whatever your deployment domain is)

5. Click **Save**

## 📧 Email Template Configuration (Optional)

You can customize the password reset email template in Supabase:

1. Go to: **Authentication** → **Email Templates**
2. Select: **Reset Password**
3. The email will contain a magic link that redirects to: `{{ .SiteURL }}/auth?mode=reset`

## 🧪 Testing the Flow

### For End Users (Production):
1. Go to `/auth` page
2. Click "Forgot Password?"
3. Enter email address
4. Check email inbox for reset link
5. Click link in email (should redirect to `/auth?mode=reset`)
6. Enter and confirm new password
7. Sign in with new password

### For Administrators (User Management):
1. Go to `/users` page (User Management)
2. Use the "Reset User Password" form
3. Select a user or enter email manually
4. User receives password reset email
5. User follows the same flow as above

## 🔍 Troubleshooting

### "Invalid redirect URL" error
- **Cause**: Production URL not whitelisted in Supabase
- **Solution**: Add your production domain to Redirect URLs in Supabase dashboard

### Users redirected to localhost in production
- **Cause**: Only localhost URLs whitelisted in Supabase
- **Solution**: Add production domain to Redirect URLs

### Password reset email not received
- **Cause**: Email not configured or in spam folder
- **Solution**: Check spam, verify email settings in Supabase, check EMAIL_SETUP.md

## 📝 Code Changes Summary

### Files Modified:
1. `src/contexts/AuthContext.tsx` - Added password reset functions
2. `src/pages/Auth.tsx` - Implemented complete forgot password UI
3. `src/hooks/useUserManagement.tsx` - Fixed admin/teacher password reset redirect URL

### Key Features:
- Self-service password reset for users
- Admin password reset for user management
- Proper error handling and validation
- Production-ready redirect URL configuration
- Modern, intuitive UI/UX

## 🚀 Deployment Checklist

- [ ] Update Supabase Redirect URLs with production domain
- [ ] Test forgot password flow in development
- [ ] Deploy to production
- [ ] Test forgot password flow in production
- [ ] Verify emails are being sent
- [ ] Verify redirect URLs work correctly
- [ ] Test admin password reset feature

---

**Note**: The redirect URL uses `window.location.origin` which automatically adapts to your environment (dev vs production), so the code doesn't need environment-specific configuration.


