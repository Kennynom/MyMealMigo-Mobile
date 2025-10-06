// components/layouts/WebLayout.jsx - Remove all redirects except home
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { router, usePathname } from 'expo-router';
import { useContext, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WebLayout({ children }) {
  // Only render on web
  if (Platform.OS !== 'web') return children;

  const { theme, colorScheme, toggleTheme } = useContext(ThemeContext);
  const { user, canAccessWeb, logout } = useAuth();
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const styles = createStyles(theme);

  const getActiveSection = () => {
    if (pathname.includes('home')) return 'home';
    if (pathname.includes('logs')) return 'features';
    if (pathname.includes('add')) return 'download';
    if (pathname.includes('tracker')) return 'calculators';
    if (pathname.includes('discover')) return 'pricing';
    return 'home';
  };

  const activeSection = getActiveSection();

  return (
    <View style={styles.container}>
      {/* MyMealMigo Website Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navContainer}>
          
          <TouchableOpacity onPress={() => router.push('/(tabs)/(home)')}>
            <Text style={styles.brand}>MyMealMigo</Text>
          </TouchableOpacity>
          
          <View style={styles.navLinks}>
            
            <TouchableOpacity style={[styles.navLink, activeSection === 'features' && styles.activeNavLink
              // onPress={}
            ]}>
              <Text style={[styles.navText, activeSection === 'features' && styles.activeNavText]}>
                Features
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navLink, activeSection === 'pricing' && styles.activeNavLink
              // onPress={}
            ]}>
              <Text style={[styles.navText, activeSection === 'pricing' && styles.activeNavText]}>
                Pricing
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navText}>Testimonials</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navText}>How It Works</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navLink, activeSection === 'download' && styles.activeNavLink
              // onPress={}
            ]}>
              <Text style={[styles.navText, activeSection === 'download' && styles.activeNavText]}>
                Download
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.navLink, activeSection === 'calculators' && styles.activeNavLink
              // onPress={}
            ]}>
              <Text style={[styles.navText, activeSection === 'calculators' && styles.activeNavText]}>
                Calculators
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navLink}>
              <Text style={styles.navText}>About Project</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.authSection}>
            {user && canAccessWeb ? (
              <>
                <Text style={styles.welcomeText}>Welcome, {user.email}</Text>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={() => setShowLoginModal(true)}
              >
                <Text style={styles.loginText}>Admin Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Content - the existing screens */}
      <View style={styles.content}>
        {children}
      </View>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <LoginForm onSuccess={() => setShowLoginModal(false)} />
          </View>
        </View>
      )}
    </View>
  );
}

// ... rest of your styles stay the same ...
const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  navbar: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  navContainer: {
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 16,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  activeNavLink: {
    borderBottomWidth: 2,
    borderBottomColor: '#58e221',
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeNavText: {
    color: '#58e221',
  },
  authSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6b7280',
  },  
  loginButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loginText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  
  // MODAL STYLES
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 20,
    zIndex: 1,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
});