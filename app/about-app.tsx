import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Linking,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import NetInfo from '@react-native-community/netinfo';

export default function AboutAppScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  const techStack = [
    { name: 'React Native Expo', icon: 'react', color: '#61DAFB' },
    { name: 'TypeScript', icon: 'code', color: '#3178C6' },
    { name: 'Supabase', icon: 'database', color: '#3FCF8E' },
    { name: 'PostgreSQL', icon: 'server', color: '#336791' },
  ];

  const features = [
    'Invoice Creation & Management',
    'Quotation System',
    'PDF Generation',
    'Real-time Database Sync',
    'Client Management',
    'Business Analytics',
  ];

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newIsConnected = state.isConnected;
      
      if (newIsConnected !== isConnected) {
        if (!newIsConnected) {
          showNetworkMessage('error');
        } else {
          showNetworkMessage('success');
        }
      }
      
      setIsConnected(newIsConnected);
    });

    return () => unsubscribe();
  }, [isConnected]);

  const showNetworkMessage = (type: 'error' | 'success') => {
    setShowNetworkAlert(true);
    setNetworkAlertType(type);
    
    Animated.timing(networkAlertAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    if (type === 'success') {
      setTimeout(() => {
        hideNetworkMessage();
      }, 3000);
    }
  };

  const hideNetworkMessage = () => {
    Animated.timing(networkAlertAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowNetworkAlert(false);
    });
  };

  const renderNetworkAlert = () => {
    if (!showNetworkAlert) return null;

    const isError = networkAlertType === 'error';
    const backgroundColor = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    const borderColor = isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    const iconColor = isError ? '#ef4444' : '#10b981';
    const iconName = isError ? 'wifi-slash' : 'wifi';
    const title = isError ? 'No Network Connection' : 'Connection Restored';
    const message = isError ? 'Check your internet connection' : 'Back online';

    return (
      <Animated.View 
        style={[
          styles.networkAlert,
          {
            backgroundColor,
            borderColor,
            opacity: networkAlertAnim,
            transform: [{
              translateY: networkAlertAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        <View style={styles.networkAlertContent}>
          <View style={[styles.networkAlertIcon, { backgroundColor: `${iconColor}20` }]}>
            <Icon name={iconName} size={16} color={iconColor} />
          </View>
          <View style={styles.networkAlertText}>
            <Text style={[styles.networkAlertTitle, { color: iconColor }]}>
              {title}
            </Text>
            <Text style={styles.networkAlertMessage}>
              {message}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={hideNetworkMessage}
            style={[styles.networkAlertClose, { backgroundColor: `${iconColor}20` }]}
          >
            <Icon name="xmark" size={14} color={iconColor} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const openWebsite = () => {
    if (!isConnected) {
      showNetworkMessage('error');
      return;
    }
    Linking.openURL('https://aksagensetservices.co.ke');
  };

  const openWhatsApp = () => {
    const phoneNumber = '+254773743248';
    const url = `https://wa.me/${phoneNumber.replace('+', '')}`;
    Linking.openURL(url);
  };

  const contactDeveloper = () => {
    openWhatsApp();
  };

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <View style={[styles.headerContent, isSmallScreen && styles.headerContentSmall]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="chevron-left" size={20} color="#C3B1E1" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>About</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="circle-info" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>
      {!isConnected && (
        <View style={styles.offlineBadge}>
          <Icon name="wifi-slash" size={10} color="#ef4444" />
          <Text style={styles.offlineBadgeText}>Offline Mode</Text>
        </View>
      )}
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <View style={styles.heroCard}>
        <View style={styles.appLogoContainer}>
          <View style={styles.appLogo}>
            <Icon name="bolt" size={40} color="#000000" />
          </View>
        </View>
        
        <View style={styles.appInfo}>
          <Text style={styles.appName}>InvoicePro</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appTagline}>
            Professional Invoicing & Quotation Management
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDeveloperSection = () => (
    <View style={styles.developerSection}>
      <Text style={styles.sectionTitle}>Developer</Text>
      <View style={styles.developerCard}>
        <View style={styles.developerAvatar}>
          <Icon name="user-graduate" size={32} color="#C3B1E1" />
        </View>
        <View style={styles.developerInfo}>
          <Text style={styles.developerName}>Simon Ngugi Kagiri</Text>
          <Text style={styles.developerTitle}>Full Stack Developer</Text>
          
          <View style={styles.developerDetails}>
            <View style={styles.detailItem}>
              <Icon name="university" size={12} color="#4ECDC4" />
              <Text style={styles.detailText}>KCA University - IT Student</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="location-dot" size={12} color="#FF6B6B" />
              <Text style={styles.detailText}>Nairobi, Kenya</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={contactDeveloper}
          >
            <Icon name="whatsapp" size={16} color="#25D366" />
            <Text style={styles.contactButtonText}>Connect on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTechStack = () => (
    <View style={styles.techSection}>
      <Text style={styles.sectionTitle}>Built With</Text>
      <View style={styles.techGrid}>
        {techStack.map((tech, index) => (
          <View key={index} style={styles.techCard}>
            <View style={[styles.techIconContainer, { backgroundColor: `${tech.color}15` }]}>
              <Icon name={tech.icon as any} size={22} color={tech.color} />
            </View>
            <Text style={styles.techName}>{tech.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.featuresSection}>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.featuresGrid}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="check" size={12} color="#10b981" />
            </View>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footerSection}>
      <View style={styles.companyCard}>
        <Text style={styles.companyName}>Aksa Genset Services</Text>
        <Text style={styles.companyDescription}>
          Professional power solutions and maintenance services based in Nairobi, Kenya.
        </Text>
        
        <TouchableOpacity 
          style={styles.websiteButton}
          onPress={openWebsite}
        >
          <Icon name="globe" size={16} color="#C3B1E1" />
          <Text style={styles.websiteText}>Visit Website</Text>
          <Icon name="arrow-right" size={12} color="#C3B1E1" />
        </TouchableOpacity>
        
        <View style={styles.contactInfo}>
          <View style={styles.contactItem}>
            <Icon name="phone" size={12} color="#8E8E93" />
            <Text style={styles.contactText}>0722 222257</Text>
          </View>
          <View style={styles.contactItem}>
            <Icon name="envelope" size={12} color="#8E8E93" />
            <Text style={styles.contactText}>info@aksagensetservices.co.ke</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.copyrightSection}>
        <Text style={styles.copyrightText}>
          © 2024-2026 InvoicePro. All rights reserved.
        </Text>
        <Text style={styles.developedBy}>
          Developed with <Icon name="heart" size={10} color="#FF6B6B" /> by Simon Ngugi Kagiri
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderNetworkAlert()}
      {renderHeader()}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeroSection()}
        {renderDeveloperSection()}
        {renderTechStack()}
        {renderFeatures()}
        {renderFooter()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  networkAlert: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  networkAlertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  networkAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  networkAlertText: {
    flex: 1,
  },
  networkAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  networkAlertMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  networkAlertClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    marginLeft: 20,
    gap: 4,
  },
  offlineBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Header
  header: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  headerSmall: {
    paddingVertical: 10,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContentSmall: {
    paddingHorizontal: 15,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitleSmall: {
    fontSize: 20,
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero Section
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  heroCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  appLogoContainer: {
    marginBottom: 16,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#C3B1E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    alignItems: 'center',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  appVersion: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  appTagline: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Developer Section
  developerSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  developerCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  developerAvatar: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  developerInfo: {
    flex: 1,
  },
  developerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  developerTitle: {
    color: '#C3B1E1',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  developerDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#8E8E93',
    fontSize: 12,
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.2)',
  },
  contactButtonText: {
    color: '#25D366',
    fontSize: 13,
    fontWeight: '600',
  },
  // Tech Stack
  techSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  techIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  techName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Features
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  featureIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  // Footer
  footerSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  companyCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  companyName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  companyDescription: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  websiteText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  contactInfo: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  copyrightText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  developedBy: {
    color: '#6B6B6B',
    fontSize: 11,
    textAlign: 'center',
  },
});