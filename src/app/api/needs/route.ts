import { NextRequest, NextResponse } from 'next/server';
import { Need, SkillCategory, SKILL_CATEGORIES } from '@/types';

// GET all needs or by category
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') as SkillCategory | null;
  const activeOnly = searchParams.get('active') !== 'false';

  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = 'caps-collective';

    // Get all needs using Firestore REST API
    const needsResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/needs`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!needsResponse.ok) {
      throw new Error(`Failed to fetch needs: ${needsResponse.statusText}`);
    }

    const needsData = await needsResponse.json();
    let needs = (needsData.documents || []).map((doc: any) => {
      const fields = doc.fields;
      return {
        id: doc.name.split('/').pop(),
        title: fields.title?.stringValue || '',
        description: fields.description?.stringValue || '',
        category: fields.category?.stringValue || '',
        createdBy: fields.createdBy?.stringValue || '',
        isActive: fields.isActive?.booleanValue !== false,
        createdAt: fields.createdAt?.timestampValue ? new Date(fields.createdAt.timestampValue) : new Date(),
        updatedAt: fields.updatedAt?.timestampValue ? new Date(fields.updatedAt.timestampValue) : new Date(),
      } as Need;
    });

    // Filter by active status
    if (activeOnly) {
      needs = needs.filter((n: Need) => n.isActive);
    }

    // Filter by category if provided
    if (category) {
      needs = needs.filter((n: Need) => n.category === category);
    }

    // Sort by createdAt descending
    needs.sort((a: Need, b: Need) => b.createdAt.getTime() - a.createdAt.getTime());

    // Group by category with counts
    const categoryStats = SKILL_CATEGORIES.map(cat => ({
      category: cat,
      count: needs.filter((n: Need) => n.category === cat).length,
    })).filter(c => c.count > 0);

    return NextResponse.json({
      success: true,
      data: { needs, categoryStats },
    });
  } catch (error) {
    console.error('Get Needs Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch needs' },
      { status: 500 }
    );
  }
}

// POST - Create new need (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, userId } = body;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = 'caps-collective';

    // Verify admin status by fetching user document
    const userResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = await userResponse.json();
    const isAdmin = userData.fields?.isAdmin?.booleanValue || false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Create the need using Firestore REST API
    const now = new Date().toISOString();
    const createResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/needs`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            title: { stringValue: title },
            description: { stringValue: description },
            category: { stringValue: category },
            createdBy: { stringValue: userId },
            isActive: { booleanValue: true },
            createdAt: { timestampValue: now },
            updatedAt: { timestampValue: now },
          },
        }),
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Firestore API Error:', errorData);
      throw new Error('Failed to create need');
    }

    const createdNeed = await createResponse.json();
    const needId = createdNeed.name.split('/').pop();

    return NextResponse.json({
      success: true,
      data: { id: needId },
    });
  } catch (error) {
    console.error('Create Need Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create need' },
      { status: 500 }
    );
  }
}

// PATCH - Update need (status, title, description, category)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { needId, userId, isActive, title, description, category } = body;

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = 'caps-collective';

    // Verify admin status by fetching user document
    const userResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = await userResponse.json();
    const userIsAdmin = userData.fields?.isAdmin?.booleanValue || false;

    if (!userIsAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Build update fields dynamically
    const now = new Date().toISOString();
    const fields: any = {
      updatedAt: { timestampValue: now },
    };

    if (typeof isActive === 'boolean') {
      fields.isActive = { booleanValue: isActive };
    }
    if (title !== undefined) {
      fields.title = { stringValue: title };
    }
    if (description !== undefined) {
      fields.description = { stringValue: description };
    }
    if (category !== undefined) {
      fields.category = { stringValue: category };
    }

    // Update the need using Firestore REST API
    const updateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/needs/${needId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Firestore API Error:', errorData);
      throw new Error('Failed to update need');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Need Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update need' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a need (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const needId = searchParams.get('needId');

    if (!needId) {
      return NextResponse.json(
        { success: false, error: 'needId is required' },
        { status: 400 }
      );
    }

    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = 'caps-collective';

    // Verify user is admin by decoding token
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const userId = tokenPayload.user_id;

    // Verify admin status by fetching user document
    const userResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = await userResponse.json();
    const isAdmin = userData.fields?.isAdmin?.booleanValue || false;

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Delete the need using Firestore REST API
    const deleteResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/needs/${needId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      const errorData = await deleteResponse.json();
      console.error('Firestore API Error:', errorData);
      throw new Error('Failed to delete need');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Need Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete need' },
      { status: 500 }
    );
  }
}
