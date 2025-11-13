import { ThemeContext } from '@/context/ThemeContext';
import { db } from '@/lib/firebase'; // or the correct path
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useCallback, useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CalorieTrackerScreen() {
    const { theme } = useContext(ThemeContext); 
    const [period, setPeriod] = useState('daily');

    const [dailyIntake, setDailyIntake] = useState({
        dateStart: '',
        dateEnd: '',
        carbs: 0,
        protein: 0,
        fats: 0,
        sodium: 0,
        sugar: 0,
        caloriesSet: 0,
        caloriesConsumed: 0,
        caloriesRemaining: 0
    });
    const [weeklyIntake, setWeeklyIntake] = useState({
        dateStart: '',
        dateEnd: '',
        carbs: 0,
        protein: 0,
        fats: 0,
        sodium: 0,
        sugar: 0,
        caloriesSet: 0,
        caloriesConsumed: 0,
        caloriesRemaining: 0
    });
    const [monthlyIntake, setMonthlyIntake] = useState({
        dateStart: '',
        dateEnd: '',
        carbs: 0,
        protein: 0,
        fats: 0,
        sodium: 0,
        sugar: 0,
        caloriesSet: 0,
        caloriesConsumed: 0,
        caloriesRemaining: 0
    });

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [allDailyLogs, setAllDailyLogs] = useState([]);
    const [defaultCalorieGoal, setDefaultCalorieGoal] = useState(null); // Store user's default calorie goal

    // Function to calculate remaining calories
    const calculateRemaining = (caloriesSet, consumed) => {
        return caloriesSet > 0 ? caloriesSet - consumed : 0;
    }

    // Example: update dailyIntake when values change
    useEffect(() => {
        setDailyIntake((prev) => ({
            ...prev,
            caloriesRemaining: calculateRemaining(prev.caloriesSet, prev.caloriesConsumed)
        }));
    }, [dailyIntake.caloriesSet, dailyIntake.caloriesConsumed]);

    // Calculate weekly data from daily logs
    const calculateWeeklyData = useCallback(() => {
        if (!allDailyLogs || allDailyLogs.length === 0 || !defaultCalorieGoal) {
            const emptyWeeklyGoal = defaultCalorieGoal ? defaultCalorieGoal * 7 : 0;
            return {
                weeklyGoal: emptyWeeklyGoal,
                consumed: 0,
                remaining: emptyWeeklyGoal,
                percentageReached: 0,
                carbs: 0,
                protein: 0,
                fats: 0,
                sodium: 0,
                sugar: 0,
                avgCalories: 0,
                avgCarbs: 0,
                avgProtein: 0,
                avgFats: 0,
                avgSodium: 0,
                avgSugar: 0,
            };
        }

        // Get past 7 days range (including today)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Today + 6 days back = 7 days total
        sevenDaysAgo.setHours(0, 0, 0, 0); // Start of that day

        console.log('=== Weekly Calculation ===');
        console.log('Date range:', sevenDaysAgo.toLocaleDateString(), 'to', today.toLocaleDateString());
        console.log('Total daily logs available:', allDailyLogs.length);

        // Filter logs for past 7 days
        const weeklyLogs = allDailyLogs.filter(log => {
            if (!log.dateStart) return false;
            const logDate = new Date(log.dateStart);
            return logDate >= sevenDaysAgo && logDate <= today;
        });

        console.log('Logs in past 7 days:', weeklyLogs.length);
        console.log('Weekly logs:', weeklyLogs.map(log => ({
            date: log.dateStart,
            consumed: log.caloriesConsumed,
            carbs: log.carbs,
            protein: log.protein,
            fats: log.fats,
            sodium: log.sodium,
            sugar: log.sugar
        })));

        // Calculate totals
        let totalConsumed = 0;
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;
        let totalSodium = 0;
        let totalSugar = 0;

        weeklyLogs.forEach(log => {
            totalConsumed += log.caloriesConsumed || 0;
            totalCarbs += log.carbs || 0;
            totalProtein += log.protein || 0;
            totalFats += log.fats || 0;
            totalSodium += log.sodium || 0;
            totalSugar += log.sugar || 0;
        });

        const weeklyGoal = defaultCalorieGoal * 7;
        const remaining = Math.max(0, weeklyGoal - totalConsumed);
        const percentageReached = weeklyGoal > 0 ? Math.round((totalConsumed / weeklyGoal) * 100) : 0;

        console.log('Total consumed (past 7 days):', totalConsumed);
        console.log('Weekly goal (daily goal × 7):', weeklyGoal, '=', defaultCalorieGoal, '× 7');
        console.log('Percentage reached:', percentageReached + '%');

        // Calculate averages (divide by 7 for full week)
        const avgCalories = Math.round(totalConsumed / 7);
        const avgCarbs = Math.round(totalCarbs / 7);
        const avgProtein = Math.round(totalProtein / 7);
        const avgFats = Math.round(totalFats / 7);
        const avgSodium = Math.round(totalSodium / 7);
        const avgSugar = Math.round(totalSugar / 7);

        return {
            weeklyGoal,
            consumed: Math.round(totalConsumed),
            remaining: Math.round(remaining),
            percentageReached,
            carbs: Math.round(totalCarbs),
            protein: Math.round(totalProtein),
            fats: Math.round(totalFats),
            sodium: Math.round(totalSodium),
            sugar: Math.round(totalSugar),
            avgCalories,
            avgCarbs,
            avgProtein,
            avgFats,
            avgSodium,
            avgSugar,
        };
    }, [allDailyLogs, defaultCalorieGoal]);

    const weeklyData = calculateWeeklyData();

    // Calculate monthly data from daily logs
    const calculateMonthlyData = useCallback(() => {
        if (!allDailyLogs || allDailyLogs.length === 0 || !defaultCalorieGoal) {
            const emptyMonthlyGoal = defaultCalorieGoal ? defaultCalorieGoal * 30 : 0;
            return {
                monthlyGoal: emptyMonthlyGoal,
                consumed: 0,
                remaining: emptyMonthlyGoal,
                percentageReached: 0,
                carbs: 0,
                protein: 0,
                fats: 0,
                sodium: 0,
                sugar: 0,
                avgCalories: 0,
                avgCarbs: 0,
                avgProtein: 0,
                avgFats: 0,
                avgSodium: 0,
                avgSugar: 0,
            };
        }

        // Get past 30 days range (including today)
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today
        
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29); // Today + 29 days back = 30 days total
        thirtyDaysAgo.setHours(0, 0, 0, 0); // Start of that day

        console.log('=== Monthly Calculation ===');
        console.log('Date range:', thirtyDaysAgo.toLocaleDateString(), 'to', today.toLocaleDateString());
        console.log('Total daily logs available:', allDailyLogs.length);

        // Filter logs for past 30 days
        const monthlyLogs = allDailyLogs.filter(log => {
            if (!log.dateStart) return false;
            const logDate = new Date(log.dateStart);
            return logDate >= thirtyDaysAgo && logDate <= today;
        });

        console.log('Logs in past 30 days:', monthlyLogs.length);
        console.log('Monthly logs:', monthlyLogs.map(log => ({
            date: log.dateStart,
            consumed: log.caloriesConsumed,
            carbs: log.carbs,
            protein: log.protein,
            fats: log.fats,
            sodium: log.sodium,
            sugar: log.sugar
        })));

        // Calculate totals
        let totalConsumed = 0;
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFats = 0;
        let totalSodium = 0;
        let totalSugar = 0;

        monthlyLogs.forEach(log => {
            totalConsumed += log.caloriesConsumed || 0;
            totalCarbs += log.carbs || 0;
            totalProtein += log.protein || 0;
            totalFats += log.fats || 0;
            totalSodium += log.sodium || 0;
            totalSugar += log.sugar || 0;
        });

        const monthlyGoal = defaultCalorieGoal * 30;
        const remaining = Math.max(0, monthlyGoal - totalConsumed);
        const percentageReached = monthlyGoal > 0 ? Math.round((totalConsumed / monthlyGoal) * 100) : 0;

        console.log('Total consumed (past 30 days):', totalConsumed);
        console.log('Monthly goal (daily goal × 30):', monthlyGoal, '=', defaultCalorieGoal, '× 30');
        console.log('Percentage reached:', percentageReached + '%');

        // Calculate averages (divide by 30 for full month)
        const avgCalories = Math.round(totalConsumed / 30);
        const avgCarbs = Math.round(totalCarbs / 30);
        const avgProtein = Math.round(totalProtein / 30);
        const avgFats = Math.round(totalFats / 30);
        const avgSodium = Math.round(totalSodium / 30);
        const avgSugar = Math.round(totalSugar / 30);

        return {
            monthlyGoal,
            consumed: Math.round(totalConsumed),
            remaining: Math.round(remaining),
            percentageReached,
            carbs: Math.round(totalCarbs),
            protein: Math.round(totalProtein),
            fats: Math.round(totalFats),
            sodium: Math.round(totalSodium),
            sugar: Math.round(totalSugar),
            avgCalories,
            avgCarbs,
            avgProtein,
            avgFats,
            avgSodium,
            avgSugar,
        };
    }, [allDailyLogs, defaultCalorieGoal]);

    const monthlyData = calculateMonthlyData();

    const fetchCalorieLogs = useCallback(async () => {
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        try {
            // Get the calorie logs
            const calorieLogDocRef = doc(db, 'users', uid, 'private', 'health_profile', 'calorie_logs', 'main');
            const docSnap = await getDoc(calorieLogDocRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAllDailyLogs(data.dailyLogs || []);
                
                // Get latest weekly log
                if (data.weeklyLogs && data.weeklyLogs.length > 0) {
                    setWeeklyIntake(data.weeklyLogs[data.weeklyLogs.length - 1]);
                }
                // Get latest monthly log
                if (data.monthlyLogs && data.monthlyLogs.length > 0) {
                    setMonthlyIntake(data.monthlyLogs[data.monthlyLogs.length - 1]);
                }
            }
            
        } catch (error) {
            console.error('Error fetching calorie logs:', error);
        }
    }, []);

    // Set up real-time listener for targetCalories
    useEffect(() => {
        const auth = getAuth();
        const uid = auth.currentUser?.uid;
        if (!uid) return;

        console.log('🔍 [CALORIE TRACKER] Setting up real-time listener for targetCalories, uid:', uid);
        
        const healthProfileRef = doc(db, 'users', uid, 'private', 'health_profile');
        const unsubscribe = onSnapshot(healthProfileRef, (healthProfileSnap) => {
            if (healthProfileSnap.exists()) {
                const healthData = healthProfileSnap.data();
                console.log('📊 [CALORIE TRACKER] Health data received');
                console.log('📊 [CALORIE TRACKER] Goal:', healthData.Goal);
                console.log('📊 [CALORIE TRACKER] Goal.items:', healthData.Goal?.items);
                console.log('📊 [CALORIE TRACKER] targetCalories:', healthData.Goal?.items?.targetCalories);
                
                // Use targetCalories from Goal.items as the primary source
                let userCalorieGoal = null;
                if (healthData.Goal && healthData.Goal.items && healthData.Goal.items.targetCalories) {
                    userCalorieGoal = healthData.Goal.items.targetCalories;
                    console.log('✅ [CALORIE TRACKER] Real-time update - targetCalories:', userCalorieGoal);
                }
                // Fall back to dailyCalorieGoal if targetCalories doesn't exist
                else if (healthData.dailyCalorieGoal) {
                    userCalorieGoal = healthData.dailyCalorieGoal;
                    console.log('✅ [CALORIE TRACKER] Real-time update - dailyCalorieGoal:', userCalorieGoal);
                }
                
                setDefaultCalorieGoal(userCalorieGoal);
                console.log('✅ [CALORIE TRACKER] Set defaultCalorieGoal to:', userCalorieGoal);
            }
        }, (err) => {
            console.error('❌ [CALORIE TRACKER] ERROR in real-time listener:', err);
        });

        // Cleanup listener on unmount
        return () => {
            console.log('🧹 [CALORIE TRACKER] Cleaning up real-time listener');
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        fetchCalorieLogs();
    }, [fetchCalorieLogs]);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchCalorieLogs();
        }, [fetchCalorieLogs])
    );

    // Find daily log for selected date - ONLY show data for that specific date
    // Use local timezone instead of UTC to avoid timezone issues
    const selectedDateString = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
    ).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD in local timezone
    
    const logForSelectedDate = allDailyLogs.find(
        log => log.dateStart && log.dateStart.startsWith(selectedDateString)
    );
    
    // If no log exists for selected date, create empty log with default calorie goal
    const dailyLogForDate = logForSelectedDate || {
        dateStart: selectedDateString,
        dateEnd: selectedDateString,
        carbs: 0,
        protein: 0,
        fats: 0,
        sodium: 0,
        sugar: 0,
        caloriesSet: defaultCalorieGoal,
        caloriesConsumed: 0,
        caloriesRemaining: defaultCalorieGoal
    };

    // Override caloriesSet with latest defaultCalorieGoal if it exists
    // This ensures we always show the current goal, not the old logged value
    if (defaultCalorieGoal && logForSelectedDate) {
        dailyLogForDate.caloriesSet = defaultCalorieGoal;
        dailyLogForDate.caloriesRemaining = defaultCalorieGoal - dailyLogForDate.caloriesConsumed;
    }

    console.log('=== Daily Log for Date ===');
    console.log('Selected date:', selectedDateString);
    console.log('dailyLogForDate.caloriesSet:', dailyLogForDate.caloriesSet);
    console.log('defaultCalorieGoal:', defaultCalorieGoal);

    // Choose which intake to show
    const currentIntake =
        period === 'daily' ? dailyIntake :
        period === 'weekly' ? weeklyIntake :
        monthlyIntake;

    const styles = createStyles(theme);
    
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Calorie Tracker</Text>
                    <Text style={styles.headerSubtitle}>Track your daily intake</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            {/* Overview Section */}
            <View style={styles.cardContainer}>
                <Text style={styles.overviewHeader}>Overview</Text>
                <View style={styles.overviewContainer}>
                    {period === 'weekly' ? (
                        // Weekly Overview
                        <>
                            <View style={styles.remainingSection}>
                                {/* Weekly Circular Progress Ring */}
                                {(() => {
                                    const percent = weeklyData.percentageReached;
                                    const radius = 70;
                                    const strokeWidth = 12;
                                    const normalizedRadius = radius;
                                    const circumference = 2 * Math.PI * normalizedRadius;
                                    const strokeDashoffset = circumference * (1 - Math.min(100, percent) / 100);

                                    return (
                                        <View style={styles.ringWrapper}>
                                            <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
                                                <Circle
                                                    stroke={theme?.accent ?? '#0B5E24'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                />
                                                <Circle
                                                    stroke={theme?.primary ?? '#158D25'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${circumference} ${circumference}`}
                                                    strokeDashoffset={strokeDashoffset}
                                                    rotation={-90}
                                                    origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
                                                />
                                            </Svg>
                                            <View style={styles.ringCenter} pointerEvents="none">
                                                <Text style={styles.ringPercent}>{percent}%</Text>
                                                <Text style={styles.ringLabel}>of Weekly Goal</Text>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>

                            <View style={styles.caloriesSetSection}>
                                <View style={styles.displayCol}>
                                    <View>
                                        <AntDesign name="fire" size={24} color="darkorange" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Goal:</Text>
                                        <Text style={styles.rightNumber}>
                                            {weeklyData.weeklyGoal.toLocaleString()}
                                        </Text>
                                        <Text style={styles.rightSubtext}>({defaultCalorieGoal} × 7)</Text>
                                    </View>
                                </View>

                                <View style={styles.displayCol}>
                                    <View>
                                        <MaterialCommunityIcons name="food-apple" size={24} color="crimson" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Consumed:</Text>
                                        <Text style={styles.rightNumber}>{weeklyData.consumed.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    ) : period === 'monthly' ? (
                        // Monthly Overview
                        <>
                            <View style={styles.remainingSection}>
                                {/* Monthly Circular Progress Ring */}
                                {(() => {
                                    const percent = monthlyData.percentageReached;
                                    const radius = 70;
                                    const strokeWidth = 12;
                                    const normalizedRadius = radius;
                                    const circumference = 2 * Math.PI * normalizedRadius;
                                    const strokeDashoffset = circumference * (1 - Math.min(100, percent) / 100);

                                    return (
                                        <View style={styles.ringWrapper}>
                                            <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
                                                <Circle
                                                    stroke={theme?.accent ?? '#0B5E24'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                />
                                                <Circle
                                                    stroke={theme?.primary ?? '#158D25'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${circumference} ${circumference}`}
                                                    strokeDashoffset={strokeDashoffset}
                                                    rotation={-90}
                                                    origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
                                                />
                                            </Svg>
                                            <View style={styles.ringCenter} pointerEvents="none">
                                                <Text style={styles.ringPercent}>{percent}%</Text>
                                                <Text style={styles.ringLabel}>of Monthly Goal</Text>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>

                            <View style={styles.caloriesSetSection}>
                                <View style={styles.displayCol}>
                                    <View>
                                        <AntDesign name="fire" size={24} color="darkorange" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Goal:</Text>
                                        <Text style={styles.rightNumber}>
                                            {monthlyData.monthlyGoal.toLocaleString()}
                                        </Text>
                                        <Text style={styles.rightSubtext}>({defaultCalorieGoal} × 30)</Text>
                                    </View>
                                </View>

                                <View style={styles.displayCol}>
                                    <View>
                                        <MaterialCommunityIcons name="food-apple" size={24} color="crimson" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Consumed:</Text>
                                        <Text style={styles.rightNumber}>{monthlyData.consumed.toLocaleString()}</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    ) : (
                        // Daily Overview (unchanged)
                        <>
                            <View style={styles.remainingSection}>
                                {/* Circular progress ring showing percent remaining */}
                                {(() => {
                                    const percent = dailyLogForDate.caloriesSet > 0
                                        ? Math.max(0, Math.min(100, Math.round(((dailyLogForDate.caloriesSet - dailyLogForDate.caloriesConsumed) / dailyLogForDate.caloriesSet) * 100)))
                                        : 0;
                                    const radius = 70;
                                    const strokeWidth = 12;
                                    const normalizedRadius = radius;
                                    const circumference = 2 * Math.PI * normalizedRadius;
                                    const strokeDashoffset = circumference * (1 - percent / 100);

                                    return (
                                        <View style={styles.ringWrapper}>
                                            <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
                                                <Circle
                                                    stroke={theme?.accent ?? '#0B5E24'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                    origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
                                                />
                                                <Circle
                                                    stroke={theme?.primary ?? '#158D25'}
                                                    fill="none"
                                                    cx={radius + strokeWidth / 2}
                                                    cy={radius + strokeWidth / 2}
                                                    r={normalizedRadius}
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    strokeDasharray={`${circumference} ${circumference}`}
                                                    strokeDashoffset={strokeDashoffset}
                                                    rotation={90}
                                                    origin={`${radius + strokeWidth / 2}, ${radius + strokeWidth / 2}`}
                                                />
                                            </Svg>
                                            <View style={styles.ringCenter} pointerEvents="none">
                                                <Text style={styles.ringPercent}>{percent}%</Text>
                                                <Text style={styles.ringLabel}>Remaining</Text>
                                            </View>
                                        </View>
                                    );
                                })()}
                            </View>

                            <View style={styles.caloriesSetSection}>
                                <View style={styles.displayCol}>
                                    <View>
                                        <AntDesign name="fire" size={24} color="darkorange" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Goal:</Text>
                                        <Text style={styles.rightNumber}>
                                            {dailyLogForDate.caloriesSet ? dailyLogForDate.caloriesSet : 'Not Set'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.displayCol}>
                                    <View>
                                        <MaterialCommunityIcons name="food-apple" size={24} color="crimson" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Consumed:</Text>
                                        <Text style={styles.rightNumber}>{dailyLogForDate.caloriesConsumed}</Text>
                                    </View>
                                </View>

                                <View style={styles.displayCol}>
                                    <View>
                                        <Entypo name="check" size={24} color="lime" />
                                    </View>
                                    <View>
                                        <Text style={styles.rightText}>Remaining:</Text>
                                        <Text style={styles.rightNumber}>{dailyLogForDate.caloriesSet - dailyLogForDate.caloriesConsumed}</Text>
                                    </View>
                                </View>
                            </View>
                        </>
                    )}
                </View>
            </View>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                >
                <View>
                    <View style={styles.dailyButton} />
                    <View style={styles.weeklyButton} />
                    <View style={styles.monthlyButton} />
                </View>

                <View style={styles.macroSection}/>

                {/* Inline card */}
                <View style={styles.cardContainer2}>
                    <View style={styles.cardHandle} />

                    <View style={styles.pillsRow}>
                        <TouchableOpacity
                            style={[styles.pill, period === 'daily' && styles.pillActive]}
                            onPress={() => setPeriod('daily')}
                        >
                            <Text style={[styles.pillText, period === 'daily' && styles.pillTextActive]}>Daily</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, period === 'weekly' && styles.pillActive]}
                            onPress={() => setPeriod('weekly')}
                        >
                            <Text style={[styles.pillText, period === 'weekly' && styles.pillTextActive]}>Weekly</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, period === 'monthly' && styles.pillActive]}
                            onPress={() => setPeriod('monthly')}
                        >
                            <Text style={[styles.pillText, period === 'monthly' && styles.pillTextActive]}>Monthly</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Date Picker Section (for daily) */}
                    {period === 'daily' && (
                    <View style={styles.datePickerSection}>
                        <DateTimePicker
                            value={selectedDate}
                            mode="date"
                            display="default"
                            maximumDate={new Date()} // Block future dates - only allow today and past
                            onChange={(event, date) => {
                                if (date) setSelectedDate(date);
                            }}
                        />
                    </View>
                    )}

                    {period === 'daily' ? (
                        <View style={styles.nutritionList}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Goal:</Text>
                                <Text style={styles.rowValue}>
                                    {dailyLogForDate.caloriesSet || 'Not Set'}
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Calories Consumed:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.caloriesConsumed}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Calories Remaining:</Text>
                                <Text style={styles.rowValue}>
                                    {dailyLogForDate.caloriesSet - dailyLogForDate.caloriesConsumed}
                                </Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Carbs:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.carbs}g</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Protein:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.protein}g</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Fats:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.fats}g</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sodium:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.sodium}mg</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sugar:</Text>
                                <Text style={styles.rowValue}>{dailyLogForDate.sugar}g</Text>
                            </View>
                        </View>
                    ) : period === 'weekly' ? (
                        <View style={styles.nutritionList}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Goal:</Text>
                                <Text style={styles.rowValue}>{weeklyData.weeklyGoal.toLocaleString()} cal</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Calories Consumed:</Text>
                                <Text style={styles.rowValue}>{weeklyData.consumed.toLocaleString()} cal</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Carbs:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{weeklyData.carbs}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {weeklyData.avgCarbs}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Protein:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{weeklyData.protein}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {weeklyData.avgProtein}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Fats:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{weeklyData.fats}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {weeklyData.avgFats}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sodium:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{weeklyData.sodium}mg</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {weeklyData.avgSodium}mg/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sugar:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{weeklyData.sugar}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {weeklyData.avgSugar}g/day</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.nutritionList}>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Goal:</Text>
                                <Text style={styles.rowValue}>{monthlyData.monthlyGoal.toLocaleString()} cal</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Calories Consumed:</Text>
                                <Text style={styles.rowValue}>{monthlyData.consumed.toLocaleString()} cal</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Carbs:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{monthlyData.carbs}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {monthlyData.avgCarbs}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Protein:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{monthlyData.protein}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {monthlyData.avgProtein}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Fats:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{monthlyData.fats}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {monthlyData.avgFats}g/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sodium:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{monthlyData.sodium}mg</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {monthlyData.avgSodium}mg/day</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.rowLabel}>Sugar:</Text>
                                <View style={styles.rowValueContainer}>
                                    <Text style={styles.rowValue}>{monthlyData.sugar}g</Text>
                                    <View style={styles.avgBox}>
                                        <Text style={styles.avgText}>Avg: {monthlyData.avgSugar}g/day</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: 16,
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: theme.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backText: {
        color: theme.text,
        fontSize: 20,
        fontWeight: '600',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    placeholder: {
        width: 40,
    },
    overviewHeader: {
        fontSize: 28,
        fontWeight: '600',
        color: theme.text,
        textAlign: 'center',
        marginBottom: 20,
    },
    overviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    caloriesSetSection: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    rightText: {
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 10,
    },
    rightNumber: {
        fontSize: 24,
        color: theme.text,
    },
    rightSubtext: {
        fontSize: 10,
        color: theme.textSecondary,
        marginTop: 2,
    },
    cardContainer:{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 6,
        shadowOpacity: 0.5,
    },
    cardContainer2:{
        backgroundColor: theme.background,
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    pillsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 12,
    },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: '#bba9b0',
        width: 90,
    },
    pillActive: {
        backgroundColor: theme?.primary ?? '#b22222',
        elevation: 2,
    },
    pillText: {
        color: '#333',
        fontWeight: '600',
        textAlign: 'center',
    },
    pillTextActive: {
        color: '#fff',
    },
    nutritionList: {
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e6e6e6',
    },
    rowLabel: {
        color: theme?.text ?? '#000',
        fontSize: 16,
    },
    rowValue: {
        color: theme?.primary ?? '#b22222',
        fontWeight: '700',
    },
    rowValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    avgBox: {
        backgroundColor: '#000',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    avgText: {
        fontSize: 11,
        color: '#4cce57ff',
        fontWeight: '600',
    },
    datePickerSection: {
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
    },
    displayCol: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ringWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        // optional: give wrapper enough space for the svg
        padding: 8,
    },
    ringCenter: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringPercent: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.text,
    },
    ringLabel: {
        fontSize: 12,
        color: theme.textSecondary,
    },
    // Weekly Tracker Styles
    weeklyContainer: {
        marginTop: 8,
    },
    weeklySummaryCircle: {
        alignItems: 'center',
        marginBottom: 24,
    },
    weeklyPercent: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.text,
    },
    weeklyPercentLabel: {
        fontSize: 12,
        color: theme.textSecondary,
        textAlign: 'center',
    },
    weeklyStatsBox: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    weeklyStatsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: theme.text,
        marginBottom: 12,
    },
    weeklyStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    weeklyStatLabel: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    weeklyStatValue: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
    },
    weeklyTable: {
        backgroundColor: theme.surface,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: theme.primary,
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    tableHeaderCell: {
        fontSize: 13,
        fontWeight: '700',
        color: '#ffffffff',
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#e6e6e6ff',
    },
    tableCell: {
        fontSize: 13,
        color: theme.text,
    },
    tableCol1: {
        flex: 2,
    },
    tableCol2: {
        flex: 1.5,
        textAlign: 'right',
    },
    tableCol3: {
        flex: 1.2,
        textAlign: 'right',
    },
});