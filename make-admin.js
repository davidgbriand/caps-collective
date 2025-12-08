const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCj-kx4uaSzrsCeZOZ9FgBFwp0NR3VrtFg",
  authDomain: "caps-collective.firebaseapp.com",
  projectId: "caps-collective",
  storageBucket: "caps-collective.firebasestorage.app",
  messagingSenderId: "902162973860",
  appId: "1:902162973860:web:371a4234127d77e8e65231"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeAdmin() {
  const userId = 'MS7aQ71gS3Zw6eNmft2gxcGAFtx1';

  try {
    await updateDoc(doc(db, 'users', userId), {
      isAdmin: true,
      onboardingComplete: true
    });
    console.log('User is now admin!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

makeAdmin();

