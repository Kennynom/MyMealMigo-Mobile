// Create: app/(tabs)/(tracker)/calorie-tracker.jsx
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export default function CalorieTrackerScreen() {
    const { theme } = useContext(ThemeContext); 
    const [period, setPeriod] = useState('weekly');
    const [caloriesSet, setCaloriesSet] = useState(0);
    const [consumed, setConsumed] = useState(0);
    const [remaining, setRemaining] = useState(0);
    const [dailyMacro, setDailyMacro] = useState({ carbs: 0, protein: 0, fats: 0 });
    const [weeklyMacro, setWeeklyMacro] = useState({ carbs: 0, protein: 0, fats: 0 });
    const [monthlyMacro, setMonthlyMacro] = useState({ carbs: 0, protein: 0, fats: 0 });
    const [history, setHistory] = useState({month: { carbs: 0, protein: 0, fats: 0 }});
    const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

    // Function to calculate remaining calories
    const calculateRemaining = (caloriesSet, consumed) => {
        setRemaining((caloriesSet - consumed)/caloriesSet * 100);
    }

    // set initial values once
    useEffect(() => {
        setCaloriesSet(2500); // Example static value, replace with user input logic
        setConsumed(200); // Initial consumed calories
    }, []);

    // when calories or consumed changes, recalculate remaining
    useEffect(() => {
        calculateRemaining(caloriesSet, consumed);
    }, [caloriesSet, consumed]);

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
            <View>
                <Text style={styles.overviewHeader}>Overview</Text>
                <View style={styles.overviewContainer}>
                    <View style={styles.consumedSection}>
                        <Text style={styles.consumedNumber}>{consumed}</Text>
                        <Text style={styles.consumedText}>Consumed</Text>
                    </View>

                    <View style={styles.remainingSection}>
                        {/* Circular progress ring showing percent remaining */}
                        {(() => {
                            const percent = caloriesSet > 0
                                ? Math.max(0, Math.min(100, Math.round(((caloriesSet - consumed) / caloriesSet) * 100)))
                                : 0;
                            const radius = 55;
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
                        <Text style={styles.setNumber}>{caloriesSet}</Text>
                        <Text style={styles.setText}>Set</Text>
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

                    <View style={styles.nutritionList}>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Calories:</Text>
                            <Text style={styles.rowValue}>{caloriesSet}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Carbs:</Text>
                            <Text style={styles.rowValue}>{dailyMacro.carbs}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Protein:</Text>
                            <Text style={styles.rowValue}>{dailyMacro.protein}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Fats:</Text>
                            <Text style={styles.rowValue}>{dailyMacro.fats}</Text>
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
    consumedNumber: {
        fontSize: 24,
        color: theme.text,
    },
    consumedText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    remainingSection: {
        alignItems: 'center',
        color: theme.text,
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
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    setNumber: {
        fontSize: 24,
        color: theme.text,
    },
    setText: {
        fontSize: 14,
        color: theme.textSecondary,
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
});