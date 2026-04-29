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
  TextInput,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';
import NetInfo from '@react-native-community/netinfo';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_address: string;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes: string;
  terms: string[];
  status: string;
  payment_method?: string;
  paid_amount?: number;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

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
  <View style={styles.statItem}>
    <ShimmerLine width={60} height={28} borderRadius={4} style={{ marginBottom: 6 }} />
    <ShimmerLine width={50} height={12} borderRadius={4} />
  </View>
);

const ShimmerInvoiceCard = () => (
  <View style={styles.invoiceCard}>
    <View style={styles.invoiceCardHeader}>
      <View style={styles.invoiceHeaderLeft}>
        <ShimmerLine width={80} height={24} borderRadius={12} />
        <ShimmerLine width={100} height={20} borderRadius={8} />
      </View>
      <ShimmerLine width={32} height={32} borderRadius={8} />
    </View>
    <View style={styles.invoiceCardBody}>
      <View style={styles.invoiceInfoRow}>
        <ShimmerLine width={16} height={12} borderRadius={4} />
        <ShimmerLine width={120} height={16} borderRadius={4} />
      </View>
      <View style={styles.clientRow}>
        <ShimmerLine width={14} height={14} borderRadius={4} />
        <ShimmerLine width={150} height={20} borderRadius={4} />
      </View>
      <View style={styles.invoiceDetailsGrid}>
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

export default function InvoicesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Paid', value: 'paid' },
    { label: 'Pending', value: 'pending' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Draft', value: 'draft' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Amount: High to Low', value: 'amount-high' },
    { label: 'Amount: Low to High', value: 'amount-low' },
    { label: 'Due Date', value: 'due-date' },
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
          setTimeout(() => {
            fetchInvoices();
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

  const fetchInvoices = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      if (!isConnected) {
        showNetworkMessage('error');
      } else {
        Alert.alert('Error', 'Failed to load invoices. Please check your connection.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setRefreshing(false);
      return;
    }
    
    await fetchInvoices();
  };

  const deleteInvoice = async (id: string) => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setInvoices(prev => prev.filter(q => q.id !== id));
        Alert.alert('Success', 'Invoice deleted successfully');
      } else {
        throw new Error('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete invoice');
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: 'Paid' };
      case 'pending':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: 'Pending' };
      case 'overdue':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'Overdue' };
      case 'draft':
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Draft' };
      case 'cancelled':
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Cancelled' };
      default:
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Unknown' };
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-KE', {
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

  const filterAndSortInvoices = () => {
    let filtered = [...invoices];

    if (searchQuery) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (invoice.client_email && invoice.client_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (invoice.client_company && invoice.client_company.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(invoice => {
        if (statusFilter === 'overdue') {
          return isInvoiceOverdue(invoice) && invoice.status !== 'paid';
        }
        return invoice.status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'amount-high':
          return b.total - a.total;
        case 'amount-low':
          return a.total - b.total;
        case 'due-date':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredInvoices = filterAndSortInvoices();

  const handleDeleteInvoice = (id: string, invoiceNumber: string) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoiceNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteInvoice(id);
            setShowActionsModal(false);
          }
        }
      ]
    );
  };

  const handleInvoiceAction = (action: string, invoice: Invoice) => {
    setShowActionsModal(false);
    
    switch (action) {
      case 'view':
        router.push({ pathname: '/invoice-detail', params: { id: invoice.id } });
        break;
      case 'edit':
        Alert.alert('Info', 'Edit feature coming soon');
        break;
      case 'download':
        Alert.alert('Info', 'PDF download feature coming soon');
        break;
      case 'share':
        Alert.alert('Info', 'Share feature coming soon');
        break;
      case 'duplicate':
        Alert.alert('Info', 'Duplicate feature coming soon');
        break;
      case 'delete':
        handleDeleteInvoice(invoice.id, invoice.invoice_number);
        break;
    }
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

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <View style={[styles.headerContent, isSmallScreen && styles.headerContentSmall]}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="chevron-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>Invoices</Text>
          {!isConnected && (
            <View style={styles.offlineBadge}>
              <Icon name="wifi-slash" size={10} color="#ef4444" />
              <Text style={styles.offlineBadgeText}>Offline</Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={styles.newInvoiceButton}
          onPress={() => {
            if (!isConnected) {
              Alert.alert('Offline', 'You need an internet connection to create a new invoice.');
              return;
            }
            router.push('/create-invoice');
          }}
          disabled={!isConnected}
        >
          <Icon name="plus" size={16} color={isConnected ? "#000000" : "#666666"} />
          <Text style={[styles.newInvoiceText, { color: isConnected ? "#000000" : "#666666" }]}>
            New Invoice
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={[styles.searchContainer, isSmallScreen && styles.searchContainerSmall]}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, isSmallScreen && styles.searchInputSmall]}
          placeholder="Search invoices..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="times" size={16} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity 
        style={[styles.filterButton, isSmallScreen && styles.filterButtonSmall]}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Icon name="sliders" size={16} color="#C3B1E1" />
        <Text style={[styles.filterButtonText, isSmallScreen && styles.filterButtonTextSmall]}>
          Filters
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <Animated.View style={[styles.filtersContainer, { opacity: fadeAnim }]}>
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statusFiltersContainer}
          >
            {statusOptions.map((status, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.statusFilterButton,
                  statusFilter === status.value && styles.statusFilterButtonActive
                ]}
                onPress={() => setStatusFilter(status.value)}
              >
                <Text style={[
                  styles.statusFilterText,
                  statusFilter === status.value && styles.statusFilterTextActive
                ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Sort By</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sortOptionsContainer}
          >
            {sortOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.sortOptionButton,
                  sortBy === option.value && styles.sortOptionButtonActive
                ]}
                onPress={() => setSortBy(option.value)}
              >
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.filterActions}>
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={() => {
              setStatusFilter(null);
              setSortBy('newest');
              setSearchQuery('');
            }}
          >
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => {
    const status = getStatusColor(item.status);
    const daysUntilDue = getDaysUntilDue(item.due_date);
    const isOverdue = isInvoiceOverdue(item);
    const actualStatus = isOverdue ? 'overdue' : item.status;

    return (
      <TouchableOpacity
        style={styles.invoiceCard}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/invoice-detail', params: { id: item.id } })}
        onLongPress={() => {
          setSelectedInvoice(item);
          setShowActionsModal(true);
        }}
      >
        <View style={styles.invoiceCardHeader}>
          <View style={styles.invoiceHeaderLeft}>
            <View style={[styles.statusBadge, { backgroundColor: isOverdue ? getStatusColor('overdue').bg : status.bg }]}>
              <Text style={[styles.statusText, { color: isOverdue ? getStatusColor('overdue').color : status.color }]}>
                {isOverdue ? 'Overdue' : status.text}
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
              setSelectedInvoice(item);
              setShowActionsModal(true);
            }}
          >
            <Icon name="ellipsis-vertical" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.invoiceCardBody}>
          <View style={styles.invoiceInfoRow}>
            <Icon name="hashtag" size={12} color="#8E8E93" />
            <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
          </View>

          <View style={styles.clientRow}>
            <Icon name="building" size={14} color="#C3B1E1" />
            <Text style={styles.clientName} numberOfLines={1}>{item.client_name}</Text>
          </View>

          <View style={styles.invoiceDetailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="calendar" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Issued:</Text>
              <Text style={styles.detailValue}>{formatDate(item.issue_date)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="clock" size={12} color="#8E8E93" />
              <Text style={styles.detailLabel}>Due:</Text>
              <Text style={[styles.detailValue, isOverdue && styles.overdueDate]}>
                {formatDate(item.due_date)}
              </Text>
            </View>
          </View>

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>{formatCurrency(item.total)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = () => {
    const stats = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending').length,
      overdue: invoices.filter(i => isInvoiceOverdue(i)).length,
      totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
      paidAmount: invoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0),
    };

    if (loading) {
      return (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <ShimmerStatsCard />
            <ShimmerStatsCard />
            <ShimmerStatsCard />
            <ShimmerStatsCard />
          </View>
          <View style={styles.totalAmountContainer}>
            <ShimmerLine width={80} height={12} borderRadius={4} style={{ marginBottom: 4 }} />
            <ShimmerLine width={150} height={28} borderRadius={4} />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.paid}</Text>
            <Text style={styles.statLabel}>Paid</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.overdue}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>
        <View style={styles.totalAmountContainer}>
          <Text style={styles.totalAmountLabel}>Total Value</Text>
          <Text style={styles.totalAmount}>{formatCurrency(stats.totalAmount)}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="file-invoice" size={60} color="#8E8E93" />
      <Text style={styles.emptyStateTitle}>No invoices found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery || statusFilter ? 'Try changing your search or filter criteria' : 
         !isConnected ? 'Check your internet connection' :
         'Create your first invoice to get started'}
      </Text>
      {!searchQuery && !statusFilter && isConnected && (
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => router.push('/create-invoice')}
        >
          <Icon name="plus" size={16} color="#000000" />
          <Text style={styles.emptyStateButtonText}>Create Invoice</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {renderNetworkAlert()}
      {renderHeader()}
      
      <View style={styles.mainContent}>
        {renderSearchBar()}
        {renderFilters()}
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#C3B1E1"
              colors={['#C3B1E1']}
              enabled={isConnected}
            />
          }
        >
          {renderStats()}
          
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {filteredInvoices.length} {filteredInvoices.length === 1 ? 'Invoice' : 'Invoices'}
            </Text>
            {filteredInvoices.length > 0 && (
              <Text style={styles.resultsSubtitle}>
                {statusFilter ? `Filtered by: ${statusFilter}` : 'All invoices'}
              </Text>
            )}
          </View>

          {loading ? (
            <View style={styles.invoicesList}>
              <ShimmerInvoiceCard />
              <ShimmerInvoiceCard />
              <ShimmerInvoiceCard />
            </View>
          ) : filteredInvoices.length > 0 ? (
            <FlatList
              data={filteredInvoices}
              renderItem={renderInvoiceCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.invoicesList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      </View>

      <BottomNav />

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
              <Text style={styles.modalTitle}>Invoice Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {selectedInvoice && (
              <View style={styles.modalInvoiceInfo}>
                <Text style={styles.modalInvoiceNumber}>{selectedInvoice.invoice_number}</Text>
                <Text style={styles.modalInvoiceClient}>{selectedInvoice.client_name}</Text>
                <Text style={styles.modalInvoiceAmount}>{formatCurrency(selectedInvoice.total)}</Text>
                <View style={[styles.modalStatusBadge, { 
                  backgroundColor: isInvoiceOverdue(selectedInvoice) ? 
                    getStatusColor('overdue').bg : 
                    getStatusColor(selectedInvoice.status).bg 
                }]}>
                  <Text style={[styles.modalStatusText, { 
                    color: isInvoiceOverdue(selectedInvoice) ? 
                      getStatusColor('overdue').color : 
                      getStatusColor(selectedInvoice.status).color 
                  }]}>
                    {isInvoiceOverdue(selectedInvoice) ? 'Overdue' : selectedInvoice.status.charAt(0).toUpperCase() + selectedInvoice.status.slice(1)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              {['view', 'edit', 'download', 'share', 'duplicate'].map((action) => (
                <TouchableOpacity
                  key={action}
                  style={styles.modalActionButton}
                  onPress={() => handleInvoiceAction(action, selectedInvoice!)}
                >
                  <Icon 
                    name={
                      action === 'view' ? 'eye' :
                      action === 'edit' ? 'pen-to-square' :
                      action === 'download' ? 'download' :
                      action === 'share' ? 'share' :
                      'copy'
                    } 
                    size={18} 
                    color="#C3B1E1" 
                  />
                  <Text style={styles.modalActionText}>
                    {action.charAt(0).toUpperCase() + action.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.modalActionButton, styles.deleteActionButton]}
                onPress={() => handleInvoiceAction('delete', selectedInvoice!)}
              >
                <Icon name="trash" size={18} color="#ef4444" />
                <Text style={[styles.modalActionText, styles.deleteActionText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerContentSmall: {
    paddingHorizontal: 15,
  },
  headerTitleContainer: {
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
  newInvoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newInvoiceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#000000',
  },
  searchContainerSmall: {
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C3B1E1',
  },
  filterButtonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterButtonText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextSmall: {
    fontSize: 13,
  },
  filtersContainer: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusFiltersContainer: {
    gap: 8,
    paddingRight: 16,
  },
  statusFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  statusFilterButtonActive: {
    backgroundColor: 'rgba(195, 177, 225, 0.2)',
    borderColor: '#C3B1E1',
  },
  statusFilterText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  statusFilterTextActive: {
    color: '#C3B1E1',
  },
  sortOptionsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  sortOptionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  sortOptionButtonActive: {
    backgroundColor: 'rgba(195, 177, 225, 0.2)',
    borderColor: '#C3B1E1',
  },
  sortOptionText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#C3B1E1',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 8,
  },
  clearFiltersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearFiltersText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsContainer: {
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  totalAmountContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
    alignItems: 'center',
  },
  totalAmountLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  totalAmount: {
    color: '#C3B1E1',
    fontSize: 28,
    fontWeight: '700',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultsSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  invoicesList: {
    gap: 12,
    paddingHorizontal: 20,
  },
  invoiceCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  invoiceHeaderLeft: {
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
  invoiceCardBody: {
    gap: 12,
  },
  invoiceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  invoiceNumber: {
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
  invoiceDetailsGrid: {
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
    alignItems: 'center',
    padding: 40,
    marginHorizontal: 20,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#15171C',
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
  modalInvoiceInfo: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    gap: 8,
  },
  modalInvoiceNumber: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '700',
  },
  modalInvoiceClient: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalInvoiceAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  modalStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    padding: 16,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  deleteActionButton: {
    borderBottomWidth: 0,
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  deleteActionText: {
    color: '#ef4444',
  },
});