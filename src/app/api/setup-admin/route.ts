import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ success: false, error: 'Email required' }, { status: 400 });
    }

    try {
        const projectId = 'caps-collective';

        // First, query to find user by email using Firestore REST API
        const queryResponse = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?pageSize=100`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!queryResponse.ok) {
            console.error('Failed to query users:', queryResponse.statusText);
            return NextResponse.json({ success: false, error: 'Failed to query users' }, { status: 500 });
        }

        const queryData = await queryResponse.json();
        const documents = queryData.documents || [];

        // Find user with matching email
        const userDoc = documents.find((doc: any) => {
            const emailField = doc.fields?.email?.stringValue;
            return emailField === email;
        });

        if (!userDoc) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        // Extract user ID from document name
        const userId = userDoc.name.split('/').pop();

        // Update user to set isAdmin to true
        const updateResponse = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
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
            return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `User ${email} is now an admin` });
    } catch (error) {
        console.error('Error upgrading user:', error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
