# Team Password Management Features

## Overview
Enhanced team management functionality to allow owners to view and reset team member passwords.

## Changes Made

### Backend Changes

#### 1. New API Endpoint - Reset Password
**File**: `server/api/src/controllers/team.controller.js`

Added new controller function `resetMemberPassword`:
- **Route**: `POST /api/team/:userId/reset-password`
- **Access**: Owner only
- **Functionality**: 
  - Generates a new temporary password (12 characters)
  - Updates the user's password hash
  - Returns the new temporary password to the owner
  - Validates that the target user belongs to the same company

#### 2. Updated Routes
**File**: `server/api/src/routes/team.routes.js`

Added new route:
```javascript
router.post("/:userId/reset-password", requireRole(['OWNER']), resetMemberPassword);
```

### Frontend Changes

#### 1. Enhanced Team Page
**File**: `frontend/src/pages/TeamPage.jsx`

**New Features:**
- **Password Reset Button**: Added to the action menu (⋮) for each team member
  - Only visible to owners
  - Generates and displays new temporary password
  
- **Password Modal**: New modal dialog that appears after password reset
  - Shows member name
  - Displays temporary password (with show/hide toggle)
  - Copy to clipboard functionality
  - Visual warnings about password security
  
- **Password Management Info Box**: Added informational section
  - Explains password management capabilities to owners
  - Appears in the Role Permissions card
  - Only visible to owners

**New State Variables:**
- `passwordModal`: Stores password reset information
- `showPassword`: Toggle for password visibility
- `resettingPassword`: Loading state for reset operation

**New Functions:**
- `handleResetPassword`: Calls API to reset password
- `copyPassword`: Copies password to clipboard
- `isOwner`: Helper to check if current user is owner

**UI Updates:**
- Updated action menu to conditionally show options based on role
- Added password visibility toggle (eye icon)
- Added copy button for quick clipboard access
- Added security warnings in the modal

#### 2. Team Invite Page
**File**: `frontend/src/pages/TeamInvitePage.jsx`

No changes needed - already shows temporary password when inviting new members.

## User Experience Flow

### For Owners:

1. **Viewing Team Members**
   - Navigate to Team page
   - See all team members with their roles
   - Notice the password management info box

2. **Resetting a Password**
   - Click the menu (⋮) next to any team member
   - Click "Reset Password"
   - View the new temporary password in a modal
   - Copy password or toggle visibility
   - Share password securely with team member

3. **Inviting New Members**
   - Click "Invite Member"
   - Fill in details and select role
   - Receive temporary password in credentials modal
   - Copy and share with new team member

### For Team Members:
- Cannot see password management options
- Cannot reset passwords
- Can only view team members (if admin) or their own profile

## Security Considerations

1. **Access Control**: Only owners can reset passwords (enforced by `requireRole` middleware)
2. **Temporary Passwords**: All generated passwords are temporary and should be changed on first login
3. **Visual Warnings**: UI includes warnings to handle passwords securely
4. **Single Display**: Passwords are only shown once after generation
5. **Company Isolation**: Users can only reset passwords for members in their own company

## Testing Checklist

- [ ] Owner can reset password for any team member
- [ ] Password reset modal displays correctly
- [ ] Copy to clipboard works
- [ ] Show/hide password toggle works
- [ ] Non-owners cannot see password reset option
- [ ] Password reset fails for users from different companies
- [ ] Backend validation prevents unauthorized access
- [ ] Password is successfully updated in database
- [ ] Team member can log in with new password

## Future Enhancements

1. **Email Notifications**: Send password reset email to team member
2. **Password Expiry**: Force password change on first login
3. **Password History**: Prevent reuse of recent passwords
4. **Activity Log**: Track password resets for audit purposes
5. **Self-Service Reset**: Allow users to reset their own password via email
6. **Password Complexity**: Add requirements for stronger passwords
7. **2FA Integration**: Add two-factor authentication option

## API Reference

### Reset Password Endpoint

```
POST /api/team/:userId/reset-password
```

**Authentication**: Required (Bearer token)
**Authorization**: OWNER role required

**Path Parameters:**
- `userId` (string): The ID of the user whose password to reset

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "tempPassword": "abc123xyz789"
}
```

**Error Responses:**
- `400`: User must belong to a company
- `404`: Team member not found
- `401`: Unauthorized (not owner)
- `403`: Forbidden (wrong company)
