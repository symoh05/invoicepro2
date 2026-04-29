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
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';
import NetInfo from '@react-native-community/netinfo';

export default function CreateOptionsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  const options = [
    {
      id: 'invoice',
      title: 'Create Invoice',
      description: 'Generate a new invoice for your client',
      icon: 'file-invoice-dollar',
      color: '#C3B1E1',
      bgColor: 'rgba(195, 177, 225, 0.1)',
      path: '/create-invoice',
    },
    {
      id: 'quotation',
      title: 'Create Quotation',
      description: 'Prepare a quotation for potential clients',
      icon: 'quote-right',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      path: '/create-quotation',
    },
    {
      id: 'client',
      title: 'Add Client',
      description: 'Add a new client to your database',
      icon: 'user-plus',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      path: '/add-client',
    },
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

  const handleOptionPress = (path: string, requiresConnection: boolean = true) => {
    if (requiresConnection && !isConnected) {
      showNetworkMessage('error');
      return;
    }
    router.push(path);
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

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>
            Create New
          </Text>
          {!isConnected && (
            <View style={styles.offlineBadge}>
              <Icon name="wifi-slash" size={10} color="#ef4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderNetworkAlert()}
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.welcomeSection}>
          <Text style={[styles.welcomeText, isSmallScreen && styles.welcomeTextSmall]}>
            What would you like to create?
          </Text>
          <Text style={[styles.subtitle, isSmallScreen && styles.subtitleSmall]}>
            {isConnected ? 'Select an option to get started' : 'Working offline - some features limited'}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {options.map((option) => {
            const requiresConnection = option.id !== 'client';
            const isDisabled = requiresConnection && !isConnected;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard, 
                  isSmallScreen && styles.optionCardSmall,
                  isDisabled && styles.optionCardDisabled
                ]}
                onPress={() => handleOptionPress(option.path, requiresConnection)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={[
                  styles.optionIcon, 
                  { backgroundColor: option.bgColor },
                  isDisabled && styles.optionIconDisabled
                ]}>
                  <Icon 
                    name={option.icon as any} 
                    size={isSmallScreen ? 20 : 22} 
                    color={isDisabled ? '#666666' : option.color} 
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[
                    styles.optionTitle, 
                    isSmallScreen && styles.optionTitleSmall,
                    isDisabled && styles.optionTitleDisabled
                  ]}>
                    {option.title}
                    {isDisabled && ' (Offline)'}
                  </Text>
                  <Text style={[
                    styles.optionDescription, 
                    isSmallScreen && styles.optionDescriptionSmall,
                    isDisabled && styles.optionDescriptionDisabled
                  ]}>
                    {isDisabled ? 'Requires internet connection' : option.description}
                  </Text>
                </View>
                <Icon 
                  name="chevron-right" 
                  size={14} 
                  color={isDisabled ? '#666666' : '#8E8E93'} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <Icon name="lightbulb" size={18} color="#f59e0b" />
            <Text style={[styles.tipsTitle, isSmallScreen && styles.tipsTitleSmall]}>
              Quick Tips
            </Text>
          </View>
          
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color="#10b981" style={styles.tipIcon} />
              <Text style={[styles.tipText, isSmallScreen && styles.tipTextSmall]}>
                Save frequently used items as templates
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color="#10b981" style={styles.tipIcon} />
              <Text style={[styles.tipText, isSmallScreen && styles.tipTextSmall]}>
                Use client profiles for faster invoice creation
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Icon name="check-circle" size={14} color="#10b981" style={styles.tipIcon} />
              <Text style={[styles.tipText, isSmallScreen && styles.tipTextSmall]}>
                {isConnected ? 
                  'Convert accepted quotations to invoices instantly' : 
                  'Work will sync when connection is restored'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <BottomNav />
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    gap: 4,
  },
  offlineBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
  },
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  welcomeTextSmall: {
    fontSize: 24,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
  subtitleSmall: {
    fontSize: 14,
  },
  optionsGrid: {
    gap: 14,
    marginBottom: 30,
  },
  optionCard: {
    backgroundColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#24262B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
  },
  optionCardSmall: {
    padding: 16,
    borderRadius: 12,
  },
  optionCardDisabled: {
    backgroundColor: '#000000',
    borderColor: '#333333',
    opacity: 0.7,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIconDisabled: {
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionTitleSmall: {
    fontSize: 16,
  },
  optionTitleDisabled: {
    color: '#666666',
  },
  optionDescription: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
  },
  optionDescriptionSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  optionDescriptionDisabled: {
    color: '#666666',
  },
  tipsSection: {
    backgroundColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  tipsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  tipsTitleSmall: {
    fontSize: 16,
  },
  tipsContent: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    color: '#8E8E93',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tipTextSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
});