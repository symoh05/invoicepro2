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
  RefreshControl,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator, // Add this import
  Image,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';
import NetInfo from '@react-native-community/netinfo';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  issue_date: string;
  due_date: string;
  total: number;
  status: string;
  created_at: string;
};

type Quotation = {
  id: string;
  quotation_number: string;
  client_name: string;
  client_email?: string;
  client_company?: string;
  issue_date: string;
  valid_until: string;
  total: number;
  status: string;
  created_at: string;
};

// Shimmer Components
const ShimmerLine = ({ width, height, style, borderRadius = 8 }: { width: number | string; height: number; style?: any; borderRadius?: number }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  return (
    <View style={[{ width, height, backgroundColor: '#1a1c21', borderRadius, overflow: 'hidden' }, style]}>
      <Animated.View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          transform: [{ translateX }],
        }}
      />
    </View>
  );
};

const ShimmerStatsCard = () => (
  <View style={styles.statCardWrapper}>
    <View style={styles.statCard}>
      <ShimmerLine width={44} height={44} borderRadius={12} />
      <View style={styles.statInfo}>
        <ShimmerLine width={80} height={20} style={{ marginBottom: 4 }} borderRadius={4} />
        <ShimmerLine width={100} height={13} borderRadius={4} />
      </View>
    </View>
  </View>
);

const ShimmerInvoiceCard = () => (
  <View style={styles.itemCard}>
    <View style={styles.itemCardHeader}>
      <View style={styles.itemHeaderLeft}>
        <ShimmerLine width={80} height={24} borderRadius={12} />
        <ShimmerLine width={100} height={20} borderRadius={8} />
      </View>
      <ShimmerLine width={32} height={32} borderRadius={8} />
    </View>
    <View style={styles.itemCardBody}>
      <View style={styles.itemInfoRow}>
        <ShimmerLine width={16} height={12} borderRadius={4} />
        <ShimmerLine width={120} height={16} borderRadius={4} />
      </View>
      <View style={styles.clientRow}>
        <ShimmerLine width={14} height={14} borderRadius={4} />
        <ShimmerLine width={150} height={20} borderRadius={4} />
      </View>
      <View style={styles.itemDetailsGrid}>
        <View style={styles.detailItem}>
          <ShimmerLine width={50} height={12} borderRadius={4} />
          <ShimmerLine width={80} height={12} borderRadius={4} />
        </View>
        <View style={styles.detailItem}>
          <ShimmerLine width={40} height={12} borderRadius={4} />
          <ShimmerLine width={80} height={12} borderRadius={4} />
        </View>
      </View>
      <View style={styles.amountRow}>
        <ShimmerLine width={80} height={16} borderRadius={4} />
        <ShimmerLine width={120} height={24} borderRadius={4} />
      </View>
    </View>
  </View>
);

const ShimmerQuotationCard = () => (
  <View style={styles.itemCard}>
    <View style={styles.itemCardHeader}>
      <View style={styles.itemHeaderLeft}>
        <ShimmerLine width={80} height={24} borderRadius={12} />
        <ShimmerLine width={100} height={20} borderRadius={8} />
      </View>
      <ShimmerLine width={32} height={32} borderRadius={8} />
    </View>
    <View style={styles.itemCardBody}>
      <View style={styles.itemInfoRow}>
        <ShimmerLine width={16} height={12} borderRadius={4} />
        <ShimmerLine width={120} height={16} borderRadius={4} />
      </View>
      <View style={styles.clientRow}>
        <ShimmerLine width={14} height={14} borderRadius={4} />
        <ShimmerLine width={150} height={20} borderRadius={4} />
      </View>
      <View style={styles.itemDetailsGrid}>
        <View style={styles.detailItem}>
          <ShimmerLine width={50} height={12} borderRadius={4} />
          <ShimmerLine width={80} height={12} borderRadius={4} />
        </View>
        <View style={styles.detailItem}>
          <ShimmerLine width={60} height={12} borderRadius={4} />
          <ShimmerLine width={80} height={12} borderRadius={4} />
        </View>
      </View>
      <View style={styles.amountRow}>
        <ShimmerLine width={80} height={16} borderRadius={4} />
        <ShimmerLine width={120} height={24} borderRadius={4} />
      </View>
    </View>
  </View>
);

