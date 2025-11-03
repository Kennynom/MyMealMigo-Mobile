import { db } from '@/config/firebase';
import {
    arrayUnion,
    deleteDoc,
    doc,
    getDoc,
    setDoc,
    Timestamp,
    updateDoc
} from 'firebase/firestore';

// Collection paths for nested structure
const USERS_COLLECTION = 'users';
const PRIVATE_COLLECTION = 'private';
const HEALTH_PROFILE_DOC = 'health_profile';
const MEAL_LOGS_COLLECTION = 'meal_logs';
const MAIN_DOC = 'main';

/**
 * Log a meal to Firebase in the nested user structure
 * Structure: users/{userId}/private/health_profile/meal_logs/main -> dailyLogs array
 * @param {Object} mealData - The meal data to log
 * @param {string} mealData.foodName - Name of the food
 * @param {number} mealData.calories - Calories per serving
 * @param {number} mealData.protein - Protein in grams
 * @param {number} mealData.carbs - Carbohydrates in grams  
 * @param {number} mealData.fat - Fat in grams
 * @param {number} mealData.servingSize - Serving size amount
 * @param {string} mealData.servingUnit - Serving size unit
 * @param {string} mealData.entryMethod - How the meal was entered (manual, photo, barcode)
 * @param {Date} mealData.timestamp - When the meal was logged
 * @param {string} mealData.userId - ID of the user logging the meal
 * @returns {Promise<string>} The generated meal ID
 */
export const logMealToFirebase = async (mealData) => {
  try {
    // Debug logging
    console.log('=== Firebase Meal Logging Debug ===');
    console.log('Input mealData:', mealData);
    
    // Validate required fields
    if (!mealData.userId) {
      throw new Error('User ID is required');
    }
    if (!mealData.foodName || !mealData.calories) {
      throw new Error('Food name and calories are required');
    }

    // Generate unique meal ID
    const mealId = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create the meal document
    const mealDocument = {
      id: mealId,
      ...mealData,
      timestamp: Timestamp.fromDate(mealData.timestamp || new Date()),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    console.log('Final meal document:', mealDocument);
    
    // Path: users/{userId}/private/health_profile/meal_logs/main
    const userMealLogsRef = doc(db, USERS_COLLECTION, mealData.userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, MEAL_LOGS_COLLECTION, MAIN_DOC);
    
    console.log('Document path:', `users/${mealData.userId}/private/health_profile/meal_logs/main`);

    // Check if the document exists, if not create it with the meal
    const docSnap = await getDoc(userMealLogsRef);
    
    if (docSnap.exists()) {
      // Document exists, add meal to dailyLogs array
      await updateDoc(userMealLogsRef, {
        dailyLogs: arrayUnion(mealDocument),
        updatedAt: Timestamp.now()
      });
      console.log('✅ Meal added to existing dailyLogs array');
    } else {
      // Document doesn't exist, create it with the meal
      await setDoc(userMealLogsRef, {
        dailyLogs: [mealDocument],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: mealData.userId
      });
      console.log('✅ Created new meal_logs document with first meal');
    }
    
    console.log('Meal logged successfully with ID:', mealId);
    return mealId;
  } catch (error) {
    console.error('Error logging meal to Firebase:', error);
    throw error;
  }
};

/**
 * Get meals for a specific user from the nested structure
 * @param {string} userId - The user's ID
 * @param {number} limit - Maximum number of meals to retrieve (optional)
 * @returns {Promise<Array>} Array of meal objects
 */
export const getUserMeals = async (userId, limit = 50) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Path: users/{userId}/private/health_profile/meal_logs/main
    const userMealLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, MEAL_LOGS_COLLECTION, MAIN_DOC);
    const docSnap = await getDoc(userMealLogsRef);

    if (!docSnap.exists()) {
      console.log('No meal logs found for user');
      return [];
    }

    const data = docSnap.data();
    let meals = data.dailyLogs || [];

    // Convert Firestore timestamps to JavaScript dates
    meals = meals.map(meal => ({
      ...meal,
      timestamp: meal.timestamp?.toDate ? meal.timestamp.toDate() : meal.timestamp,
      createdAt: meal.createdAt?.toDate ? meal.createdAt.toDate() : meal.createdAt,
      updatedAt: meal.updatedAt?.toDate ? meal.updatedAt.toDate() : meal.updatedAt,
    }));

    // Sort by timestamp (newest first)
    meals.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit if specified
    if (limit && meals.length > limit) {
      meals = meals.slice(0, limit);
    }

    return meals;
  } catch (error) {
    console.error('Error getting user meals:', error);
    throw error;
  }
};

