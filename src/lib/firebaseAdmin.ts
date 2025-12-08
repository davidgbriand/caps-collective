import admin from 'firebase-admin';

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
    // Use Application Default Credentials or provide service account JSON via env var
    // Ensure GOOGLE_APPLICATION_CREDENTIALS env var points to the service account key file
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

export const adminAuth = admin.auth();
