# Category System Migration Guide

## Overview
The Caps Collective skill categories have been updated to better align with the needs of the Vancouver Whitecaps FC soccer community (1,000+ families). This guide explains the changes and how to migrate existing data.

## What Changed

### New Categories Added (Soccer Community-Focused)
1. **Sports & Coaching** ⚽
   - Soccer Coaching, Referee/Officiating, Athletic Training, Sports Medicine, Fitness Training, Team Management, Sports Psychology

2. **Youth Development** 🌱
   - Mentoring, Leadership Training, Character Development, Life Skills, Academic Support, Career Guidance, Conflict Resolution

3. **Event Planning** 🎉
   - Tournament Organization, Game Day Operations, Fundraising Events, Team Parties, Award Ceremonies, Travel Coordination, Venue Management

4. **Facilities & Equipment** 🏟️
   - Field Maintenance, Equipment Management, Facility Setup, Safety Inspections, Groundskeeping, Equipment Repair, Inventory Management

### Category Order Updated
Categories are now ordered by relevance to the soccer community:
1. Sports & Coaching (NEW - most relevant)
2. Youth Development (NEW)
3. Event Planning (NEW - extracted from Arts & Entertainment)
4. Facilities & Equipment (NEW)
5. Education
6. Healthcare
7. Technology
8. Media
9. Marketing
10. Finance
11. Legal
12. Trades
13. Real Estate
14. Consulting
15. Arts & Entertainment
16. Non-Profit
17. Government
18. Other

## Migration Required

### Existing Needs to Update

Based on the screenshot provided, the following need requires recategorization:

**"Soccer Coach Needed"**
- Current Category: `Technology` ❌
- Correct Category: `Sports & Coaching` ✅
- Description: "We need an experienced soccer coach to train our youth team for the upcoming tournament. Looking for someone with at least 5 years of coaching experience."

### How to Update Existing Needs

#### Option 1: Via Admin Panel (Recommended)
1. Log in as an admin
2. Navigate to Admin Panel → Needs tab
3. Find the miscategorized need
4. Click "Edit" button
5. Select the correct category from the dropdown
6. Click "Save Changes"

#### Option 2: Via Firebase Console (Direct Database Update)
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select project: `caps-collective`
3. Navigate to Firestore Database
4. Find the `needs` collection
5. Locate the document for "Soccer Coach Needed"
6. Update the `category` field from `"Technology"` to `"Sports & Coaching"`
7. Save the document

#### Option 3: Via API (Bulk Update Script)
If you have multiple needs to update, you can use the API:

```javascript
// Example: Update a need's category
const updateNeedCategory = async (needId, newCategory) => {
  const token = await user.getIdToken();
  const response = await fetch(`/api/needs/${needId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ category: newCategory })
  });
  return response.json();
};

// Usage
await updateNeedCategory('need-id-here', 'Sports & Coaching');
```

## Review All Existing Needs

After this migration, it's recommended to review ALL existing needs in the database to ensure they are properly categorized with the new system. Common migrations might include:

- **Event-related needs** → Move from "Arts & Entertainment" to "Event Planning"
- **Coaching/Training needs** → Move to "Sports & Coaching"
- **Mentoring needs** → Move to "Youth Development"
- **Field/Equipment needs** → Move to "Facilities & Equipment"

## Impact on Users

### Skills
Users who previously added skills will need to be aware that:
- The category dropdown now shows soccer-relevant categories first
- They can add new skills in the new categories
- Existing skills remain unchanged and valid

### Connections
No changes to connection sectors - "Sports & Recreation" already existed in the connection sectors.

### CAPS Score Matching
The CAPS score algorithm will now match needs in the new categories with:
- Direct skills in those categories
- Connections in related sectors (e.g., "Sports & Recreation")
- Hobby skills that align with the categories

## Testing Checklist

After migration, verify:
- [ ] All needs display with correct category icons
- [ ] Category filtering works on the Needs Board
- [ ] Admin panel shows updated categories in dropdowns
- [ ] Creating new needs shows all categories
- [ ] CAPS score matching works with new categories
- [ ] Onboarding flow shows updated categories
- [ ] Category statistics display correctly

## Questions?

If you encounter any issues during migration, please contact the development team or refer to the main documentation.

---

**Last Updated:** December 8, 2024
**Version:** 1.0