/**
 * Get meals for a specific date range from the nested structure
 * @param {string} userId - The user's ID
 * @param {Date} startDate - Start date for the range
 * @param {Date} endDate - End date for the range
 * @returns {Promise<Array>} Array of meal objects
 */
export const getMealsInDateRange = async (userId, startDate, endDate) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Get all user meals first
    const allMeals = await getUserMeals(userId);

    // Filter by date range
    const mealsInRange = allMeals.filter(meal => {
      const mealDate = new Date(meal.timestamp);
      return mealDate >= startDate && mealDate <= endDate;
    });

    // Sort by timestamp (newest first)
    mealsInRange.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return mealsInRange;
  } catch (error) {
    console.error('Error getting meals in date range:', error);
    throw error;
  }
};

/**
 * Get today's meals for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of today's meal objects
 */
export const getTodaysMeals = async (userId) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  return getMealsInDateRange(userId, startOfDay, endOfDay);
};

/**
 * Update a meal entry
 * @param {string} mealId - The ID of the meal to update
 * @param {Object} updateData - The data to update
 * @returns {Promise<void>}
 */
export const updateMeal = async (mealId, updateData) => {
  try {
    if (!mealId) {
      throw new Error('Meal ID is required');
    }

    const mealRef = doc(db, MEALS_COLLECTION, mealId);
    const updatedData = {
      ...updateData,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(mealRef, updatedData);
    console.log('Meal updated successfully');
  } catch (error) {
    console.error('Error updating meal:', error);
    throw error;
  }
};

/**
 * Delete a meal entry
 * @param {string} mealId - The ID of the meal to delete
 * @returns {Promise<void>}
 */
export const deleteMeal = async (mealId) => {
  try {
    if (!mealId) {
      throw new Error('Meal ID is required');
    }

    const mealRef = doc(db, MEALS_COLLECTION, mealId);
    await deleteDoc(mealRef);
    console.log('Meal deleted successfully');
  } catch (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
};

/**
 * Calculate daily nutrition totals for a user
 * @param {string} userId - The user's ID
 * @param {Date} date - The date to calculate for (optional, defaults to today)
 * @returns {Promise<Object>} Object containing total calories, protein, carbs, and fat
 */
export const getDailyNutritionTotals = async (userId, date = new Date()) => {
  try {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
    
    const meals = await getMealsInDateRange(userId, startOfDay, endOfDay);
    
    const totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      mealCount: meals.length,
    };

    meals.forEach(meal => {
      const servingMultiplier = meal.servingSize || 1;
      totals.calories += (meal.calories || 0) * servingMultiplier;
      totals.protein += (meal.protein || 0) * servingMultiplier;
      totals.carbs += (meal.carbs || 0) * servingMultiplier;
      totals.fat += (meal.fat || 0) * servingMultiplier;
    });

    // Round to 1 decimal place
    Object.keys(totals).forEach(key => {
      if (key !== 'mealCount') {
        totals[key] = Math.round(totals[key] * 10) / 10;
      }
    });

    return totals;
  } catch (error) {
    console.error('Error calculating daily nutrition totals:', error);
    throw error;
  }
};

/**
 * Update daily calorie tracking when a meal is logged
 * @param {string} userId - The user's ID
 * @param {Object} mealData - The meal data that was just logged
 * @returns {Promise<void>}
 */
export const updateCalorieTracking = async (userId, mealData) => {
  try {
    console.log('=== Updating Calorie Tracking ===');
    console.log('User ID:', userId);
    console.log('Meal data:', mealData);

    // Path: users/{userId}/private/health_profile/calorie_logs/main
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    
    // Get current calorie logs
    const docSnap = await getDoc(calorieLogsRef);
    
    // Calculate total calories from this meal (including serving size)
    const mealCalories = (mealData.calories || 0) * (mealData.servingSize || 1);
    const mealProtein = (mealData.protein || 0) * (mealData.servingSize || 1);
    const mealCarbs = (mealData.carbs || 0) * (mealData.servingSize || 1);
    const mealFats = (mealData.fat || 0) * (mealData.servingSize || 1);
    const mealSodium = (mealData.sodium || 0) * (mealData.servingSize || 1);
    const mealSugar = (mealData.sugar || 0) * (mealData.servingSize || 1);
    
    // Get today's date string in format YYYY-MM-DD
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Get user's calorie goal
    const calorieGoal = await getUserCalorieGoal(userId);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      let dailyLogs = data.dailyLogs || [];
      
      // Find today's log entry
      let todayLog = dailyLogs.find(log => log.dateStart === dateString && log.dateEnd === dateString);
      
      if (todayLog) {
        // Update existing today's log
        todayLog.caloriesConsumed = (todayLog.caloriesConsumed || 0) + mealCalories;
        todayLog.caloriesRemaining = Math.max(0, (todayLog.caloriesSet || calorieGoal) - todayLog.caloriesConsumed);
        todayLog.protein = (todayLog.protein || 0) + mealProtein;
        todayLog.carbs = (todayLog.carbs || 0) + mealCarbs;
        todayLog.fats = (todayLog.fats || 0) + mealFats;
        todayLog.sodium = (todayLog.sodium || 0) + mealSodium;
        todayLog.sugar = (todayLog.sugar || 0) + mealSugar;
        
        // Update the dailyLogs array
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyLogs,
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Updated existing daily log with meal calories');
      } else {
        // Create new daily log for today
        const newDailyLog = {
          dateStart: dateString,
          dateEnd: dateString,
          caloriesSet: calorieGoal,
          caloriesConsumed: mealCalories,
          caloriesRemaining: Math.max(0, calorieGoal - mealCalories),
          protein: mealProtein,
          carbs: mealCarbs,
          fats: mealFats,
          sodium: mealSodium,
          sugar: mealSugar
        };
        
        dailyLogs.push(newDailyLog);
        
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyLogs,
          updatedAt: Timestamp.now()
        });
        
        console.log('✅ Created new daily log with meal calories');
      }
    } else {
      // Document doesn't exist, create it with first daily log
      const newDailyLog = {
        dateStart: dateString,
        dateEnd: dateString,
        caloriesSet: calorieGoal,
        caloriesConsumed: mealCalories,
        caloriesRemaining: Math.max(0, calorieGoal - mealCalories),
        protein: mealProtein,
        carbs: mealCarbs,
        fats: mealFats,
        sodium: mealSodium,
        sugar: mealSugar
      };
      
      await setDoc(calorieLogsRef, {
        dailyLogs: [newDailyLog],
        weeklyLogs: [],
        monthlyLogs: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: userId
      });
      
      console.log('✅ Created new calorie logs document with first daily log');
    }
    
    console.log(`Added ${mealCalories} calories to daily tracking`);
  } catch (error) {
    console.error('Error updating calorie tracking:', error);
    throw error;
  }
};

