// Script to create test admin/nutritionist accounts
// Run this in Firebase Console or create manually

export const createTestAccounts = async () => {
  // You can create these manually in Firebase Console
  const testAccounts = [
    {
      email: "admin@mymealmigo.com",
      password: "Admin123!", // Use this password
      userData: {
        role: "admin",
        name: "Test Admin",
        accountStatus: "Active",
        createdAt: new Date().toISOString()
      }
    },
    {
      email: "nutritionist@mymealmigo.com", 
      password: "Nutri123!", // Use this password
      userData: {
        role: "nutritionist",
        name: "Test Nutritionist",
        accountStatus: "Active",
        createdAt: new Date().toISOString()
      }
    }
  ];

  return testAccounts;
};

// Manual creation steps:
console.log(`
🔐 CREATE TEST ACCOUNTS MANUALLY:

1. Go to Firebase Console → Authentication → Users
2. Click "Add User"

ADMIN ACCOUNT:
Email: admin@mymealmigo.com
Password: Admin123!

NUTRITIONIST ACCOUNT:  
Email: nutritionist@mymealmigo.com
Password: Nutri123!

3. After creating, go to Firestore → users collection
4. Create documents with the user UIDs and add:
   {
     role: "admin", // or "nutritionist"
     name: "Test Admin",
     accountStatus: "Active"
   }
`);