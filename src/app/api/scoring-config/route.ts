import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';
import { ScoringConfig } from '@/types';
import OpenAI from 'openai';

const getOpenAI = () => process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

const DEFAULT_CONFIG: Omit<ScoringConfig, 'id' | 'createdAt' | 'updatedAt'> = {
  weights: { directSkill: 3, connection: 2, hobbySkill: 1 },
  willingnessMultipliers: { pro_bono: 3, sponsor: 2.5, discount: 1.5, advice: 1, vendor: 0.75 },
  relationshipMultipliers: { decision_maker: 1.5, strong_contact: 1.2, acquaintance: 1 },
  strengthMeterThresholds: { tier5: 0.8, tier4: 0.6, tier3: 0.4, tier2: 0.2 },
  isActive: true,
};

interface DataStats {
  totalUsers: number;
  totalSkills: number;
  totalConnections: number;
  totalNeeds: number;
  skillsByWillingness: Record<string, number>;
  connectionsByStrength: Record<string, number>;
  skillsByCategory: Record<string, number>;
}

async function analyzeWithAI(stats: DataStats) {
  const openai = getOpenAI();
  if (!openai) {
    return {
      config: {
        weights: { directSkill: 3.5, connection: 2.5, hobbySkill: 1.2 },
        willingnessMultipliers: { pro_bono: 3.2, sponsor: 2.6, discount: 1.6, advice: 1.1, vendor: 0.8 },
        relationshipMultipliers: { decision_maker: 1.6, strong_contact: 1.25, acquaintance: 1 },
        strengthMeterThresholds: { tier5: 0.78, tier4: 0.58, tier3: 0.38, tier2: 0.18 }
      },
      reasoning: 'Using optimized defaults (OpenAI unavailable).',
      confidence: 0.6,
    };
  }

  const prompt = `Analyze community data and recommend scoring weights. Data: Users:${stats.totalUsers}, Skills:${stats.totalSkills}, Connections:${stats.totalConnections}, Needs:${stats.totalNeeds}. Skills by willingness: ${JSON.stringify(stats.skillsByWillingness)}. Connections by strength: ${JSON.stringify(stats.connectionsByStrength)}. Respond ONLY with JSON: {"weights":{"directSkill":<1-5>,"connection":<1-5>,"hobbySkill":<0.5-2>},"willingnessMultipliers":{"pro_bono":<2-4>,"sponsor":<1.5-3>,"discount":<1-2>,"advice":<0.5-1.5>,"vendor":<0.5-1>},"relationshipMultipliers":{"decision_maker":<1.3-2>,"strong_contact":<1-1.5>,"acquaintance":<0.8-1.2>},"strengthMeterThresholds":{"tier5":<0.75-0.9>,"tier4":<0.55-0.7>,"tier3":<0.35-0.5>,"tier2":<0.15-0.3>},"reasoning":"<explanation>","confidence":<0.5-1>}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800,
    });

    const text = completion.choices[0]?.message?.content || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    return {
      config: {
        weights: parsed.weights,
        willingnessMultipliers: parsed.willingnessMultipliers,
        relationshipMultipliers: parsed.relationshipMultipliers,
        strengthMeterThresholds: parsed.strengthMeterThresholds
      },
      reasoning: parsed.reasoning || 'AI analysis complete.',
      confidence: parsed.confidence || 0.75,
    };
  } catch (e) {
    console.error('AI Error:', e);
    return {
      config: DEFAULT_CONFIG,
      reasoning: 'Fallback to defaults due to AI error.',
      confidence: 0.5
    };
  }
}

// GET - Fetch current scoring configuration
export async function GET(request: NextRequest) {
  try {
    // Get the most recent active config
    const configsSnapshot = await adminDb
      .collection('scoring_config')
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (configsSnapshot.empty) {
      // Return default config
      return NextResponse.json({
        success: true,
        data: {
          ...DEFAULT_CONFIG,
          id: 'default',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        isDefault: true
      });
    }

    const configDoc = configsSnapshot.docs[0];
    const configData = configDoc.data();

    return NextResponse.json({
      success: true,
      data: {
        id: configDoc.id,
        ...configData,
        createdAt: configData.createdAt?.toDate() || new Date(),
        updatedAt: configData.updatedAt?.toDate() || new Date(),
        aiAnalysis: configData.aiAnalysis ? {
          ...configData.aiAnalysis,
          lastAnalyzedAt: configData.aiAnalysis.lastAnalyzedAt?.toDate() || new Date()
        } : undefined
      } as ScoringConfig,
      isDefault: false
    });
  } catch (e) {
    console.error('GET scoring-config Error:', e);
    // Return default config on error
    return NextResponse.json({
      success: true,
      data: {
        ...DEFAULT_CONFIG,
        id: 'default',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      isDefault: true
    });
  }
}

// POST - Run AI analysis and create new scoring configuration
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get user ID
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verify admin status
    const isAdmin = await isUserAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Gather statistics from Firestore
    const [usersSnapshot, skillsSnapshot, connectionsSnapshot, needsSnapshot] = await Promise.all([
      adminDb.collection('users').get(),
      adminDb.collection('skills').get(),
      adminDb.collection('connections').get(),
      adminDb.collection('needs').get(),
    ]);

    const stats: DataStats = {
      totalUsers: usersSnapshot.size,
      totalSkills: skillsSnapshot.size,
      totalConnections: connectionsSnapshot.size,
      totalNeeds: needsSnapshot.size,
      skillsByWillingness: {},
      connectionsByStrength: {},
      skillsByCategory: {},
    };

    // Analyze skills
    skillsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.willingnessLevel) {
        stats.skillsByWillingness[data.willingnessLevel] = (stats.skillsByWillingness[data.willingnessLevel] || 0) + 1;
      }
      if (data.category) {
        stats.skillsByCategory[data.category] = (stats.skillsByCategory[data.category] || 0) + 1;
      }
    });

    // Analyze connections
    connectionsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.relationshipStrength) {
        stats.connectionsByStrength[data.relationshipStrength] = (stats.connectionsByStrength[data.relationshipStrength] || 0) + 1;
      }
    });

    // Run AI analysis
    const aiResult = await analyzeWithAI(stats);

    // Deactivate old configs
    const oldConfigsSnapshot = await adminDb
      .collection('scoring_config')
      .where('isActive', '==', true)
      .get();

    const deactivatePromises = oldConfigsSnapshot.docs.map(doc =>
      adminDb.collection('scoring_config').doc(doc.id).update({ isActive: false })
    );
    await Promise.all(deactivatePromises);

    // Create new config
    const now = new Date();
    const newConfigRef = adminDb.collection('scoring_config').doc();

    const newConfig: ScoringConfig = {
      id: newConfigRef.id,
      ...aiResult.config,
      aiAnalysis: {
        reasoning: aiResult.reasoning,
        confidence: aiResult.confidence,
        dataPointsAnalyzed: stats.totalUsers + stats.totalSkills + stats.totalConnections,
        lastAnalyzedAt: now
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await newConfigRef.set(newConfig);

    return NextResponse.json({
      success: true,
      data: newConfig
    });
  } catch (e: any) {
    console.error('POST scoring-config Error:', e);
    return NextResponse.json(
      { success: false, error: e.message || 'AI analysis failed' },
      { status: 500 }
    );
  }
}

