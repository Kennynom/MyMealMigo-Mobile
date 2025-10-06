import { ThemeContext } from '@/context/ThemeContext';
import React, { useContext } from "react";
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function Footer() {
    const { theme } = useContext(ThemeContext);

    const handleEmailPress = () => {
        Linking.openURL('mailto:support@mymealmigo.com');
    };

    const handlePhonePress = () => {
        Linking.openURL('tel:+1234567890');
    };

    const handleSocialPress = (url) => {
        Linking.openURL(url);
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {/* Company Info */}
                <View style={styles.section}>
                    <Text style={styles.logo}>MyMealMigo</Text>
                    <Text style={styles.tagline}>
                        Your all-in-one nutrition companion for a healthier lifestyle.
                    </Text>
                    <Text style={styles.copyright}>
                        © 2025 MyMealMigo. All rights reserved.
                    </Text>
                </View>

                {/* Contact Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>
                    
                    <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                        <Text style={styles.contactIcon}>✉️</Text>
                        <Text style={styles.contactText}>support@mymealmigo.com</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
                        <Text style={styles.contactIcon}>📞</Text>
                        <Text style={styles.contactText}>+1 (234) 567-8900</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.contactItem}>
                        <Text style={styles.contactIcon}>📍</Text>
                        <Text style={styles.contactText}>
                            123 Health Street{'\n'}
                            Wellness City, WC 12345{'\n'}
                            United States
                        </Text>
                    </View>
                </View>

                {/* Quick Links */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Links</Text>
                    
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={styles.linkText}>About Us</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.linkItem}>
                        <Text style={styles.linkText}>Help & Support</Text>
                    </TouchableOpacity>
                </View>

                {/* Social Media */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Follow Us</Text>
                    
                    <View style={styles.socialContainer}>
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('https://facebook.com/mymealmigo')}
                        >
                            <Text style={styles.socialIcon}>📘</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('https://twitter.com/mymealmigo')}
                        >
                            <Text style={styles.socialIcon}>🐦</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('https://instagram.com/mymealmigo')}
                        >
                            <Text style={styles.socialIcon}>📷</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('https://linkedin.com/company/mymealmigo')}
                        >
                            <Text style={styles.socialIcon}>💼</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
                <Text style={styles.bottomText}>
                    Made with ❤️ for a healthier world
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1f2937',
        paddingTop: 60,
    },
    content: {
        flexDirection: Platform.OS === 'web' ? 'row' : 'column',
        justifyContent: 'space-between',
        alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
        paddingHorizontal: 20,
        paddingBottom: 40,
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        gap: Platform.OS === 'web' ? 40 : 30,
    },
    section: {
        flex: Platform.OS === 'web' ? 1 : 0,
        alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
        maxWidth: Platform.OS === 'web' ? 250 : '100%',
    },
    logo: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#58e221',
        marginBottom: 12,
        textAlign: Platform.OS === 'web' ? 'left' : 'center',
    },
    tagline: {
        fontSize: 14,
        color: '#9ca3af',
        lineHeight: 20,
        marginBottom: 16,
        textAlign: Platform.OS === 'web' ? 'left' : 'center',
    },
    copyright: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: Platform.OS === 'web' ? 'left' : 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 16,
        textAlign: Platform.OS === 'web' ? 'left' : 'center',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        maxWidth: 200,
    },
    contactIcon: {
        fontSize: 16,
        marginRight: 8,
        width: 20,
    },
    contactText: {
        fontSize: 14,
        color: '#d1d5db',
        flex: 1,
        lineHeight: 18,
    },
    linkItem: {
        marginBottom: 8,
    },
    linkText: {
        fontSize: 14,
        color: '#d1d5db',
        textAlign: Platform.OS === 'web' ? 'left' : 'center',
    },
    socialContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
    },
    socialButton: {
        width: 40,
        height: 40,
        backgroundColor: '#374151',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    socialIcon: {
        fontSize: 20,
    },
    bottomBar: {
        backgroundColor: '#111827',
        paddingVertical: 16,
        alignItems: 'center',
    },
    bottomText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    },
});