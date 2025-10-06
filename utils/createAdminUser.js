// Admin User Creation Helper
// This can be run in a Node.js environment or Firebase Functions

import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

export const createAdminUser = async (email, password, name = 'Admin User') => {
  try {
    const auth = getAuth();
    const db = getFirestore();
    
    // Step 1: Create the authentication account
    console.log(`Creating auth account for: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log(`✅ Auth account created with UID: ${user.uid}`);
    
    // Step 2: Create the Firestore user document
    const userData = {
      role: 'admin',
      name: name,
      email: email,
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
    console.log(`✅ Firestore document created for admin: ${email}`);
    
    return {
      success: true,
      uid: user.uid,
      email: email,
      role: 'admin'
    };
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Example usage:
export const createTestAdmins = async () => {
  const adminsToCreate = [
    {
      email: 'admin@mymealmigo.com',
      password: 'Admin123!',
      name: 'Main Admin'
    },
    {
      email: 'superadmin@mymealmigo.com', 
      password: 'SuperAdmin123!',
      name: 'Super Admin'
    },
    {
      email: 'manager@mymealmigo.com',
      password: 'Manager123!', 
      name: 'Manager Admin'
    }
  ];
  
  for (const admin of adminsToCreate) {
    console.log(`\n🔄 Creating admin: ${admin.email}`);
    const result = await createAdminUser(admin.email, admin.password, admin.name);
    
    if (result.success) {
      console.log(`✅ Successfully created admin: ${admin.email}`);
    } else {
      console.log(`❌ Failed to create admin: ${admin.email} - ${result.error}`);
    }
  }
};

// Manual steps for Firebase Console:
console.log(`
📋 MANUAL ADMIN CREATION STEPS:

1. 🔗 Go to Firebase Console: https://console.firebase.google.com/
2. 📂 Select Project: test-6411d
3. 🔐 Go to: Authentication → Users
4. ➕ Click: "Add user"
5. 📝 Enter Details:
   - Email: admin@mymealmigo.com
   - Password: Admin123!
6. ✅ Click: "Add user"
7. 📄 Go to: Firestore Database → users collection
8. 📋 Create document with user UID:
   {
     "role": "admin",
     "name": "Admin User", 
     "email": "admin@mymealmigo.com",
     "accountStatus": "Active",
     "createdAt": "2025-10-07T10:00:00.000Z"
   }
9. 💾 Save document

🎯 RESULT: New admin can login to web interface!
`);