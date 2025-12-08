import { NextRequest, NextResponse } from 'next/server';
import { Skill, Connection, CapsScoreResult, WillingnessLevel, SkillCategory, ConnectionSector, ScoringConfig, RelationshipStrength } from '@/types';

// Default config used if Firestore config unavailable
const DEFAULT_WEIGHTS = { directSkill: 3, connection: 2, hobbySkill: 1 };
const DEFAULT_WILLINGNESS: Record<WillingnessLevel, number> = { pro_bono: 3, sponsor: 2.5, discount: 1.5, advice: 1, vendor: 0.75 };
const DEFAULT_RELATIONSHIP: Record<RelationshipStrength, number> = { decision_maker: 1.5, strong_contact: 1.2, acquaintance: 1 };
const DEFAULT_THRESHOLDS = { tier5: 0.8, tier4: 0.6, tier3: 0.4, tier2: 0.2 };

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'caps-collective';

// Helper to parse Firestore REST API response
function parseFirestoreValue(value: any): any {
  if (!value) return null;
  if (value.stringValue) return value.stringValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.integerValue) return parseInt(value.integerValue);
  if (value.doubleValue) return value.doubleValue;
  if (value.timestampValue) return new Date(value.timestampValue);
  if (value.arrayValue) return value.arrayValue.values?.map(parseFirestoreValue) || [];
  if (value.mapValue) {
    const obj: any = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) {
      obj[k] = parseFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

// Fetch active scoring configuration from Firestore REST API
async function getScoringConfig(token: string) {
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/scoring_config`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      const doc = data.documents[0];
      const fields = doc.fields || {};
      return {
        weights: parseFirestoreValue(fields.weights),
        willingnessMultipliers: parseFirestoreValue(fields.willingnessMultipliers),
        relationshipMultipliers: parseFirestoreValue(fields.relationshipMultipliers),
        strengthMeterThresholds: parseFirestoreValue(fields.strengthMeterThresholds),
      } as ScoringConfig;
    }
  } catch (e) {
    console.log('Using default scoring config');
  }
  return null;
}

// Convert raw score to 1-5 strength meter using dynamic thresholds
function scoreToStrengthMeter(score: number, maxScore: number, thresholds = DEFAULT_THRESHOLDS): number {
  if (maxScore === 0) return 1;
  const normalized = score / maxScore;
  if (normalized >= thresholds.tier5) return 5;
  if (normalized >= thresholds.tier4) return 4;
  if (normalized >= thresholds.tier3) return 3;
  if (normalized >= thresholds.tier2) return 2;
  return 1;
}

interface ScoreRequest {
  skillCategories?: SkillCategory[];
  skillNames?: string[];
  sectors?: ConnectionSector[];
  organizationNames?: string[];
  limit?: number;
}

export async function POST(request: NextRequest) {
  // POST endpoint not currently used - use GET with category parameter instead
  return NextResponse.json(
    { success: false, error: 'POST endpoint not implemented' },
    { status: 501 }
  );
}

// GET endpoint for fetching top matches for a specific need
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const needId = searchParams.get('needId');
  const category = searchParams.get('category') as SkillCategory | null;
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  if (!needId && !category) {
    return NextResponse.json(
      { success: false, error: 'needId or category required' },
      { status: 400 }
    );
  }

  try {
    // Get dynamic scoring config (falls back to spec defaults if not found)
    const config = await getScoringConfig(token || '');
    const WEIGHTS = config?.weights || DEFAULT_WEIGHTS;
    const WILLINGNESS = config?.willingnessMultipliers || DEFAULT_WILLINGNESS;
    const RELATIONSHIP = config?.relationshipMultipliers || DEFAULT_RELATIONSHIP;
    const THRESHOLDS = config?.strengthMeterThresholds || DEFAULT_THRESHOLDS;

    let searchCategory = category;

    if (needId) {
      const needResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/needs/${needId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const needData = await needResponse.json();
      if (!needData.fields) {
        return NextResponse.json({ success: false, error: 'Need not found' }, { status: 404 });
      }
      searchCategory = parseFirestoreValue(needData.fields.category) as SkillCategory;
    }

    // Fetch skills matching the category using REST API
    const skillsResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/skills`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const skillsData = await skillsResponse.json();
    const matchingSkills = (skillsData.documents || [])
      .filter((doc: any) => parseFirestoreValue(doc.fields?.category) === searchCategory)
      .map((doc: any) => ({
        id: doc.name.split('/').pop(),
        userId: parseFirestoreValue(doc.fields?.userId),
        skillName: parseFirestoreValue(doc.fields?.skillName),
        category: parseFirestoreValue(doc.fields?.category),
        willingnessLevel: parseFirestoreValue(doc.fields?.willingnessLevel),
        isHobby: parseFirestoreValue(doc.fields?.isHobby),
      } as Skill));

    // Group by user and calculate scores
    const userScores = new Map<string, {
      score: number;
      directSkillMatches: number;
      hobbySkillMatches: number;
      connectionMatches: number;
    }>();

    // 1) Skill-based scoring (Direct vs Hobby) – matches spec weights & multipliers
    for (const skill of matchingSkills) {
      const multiplier = WILLINGNESS[skill.willingnessLevel as WillingnessLevel] || 1;
      const base = skill.isHobby ? WEIGHTS.hobbySkill : WEIGHTS.directSkill; // 1 vs 3
      const points = base * multiplier; // apply Pro Bono/Sponsor/Discount/Advice

      const current =
        userScores.get(skill.userId) ||
        { score: 0, directSkillMatches: 0, hobbySkillMatches: 0, connectionMatches: 0 };

      current.score += points;
      if (skill.isHobby) current.hobbySkillMatches++;
      else current.directSkillMatches++;

      userScores.set(skill.userId, current);
    }

    // 2) Connection-based scoring – social capital layer (only for users already in the pool)
    // Each qualifying connection contributes: WEIGHTS.connection (2) * relationshipMultiplier
    if (userScores.size > 0) {
      const connectionsResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/connections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const connectionsData = await connectionsResponse.json();

      const connections: Connection[] = (connectionsData.documents || []).map((doc: any) => ({
        id: doc.name.split('/').pop(),
        userId: parseFirestoreValue(doc.fields?.userId),
        sector: parseFirestoreValue(doc.fields?.sector) as ConnectionSector,
        organizationName: parseFirestoreValue(doc.fields?.organizationName),
        relationshipStrength: parseFirestoreValue(doc.fields?.relationshipStrength) as RelationshipStrength,
        contactName: parseFirestoreValue(doc.fields?.contactName),
        createdAt: parseFirestoreValue(doc.fields?.createdAt),
      }));

      for (const connection of connections) {
        // Only boost users who already have relevant skills for this need
        const current = userScores.get(connection.userId);
        if (!current) continue;

        const relMultiplier =
          RELATIONSHIP[connection.relationshipStrength as RelationshipStrength] || 1;
        const points = WEIGHTS.connection * relMultiplier; // base 2 * relationship strength

        current.score += points;
        current.connectionMatches += 1;
      }
    }

    // Get user details and build results
    const results: CapsScoreResult[] = [];
    let maxScore = 0;

    for (const [userId, scoreData] of userScores) {
      const userResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const userData = await userResponse.json();
      const userFields = userData.fields || {};
      if (scoreData.score > maxScore) maxScore = scoreData.score;
      results.push({
        userId,
        userEmail: parseFirestoreValue(userFields.email) || '',
        userName: parseFirestoreValue(userFields.displayName),
        userPhoneNumber: parseFirestoreValue(userFields.phoneNumber),
        userBio: parseFirestoreValue(userFields.bio),
        userProfilePhoto: parseFirestoreValue(userFields.profilePhoto),
        score: scoreData.score,
        strengthMeter: 0,
          matchDetails: {
            directSkillMatches: scoreData.directSkillMatches,
            connectionMatches: scoreData.connectionMatches,
            hobbySkillMatches: scoreData.hobbySkillMatches,
          },
      });
    }

    const sortedResults = results
      .map(r => ({ ...r, strengthMeter: scoreToStrengthMeter(r.score, maxScore, THRESHOLDS) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return NextResponse.json({ success: true, data: sortedResults, metadata: { category: searchCategory, needId } });
  } catch (error) {
    console.error('Caps Score GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

