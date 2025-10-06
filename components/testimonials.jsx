import { ThemeContext } from '@/context/ThemeContext';
import React, { useContext, useRef, useState } from "react";
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

export function Testimonials({ testimonials = [] }) {
    const { theme } = useContext(ThemeContext);
    const [scrollProgress, setScrollProgress] = useState(0);
    const scrollViewRef = useRef(null);

    if (!testimonials || testimonials.length === 0) {
        return null;
    }

    const handleScroll = (event) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const scrollableWidth = contentSize.width - layoutMeasurement.width;
        const progress = scrollableWidth > 0 ? contentOffset.x / scrollableWidth : 0;
        setScrollProgress(Math.max(0, Math.min(1, progress)));
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Text key={index} style={[
                styles.star,
                { color: index < rating ? '#FFD700' : '#E0E0E0' }
            ]}>
                ★
            </Text>
        ));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>What Our Users Say</Text>
                </View>
                <Text style={styles.subtitle}>
                    Join thousands of users who have transformed their nutrition journey
                </Text>
                <View style={styles.scrollIndicator}>
                        <Text style={styles.scrollText}>Scroll for more</Text>
                        <Text style={styles.arrowIcon}>→</Text>
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
                style={styles.scrollView}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {testimonials.map((testimonial, index) => (
                    <View key={index} style={styles.testimonialCard}>
                        {/* User Image */}
                        {testimonial.image ? (
                            <Image
                                source={{ uri: testimonial.image }}
                                style={styles.userImage}
                                onError={() => console.log('Image failed to load')}
                            />
                        ) : (
                            <View style={styles.placeholderImage}>
                                <Text style={styles.placeholderText}>
                                    {testimonial.name?.charAt(0) || '?'}
                                </Text>
                            </View>
                        )}

                        {/* Rating Stars */}
                        <View style={styles.starsContainer}>
                            {renderStars(testimonial.rating || 5)}
                        </View>

                        {/* Testimonial Content */}
                        <Text style={styles.content}>
                            "{testimonial.content}"
                        </Text>

                        {/* User Info */}
                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{testimonial.name}</Text>
                            {testimonial.role && (
                                <Text style={styles.userRole}>{testimonial.role}</Text>
                            )}
                            {testimonial.location && (
                                <Text style={styles.userLocation}>{testimonial.location}</Text>
                            )}
                        </View>
                    </View>
                ))}
            </ScrollView>
            
            {/* Visual Scroll Bar Indicator */}
            <View style={styles.scrollBarContainer}>
                <View style={styles.scrollBarTrack}>
                    <View 
                        style={[
                            styles.scrollBarThumb,
                            { 
                                left: `${scrollProgress * 80}%`, // 80% to account for thumb width
                                backgroundColor: '#58e221' 
                            }
                        ]} 
                    />
                </View>
            </View>
            
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f8fafc',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        maxWidth: 600,
        alignSelf: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        marginBottom: 12,
    },
    title: {
        fontSize: Platform.OS === 'web' ? 36 : 28,
        fontWeight: 'bold',
        color: '#1f2937',
        textAlign: 'center',
        flex: 1,
    },
    scrollIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 16,
    },
    scrollText: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 4,
        fontWeight: '500',
    },
    arrowIcon: {
        fontSize: 14,
        color: '#059669',
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: Platform.OS === 'web' ? 18 : 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: Platform.OS === 'web' ? 28 : 24,
    },
    scrollView: {
        flexGrow: 0,
    },
    scrollContainer: {
        paddingHorizontal: Platform.OS === 'web' ? 20 : 10,
        gap: 20,
    },
    testimonialCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        width: Platform.OS === 'web' ? 350 : 280,
        marginRight: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        alignItems: 'center',
        minHeight: 300,
    },
    userImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginBottom: 16,
    },
    placeholderImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#58e221',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    placeholderText: {
        color: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    starsContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    star: {
        fontSize: 18,
        marginHorizontal: 1,
    },
    content: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 20,
        flex: 1,
        fontStyle: 'italic',
    },
    userInfo: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    userRole: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '600',
        marginBottom: 2,
    },
    userLocation: {
        fontSize: 12,
        color: '#9ca3af',
    },
    scrollBarContainer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    scrollBarTrack: {
        width: '60%',
        height: 4,
        backgroundColor: '#e5e7eb',
        borderRadius: 2,
        position: 'relative',
    },
    scrollBarThumb: {
        position: 'absolute',
        width: '20%',
        height: 4,
        borderRadius: 2,
        top: 0,
    },
});
