import { db, Collections } from './config/db.js';
import { config } from './config/index.js';

async function checkDatabase() {
  const email = 'alvesoscar517@gmail.com';
  console.log(`Connecting to Firestore projectId: ${config.gcp.projectId}...`);
  console.log(`Checking for user with email: ${email}`);

  try {
    const snapshot = await db
      .collection(Collections.USERS)
      .where('email', '==', email)
      .get();

    if (snapshot.empty) {
      console.log('No user found by email in "users" collection.');

      // Let's create a test document if it doesn't exist
      console.log(
        'Creating a dummy test user document to verify write capability...'
      );
      const testUserRef = db
        .collection(Collections.USERS)
        .doc('test-openvideo-user');
      await testUserRef.set({
        email,
        name: 'Oscar Alves (Test)',
        avatar: '',
        credits: 100,
        role: 'pro',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      console.log('Test user document created successfully!');
    } else {
      console.log(`Found ${snapshot.size} matching users.`);
      snapshot.docs.forEach((doc) => {
        console.log(`Document ID: ${doc.id} =>`, doc.data());
      });
    }
  } catch (error) {
    console.error('Error connecting or writing to Firestore:', error);
  }
}

checkDatabase();
