import UpgradeModal from '@/components/UpgradeModal';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SubscriptionScreen() {
    const { theme } = useContext(ThemeContext);
    const { user, userRole } = useAuth();
    const styles = createStyles(theme);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState('free');

    // Update current plan based on userRole
    useEffect(() => {
        if (userRole === 'premium' || userRole === 'admin' || userRole === 'nutritionist') {
            setCurrentPlan('premium');
        } else {
            setCurrentPlan('free');
        }
    }, [userRole]);

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: '$0',
            period: 'forever',
            features: [
                'Basic calorie tracking',
                'Manual food logging',
                'Basic meal suggestions',
                'Save & view nutrition tips',
                'Standard support'
            ],
            color: '#95a5a6',
            icon: 'leaf-outline'
        },
        {
            id: 'premium',
            name: 'Premium',
            price: '$4.99',
            period: 'per month',
            features: [
                'Advanced calorie tracking',
                'AI-powered food recognition',
                'Personalized meal plans',
                'Full tips history access',
                'Save & view nutrition tips',
                'Progress analytics',
                'Priority support',
                'Ad-free experience',
                'Export health data'
            ],
            color: '#FFD700',
            icon: 'diamond-outline',
            popular: true
        }
    ];

    const handleSubscribe = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated. Please log in again.');
            return;
        }

        if (isProcessing) return; // Prevent duplicate submissions

        setIsProcessing(true);
        console.log('Upgrading to premium subscription');

        try {
            // Update role to premium in Firebase
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                role: 'premium',
                updatedAt: new Date().toISOString(),
            });

            // Manually update local state immediately for instant UI feedback
            setCurrentPlan('premium');
            setShowUpgradeModal(false);
            
            // Show success alert
            Alert.alert(
                '🎉 Account Upgraded!',
                'Your account has been successfully upgraded to Premium. Enjoy all premium features!',
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error upgrading subscription:', error);
            Alert.alert(
                'Upgrade Failed',
                'There was an error processing your subscription. Please try again later.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDowngrade = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated. Please log in again.');
            return;
        }

        // Show confirmation dialog
        Alert.alert(
            'Switch to Free Plan?',
            'You will lose access to all premium features. Are you sure you want to continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Switch to Free',
                    style: 'destructive',
                    onPress: async () => {
                        if (isProcessing) return;

                        setIsProcessing(true);
                        console.log('Downgrading to free plan');

                        try {
                            // Update role to free in Firebase
                            const userRef = doc(db, 'users', user.uid);
                            await updateDoc(userRef, {
                                role: 'free',
                                updatedAt: new Date().toISOString(),
                            });

                            // Manually update local state immediately for instant UI feedback
                            setCurrentPlan('free');
                            
                            // Show success alert
                            Alert.alert(
                                'Plan Changed',
                                'Your account has been switched to the Free plan. You can upgrade again anytime!',
                                [{ text: 'OK' }]
                            );
                        } catch (error) {
                            console.error('Error downgrading subscription:', error);
                            Alert.alert(
                                'Downgrade Failed',
                                'There was an error changing your plan. Please try again later.',
                                [{ text: 'OK' }]
                            );
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Subscription</Text>
                    <Text style={styles.headerSubtitle}>Choose your plan</Text>
                </View>
                <View style={styles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Current Plan Badge */}
                <View style={styles.currentPlanBadge}>
                    <Ionicons 
                        name={currentPlan === 'premium' ? 'diamond' : 'leaf'} 
                        size={20} 
                        color={currentPlan === 'premium' ? '#FFD700' : '#95a5a6'} 
                    />
                    <Text style={styles.currentPlanText}>
                        Current Plan: <Text style={styles.currentPlanName}>{currentPlan === 'premium' ? 'Premium' : 'Free'}</Text>
                    </Text>
                </View>

                {/* Plans */}
                {plans.map((plan) => (
                    <View 
                        key={plan.id}
                        style={[
                            styles.planCard,
                            currentPlan === plan.id && styles.activePlanCard,
                            plan.popular && styles.popularPlanCard
                        ]}
                    >
                        {plan.popular && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularText}>MOST POPULAR</Text>
                            </View>
                        )}

                        <View style={styles.planHeader}>
                            <View style={[styles.planIconCircle, { backgroundColor: plan.color + '20' }]}>
                                <Ionicons name={plan.icon} size={32} color={plan.color} />
                            </View>
                            <View style={styles.planInfo}>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.planPrice}>{plan.price}</Text>
                                    <Text style={styles.planPeriod}>/{plan.period}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Features */}
                        <View style={styles.featuresContainer}>
                            {plan.features.map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Action Button */}
                        {currentPlan === plan.id ? (
                            <View style={[styles.currentButton, { borderColor: plan.color }]}>
                                <Ionicons name="checkmark-circle" size={20} color={plan.color} />
                                <Text style={[styles.currentButtonText, { color: plan.color }]}>
                                    Current Plan
                                </Text>
                            </View>
                        ) : plan.id === 'premium' ? (
                            <TouchableOpacity 
                                style={[styles.upgradeButton, { backgroundColor: plan.color }]}
                                onPress={() => setShowUpgradeModal(true)}
                                disabled={isProcessing}
                            >
                                <Ionicons name="arrow-up-circle" size={20} color="#000" />
                                <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.downgradeButton]}
                                onPress={handleDowngrade}
                                disabled={isProcessing}
                            >
                                <Text style={styles.downgradeButtonText}>Switch to Free</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                {/* Info Section */}
                <View style={styles.infoSection}>
                    <View style={styles.infoCard}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Secure Payments</Text>
                            <Text style={styles.infoDescription}>
                                Your payment information is encrypted and secure
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Ionicons name="refresh" size={24} color={theme.primary} />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>Cancel Anytime</Text>
                            <Text style={styles.infoDescription}>
                                No commitments. Cancel your subscription anytime
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoCard}>
                        <Ionicons name="help-circle" size={24} color={theme.primary} />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoTitle}>24/7 Support</Text>
                            <Text style={styles.infoDescription}>
                                Our team is here to help you anytime
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Upgrade Modal */}
            <UpgradeModal
                visible={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                onSubscribe={handleSubscribe}
            />
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
    currentPlanBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        gap: 8,
    },
    currentPlanText: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    currentPlanName: {
        fontWeight: 'bold',
        color: theme.text,
    },
    planCard: {
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    activePlanCard: {
        borderColor: theme.primary,
    },
    popularPlanCard: {
        borderColor: '#FFD700',
    },
    popularBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#FFD700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    popularText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 1,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    planIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.text,
    },
    planPeriod: {
        fontSize: 14,
        color: theme.textSecondary,
        marginLeft: 4,
    },
    featuresContainer: {
        marginBottom: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    featureText: {
        flex: 1,
        fontSize: 14,
        color: theme.text,
    },
    currentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
        gap: 8,
    },
    currentButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    upgradeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    downgradeButton: {
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
    },
    downgradeButtonText: {
        fontSize: 16,
        color: theme.textSecondary,
    },
    infoSection: {
        marginHorizontal: 20,
        marginTop: 10,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    infoDescription: {
        fontSize: 13,
        color: theme.textSecondary,
        lineHeight: 18,
    },
});
