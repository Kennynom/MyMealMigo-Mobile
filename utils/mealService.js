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
    
    // Path: users/{userId}/private/health_profile/meal_logs/main
    const userMealLogsRef = doc(db, USERS_COLLECTION, mealData.userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, MEAL_LOGS_COLLECTION, MAIN_DOC);

    // Check if the document exists, if not create it with the meal
    const docSnap = await getDoc(userMealLogsRef);
    
    if (docSnap.exists()) {
      // Document exists, add meal to dailyLogs array
      await updateDoc(userMealLogsRef, {
        dailyLogs: arrayUnion(mealDocument),
        updatedAt: Timestamp.now()
      });
    } else {
      // Document doesn't exist, create it with the meal
      await setDoc(userMealLogsRef, {
        dailyLogs: [mealDocument],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userId: mealData.userId
      });
    }
    
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
      return [];
    }    const data = docSnap.data();
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
    // Path: users/{userId}/private/health_profile/calorie_logs/main
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    
    // Get current calorie logs
    const docSnap = await getDoc(calorieLogsRef);
    
    // Calculate total calories from this meal (including serving size)
    // Round to 2 decimal places to avoid floating point precision issues
    const mealCalories = Math.round(((mealData.calories || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealProtein = Math.round(((mealData.protein || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealCarbs = Math.round(((mealData.carbs || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealFats = Math.round(((mealData.fat || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealSodium = Math.round(((mealData.sodium || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealSugar = Math.round(((mealData.sugar || 0) * (mealData.servingSize || 1)) * 100) / 100;
    
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
        // Update existing today's log with rounded values
        todayLog.caloriesConsumed = Math.round(((todayLog.caloriesConsumed || 0) + mealCalories) * 100) / 100;
        todayLog.caloriesRemaining = Math.max(0, (todayLog.caloriesSet || calorieGoal) - todayLog.caloriesConsumed);
        todayLog.protein = Math.round(((todayLog.protein || 0) + mealProtein) * 100) / 100;
        todayLog.carbs = Math.round(((todayLog.carbs || 0) + mealCarbs) * 100) / 100;
        todayLog.fats = Math.round(((todayLog.fats || 0) + mealFats) * 100) / 100;
        todayLog.sodium = Math.round(((todayLog.sodium || 0) + mealSodium) * 100) / 100;
        todayLog.sugar = Math.round(((todayLog.sugar || 0) + mealSugar) * 100) / 100;
        
        // Update the dailyLogs array
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyLogs,
          updatedAt: Timestamp.now()
        });
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
    }
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
    // First priority: Check health profile for Goal.items.targetCalories (from Health Calculator)
    const healthProfileRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC);
    const healthProfileSnap = await getDoc(healthProfileRef);
    
    if (healthProfileSnap.exists()) {
      const healthData = healthProfileSnap.data();
      
      // Primary: Use Goal.items.targetCalories from Health Calculator
      if (healthData.Goal && healthData.Goal.items && healthData.Goal.items.targetCalories) {
        return healthData.Goal.items.targetCalories;
      }
      
      // Fallback: Use dailyCalorieGoal if Goal.items.targetCalories doesn't exist
      if (healthData.dailyCalorieGoal) {
        return healthData.dailyCalorieGoal;
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
 * Check if adding a meal will exceed the daily calorie goal
 * @param {string} userId - The user's ID
 * @param {number} mealCalories - The calories to be added
 * @returns {Promise<Object>} Object with {willExceed: boolean, exceedBy: number, currentConsumed: number, calorieGoal: number}
 */
export const checkCalorieGoalExceedance = async (userId, mealCalories) => {
  try {
    console.log('=== Checking Calorie Goal Exceedance ===');
    
    // Get user's calorie goal
    const calorieGoal = await getUserCalorieGoal(userId);
    
    if (!calorieGoal) {
      // No goal set, can't check for exceedance
      return {
        willExceed: false,
        exceedBy: 0,
        currentConsumed: 0,
        calorieGoal: null,
        hasGoal: false
      };
    }

    // Get today's date string in local timezone
    const today = new Date();
    const dateString = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

    // Get current calorie consumption for today
    const calorieLogsRef = doc(db, USERS_COLLECTION, userId, PRIVATE_COLLECTION, HEALTH_PROFILE_DOC, 'calorie_logs', MAIN_DOC);
    const docSnap = await getDoc(calorieLogsRef);

    let currentConsumed = 0;

    if (docSnap.exists()) {
      const data = docSnap.data();
      const dailyLogs = data.dailyLogs || [];
      
      // Find today's log
      const todayLog = dailyLogs.find(log => 
        log.dateStart && log.dateStart.startsWith(dateString)
      );

      if (todayLog) {
        currentConsumed = todayLog.caloriesConsumed || 0;
      }
    }

    // Calculate if adding this meal will exceed the goal
    const totalAfterMeal = currentConsumed + mealCalories;
    const willExceed = totalAfterMeal > calorieGoal;
    const exceedBy = willExceed ? totalAfterMeal - calorieGoal : 0;

    return {
      willExceed,
      exceedBy: Math.round(exceedBy),
      currentConsumed: Math.round(currentConsumed),
      calorieGoal,
      hasGoal: true,
      totalAfterMeal: Math.round(totalAfterMeal)
    };
  } catch (error) {
    console.error('Error checking calorie goal exceedance:', error);
    return {
      willExceed: false,
      exceedBy: 0,
      currentConsumed: 0,
      calorieGoal: null,
      hasGoal: false
    };
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
    // Calculate old meal calories with rounding
    const oldCalories = Math.round(((oldMealData.calories || 0) * (oldMealData.servingSize || 1)) * 100) / 100;
    const oldProtein = Math.round(((oldMealData.protein || 0) * (oldMealData.servingSize || 1)) * 100) / 100;
    const oldCarbs = Math.round(((oldMealData.carbs || 0) * (oldMealData.servingSize || 1)) * 100) / 100;
    const oldFats = Math.round(((oldMealData.fat || 0) * (oldMealData.servingSize || 1)) * 100) / 100;
    const oldSodium = Math.round(((oldMealData.sodium || 0) * (oldMealData.servingSize || 1)) * 100) / 100;
    const oldSugar = Math.round(((oldMealData.sugar || 0) * (oldMealData.servingSize || 1)) * 100) / 100;

    // Calculate new meal calories with rounding
    const newCalories = Math.round(((newMealData.calories || 0) * (newMealData.servingSize || 1)) * 100) / 100;
    const newProtein = Math.round(((newMealData.protein || 0) * (newMealData.servingSize || 1)) * 100) / 100;
    const newCarbs = Math.round(((newMealData.carbs || 0) * (newMealData.servingSize || 1)) * 100) / 100;
    const newFats = Math.round(((newMealData.fat || 0) * (newMealData.servingSize || 1)) * 100) / 100;
    const newSodium = Math.round(((newMealData.sodium || 0) * (newMealData.servingSize || 1)) * 100) / 100;
    const newSugar = Math.round(((newMealData.sugar || 0) * (newMealData.servingSize || 1)) * 100) / 100;

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
        // Update the daily log: subtract old values, add new values (with rounding)
        dailyCalorieLogs[logIndex].caloriesConsumed = Math.round(((dailyCalorieLogs[logIndex].caloriesConsumed || 0) - oldCalories + newCalories) * 100) / 100;
        dailyCalorieLogs[logIndex].protein = Math.round(((dailyCalorieLogs[logIndex].protein || 0) - oldProtein + newProtein) * 100) / 100;
        dailyCalorieLogs[logIndex].carbs = Math.round(((dailyCalorieLogs[logIndex].carbs || 0) - oldCarbs + newCarbs) * 100) / 100;
        dailyCalorieLogs[logIndex].fats = Math.round(((dailyCalorieLogs[logIndex].fats || 0) - oldFats + newFats) * 100) / 100;
        dailyCalorieLogs[logIndex].sodium = Math.round(((dailyCalorieLogs[logIndex].sodium || 0) - oldSodium + newSodium) * 100) / 100;
        dailyCalorieLogs[logIndex].sugar = Math.round(((dailyCalorieLogs[logIndex].sugar || 0) - oldSugar + newSugar) * 100) / 100;

        // Recalculate calories remaining
        dailyCalorieLogs[logIndex].caloriesRemaining = Math.max(0, (dailyCalorieLogs[logIndex].caloriesSet || 0) - dailyCalorieLogs[logIndex].caloriesConsumed);

        // Update the calorie logs document
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyCalorieLogs,
          updatedAt: Timestamp.now()
        });
      }
    }
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
    // Calculate meal calories to subtract with rounding
    const mealCalories = Math.round(((mealData.calories || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealProtein = Math.round(((mealData.protein || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealCarbs = Math.round(((mealData.carbs || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealFats = Math.round(((mealData.fat || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealSodium = Math.round(((mealData.sodium || 0) * (mealData.servingSize || 1)) * 100) / 100;
    const mealSugar = Math.round(((mealData.sugar || 0) * (mealData.servingSize || 1)) * 100) / 100;

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
        // Subtract the deleted meal's values with rounding
        dailyCalorieLogs[logIndex].caloriesConsumed = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].caloriesConsumed || 0) - mealCalories) * 100) / 100);
        dailyCalorieLogs[logIndex].protein = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].protein || 0) - mealProtein) * 100) / 100);
        dailyCalorieLogs[logIndex].carbs = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].carbs || 0) - mealCarbs) * 100) / 100);
        dailyCalorieLogs[logIndex].fats = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].fats || 0) - mealFats) * 100) / 100);
        dailyCalorieLogs[logIndex].sodium = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].sodium || 0) - mealSodium) * 100) / 100);
        dailyCalorieLogs[logIndex].sugar = Math.max(0, Math.round(((dailyCalorieLogs[logIndex].sugar || 0) - mealSugar) * 100) / 100);

        // Recalculate calories remaining
        dailyCalorieLogs[logIndex].caloriesRemaining = Math.max(0, (dailyCalorieLogs[logIndex].caloriesSet || 0) - dailyCalorieLogs[logIndex].caloriesConsumed);

        // Update the calorie logs document
        await updateDoc(calorieLogsRef, {
          dailyLogs: dailyCalorieLogs,
          updatedAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Error deleting meal and calories:', error);
    throw error;
  }
};

