import { ThemeContext } from '@/context/ThemeContext';
import React, { useContext } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function Pricing({
    buttonText,
    description,
    featured,
    features = [],
    name,
    price,
}) {
    const { theme } = useContext(ThemeContext);

    return (
        <View style={[
            styles.pricingCard,
            featured && styles.featuredCard,
            { backgroundColor: theme.cardBackground }
        ]}>
            {featured && (
                <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>Featured</Text>
                </View>
            )}
            
            <Text style={[styles.planName]}>{name}</Text>
            <Text style={[styles.price]}>
                ${price}{price > 0 ? '/month' : ''}
            </Text>
            <Text style={[styles.description]}>
                {description}
            </Text>

            <View style={styles.featuresContainer}>
                {features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                        <Text style={styles.checkmark}>✓</Text>
                        <Text style={[styles.featureText]}>
                            {feature}
                        </Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity 
                style={[
                    styles.button,
                    featured 
                        ? { backgroundColor: theme.primary }
                        : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.primary }
                ]}
            >
                <Text style={[
                    styles.buttonText,
                    { color: featured ? '#fff' : theme.primary }
                ]}>
                    {buttonText}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    pricingCard: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minHeight: 400,
        width: Platform.OS === 'web' ? 300 : '90%',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    featuredCard: {
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    featuredBadge: {
        position: 'absolute',
        top: -10,
        right: 20,
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    featuredText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    planName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#000000', // Explicit black color
    },
    price: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#059669', // Explicit green color
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#333333', // Explicit dark grey
    },
    featuresContainer: {
        flex: 1,
        marginBottom: 24,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkmark: {
        color: '#28a745',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 12,
    },
    featureText: {
        fontSize: 16,
        flex: 1,
        color: '#000000', // Explicit black color
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});