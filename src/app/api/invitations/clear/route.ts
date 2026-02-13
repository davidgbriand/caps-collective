import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// DELETE - Clear all invitation history (admin only)
export async function DELETE(request: NextRequest) {
    try {
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
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Get all invitations
        const invitationsSnapshot = await adminDb.collection('invitations').get();

        // Delete all invitations
        const deletePromises = invitationsSnapshot.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);

        return NextResponse.json({
            success: true,
            message: `Cleared ${invitationsSnapshot.size} invitations`,
        });
    } catch (error) {
        console.error('Clear Invitations Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to clear invitations' },
            { status: 500 }
        );
    }
}
