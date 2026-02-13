// Script to create the first admin user using Firebase Admin SDK
// Run with: node scripts/setup-first-admin.ts

const firebaseAdmin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'caps-collective-firebase-adminsdk-fbsvc-538699c71d.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!firebaseAdmin.apps.length) {
    firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
        projectId: 'caps-collective',
    });
}

const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();

async function setupFirstAdmin() {
    const email = 'admin@capscollective.com';
    const password = 'Test@123';

    try {
        // Check if user already exists in Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('User already exists in Firebase Auth:', userRecord.uid);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create the user
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    emailVerified: true,
                });
                console.log('Created new user in Firebase Auth:', userRecord.uid);
            } else {
                throw error;
            }
        }

        // Check if user document exists in Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (userDoc.exists) {
            // Update existing user to be primary admin
            await db.collection('users').doc(userRecord.uid).update({
                isAdmin: true,
                isPrimaryAdmin: true,
                updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('Updated existing user to be primary admin');
        } else {
            // Create user document
            await db.collection('users').doc(userRecord.uid).set({
                email: email,
                displayName: 'Admin',
                isAdmin: true,
                isPrimaryAdmin: true,
                onboardingComplete: true,
                createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('Created user document as primary admin');
        }

        console.log('\n✅ Admin setup complete!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('UID:', userRecord.uid);

    } catch (error) {
        console.error('Error setting up admin:', error);
        process.exit(1);
    }

    process.exit(0);
}

setupFirstAdmin();

export { };
