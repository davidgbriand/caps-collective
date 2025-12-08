# Caps Collective - Technical Issues & Debugging Guide

## Critical Issues

### 1. Notifications API 500 Error
**Severity**: CRITICAL  
**Endpoint**: `GET /api/notifications`  
**Status Code**: 500 Internal Server Error  
**Frequency**: Consistent - occurs on every page load  
**Impact**: Notification system completely non-functional

#### Symptoms
- Notification bell shows "No notifications yet"
- Browser console shows repeated 500 errors
- No notifications are displayed to users
- API endpoint is being called but failing

#### Debugging Steps
1. Check server logs for `/api/notifications` endpoint
2. Verify database connection for notifications table
3. Check if notifications table exists and has proper schema
4. Verify user permissions for notifications query
5. Check for null/undefined values in notification query
6. Review recent changes to notifications API

#### Possible Causes
- Database connection issue
- Missing notifications table
- Incorrect query syntax
- Missing environment variables
- Permission issues with database user
- Null pointer exception in API handler

#### Recommended Fix
1. Add error logging to `/api/notifications` endpoint
2. Verify database schema for notifications
3. Test API endpoint directly with curl/Postman
4. Check server logs for detailed error messages
5. Add try-catch blocks with proper error handling

---

## Medium Priority Issues

### 2. Onboarding Routes Redirect
**Severity**: MEDIUM  
**Routes**: `/onboarding/skills`, `/onboarding/connections`  
**Behavior**: Redirects to `/admin` instead of showing edit forms  
**Impact**: Users cannot edit their skills and connections

#### Symptoms
- Clicking "Edit" on skills/connections redirects to admin dashboard
- No edit forms are displayed
- Users cannot modify their profile data
- Regular users get 403 Forbidden errors when accessing `/admin`

#### Debugging Steps
1. Check if onboarding routes are defined in Next.js routing
2. Verify middleware/guards for onboarding routes
3. Check authentication state when accessing routes
4. Review redirect logic in route handlers
5. Check if pages exist in `/pages/onboarding/` directory

#### Possible Causes
- Routes not implemented
- Middleware redirecting to admin
- Missing page components
- Authentication check failing
- Route guards misconfigured

#### Recommended Fix
1. Implement `/pages/onboarding/skills.tsx` page
2. Implement `/pages/onboarding/connections.tsx` page
3. Add proper authentication checks
4. Remove redirect logic if not needed
5. Test with both regular and admin users

---

### 3. CAPS Score Matching Returns 0 Results
**Severity**: MEDIUM  
**Feature**: Need matching system  
**Behavior**: Created needs show "0 matches found"  
**Impact**: Auto-matching feature not demonstrating functionality

#### Symptoms
- Admin creates a need for "Soccer Coach"
- Need details page shows "0 matches found"
- No users are matched despite having relevant skills
- Matching algorithm may not be calculating correctly

#### Debugging Steps
1. Check CAPS Score calculation algorithm
2. Verify user skills are being indexed correctly
3. Check if matching query is filtering correctly
4. Review scoring weights configuration
5. Test with users that have matching skills
6. Check database for user skills data

#### Possible Causes
- Insufficient user data with matching skills
- Scoring algorithm not implemented
- Matching query has incorrect filters
- Skills not properly categorized
- Database query returning empty results

#### Recommended Fix
1. Add test data with matching skills
2. Verify scoring algorithm implementation
3. Add logging to matching query
4. Test with known matching scenarios
5. Review scoring weights for relevance

---

## Minor Issues

### 4. Invitation History Display Lag
**Severity**: LOW  
**Feature**: Invitations management  
**Behavior**: History shows "No invitations sent yet" after creation, updates after refresh  
**Impact**: Minor UI state management issue

#### Symptoms
- Create invitation successfully
- History section still shows "No invitations sent yet"
- After page refresh, invitation appears in history
- Success message displays correctly

#### Debugging Steps
1. Check state management for invitations list
2. Verify API response after invitation creation
3. Check if component re-renders after API call
4. Review useEffect dependencies

#### Possible Causes
- State not updating after API call
- Component not re-rendering
- API response not triggering state update
- Race condition in state management

#### Recommended Fix
1. Add state update after successful invitation creation
2. Refetch invitations list after creation
3. Use proper dependency arrays in useEffect
4. Consider using React Query or SWR for data fetching

---

## Performance Observations

### Page Load Times
- Login page: Fast (~500ms)
- Dashboard: Moderate (~1-2s) - delayed by notification API errors
- Admin dashboard: Moderate (~1-2s)
- Search results: Fast (~500ms)
- Need details: Moderate (~1-2s)

### Recommendations
1. Implement loading skeletons for better UX
2. Cache frequently accessed data
3. Optimize API queries
4. Consider pagination for large lists
5. Implement lazy loading for images

---

## Console Errors Summary

### Errors Observed
```
[ERROR] Failed to load resource: the server responded with a status of 500 (Internal Server Error) @ http://localhost:3000/api/notifications:0
```

### Warnings Observed
```
[WARNING] The resource http://localhost:3000/_next/image?url=%2Fwhitecaps-logo.png&w=128&q=75 was preloaded using link preload but not used within a few seconds from the window's onload event.
```

---

## Testing Recommendations

### Unit Tests Needed
- CAPS Score calculation algorithm
- User matching logic
- Invitation creation and sending
- Need creation and validation
- Search functionality

### Integration Tests Needed
- End-to-end user flows
- Admin operations
- API endpoint testing
- Database operations
- Authentication flows

### E2E Tests Needed
- Complete user journey from login to need creation
- Admin workflow
- Search and matching workflow
- Profile management workflow

