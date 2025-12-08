import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sendFirebaseInvitation } from '@/lib/firebaseInvitations';
import { EmailInvitation, InvitationWithDetails } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// GET - List all invitations (admin only)
export async function GET(request: NextRequest) {
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

        // Fetch all invitations
        const invitationsSnapshot = await adminDb.collection('invitations').get();

        const invitations: InvitationWithDetails[] = await Promise.all(
            invitationsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const inviterId = data.invitedBy;

                // Fetch inviter details
                let inviterEmail = '';
                let inviterName = '';
                if (inviterId) {
                    try {
                        const inviterDoc = await adminDb.collection('users').doc(inviterId).get();
                        if (inviterDoc.exists) {
                            const inviterData = inviterDoc.data();
                            inviterEmail = inviterData?.email || '';
                            inviterName = inviterData?.displayName || inviterEmail;
                        }
                    } catch (e) {
                        console.error('Error fetching inviter:', e);
                    }
                }

                return {
                    id: doc.id,
                    email: data.email || '',
                    invitedBy: inviterId || '',
                    status: data.status || 'pending',
                    createdAt: data.createdAt?.toDate() || new Date(),
                    expiresAt: data.expiresAt?.toDate() || new Date(),
                    inviterEmail,
                    inviterName,
                    acceptedAt: data.acceptedAt?.toDate(),
                    acceptedByName: data.acceptedByName,
                } as InvitationWithDetails;
            })
        );

        // Sort by creation date descending
        invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json({
            success: true,
            data: { invitations },
        });
    } catch (error) {
        console.error('Get Invitations Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invitations' },
            { status: 500 }
        );
    }
}

// POST - Create new invitation (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

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

        // Check if user already exists
        const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!usersSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: 'User with this email already exists' },
                { status: 400 }
            );
        }

        // Check if pending invitation already exists
        const invitationsSnapshot = await adminDb.collection('invitations')
            .where('email', '==', email)
            .where('status', '==', 'pending')
            .limit(1)
            .get();

        if (!invitationsSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: 'Pending invitation already exists for this email' },
                { status: 400 }
            );
        }

        // Create invitation
        const invitationToken = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Generate invitation link
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const invitationLink = `${baseUrl}/register?invitation=${invitationToken}`;

        const invitationRef = await adminDb.collection('invitations').add({
            email,
            invitedBy: userId,
            status: 'pending',
            token: invitationToken,
            createdAt: now,
            expiresAt,
        });

        const invitationId = invitationRef.id;

        // Send email via Nodemailer
        let emailSent = false;
        let emailError = null;

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });

            await transporter.sendMail({
                from: process.env.SMTP_FROM || '"Caps Collective" <noreply@capscollective.com>',
                to: email,
                subject: "You're Invited to Join Caps Collective! 🎓",
                html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Join Caps Collective</title>
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                        <tr>
                            <td align="center">
                                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                    <tr>
                                        <td style="background: linear-gradient(135deg, #00245D 0%, #99D6EA 100%); padding: 40px 30px; text-align: center;">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Caps Collective</h1>
                                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Community Connection Platform</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 40px 30px;">
                                            <h2 style="margin: 0 0 20px 0; color: #00245D; font-size: 24px; font-weight: 600;">You're Invited! 🎉</h2>
                                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">Hello!</p>
                                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                                You've been invited to join <strong>Caps Collective</strong>, a platform designed to connect community members, share skills, and collaborate on meaningful projects.
                                            </p>
                                            <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                                Click the button below to create your account and get started:
                                            </p>
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="center" style="padding: 20px 0;">
                                                        <a href="${invitationLink}" style="display: inline-block; background-color: #00245D; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 36, 93, 0.3);">
                                                            Accept Invitation
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                            <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                Or copy and paste this link into your browser:
                                            </p>
                                            <p style="margin: 10px 0 0 0; color: #99D6EA; font-size: 14px; word-break: break-all;">
                                                ${invitationLink}
                                            </p>
                                            <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                This invitation will expire in 7 days.
                                            </p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                            <p style="margin: 0; color: #666666; font-size: 14px;">
                                                © ${new Date().getFullYear()} Caps Collective. All rights reserved.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                `
            });
            emailSent = true;
            console.log('Invitation email sent via Nodemailer to:', email);
        } catch (e: any) {
            console.error('Failed to send invitation email:', e);
            emailError = e.message || 'Failed to send email';
        }

        return NextResponse.json({
            success: true,
            data: {
                id: invitationId,
                invitationLink,
                email,
                expiresAt,
                emailSent,
                emailError,
            },
        });
    } catch (error) {
        console.error('Create Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create invitation' },
            { status: 500 }
        );
    }
};

// PATCH - Update invitation status (resend, revoke)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { invitationId, action } = body;

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

        const now = new Date();
        let updateFields: any = {
            updatedAt: now,
        };

        if (action === 'revoke') {
            updateFields.status = 'expired';
        } else if (action === 'resend') {
            const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            updateFields.expiresAt = expiresAt;
        }

        await adminDb.collection('invitations').doc(invitationId).update(updateFields);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update invitation' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a single invitation (admin only)
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

        const searchParams = request.nextUrl.searchParams;
        const invitationId = searchParams.get('invitationId');

        if (!invitationId) {
            return NextResponse.json(
                { success: false, error: 'Invitation ID required' },
                { status: 400 }
            );
        }

        await adminDb.collection('invitations').doc(invitationId).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete invitation' },
            { status: 500 }
        );
    }
}
