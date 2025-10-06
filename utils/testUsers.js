// Test user data examples based on your Firebase structure

export const testUsers = {
  // Admin user (can access web)
  admin: {
    email: "admin@mymealmigo.com",
    password: "admin123",
    userData: {
      role: "admin",
      name: "Admin User",
      accountStatus: "Active"
    }
  },

  // Nutritionist user (can access web)
  nutritionist: {
    email: "nutritionist@mymealmigo.com", 
    password: "nutri123",
    userData: {
      role: "nutritionist",
      name: "Dr. Nutrition",
      accountStatus: "Active"
    }
  },

  // Premium user (mobile only)
  premium: {
    email: "premium@test.com",
    password: "premium123", 
    userData: {
      role: "free", // Note: role is 'free' but subscription determines access
      name: "Premium User",
      accountStatus: "Active",
      subscription: {
        plan: "premium",
        active: true,
        billing: "monthly",
        startedAt: new Date().toISOString()
      }
    }
  },

  // Free user (mobile only)
  free: {
    email: "free@test.com",
    password: "free123",
    userData: {
      role: "free",
      name: "Free User", 
      accountStatus: "Active",
      subscription: {
        plan: "free",
        active: true,
        billing: null,
        startedAt: new Date().toISOString()
      }
    }
  }
};

// Based on your existing Firebase users:
export const existingUsers = {
  gabriel_admin: {
    // qRj0EJy6WlX321n0ikCcpfB1qTW2 - has role: "admin" and subscription: premium
    email: "gabrielleu1103@gmail.com",
    // This user should have WEB access
  },
  
  gabriel_free: {
    // Multiple users with role: "free" 
    // These users should have MOBILE access only
  }
};