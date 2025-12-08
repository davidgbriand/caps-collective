# Caps Collective - Feature Flow Documentation

## 1. User Authentication Flow

### Login Process
1. Navigate to `http://localhost:3000/login`
2. Enter email address (e.g., shujah@gmail.com)
3. Enter password (e.g., Test@123)
4. Click "Sign in" button
5. System validates credentials
6. User is redirected to `/dashboard` (regular users) or `/admin` (admin users)
7. Session is established and persists across navigation

### Logout Process
1. Click user profile button (top right with initials)
2. Click "🚪 Sign out" button
3. User is redirected to `/login`
4. Session is cleared

## 2. Regular User Dashboard Flow

### Dashboard Overview
1. After login, user sees welcome message with their name
2. Dashboard displays three key metrics:
   - ⚽ Skills (count)
   - 🤝 Connections (count)
   - 📋 Active Needs (count)
3. Three sections below:
   - Your Skills: Lists user's skills with willingness level
   - Connections: Lists user's connections with sector
   - Active Needs: Shows community needs user can help with

### Manage Skills
1. Click "Manage Skills →" link
2. Redirects to `/onboarding/skills` (currently redirects to admin)
3. Should allow adding/editing skills with category and willingness level

### Manage Connections
1. Click "Manage Connections →" link
2. Redirects to `/onboarding/connections` (currently redirects to admin)
3. Should allow adding/editing connections with sector and relationship strength

## 3. Needs Board Flow

### View Needs Board
1. Click "📋Needs Board" in navigation
2. Navigate to `/needs`
3. Page displays:
   - Category filter buttons (All, Sports & Coaching, etc.)
   - List of all active needs with descriptions
   - "View matches" link for each need

### Filter by Category
1. Click category button (e.g., "⚽ Sports & Coaching")
2. List updates to show only needs in that category
3. Count updates to show filtered results

### View Need Details
1. Click on a need card
2. Navigate to `/needs/{needId}`
3. Display shows:
   - Need title and category
   - Full description
   - Status (Active/Closed)
   - "🏆 Top Matches" section with matching users
   - "Back to Needs" button

## 4. Search Flow

### Search for Users
1. Click "🔍Search" in navigation
2. Navigate to `/search`
3. Enter search term (e.g., "soccer")
4. Click "Search" button
5. Results display matching users with:
   - User name and avatar
   - Skills and connections
   - Relationship strength indicator
6. Click on user card to view full profile

### User Profile View
1. Click on search result or user card
2. Navigate to `/users/{userId}`
3. Display shows:
   - User name and email
   - Skills count and list
   - Connections count and list
   - Relationship strength for each connection
4. Click "Back" to return to search

## 5. Admin Dashboard Flow

### Access Admin Panel
1. Login as admin user (Luqman.haider01@gmail.com)
2. Automatically redirected to `/admin`
3. Dashboard shows six management sections

### Analytics Tab
1. Click "📊 Analytics" button
2. Displays community statistics:
   - Total users
   - Total needs
   - Total skills
   - Total connections

### Invitations Tab
1. Click "📧 Invitations" button
2. Shows invitation creation form
3. Enter email address
4. Click "Send Invitation"
5. System generates invitation link
6. Link can be shared with invitee
7. Invitation history shows sent invitations

### Users Tab
1. Click "👥 Users" button
2. Displays table of all users with:
   - Email address
   - User status
   - Join date
   - Action buttons

### Needs Tab
1. Click "📋 Needs" button
2. Shows two sections:
   - **Create New Need**: Form with title, category, description
   - **Manage Needs**: List of all created needs with actions
3. To create need:
   - Enter title
   - Select category from dropdown
   - Enter description
   - Click "Create Need"
4. Need appears in Manage Needs section
5. Can view matches, edit, or delete need

### AI Scoring Tab
1. Click "🤖 AI Scoring" button
2. Displays scoring algorithm configuration:
   - Base weights (directSkill, connection, hobbySkill)
   - Willingness multipliers (pro bono, sponsor, discount, advice, vendor)
   - Relationship multipliers (decision maker, strong contact, acquaintance)
3. Shows "Run AI Analysis" button for optimization

### Settings Tab
1. Click "⚙️ Settings" button
2. Displays:
   - Change Password form
   - Admin Profile information
   - Platform statistics

## 6. Profile Management Flow

### View Own Profile
1. Click user profile button (top right)
2. Click "👤 Profile Settings"
3. Navigate to `/profile`
4. Display shows:
   - User information (email, display name)
   - Skills section with edit link
   - Connections section with edit link

### Edit Profile Information
1. On profile page, modify "Display Name" field
2. Click "Save Changes" button
3. Changes are saved

### Edit Skills
1. Click "Edit" link in Skills section
2. Should navigate to `/onboarding/skills` (currently broken)
3. Should allow adding/removing skills

### Edit Connections
1. Click "Edit" link in Connections section
2. Should navigate to `/onboarding/connections` (currently broken)
3. Should allow adding/removing connections

## 7. Notification System Flow

### View Notifications
1. Click bell icon (🔔) in top navigation
2. Should display notification list
3. **Current Status**: Shows "No notifications yet" (API returning 500 error)

## Key Routes Summary
- `/login` - Login page
- `/dashboard` - Regular user dashboard
- `/admin` - Admin dashboard
- `/needs` - Needs board
- `/needs/{id}` - Need details
- `/search` - Search users
- `/users/{id}` - User profile
- `/profile` - Own profile
- `/onboarding/skills` - Edit skills (broken)
- `/onboarding/connections` - Edit connections (broken)

