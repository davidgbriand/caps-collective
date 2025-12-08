import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const { token, userId } = await request.json();
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.replace('Bearer ', '');
    if (!bearer) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = 'caps-collective';
    const now = new Date();
    const updateResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitations/${token}`,
        {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${bearer}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: {
                    status: { stringValue: 'accepted' },
                    acceptedAt: { timestampValue: now.toISOString() },
                    acceptedByName: { stringValue: userId },
                },
            }),
        }
    );

    if (!updateResponse.ok) {
        const err = await updateResponse.text();
        console.error('Accept invitation error', err);
        return NextResponse.json({ success: false, error: 'Failed to accept invitation' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
}
