import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get authorization token (optional for testing)
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    // For testing purposes, allow without token
    // In production, this should require admin authentication
    if (!token) {
      console.warn('set-admin called without token - using unauthenticated request');
    }

    const projectId = 'caps-collective';

    // Update user document using Firestore REST API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const updateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          fields: {
            isAdmin: {
              booleanValue: true,
            },
          },
        }),
      }
    );

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update user:', errorText);
      throw new Error(`Failed to update user: ${updateResponse.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: 'User set as admin successfully',
    });
  } catch (error) {
    console.error('Error setting admin:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