/**
 * Get user's daily calorie goal from their health profile
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} The daily calorie goal
 */
export const getUserCalorieGoal = async (userId) => {
  try {
    // First priority: Check existing daily logs for caloriesSet
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    const logsSnap = await getDoc(calorieLogsRef);
    
    if (logsSnap.exists()) {
      const logsData = logsSnap.data();
      // Get caloriesSet from the most recent daily log
      if (logsData.dailyLogs && logsData.dailyLogs.length > 0) {
        const latestLog = logsData.dailyLogs[logsData.dailyLogs.length - 1];
        if (latestLog.caloriesSet) {
          return latestLog.caloriesSet;
        }
      }
    }
    
    // Second priority: Fall back to health profile's dailyCalorieGoal
    const healthProfileRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC);
    const docSnap = await getDoc(healthProfileRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.dailyCalorieGoal) {
        return data.dailyCalorieGoal;
      }
    }
    
    // No calorie goal set
    return null;
  } catch (error) {
    console.error('Error getting user calorie goal:', error);
    return null;
  }
};

/**
 * Update an existing meal and adjust calorie tracking accordingly
 * @param {string} userId - The user's ID
 * @param {string} mealId - The ID of the meal to update
 * @param {Object} oldMealData - The original meal data (for calorie adjustment)
 * @param {Object} newMealData - The updated meal data
 * @returns {Promise<void>}
 */
