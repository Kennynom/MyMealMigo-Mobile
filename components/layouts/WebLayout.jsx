// components/layouts/WebLayout.jsx - Remove all redirects except home
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router, usePathname } from 'expo-router';

export default function WebLayout({ children }) {
  // Only render on web
  if (Platform.OS !== 'web') return children;

  const { theme, colorScheme, toggleTheme } = useContext(ThemeContext);
  const pathname = usePathname();
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

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content - the existing screens */}
      <View style={styles.content}>
        {children}
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#58e221',
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
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  content: {
    flex: 1,
  },
});