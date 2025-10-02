// components/hero.jsx - Fix window error
import React from "react";
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

export function Hero({
  title1,
  title2,
  description,
  videoURL,
  imageURL,
  mediaType,
  children,
}) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.maxWidth}>
        <View style={styles.flexContainer}>
          {/* Text Section */}
          <View style={styles.textSection}>
            <View style={styles.mainContent}>
              <View style={styles.textAlign}>
                <Text style={styles.heroTitle}>
                  <Text style={styles.titleBlock}>{title1}</Text>
                  {'\n'}
                  <Text style={[styles.titleBlock, styles.greenText]}>{title2}</Text>
                </Text>
                <Text style={styles.description}>
                  {description}
                </Text>
                {children && (
                  <View style={styles.childrenContainer}>
                    {children}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Media Section */}
          <View style={styles.mediaSection}>
            <View style={styles.mediaContainer}>
              {mediaType === "video" && videoURL ? (
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.placeholderText}>🎥</Text>
                  <Text style={styles.placeholderSubtext}>Video Player</Text>
                </View>
              ) : imageURL ? (
                <Image
                  source={{ uri: imageURL }}  // ← Remove .trimEnd() if causing issues
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('Image load error:', error);
                  }}
                />
              ) : (
                <View style={styles.placeholderContainer}>
                  <Text style={styles.placeholderIcon}>🥗</Text>
                  <Text style={styles.placeholderTitle}>MyMealMigo</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    paddingVertical: Platform.OS === 'web' ? 60 : 20,
  },
  
  maxWidth: {
    maxWidth: Platform.OS === 'web' ? 1200 : '100%',
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    width: '100%',
  },
  
  flexContainer: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: Platform.OS === 'web' ? 'center' : 'center',
    gap: Platform.OS === 'web' ? 48 : 20,
    minHeight: Platform.OS === 'web' ? 500 : 'auto',
  },
  
  textSection: {
    flex: Platform.OS === 'web' ? 1 : 0,
    maxWidth: Platform.OS === 'web' ? 550 : '100%',
    paddingRight: Platform.OS === 'web' ? 24 : 0,
  },
  
  mainContent: {
    paddingTop: Platform.OS === 'web' ? 40 : 20,
  },
  
  textAlign: {
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.025,
    lineHeight: Platform.OS === 'web' ? 56 : 38,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
    marginBottom: 16,
  },
  
  titleBlock: {
    // Block behavior handled by Text structure
  },
  
  greenText: {
    color: '#58e221',
  },
  
  description: {
    marginTop: 16,
    fontSize: Platform.OS === 'web' ? 18 : 16,
    color: '#6b7280',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
    lineHeight: Platform.OS === 'web' ? 28 : 24,
    marginBottom: 24,
  },
  
  childrenContainer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
    alignItems: 'center',
  },
  
  mediaSection: {
    flex: Platform.OS === 'web' ? 1 : 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'web' ? 40 : 20,
  },
  
  mediaContainer: {
    position: 'relative',
    aspectRatio: 1,
    width: Platform.OS === 'web' ? 380 : 280,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  
  heroImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  
  videoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  
  placeholderIcon: {
    fontSize: 72,
    marginBottom: 12,
  },
  
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#58e221',
    letterSpacing: 0.5,
  },
  
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  
  placeholderSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});