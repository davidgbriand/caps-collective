
import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { Need, Skill } from '@/types';

// Helper interface for safe user data
interface SafeUser {
  id: string;
  displayName: string;
  profilePhoto?: string;
  matchedSkill?: string; // If found via skill search
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase().trim() || '';

  if (query.length < 2) {
    return NextResponse.json({ success: true, data: { people: [], needs: [] } });
  }

  try {
    // 1. Auth Check
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await verifyIdToken(token); // Just verify validity, no admin check needed

    // 2. Parallel Fetches (Users, Skills, Needs, Connections)
    const [usersSnap, skillsSnap, needsSnap, connectionsSnap] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('skills').get(),
      adminDb.collection('needs').where('isActive', '==', true).get(),
      adminDb.collection('connections').get()
    ]);

    // 3. Process People Results
    const peopleMap = new Map<string, SafeUser>();
    const matchedUserIds = new Set<string>();

    const userMatchReasons = new Map<string, string>(); // userId -> matchedSkillName or Category

    // Strategy: Search Skills first to find experts
    skillsSnap.docs.forEach(doc => {
      const skill = doc.data() as any;
      const skillName = skill.skillName?.toLowerCase() || '';
      const skillCategory = skill.category?.toLowerCase() || '';
      const willingness = skill.willingnessLevel?.toLowerCase().replace('_', ' ') || '';

      if (skillName.includes(query) || skillCategory.includes(query) || willingness.includes(query)) {
        // Found a skill match!
        if (skill.userId) {
          matchedUserIds.add(skill.userId);
          // Store reason if not already present, prioritize specific skill name over category
          if (!userMatchReasons.has(skill.userId) || userMatchReasons.get(skill.userId)?.startsWith('Category')) {
            if (skillName.includes(query)) {
              userMatchReasons.set(skill.userId, skill.skillName); // Exact skill match
            } else if (willingness.includes(query)) {
              userMatchReasons.set(skill.userId, `Willingness: ${skill.willingnessLevel?.replace('_', ' ')}`);
            } else if (!userMatchReasons.has(skill.userId)) {
              userMatchReasons.set(skill.userId, `Category: ${skill.category}`); // Category match
            }
          }
        }
      }
    });

    // Strategy: Search Connections
    connectionsSnap.docs.forEach(doc => {
      const connection = doc.data() as any;
      const orgName = connection.organizationName?.toLowerCase() || '';
      const sector = connection.sector?.toLowerCase() || '';
      const strength = connection.relationshipStrength?.toLowerCase().replace('_', ' ') || '';

      if (orgName.includes(query) || sector.includes(query) || strength.includes(query)) {
        if (connection.userId) {
          matchedUserIds.add(connection.userId);
          // Store/Overwrite reason. Connection match is high value.

          if (orgName.includes(query)) {
            userMatchReasons.set(connection.userId, `Connection: ${connection.organizationName}`);
          } else if (strength.includes(query)) {
            userMatchReasons.set(connection.userId, `Relationship: ${connection.relationshipStrength?.replace('_', ' ')}`);
          } else if (!userMatchReasons.has(connection.userId)) {
            userMatchReasons.set(connection.userId, `Sector: ${connection.sector}`);
          }
        }
      }
    });

    // Now iterate Users to match Name OR ID from Skill/Connection match
    usersSnap.docs.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      const displayName = userData.displayName || '';

      const nameMatch = displayName.toLowerCase().includes(query);
      const skillMatch = matchedUserIds.has(userId);

      if (nameMatch || skillMatch) {
        peopleMap.set(userId, {
          id: userId,
          displayName: displayName,
          profilePhoto: userData.profilePhoto || undefined,
          matchedSkill: skillMatch ? userMatchReasons.get(userId) : undefined
        });
      }
    });

    const people = Array.from(peopleMap.values());

    // 4. Process Needs Results
    const needs: Need[] = [];
    needsSnap.docs.forEach(doc => {
      const data = doc.data();
      const title = data.title || '';
      const description = data.description || '';
      const category = data.category || '';

      if (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query)
      ) {
        needs.push({
          id: doc.id,
          title: title,
          description: description,
          category: category,
          createdBy: data.createdBy,
          isActive: data.isActive,
          createdAt: data.createdAt?.toDate().toISOString(),
          updatedAt: data.updatedAt?.toDate().toISOString(),
        } as unknown as Need); // simplified type casting
      }
    });

    // 5. Sort Results
    // Prioritize those with matchedSkill (Reason) over just name match
    people.sort((a, b) => {
      if (a.matchedSkill && !b.matchedSkill) return -1;
      if (!a.matchedSkill && b.matchedSkill) return 1;
      return a.displayName.localeCompare(b.displayName);
    });

    return NextResponse.json({
      success: true,
      data: {
        people,
        needs
      }
    });

  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
