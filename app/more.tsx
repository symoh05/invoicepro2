import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';
import NetInfo from '@react-native-community/netinfo';

export default function MoreScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalQuotations: 0,
    totalProducts: 0,
    totalClients: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  // Supabase configuration
  const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

  // Fetch counts from Supabase
  const fetchCounts = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch invoices count
      const invoicesResponse = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=id`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setStats(prev => ({ ...prev, totalInvoices: invoicesData.length || 0 }));
      }
      
      // Fetch quotations count
      const quotesResponse = await fetch(`${SUPABASE_URL}/rest/v1/quotations?select=id`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (quotesResponse.ok) {
        const quotesData = await quotesResponse.json();
        setStats(prev => ({ ...prev, totalQuotations: quotesData.length || 0 }));
      }

      // Fetch products count
      const productsResponse = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setStats(prev => ({ ...prev, totalProducts: productsData.length || 0 }));
      }

      // Fetch clients count (from unique client names in invoices and quotations)
      const allClients = new Set();
      
      const allInvoices = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=client_name`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (allInvoices.ok) {
        const invoices = await allInvoices.json();
        invoices.forEach((inv: any) => allClients.add(inv.client_name));
      }
      
      const allQuotes = await fetch(`${SUPABASE_URL}/rest/v1/quotations?select=client_name`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      if (allQuotes.ok) {
        const quotes = await allQuotes.json();
        quotes.forEach((quote: any) => allClients.add(quote.client_name));
      }
      
      setStats(prev => ({ ...prev, totalClients: allClients.size }));
    } catch (error) {
      console.error('Error fetching counts:', error);
      if (!isConnected) {
        showNetworkMessage('error');
      } else {
        Alert.alert('Error', 'Failed to load data. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const newIsConnected = state.isConnected;
      
      if (newIsConnected !== isConnected) {
        if (!newIsConnected) {
          showNetworkMessage('error');
        } else {
          showNetworkMessage('success');
          setTimeout(() => {
            fetchCounts();
          }, 1500);
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

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleAboutPress = () => {
    router.push('/about-app');
  };

  const renderNetworkAlert = () => {
    if (!showNetworkAlert) return null;

    const isError = networkAlertType === 'error';
    const backgroundColor = isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    const borderColor = isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    const iconColor = isError ? '#ef4444' : '#10b981';
    const iconName = isError ? 'wifi-slash' : 'wifi';
    const title = isError ? 'No Network Connection' : 'Connection Restored';
    const message = isError ? 'Check your internet connection' : 'Syncing with server...';

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

  const totalBusinessValue = 1250000; // Mock value - replace with actual calculation

  const menuItems = [
    {
      id: 'invoices',
      title: 'All Invoices',
      icon: 'file-invoice-dollar',
      iconColor: '#C3B1E1',
      count: stats.totalInvoices,
      action: () => router.push('/invoices'),
    },
    {
      id: 'quotations',
      title: 'All Quotations',
      icon: 'quote-right',
      iconColor: '#10b981',
      count: stats.totalQuotations,
      action: () => router.push('/quotations'),
    },
    {
      id: 'products',
      title: 'Products',
      icon: 'box',
      iconColor: '#8b5cf6',
      count: stats.totalProducts,
      action: () => router.push('/products'),
    },
    {
      id: 'clients',
      title: 'Clients',
      icon: 'users',
      iconColor: '#ec4899',
      count: stats.totalClients,
      action: () => router.push('/clients'),
    },
    {
      id: 'about',
      title: 'About App',
      icon: 'circle-info',
      iconColor: '#f59e0b',
      count: null,
      action: handleAboutPress,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Network Alert */}
      {renderNetworkAlert()}
      
      {/* Header */}
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <View style={[styles.headerContent, isSmallScreen && styles.headerContentSmall]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="chevron-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>More</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Icon name="cog" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        {!isConnected && (
          <View style={styles.offlineBadge}>
            <Icon name="wifi-slash" size={10} color="#ef4444" />
            <Text style={styles.offlineBadgeText}>Offline Mode</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Business Card */}
        <View style={styles.businessCard}>
          <View style={styles.businessRow}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Icon name="bolt" size={40} color="#C3B1E1" />
              </View>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>Aksa Genset Services</Text>
              <View style={styles.businessBadge}>
                <Icon name="check-circle" size={14} color="#10b981" />
                <Text style={styles.businessBadgeText}>Business Pro</Text>
              </View>
              <Text style={styles.businessLocation}>
                <Icon name="location-dot" size={12} color="#8E8E93" /> Nairobi, Kenya
              </Text>
            </View>
          </View>
          
          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '...' : stats.totalInvoices}</Text>
              <Text style={styles.statLabel}>Invoices</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '...' : stats.totalQuotations}</Text>
              <Text style={styles.statLabel}>Quotes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {loading ? '...' : stats.totalProducts}
              </Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#ec4899' }]}>
                {loading ? '...' : stats.totalClients}
              </Text>
              <Text style={styles.statLabel}>Clients</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStatCard}>
            <Icon name="file-invoice-dollar" size={20} color="#C3B1E1" />
            <Text style={styles.quickStatLabel}>Business Value</Text>
            <Text style={styles.quickStatValue}>KES {totalBusinessValue.toLocaleString()}</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Icon name="calendar-star" size={20} color="#FFD166" />
            <Text style={styles.quickStatLabel}>Established</Text>
            <Text style={styles.quickStatValue}>2026</Text>
          </View>
        </View>

        {/* Main Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.menuItem} 
              onPress={item.action}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.iconColor}15` }]}>
                <Icon name={item.icon} size={18} color={item.iconColor} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
              {item.count !== null && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{loading ? '...' : item.count}</Text>
                </View>
              )}
              <Icon name="chevron-right" size={16} color="#8E8E93" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => router.push('/create-invoice')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#C3B1E120' }]}>
                <Icon name="plus" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.actionText}>New Invoice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton} 
              onPress={() => router.push('/create-quotation')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#10b98120' }]}>
                <Icon name="file-signature" size={18} color="#10b981" />
              </View>
              <Text style={styles.actionText}>New Quote</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <Icon 
            name={isConnected ? "wifi" : "wifi-slash"} 
            size={12} 
            color={isConnected ? "#10b981" : "#ef4444"} 
          />
          <Text style={[styles.connectionText, { color: isConnected ? "#10b981" : "#ef4444" }]}>
            {isConnected ? 'Connected to server' : 'Offline mode'}
          </Text>
        </View>

        <Text style={styles.version}>InvoicePro v1.0.0 (Build 2024)</Text>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  businessCard: {
    backgroundColor: '#000000',
    marginHorizontal: 20,                          
    marginTop: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    marginRight: 16,
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C3B1E1',
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  businessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  businessBadgeText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  businessLocation: {
    fontSize: 13,
    color: '#8E8E93',
    gap: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C3B1E1',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#24262B',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,               
    borderColor: '#24262B',
    gap: 6,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  countText: {
    color: '#C3B1E1',
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  connectionText: {
    fontSize: 12,
  },
  version: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 20,
  },
});