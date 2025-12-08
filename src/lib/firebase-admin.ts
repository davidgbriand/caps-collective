// Firebase Admin SDK initialization for server-side operations
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let serviceAccount;

    // Try to read from environment variable first (for Vercel/production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('Firebase credentials loaded from environment variable');
    } else {
      // Fall back to file path (for local development)
      const serviceAccountPath = path.join(process.cwd(), 'caps-collective-firebase-adminsdk-fbsvc-538699c71d.json');
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('Firebase credentials loaded from file');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: 'caps-collective',
    });

    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }
}

// Export Firestore instance
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Helper function to verify if user is admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data()?.isAdmin === true;
    }
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Helper function to verify Firebase ID token
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

