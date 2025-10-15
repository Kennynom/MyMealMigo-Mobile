// Create: app/(tabs)/(tracker)/calorie-tracker.jsx
import { ThemeContext } from '@/context/ThemeContext';
import { db } from '@/lib/firebase'; // or the correct path
import AntDesign from '@expo/vector-icons/AntDesign';
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CalorieTrackerScreen() {
    const { theme } = useContext(ThemeContext); 
    const [period, setPeriod] = useState('weekly');

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

    useEffect(() => {
        const fetchCalorieLogs = async () => {
            const auth = getAuth();
            const uid = auth.currentUser?.uid;
            if (!uid) return;

            const calorieLogDocRef = doc(db, 'users', uid, 'private', 'health_profile', 'calorie_logs', 'main');
            const docSnap = await getDoc(calorieLogDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setAllDailyLogs(data.dailyLogs || []);
                // Get latest daily log
                if (data.dailyLogs && data.dailyLogs.length > 0) {
                    setDailyIntake(data.dailyLogs[data.dailyLogs.length - 1]);
                }
                // Get latest weekly log
                if (data.weeklyLogs && data.weeklyLogs.length > 0) {
                    setWeeklyIntake(data.weeklyLogs[data.weeklyLogs.length - 1]);
                }
                // Get latest monthly log
                if (data.monthlyLogs && data.monthlyLogs.length > 0) {
                    setMonthlyIntake(data.monthlyLogs[data.monthlyLogs.length - 1]);
                }
            }
        };
        fetchCalorieLogs();
    }, []);

    // Find daily log for selected date
    const selectedDateString = selectedDate.toISOString().split('T')[0];
    const dailyLogForDate = allDailyLogs.find(
        log => log.dateStart && log.dateStart.startsWith(selectedDateString)
    ) || dailyIntake;

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
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>Calorie Tracker</Text>
                {/* History Button - to adjust route */}
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.historyText}>History</Text>
                </TouchableOpacity>
            </View>

            {/* Overview Section */}
            <View style={styles.cardContainer}>
                <Text style={styles.overviewHeader}>Overview</Text>
                <View style={styles.overviewContainer}>
                    <View style={styles.remainingSection}>
                        {/* Circular progress ring showing percent remaining */}
                        {(() => {
                            const percent = dailyIntake.caloriesSet > 0
                                ? Math.max(0, Math.min(100, Math.round(((dailyIntake.caloriesSet - dailyIntake.caloriesConsumed) / dailyIntake.caloriesSet) * 100)))
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
                                <Text style={styles.rightNumber}>{dailyIntake.caloriesSet}</Text>
                            </View>
                        </View>

                        <View style={styles.displayCol}>
                            <View>
                                <MaterialCommunityIcons name="food-apple" size={24} color="crimson" />
                            </View>
                            <View>
                                <Text style={styles.rightText}>Consumed:</Text>
                                <Text style={styles.rightNumber}>{dailyIntake.caloriesConsumed}</Text>
                            </View>
                        </View>

                        <View style={styles.displayCol}>
                            <View>
                                <Entypo name="check" size={24} color="lime" />
                            </View>
                            <View>
                                <Text style={styles.rightText}>Remaining:</Text>
                                <Text style={styles.rightNumber}>{dailyIntake.caloriesSet - dailyIntake.caloriesConsumed}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView>
                <View style={styles.dateSection}>
                    <View style={styles.dailyButton} />
                    <View style={styles.weeklyButton} />
                    <View style={styles.monthlyButton} />
                </View>

                <View style={styles.macroSection}/>

                {/* Inline card */}
                <View style={styles.cardContainer}>
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
                            onChange={(event, date) => {
                                if (date) setSelectedDate(date);
                            }}
                        />
                    </View>
                    )}

                    <View style={styles.nutritionList}>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Goal:</Text>
                            <Text style={styles.rowValue}>{currentIntake.caloriesSet}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Calories Consumed:</Text>
                            <Text style={styles.rowValue}>{currentIntake.caloriesConsumed}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Calories Remaining:</Text>
                            <Text style={styles.rowValue}>{currentIntake.caloriesSet - currentIntake.caloriesConsumed}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Carbs:</Text>
                            <Text style={styles.rowValue}>{period === 'daily' ? dailyLogForDate.carbs : currentIntake.carbs}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Protein:</Text>
                            <Text style={styles.rowValue}>{currentIntake.protein}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Fats:</Text>
                            <Text style={styles.rowValue}>{currentIntake.fats}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Sodium:</Text>
                            <Text style={styles.rowValue}>{currentIntake.sodium}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Sugar:</Text>
                            <Text style={styles.rowValue}>{currentIntake.sugar}</Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text,
    },
    historyText: {
        fontSize: 16,
        color: theme.text,
    },
    backButton: {
        padding: 8,
    },
    backText: {
        fontSize: 16,
        color: theme.text,
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
        justifyContent: 'space-around',
    },
    consumedSection: {
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    remainingSection: {
        alignItems: 'center',
        color: theme.text,
        justifyContent: 'center',
    },
    remainingNumber: {
        fontSize: 24,
        color: theme.text,
    },
    remainingText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    caloriesSetSection: {
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    rightText:{
        fontSize: 14,
        color: theme.textSecondary,
        marginTop: 10,
    },
    rightNumber:{
        fontSize: 24,
        color: theme.text,
    },
    ringWrapper: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringCenter: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringPercent: {
        fontSize: 20,
        fontWeight: '700',
        color: theme?.text ?? '#000',
    },
    ringLabel: {
        fontSize: 12,
        color: theme?.textSecondary ?? '#666',
    },
    controlsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
    },
    controlButton: {
        backgroundColor: theme?.primary ?? '#007AFF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    controlText: {
        color: '#fff',
        fontWeight: '600',
    },
    cardContainer: {
        backgroundColor: theme?.surface ?? '#f2f2f2',
        borderRadius: 14,
        padding: 16,
        marginTop: 20,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: 0,
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3, // Android
    },
    cardHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#ccc',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
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
    },
    pillActive: {
        backgroundColor: theme?.primary ?? '#b22222',
        elevation: 2,
    },
    pillText: {
        color: '#333',
        fontWeight: '600',
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
    }
});