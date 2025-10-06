// Add roles to existing Firebase Auth users
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAYV-wEm0lsJZqVnM8dJNXVFZ9MvUXiP4Q",
  authDomain: "test-6411d.firebaseapp.com",
  projectId: "test-6411d",
  storageBucket: "test-6411d.appspot.com",
  messagingSenderId: "869039173208",
  appId: "1:869039173208:web:6d02c93f7b85d4c33b2c3d",
  measurementId: "G-K4KV7J4QBT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const addRoleToUser = async (uid, email, role = 'admin', name = 'Admin User') => {
  try {
    const userData = {
      role: role,
      name: name,
      email: email,
      accountStatus: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', uid), userData);
    console.log(`✅ Added role '${role}' to user: ${email} (${uid})`);
    
    return { success: true, uid, email, role };
  } catch (error) {
    console.error(`❌ Error adding role for ${email}:`, error);
    return { success: false, error: error.message };
  }
};

// Add roles for your existing users from the screenshot
export const addRolesToExistingUsers = async () => {
  const usersToUpdate = [
    {
      uid: 'bb4ZrOu7mSViFnXvbEkfGRHjmxB3', // kennynom@gmail.com
      email: 'kennynom@gmail.com',
      role: 'admin',
      name: 'Kenny Nom (Admin)'
    },
    {
      uid: 'y5Ps7zqRcUNUTvEuHsin6RoU', // gabrielleu1103@gmail
      email: 'gabrielleu1103@gmail.com',
      role: 'admin', 
      name: 'Gabrielle (Admin)'
    },
    {
      uid: 'PJ6vADCNvTQVqM8kVVtmQ0', // michaelleu444@gmail
      email: 'michaelleu444@gmail.com',
      role: 'nutritionist',
      name: 'Michael (Nutritionist)'
    }
  ];
  
  console.log('🔄 Adding roles to existing users...\n');
  
  for (const user of usersToUpdate) {
    const result = await addRoleToUser(user.uid, user.email, user.role, user.name);
    
    if (result.success) {
      console.log(`✅ Success: ${user.email} → ${user.role}`);
    } else {
      console.log(`❌ Failed: ${user.email} - ${result.error}`);
    }
  }
  
  console.log('\n🎯 Done! Try logging in again.');
};

// Manual instructions
console.log(`
📋 MANUAL FIRESTORE SETUP:

1. 🔗 Go to: https://console.firebase.google.com/
2. 📂 Select: test-6411d project  
3. 🗄️ Go to: Firestore Database
4. 📁 Find/Create: 'users' collection
5. ➕ Add document for each user:

For kennynom@gmail.com:
Document ID: bb4ZrOu7mSViFnXvbEkfGRHjmxB3
Fields:
{
  "role": "admin",
  "name": "Kenny Nom", 
  "email": "kennynom@gmail.com",
  "accountStatus": "Active",
  "createdAt": "2025-10-07T10:00:00.000Z"
}

⚠️ IMPORTANT: Document ID must exactly match the UID from Authentication!
`);

export default addRolesToExistingUsers;