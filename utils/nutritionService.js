// Simple JSON-based nutrition service
// Replaces Firestore with local foods.json data

import foodsData from '../mlserver/data/foods.json';

console.log('📊 Loaded nutrition data for', foodsData.length, 'foods');

/**
 * Get nutrition data for a specific food ID
 * @param {string} foodId - The food identifier (e.g., "chicken_rice")
 * @returns {Object|null} Nutrition data or null if not found
 */
export const getFoodNutrition = async (foodId) => {
  try {
    if (!foodId) {
      throw new Error('Food ID is required');
    }

    console.log('🔍 Looking up nutrition for food ID:', foodId);

    // Find food in local JSON data
    const food = foodsData.find(item => item.id === foodId);

    if (!food) {
      console.log('❌ Food not found:', foodId);
      throw new Error(`Food with ID "${foodId}" not found in nutrition database`);
    }

    console.log('✅ Found nutrition data:', food);

    // Return standardized nutrition data
    return {
      name: food.name,
      calories: food.calories || 0,
      carbs: food.carbs || 0,
      protein: food.protein || 0,
      fats: food.fat || 0,  // Note: JSON uses "fat", we return "fats"
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      servingSize: 1,
      servingUnit: "serving"
    };

  } catch (error) {
    console.error('❌ Error fetching food nutrition:', error);
    throw error;
  }
};

/**
 * Get nutrition data for multiple food options
 * @param {Array} predictions - Array of ML predictions with foodId and confidence
 * @returns {Array} Array of nutrition data with confidence scores
 */
export const getMultipleFoodOptions = async (predictions) => {
  try {
    console.log('🍽️ Fetching nutrition for multiple predictions:', predictions);

    const foodOptions = [];

    for (const prediction of predictions) {
      if (prediction.foodId && prediction.confidence > 0.5) {
        try {
          const nutritionData = await getFoodNutrition(prediction.foodId);
          foodOptions.push({
            ...nutritionData,
            confidence: prediction.confidence,
            originalLabel: prediction.label
          });
        } catch (error) {
          console.warn(`Could not fetch nutrition for ${prediction.foodId}:`, error);
        }
      }
    }

    return foodOptions;
  } catch (error) {
    console.error('Error fetching multiple food options:', error);
    throw error;
  }
};

/**
 * Get all available foods (for debugging or food list display)
 * @returns {Array} All foods in the database
 */
export const getAllFoods = () => {
  return foodsData.map(food => ({
    id: food.id,
    name: food.name,
    calories: food.calories
  }));
};

console.log('🎯 Available foods:', getAllFoods().map(f => f.name).join(', '));