export const updateMealAndCalories = async (userId, mealId, oldMealData, newMealData) => {
  try {
    console.log('=== Updating Meal and Calories ===');
    console.log('User ID:', userId);
    console.log('Meal ID:', mealId);
    console.log('Old meal data:', oldMealData);
    console.log('New meal data:', newMealData);

    if (!userId || !mealId) {
      throw new Error('User ID and Meal ID are required');
    }

    // Path: users/{userId}/private/health_profile/meal_logs/main
    const userMealLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, MEAL_LOGS_COLLECTION, MAIN_DOC);
    
    // Get the meal logs document
    const docSnap = await getDoc(userMealLogsRef);
    
    if (!docSnap.exists()) {
      throw new Error('Meal logs not found');
    }

    const data = docSnap.data();
    let dailyLogs = data.dailyLogs || [];

    // Find the meal to update
    const mealIndex = dailyLogs.findIndex(meal => meal.id === mealId);
    
    if (mealIndex === -1) {
      throw new Error('Meal not found');
    }

    // Update the meal with new data
    dailyLogs[mealIndex] = {
      ...dailyLogs[mealIndex],
      ...newMealData,
      id: mealId, // Preserve the ID
      timestamp: Timestamp.fromDate(newMealData.timestamp || new Date()),
      updatedAt: Timestamp.now(),
    };

    // Update the meal logs document
    await updateDoc(userMealLogsRef, {
      dailyLogs: dailyLogs,
      updatedAt: Timestamp.now()
    });

    console.log('✅ Meal updated successfully');

    // Now adjust calorie tracking
    // Calculate old meal calories
    const oldCalories = (oldMealData.calories || 0) * (oldMealData.servingSize || 1);
    const oldProtein = (oldMealData.protein || 0) * (oldMealData.servingSize || 1);
    const oldCarbs = (oldMealData.carbs || 0) * (oldMealData.servingSize || 1);
    const oldFats = (oldMealData.fat || 0) * (oldMealData.servingSize || 1);
    const oldSodium = (oldMealData.sodium || 0) * (oldMealData.servingSize || 1);
    const oldSugar = (oldMealData.sugar || 0) * (oldMealData.servingSize || 1);

    // Calculate new meal calories
    const newCalories = (newMealData.calories || 0) * (newMealData.servingSize || 1);
    const newProtein = (newMealData.protein || 0) * (newMealData.servingSize || 1);
    const newCarbs = (newMealData.carbs || 0) * (newMealData.servingSize || 1);
    const newFats = (newMealData.fat || 0) * (newMealData.servingSize || 1);
    const newSodium = (newMealData.sodium || 0) * (newMealData.servingSize || 1);
    const newSugar = (newMealData.sugar || 0) * (newMealData.servingSize || 1);

    // Get the date of the meal
    const mealDate = new Date(oldMealData.timestamp);
    const dateString = mealDate.toISOString().split('T')[0];

    // Path: users/{userId}/private/health_profile/calorie_logs/main
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    const calorieSnap = await getDoc(calorieLogsRef);

    if (calorieSnap.exists()) {
      const calorieData = calorieSnap.data();
      let dailyCalorieLogs = calorieData.dailyLogs || [];

      // Find the daily log for this meal's date
      const logIndex = dailyCalorieLogs.findIndex(log => log.dateStart === dateString && log.dateEnd === dateString);

      if (logIndex !== -1) {
        // Update the daily log: subtract old values, add new values
        dailyCalorieLogs[logIndex].caloriesConsumed = (dailyCalorieLogs[logIndex].caloriesConsumed || 0) - oldCalories + newCalories;
        dailyCalorieLogs[logIndex].protein = (dailyCalorieLogs[logIndex].protein || 0) - oldProtein + newProtein;
        dailyCalorieLogs[logIndex].carbs = (dailyCalorieLogs[logIndex].carbs || 0) - oldCarbs + newCarbs;
        dailyCalorieLogs[logIndex].fats = (dailyCalorieLogs[logIndex].fats || 0) - oldFats + newFats;
        dailyCalorieLogs[logIndex].sodium = (dailyCalorieLogs[logIndex].sodium || 0) - oldSodium + newSodium;
        dailyCalorieLogs[logIndex].sugar = (dailyCalorieLogs[logIndex].sugar || 0) - oldSugar + newSugar;

        // Recalculate calories remaining
        dailyCalorieLogs[logIndex].caloriesRemaining = Math.max(0, (dailyCalorieLogs[logIndex].caloriesSet || 0) - dailyCalorieLogs[logIndex].caloriesConsumed);

        // Update the calorie logs document
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyCalorieLogs,
          updatedAt: Timestamp.now()
        });

        console.log('✅ Calorie tracking updated successfully');
      }
    }

    console.log('Meal and calories updated successfully');
  } catch (error) {
    console.error('Error updating meal and calories:', error);
    throw error;
  }
};

