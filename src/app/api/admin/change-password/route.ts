import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// POST - Change admin password
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { newPassword } = body;

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

        // Validate password
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Update password using Firebase Admin SDK
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to change password' },
            { status: 500 }
        );
    }
}
