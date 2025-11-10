import { ThemeContext } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useContext, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function UpgradeModal({ visible, onClose, onSubscribe }) {
  const { theme } = useContext(ThemeContext);

  const handleSubscribe = () => {
    if (onSubscribe) {
      onSubscribe();
    }
  };

  const features = [
    'Unlimited meal logging',
    'Advanced nutrition insights',
    'Personalized meal recommendations',
    'Export meal history',
    'Priority customer support',
    'Ad-free experience',
    'Custom calorie goals',
    'Detailed analytics & reports',
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.surface }]}
            onPress={onClose}
          >
            <MaterialIcons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Become a healthier,{'\n'}happier you.
              </Text>
              <View style={[styles.priceBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.priceText}>$4.99/month</Text>
              </View>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Unlock all premium features
              </Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresSection}>
              <Text style={[styles.featuresTitle, { color: theme.text }]}>
                Premium Features:
              </Text>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={20} color={theme.primary} />
                  <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Subscribe Button */}
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: theme.primary }]}
              onPress={handleSubscribe}
              activeOpacity={0.8}
            >
              <Text style={styles.subscribeButtonText}>Subscribe & Unlock Premium</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={[styles.termsText, { color: theme.textSecondary }]}>
              By subscribing, you agree to our terms of service. Cancel anytime.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  discountBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  priceBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  featuresSection: {
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  subscribeButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