/**
 * Delete a meal and adjust calorie tracking accordingly
 * @param {string} userId - The user's ID
 * @param {string} mealId - The ID of the meal to delete
 * @param {Object} mealData - The meal data (for calorie adjustment)
 * @returns {Promise<void>}
 */
export const deleteMealAndCalories = async (userId, mealId, mealData) => {
  try {
    console.log('=== Deleting Meal and Calories ===');
    console.log('User ID:', userId);
    console.log('Meal ID:', mealId);
    console.log('Meal data:', mealData);

    if (!userId || !mealId) {
      throw new Error('User ID and Meal ID are required');
    }

    // Path: users/{userId}/private/health_profile/meal_logs/main
    const userMealLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, MEAL_LOGS_COLLECTION, MAIN_DOC);
    
    // Get the meal logs document
    const docSnap = await getDoc(userMealLogsRef);
    
    if (!docSnap.exists()) {
      throw new Error('Meal logs not found');
    }

    const data = docSnap.data();
    let dailyLogs = data.dailyLogs || [];

    // Find and remove the meal
    const mealIndex = dailyLogs.findIndex(meal => meal.id === mealId);
    
    if (mealIndex === -1) {
      throw new Error('Meal not found');
    }

    // Remove the meal from the array
    dailyLogs.splice(mealIndex, 1);

    // Update the meal logs document
    await updateDoc(userMealLogsRef, {
      dailyLogs: dailyLogs,
      updatedAt: Timestamp.now()
    });

    console.log('✅ Meal deleted successfully');

    // Now adjust calorie tracking
    // Calculate meal calories to subtract
    const mealCalories = (mealData.calories || 0) * (mealData.servingSize || 1);
    const mealProtein = (mealData.protein || 0) * (mealData.servingSize || 1);
    const mealCarbs = (mealData.carbs || 0) * (mealData.servingSize || 1);
    const mealFats = (mealData.fat || 0) * (mealData.servingSize || 1);
    const mealSodium = (mealData.sodium || 0) * (mealData.servingSize || 1);
    const mealSugar = (mealData.sugar || 0) * (mealData.servingSize || 1);

    // Get the date of the meal
    const mealDate = new Date(mealData.timestamp);
    const dateString = mealDate.toISOString().split('T')[0];

    // Path: users/{userId}/private/health_profile/calorie_logs/main
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    const calorieSnap = await getDoc(calorieLogsRef);

    if (calorieSnap.exists()) {
      const calorieData = calorieSnap.data();
      let dailyCalorieLogs = calorieData.dailyLogs || [];

      // Find the daily log for this meal's date
      const logIndex = dailyCalorieLogs.findIndex(log => log.dateStart === dateString && log.dateEnd === dateString);

      if (logIndex !== -1) {
        // Subtract the deleted meal's values
        dailyCalorieLogs[logIndex].caloriesConsumed = Math.max(0, (dailyCalorieLogs[logIndex].caloriesConsumed || 0) - mealCalories);
        dailyCalorieLogs[logIndex].protein = Math.max(0, (dailyCalorieLogs[logIndex].protein || 0) - mealProtein);
        dailyCalorieLogs[logIndex].carbs = Math.max(0, (dailyCalorieLogs[logIndex].carbs || 0) - mealCarbs);
        dailyCalorieLogs[logIndex].fats = Math.max(0, (dailyCalorieLogs[logIndex].fats || 0) - mealFats);
        dailyCalorieLogs[logIndex].sodium = Math.max(0, (dailyCalorieLogs[logIndex].sodium || 0) - mealSodium);
        dailyCalorieLogs[logIndex].sugar = Math.max(0, (dailyCalorieLogs[logIndex].sugar || 0) - mealSugar);

        // Recalculate calories remaining
        dailyCalorieLogs[logIndex].caloriesRemaining = Math.max(0, (dailyCalorieLogs[logIndex].caloriesSet || 0) - dailyCalorieLogs[logIndex].caloriesConsumed);

        // Update the calorie logs document
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyCalorieLogs,
          updatedAt: Timestamp.now()
        });

        console.log('✅ Calorie tracking updated successfully');
      }
    }

    console.log('Meal and calories deleted successfully');
  } catch (error) {
    console.error('Error deleting meal and calories:', error);
    throw error;
  }
};

