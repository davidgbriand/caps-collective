import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
function getFirebaseAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  // Priority 1: Try Environment Variable
  if (serviceAccountJson) {
    try {
      const serviceAccount = JSON.parse(serviceAccountJson);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'caps-collective',
      });
    } catch (parseError) {
      console.error('FIREBASE_SERVICE_ACCOUNT_JSON parsing failed, trying file fallback...');
    }
  }

  // Priority 2: Try Local File (Robust fix for local dev)
  try {
    const localKeyPath = path.join(process.cwd(), 'Caps Collective Firebase Admin SDK.json');
    if (fs.existsSync(localKeyPath)) {
      console.log('Found local Service Account file, initializing...');
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'caps-collective',
      });
    }
  } catch (fileError) {
    console.error('Failed to read local Service Account file:', fileError);
  }

  // Priority 3: Application Default Credentials
  console.log('Using Application Default Credentials (last resort)');
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'caps-collective',
  });
}

const app = getFirebaseAdminApp();

// Export services with safety checks
// If app is null, these will be undefined or throw specific errors when accessed, 
// ensuring we can at least log the error.
export const adminDb = app ? app.firestore() : {
  collection: () => { throw new Error('Firebase Admin not initialized'); }
} as unknown as admin.firestore.Firestore;

export const adminAuth = app ? app.auth() : {
  verifyIdToken: () => { throw new Error('Firebase Admin not initialized'); }
} as unknown as admin.auth.Auth;

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

export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}