export default function DashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'invoice' | 'quotation';
    data: Invoice | Quotation;
  } | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalQuotations: 0,
    monthlyRevenue: 0,
    totalProducts: 0,
    totalClients: 0,
  });

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  // Search results state
  const [searchResults, setSearchResults] = useState<{
    invoices: Invoice[];
    quotations: Quotation[];
  }>({ invoices: [], quotations: [] });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'invoice' | 'quotation';
    id: string;
    number: string;
    clientName: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

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
            fetchData();
          }, 1500);
        }
      }
      
      setIsConnected(newIsConnected);
    });

    return () => unsubscribe();
  }, [isConnected]);

  // Update search results when search query changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filteredInvoices = invoices.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.client_email && invoice.client_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (invoice.client_company && invoice.client_company.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      const filteredQuotations = quotations.filter(quotation =>
        quotation.quotation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quotation.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quotation.client_email && quotation.client_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (quotation.client_company && quotation.client_company.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults({
        invoices: filteredInvoices,
        quotations: filteredQuotations,
      });
    }
  }, [searchQuery, invoices, quotations]);

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

  const fetchData = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setRefreshing(true);
      
      const invoicesResponse = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const quotationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/quotations?select=*&order=created_at.desc&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (invoicesResponse.ok && quotationsResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        const quotationsData = await quotationsResponse.json();
        
        setInvoices(invoicesData || []);
        setQuotations(quotationsData || []);
        
        const totalInvoices = invoicesData.length;
        const totalQuotations = quotationsData.length;
        
        // Calculate monthly revenue (sum of paid invoices in current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = invoicesData
          .filter((inv: Invoice) => {
            const invDate = new Date(inv.created_at);
            return invDate.getMonth() === currentMonth && 
                   invDate.getFullYear() === currentYear &&
                   inv.status === 'paid';
          })
          .reduce((sum: number, inv: Invoice) => sum + inv.total, 0);

        let totalProducts = 0;
        try {
          const productsCount = await fetch(`${SUPABASE_URL}/rest/v1/products?select=count`, {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'count=exact',
            },
          });
          
          if (productsCount.ok) {
            const countHeader = productsCount.headers.get('content-range');
            if (countHeader) {
              const match = countHeader.match(/\/(\d+)/);
              if (match) totalProducts = parseInt(match[1]);
            }
          }
        } catch (error) {
          console.log('No products table or error:', error);
        }

        // Calculate unique clients
        const allClients = [
          ...invoicesData.map((inv: Invoice) => inv.client_name),
          ...quotationsData.map((quote: Quotation) => quote.client_name)
        ];
        const uniqueClients = [...new Set(allClients)].length;

        setStats({
          totalInvoices,
          totalQuotations,
          monthlyRevenue,
          totalProducts,
          totalClients: uniqueClients,
        });
      } else {
        throw new Error(`Server error: ${invoicesResponse.status}`);
      }

    } catch (error: any) {
      console.error('Fetch error:', error);
      
      if (error.message.includes('Network request failed') || !isConnected) {
        showNetworkMessage('error');
      } else {
        Alert.alert('Database Error', 'Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = async () => {
    if (!isConnected) {
      showNetworkMessage('error');
      setRefreshing(false);
      return;
    }
    await fetchData();
  };

  const openDeleteConfirmation = (type: 'invoice' | 'quotation', id: string, number: string, clientName: string) => {
    setItemToDelete({ type, id, number, clientName });
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      const table = itemToDelete.type === 'invoice' ? 'invoices' : 'quotations';
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        if (itemToDelete.type === 'invoice') {
          setInvoices(prev => prev.filter(inv => inv.id !== itemToDelete.id));
        } else {
          setQuotations(prev => prev.filter(quote => quote.id !== itemToDelete.id));
        }
        Alert.alert('Success', `${itemToDelete.type === 'invoice' ? 'Invoice' : 'Quotation'} deleted successfully.`);
        fetchData(); // Refresh stats
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const handleShare = async (type: 'invoice' | 'quotation', data: Invoice | Quotation) => {
    setShowActionsModal(false);
    try {
      const shareContent = {
        title: type === 'invoice' ? `Invoice ${data.invoice_number}` : `Quotation ${data.quotation_number}`,
        message: `${type === 'invoice' ? 'Invoice' : 'Quotation'} ${type === 'invoice' ? (data as Invoice).invoice_number : (data as Quotation).quotation_number}\nClient: ${data.client_name}\nAmount: ${formatCurrency(data.total)}`,
      };
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'accepted':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
      case 'pending':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
      case 'overdue':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'rejected':
      case 'cancelled':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'draft':
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)' };
      case 'expired':
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' };
      default:
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate: string | Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isInvoiceOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid') return false;
    const daysUntilDue = getDaysUntilDue(invoice.due_date);
    return daysUntilDue < 0;
  };

  const isQuotationExpired = (quotation: Quotation) => {
    const validUntil = new Date(quotation.valid_until);
    const today = new Date();
    return validUntil < today;
  };

  const recentInvoices = invoices.slice(0, 5);
  const recentQuotations = quotations.slice(0, 5);

  const statsData = [
    { 
      icon: 'file-invoice-dollar', 
      color: '#C3B1E1', 
      bgColor: 'rgba(195, 177, 225, 0.1)',
      number: stats.totalInvoices.toString(), 
      label: 'Total Invoices',
      onPress: () => router.push('/invoices')
    },
    { 
      icon: 'quote-right', 
      color: '#10b981', 
      bgColor: 'rgba(16, 185, 129, 0.1)',
      number: stats.totalQuotations.toString(), 
      label: 'Total Quotes',
      onPress: () => router.push('/quotations')
    },
    { 
      icon: 'money-bill-wave', 
      color: '#3b82f6', 
      bgColor: 'rgba(59, 130, 246, 0.1)',
      number: formatCurrency(stats.monthlyRevenue), 
      label: 'Revenue',
      onPress: () => router.push('/invoices')
    },
    { 
      icon: 'box', 
      color: '#8b5cf6', 
      bgColor: 'rgba(139, 92, 246, 0.1)',
      number: stats.totalProducts.toString(), 
      label: 'Products',
      onPress: () => router.push('/products')
    },
  ];

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

  const DeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <TouchableOpacity 
        style={styles.deleteModalOverlay}
        activeOpacity={1}
        onPress={() => setShowDeleteModal(false)}
      >
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteModalHeader}>
            <View style={styles.deleteModalIcon}>
              <Icon name="trash" size={40} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>
              Delete {itemToDelete?.type === 'invoice' ? 'Invoice' : 'Quotation'}
            </Text>
            <Text style={styles.deleteModalSubtitle}>
              This action cannot be undone
            </Text>
          </View>

          <View style={styles.deleteModalInfo}>
            <View style={styles.deleteModalItemInfo}>
              <View style={styles.deleteModalItemIcon}>
                <Icon 
                  name={itemToDelete?.type === 'invoice' ? 'file-invoice' : 'file-contract'} 
                  size={24} 
                  color="#ef4444" 
                />
              </View>
              <View style={styles.deleteModalItemDetails}>
                <Text style={styles.deleteModalItemNumber}>{itemToDelete?.number}</Text>
                <Text style={styles.deleteModalClient}>{itemToDelete?.clientName}</Text>
              </View>
            </View>
            
            <View style={styles.deleteModalWarning}>
              <Icon name="exclamation-triangle" size={16} color="#f59e0b" />
              <Text style={styles.deleteModalWarningText}>
                All data associated with this {itemToDelete?.type === 'invoice' ? 'invoice' : 'quotation'} will be permanently removed.
              </Text>
            </View>
          </View>

          <View style={styles.deleteModalActions}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalCancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalDeleteButton]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Icon name="trash" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.deleteModalDeleteText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <View style={[styles.headerContent, isSmallScreen && styles.headerContentSmall]}>
        <View style={styles.logo}>
          <Image 
            source={require('../assets/images/logo1.png')} 
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.logoText, isSmallScreen && styles.logoTextSmall]}>InvoicePro</Text>
          {!isConnected && (
            <View style={styles.offlineBadge}>
              <Icon name="wifi-slash" size={10} color="#ef4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
        <View style={[styles.headerActions, isSmallScreen && styles.headerActionsSmall]}>
          <TouchableOpacity 
            style={[styles.iconButton, isSmallScreen && styles.iconButtonSmall]}
            onPress={onRefresh}
            disabled={!isConnected || refreshing}
          >
            <Icon name="rotate" size={isSmallScreen ? 16 : 18} color={isConnected ? "#C3B1E1" : "#8E8E93"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, isSmallScreen && styles.iconButtonSmall]}
            onPress={() => router.push('/products')}
          >
            <Icon name="box" size={isSmallScreen ? 16 : 18} color="#C3B1E1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, isSmallScreen && styles.iconButtonSmall]}
            onPress={() => router.push('/create-options')}
          >
            <Icon name="plus" size={isSmallScreen ? 16 : 18} color="#C3B1E1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, isSmallScreen && styles.searchContainerSmall]}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isSmallScreen && styles.searchInputSmall]}
          placeholder="Search invoices & quotes..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setShowSearchResults(text.length > 0);
          }}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            setShowSearchResults(false);
          }}>
            <Icon name="times" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={[styles.statsGrid, { gap: isSmallScreen ? 10 : 12 }]}>
      {statsData.map((stat, index) => (
        <View key={index} style={styles.statCardWrapper}>
          <TouchableOpacity
            style={styles.statCard}
            activeOpacity={0.7}
            onPress={stat.onPress}
          >
            <View style={[styles.statIcon, { backgroundColor: stat.bgColor }]}>
              <Icon name={stat.icon as any} size={isSmallScreen ? 16 : 18} color={stat.color} />
            </View>
            <View style={styles.statInfo}>
              <Text style={[styles.statNumber, isSmallScreen && styles.statNumberSmall]}>
                {stat.number}
              </Text>
              <Text style={[styles.statLabel, isSmallScreen && styles.statLabelSmall]}>
                {stat.label}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const InvoiceItemComponent = ({ invoice }: { invoice: Invoice }) => {
    const isOverdue = isInvoiceOverdue(invoice);
    const actualStatus = isOverdue ? 'overdue' : invoice.status;
    const statusColor = getStatusColor(actualStatus);
    const daysUntilDue = getDaysUntilDue(invoice.due_date);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/invoice-detail', params: { id: invoice.id } })}
      >
        <View style={styles.itemCardHeader}>
          <View style={styles.itemHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[styles.statusText, { color: statusColor.color }]}>
                {actualStatus.charAt(0).toUpperCase() + actualStatus.slice(1)}
              </Text>
            </View>
            {isOverdue && (
              <View style={styles.overdueBadge}>
                <Icon name="exclamation-circle" size={10} color="#ef4444" />
                <Text style={styles.overdueText}>{Math.abs(daysUntilDue)} days overdue</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedItem({ type: 'invoice', data: invoice });
              setShowActionsModal(true);
            }}
          >
            <Icon name="ellipsis-vertical" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemCardBody}>
          <View style={styles.itemInfoRow}>
            <Icon name="hashtag" size={12} color="#8E8E93" />
            <Text style={styles.itemNumber}>{invoice.invoice_number}</Text>
          </View>

          <View style={styles.clientRow}>
            <Icon name="building" size={14} color="#C3B1E1" />
            <Text style={styles.clientName} numberOfLines={1}>{invoice.client_name}</Text>
          </View>

          <View style={styles.itemDetailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Issued:</Text>
              <Text style={styles.detailValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="clock" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Due:</Text>
              <Text style={[styles.detailValue, isOverdue && styles.overdueDate]}>
                {formatDate(invoice.due_date)}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const QuotationItemComponent = ({ quotation }: { quotation: Quotation }) => {
    const status = getStatusColor(quotation.status);
    const daysUntilExpiry = getDaysUntilDue(quotation.valid_until);
    const isExpired = isQuotationExpired(quotation);

    return (
      <TouchableOpacity
        style={styles.itemCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/quotation-detail', params: { id: quotation.id } })}
      >
        <View style={styles.itemCardHeader}>
          <View style={styles.itemHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.color }]}>
                {quotation.status.charAt(0).toUpperCase() + quotation.status.slice(1)}
              </Text>
            </View>
            {!isExpired && daysUntilExpiry <= 3 && (
              <View style={styles.expiringBadge}>
                <Icon name="hourglass" size={10} color="#f59e0b" />
                <Text style={styles.expiringText}>
                  {daysUntilExpiry === 0 ? 'Expires today' : `${daysUntilExpiry}d left`}
                </Text>
              </View>
            )}
            {isExpired && (
              <View style={styles.expiredBadge}>
                <Icon name="hourglass-end" size={10} color="#8E8E93" />
                <Text style={styles.expiredText}>Expired</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedItem({ type: 'quotation', data: quotation });
              setShowActionsModal(true);
            }}
          >
            <Icon name="ellipsis-vertical" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemCardBody}>
          <View style={styles.itemInfoRow}>
            <Icon name="hashtag" size={12} color="#8E8E93" />
            <Text style={styles.itemNumber}>{quotation.quotation_number}</Text>
          </View>

          <View style={styles.clientRow}>
            <Icon name="building" size={14} color="#10b981" />
            <Text style={styles.clientName} numberOfLines={1}>{quotation.client_name}</Text>
          </View>

          <View style={styles.itemDetailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Issued:</Text>
              <Text style={styles.detailValue}>{formatDate(quotation.issue_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="hourglass" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Valid until:</Text>
              <Text style={[styles.detailValue, isExpired && styles.expiredDate]}>
                {formatDate(quotation.valid_until)}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>{formatCurrency(quotation.total)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResultsComponent = () => {
    const hasResults = searchResults.invoices.length > 0 || searchResults.quotations.length > 0;
    
    return (
      <ScrollView 
        style={styles.searchResultsScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.searchResultsScrollContent}
      >
        {searchResults.invoices.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.searchSectionTitle}>Invoices ({searchResults.invoices.length})</Text>
            {searchResults.invoices.map((invoice) => (
              <InvoiceItemComponent key={invoice.id} invoice={invoice} />
            ))}
          </View>
        )}
        
        {searchResults.quotations.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.searchSectionTitle}>Quotations ({searchResults.quotations.length})</Text>
            {searchResults.quotations.map((quotation) => (
              <QuotationItemComponent key={quotation.id} quotation={quotation} />
            ))}
          </View>
        )}
        
        {!hasResults && (
          <View style={styles.emptySearchState}>
            <Icon name="search" size={50} color="#8E8E93" />
            <Text style={styles.emptySearchTitle}>No results found</Text>
            <Text style={styles.emptySearchText}>
              No invoices or quotations match "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderRecentInvoices = () => (
    <View style={styles.sectionContainer}>
      <View style={[styles.sectionHeader, isSmallScreen && styles.sectionHeaderSmall]}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
          Recent Invoices
        </Text>
        <TouchableOpacity 
          style={[styles.viewAllButton, isSmallScreen && styles.viewAllButtonSmall]}
          onPress={() => router.push('/invoices')}
        >
          <Text style={styles.viewAllText}>View More</Text>
          <Icon name="arrow-right" size={14} color="#C3B1E1" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <>
          <ShimmerInvoiceCard />
          <ShimmerInvoiceCard />
          <ShimmerInvoiceCard />
          <ShimmerInvoiceCard />
          <ShimmerInvoiceCard />
        </>
      ) : recentInvoices.length > 0 ? (
        recentInvoices.map((invoice) => (
          <InvoiceItemComponent key={invoice.id} invoice={invoice} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Icon name="file-invoice" size={50} color="#8E8E93" />
          <Text style={styles.emptyStateTitle}>No Invoices Yet</Text>
          <Text style={styles.emptyStateText}>Start by creating your first invoice</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={() => router.push('/create-invoice')}
          >
            <Icon name="plus" size={16} color="#000000" />
            <Text style={styles.emptyStateButtonText}>Create Invoice</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRecentQuotations = () => (
    <View style={styles.sectionContainer}>
      <View style={[styles.sectionHeader, isSmallScreen && styles.sectionHeaderSmall]}>
        <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
          Recent Quotes
        </Text>
        <TouchableOpacity 
          style={[styles.viewAllButton, isSmallScreen && styles.viewAllButtonSmall]}
          onPress={() => router.push('/quotations')}
        >
          <Text style={[styles.viewAllText, { color: '#10b981' }]}>View More</Text>
          <Icon name="arrow-right" size={14} color="#10b981" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <>
          <ShimmerQuotationCard />
          <ShimmerQuotationCard />
          <ShimmerQuotationCard />
          <ShimmerQuotationCard />
          <ShimmerQuotationCard />
        </>
      ) : recentQuotations.length > 0 ? (
        recentQuotations.map((quotation) => (
          <QuotationItemComponent key={quotation.id} quotation={quotation} />
        ))
      ) : (
        <View style={[styles.emptyState, { borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <Icon name="quote-right" size={50} color="#8E8E93" />
          <Text style={styles.emptyStateTitle}>No Quotes Yet</Text>
          <Text style={styles.emptyStateText}>Start by creating your first quotation</Text>
          <TouchableOpacity 
            style={[styles.emptyStateButton, { backgroundColor: '#10b981' }]}
            onPress={() => router.push('/create-quotation')}
          >
            <Icon name="plus" size={16} color="#000000" />
            <Text style={styles.emptyStateButtonText}>Create Quote</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderActionsModal = () => (
    <Modal
      visible={showActionsModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowActionsModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowActionsModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedItem ? `${selectedItem.type === 'invoice' ? 'Invoice' : 'Quotation'} Actions` : 'Actions'}
            </Text>
            <TouchableOpacity onPress={() => setShowActionsModal(false)}>
              <Icon name="xmark" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          {selectedItem && (
            <View style={styles.modalInfo}>
              <Text style={styles.modalItemNumber}>
                {selectedItem.type === 'invoice' 
                  ? (selectedItem.data as Invoice).invoice_number
                  : (selectedItem.data as Quotation).quotation_number}
              </Text>
              <Text style={styles.modalClient}>
                {(selectedItem.data as Invoice | Quotation).client_name}
              </Text>
              <Text style={styles.modalAmount}>
                {formatCurrency((selectedItem.data as Invoice | Quotation).total)}
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowActionsModal(false);
                if (selectedItem && selectedItem.type === 'invoice') {
                  router.push({ pathname: '/invoice-detail', params: { id: selectedItem.data.id } });
                } else if (selectedItem && selectedItem.type === 'quotation') {
                  router.push({ pathname: '/quotation-detail', params: { id: selectedItem.data.id } });
                }
              }}
            >
              <View style={styles.modalActionIcon}>
                <Icon name="eye" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.modalActionText}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                if (selectedItem) {
                  handleShare(selectedItem.type, selectedItem.data);
                }
              }}
            >
              <View style={styles.modalActionIcon}>
                <Icon name="share" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.modalActionText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowActionsModal(false);
                Alert.alert('Info', 'Edit feature coming soon!');
              }}
            >
              <View style={styles.modalActionIcon}>
                <Icon name="pen-to-square" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.modalActionText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowActionsModal(false);
                Alert.alert('Info', 'Download PDF feature coming soon!');
              }}
            >
              <View style={styles.modalActionIcon}>
                <Icon name="download" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.modalActionText}>Download PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalActionButton}
              onPress={() => {
                setShowActionsModal(false);
                Alert.alert('Info', 'Duplicate feature coming soon!');
              }}
            >
              <View style={styles.modalActionIcon}>
                <Icon name="copy" size={18} color="#C3B1E1" />
              </View>
              <Text style={styles.modalActionText}>Duplicate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalActionButton, styles.deleteActionButton]}
              onPress={() => {
                setShowActionsModal(false);
                if (selectedItem) {
                  openDeleteConfirmation(
                    selectedItem.type,
                    selectedItem.data.id,
                    selectedItem.type === 'invoice' 
                      ? (selectedItem.data as Invoice).invoice_number 
                      : (selectedItem.data as Quotation).quotation_number,
                    selectedItem.data.client_name
                  );
                }
              }}
            >
              <View style={[styles.modalActionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Icon name="trash" size={18} color="#ef4444" />
              </View>
              <Text style={[styles.modalActionText, styles.deleteActionText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderNetworkAlert()}
      {renderHeader()}
      
      <View style={styles.mainContent}>
        {renderSearchBar()}
        
        {showSearchResults ? (
          renderSearchResultsComponent()
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#C3B1E1"
                colors={['#C3B1E1']}
              />
            }
          >
            {loading ? (
              <View style={styles.statsGrid}>
                <ShimmerStatsCard />
                <ShimmerStatsCard />
                <ShimmerStatsCard />
                <ShimmerStatsCard />
              </View>
            ) : (
              renderStats()
            )}
            
            {renderRecentInvoices()}
            {renderRecentQuotations()}
          </ScrollView>
        )}
      </View>
      
      <BottomNav />
      {renderActionsModal()}
      <DeleteModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Network Alert Styles
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
  
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#24262B',
    overflow: 'hidden',
  },
  deleteModalHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  deleteModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteModalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  deleteModalInfo: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  deleteModalItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  deleteModalItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteModalItemDetails: {
    flex: 1,
  },
  deleteModalItemNumber: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deleteModalClient: {
    color: '#8E8E93',
    fontSize: 14,
  },
  deleteModalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  deleteModalWarningText: {
    color: '#f59e0b',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  deleteModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalCancelButton: {
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  deleteModalDeleteButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
  },
  deleteModalCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  logoImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
  headerContentSmall: {
    paddingHorizontal: 15,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  logoTextSmall: {
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerActionsSmall: {
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonSmall: {
    width: 32,
    height: 32,
  },
  
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000000',
  },
  searchContainerSmall: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  searchInputSmall: {
    fontSize: 13,
    paddingVertical: 10,
  },
  
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 30,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  statCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: '#000000',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#24262B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statNumberSmall: {
    fontSize: 18,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  statLabelSmall: {
    fontSize: 12,
  },
  
  sectionContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderSmall: {
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  sectionTitleSmall: {
    fontSize: 18,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  viewAllButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Item Cards
  itemCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
    marginBottom: 12,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
  },
  expiringText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '500',
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderRadius: 8,
  },
  expiredText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '500',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  overdueText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '500',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCardBody: {
    gap: 12,
  },
  itemInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemNumber: {
    color: '#C3B1E1',
    fontSize: 16,
    fontWeight: '600',
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  itemDetailsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  expiredDate: {
    color: '#8E8E93',
    textDecorationLine: 'line-through',
  },
  overdueDate: {
    color: '#ef4444',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  amountLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  
  emptyState: {
    backgroundColor: '#15171C',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
    borderStyle: 'dashed',
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C3B1E1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  
  searchResultsScrollView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  searchResultsScrollContent: {
    paddingBottom: 100,
  },
  searchSectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySearchState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptySearchTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySearchText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#24262B',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    gap: 8,
  },
  modalItemNumber: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '700',
  },
  modalClient: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalActions: {
    padding: 16,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  modalActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteActionButton: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  deleteActionText: {
    color: '#ef4444',
  },
});