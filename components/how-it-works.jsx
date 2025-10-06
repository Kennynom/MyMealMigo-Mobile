import { ThemeContext } from '@/context/ThemeContext';
import React, { useContext } from "react";
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

export function HowItWorks({ howItWorks = [] }) {
    const { theme } = useContext(ThemeContext);

    if (!howItWorks || howItWorks.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>How It Works</Text>
                <Text style={styles.subtitle}>
                    Get started with MyMealMigo in just 3 simple steps
                </Text>
            </View>

            <View style={styles.stepsContainer}>
                {howItWorks.map((step, index) => (
                    <View key={index} style={styles.stepCard}>
                        {/* Step Number */}
                        <View style={styles.stepNumber}>
                            <Text style={styles.stepNumberText}>{index + 1}</Text>
                        </View>

                        {/* Step Image */}
                        {step.image && step.image !== "/placeholder.svg" ? (
                            <Image
                                source={{ uri: step.image }}
                                style={styles.stepImage}
                                onError={() => console.log('Step image failed to load')}
                            />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={styles.placeholderIcon}>
                                    {index === 0 ? '👤' : index === 1 ? '📱' : '📊'}
                                </Text>
                            </View>
                        )}

                        {/* Step Content */}
                        <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>{step.title}</Text>
                            <Text style={styles.stepDescription}>{step.description}</Text>
                        </View>

                        {/* Connecting Line (except for last step) */}
                        {index < howItWorks.length - 1 && Platform.OS === 'web' && (
                            <View style={styles.connectingLine} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        paddingVertical: 80,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
        maxWidth: 600,
        alignSelf: 'center',
    },
    title: {
        fontSize: Platform.OS === 'web' ? 36 : 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 16,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Platform.OS === 'web' ? 18 : 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 28 : 24,
    },
    stepsContainer: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'center',
        alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
        flexWrap: Platform.OS === 'web' ? 'nowrap' : 'wrap',
        maxWidth: 1200,
        alignSelf: 'center',
        gap: Platform.OS === 'web' ? 40 : 30,
    },
    stepCard: {
        alignItems: 'center',
        maxWidth: Platform.OS === 'web' ? 300 : '100%',
        position: 'relative',
        flex: Platform.OS === 'web' ? 1 : 0,
    },
    stepNumber: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#059669',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        shadowColor: '#044732',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    stepNumberText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    stepImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginBottom: 24,
        backgroundColor: '#f8fafc',
    },
    placeholderImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#f8fafc',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#e5e7eb',
        borderStyle: 'dashed',
    },
    placeholderIcon: {
        fontSize: 48,
    },
    stepContent: {
        alignItems: 'center',
        maxWidth: 280,
    },
    stepTitle: {
        fontSize: Platform.OS === 'web' ? 24 : 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    stepDescription: {
        fontSize: Platform.OS === 'web' ? 16 : 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 24 : 20,
    },
    connectingLine: {
        position: 'absolute',
        top: 30,
        right: -20,
        width: 40,
        height: 2,
        backgroundColor: '#e5e7eb',
        zIndex: -1,
    },
});
