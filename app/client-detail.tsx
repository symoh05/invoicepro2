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
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import NetInfo from '@react-native-community/netinfo';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  total: number;
  status: string;
  due_date: string;
  issue_date: string;
  created_at: string;
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_email: string;
  total: number;
  status: string;
  valid_until: string;
  issue_date: string;
  created_at: string;
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

const ShimmerDocumentItem = () => (
  <View style={styles.documentItem}>
    <ShimmerLine width={36} height={36} borderRadius={8} />
    <View style={styles.documentInfo}>
      <ShimmerLine width={120} height={16} borderRadius={4} style={{ marginBottom: 4 }} />
      <ShimmerLine width={100} height={12} borderRadius={4} />
    </View>
    <ShimmerLine width={80} height={16} borderRadius={4} />
  </View>
);

export default function ClientDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const params = useLocalSearchParams();
  
  const [client, setClient] = useState({
    id: params.id as string || '',
    name: params.name as string || '',
    email: params.email as string || '',
    phone: params.phone as string || '',
    company: params.company as string || '',
    address: params.address as string || '',
    invoice_count: parseInt(params.invoice_count as string) || 0,
    quotation_count: parseInt(params.quotation_count as string) || 0,
    total_amount: parseFloat(params.total_amount as string) || 0,
  });
  
  const [documents, setDocuments] = useState<{
    invoices: Invoice[];
    quotations: Quotation[];
  }>({ invoices: [], quotations: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClientDocuments = async () => {
    try {
      setRefreshing(true);
      
      // Fetch invoices for this client
      const invoicesResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/invoices?` + 
        `client_name=eq.${encodeURIComponent(client.name)}&` +
        (client.email ? `client_email=eq.${encodeURIComponent(client.email)}&` : '') +
        `select=id,invoice_number,client_name,total,status,due_date,issue_date,created_at&` +
        `order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Fetch quotations for this client
      const quotationsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/quotations?` +
        `client_name=eq.${encodeURIComponent(client.name)}&` +
        (client.email ? `client_email=eq.${encodeURIComponent(client.email)}&` : '') +
        `select=id,quotation_number,client_name,total,status,valid_until,issue_date,created_at&` +
        `order=created_at.desc`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const invoicesData = invoicesResponse.ok ? await invoicesResponse.json() : [];
      const quotationsData = quotationsResponse.ok ? await quotationsResponse.json() : [];
      
      setDocuments({
        invoices: invoicesData || [],
        quotations: quotationsData || [],
      });
    } catch (error) {
      console.error('Error fetching client documents:', error);
      Alert.alert('Error', 'Failed to load client documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClientDocuments();
  }, []);

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'accepted':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'overdue':
        return '#ef4444';
      case 'rejected':
      case 'cancelled':
        return '#ef4444';
      case 'draft':
        return '#8E8E93';
      case 'expired':
        return '#64748b';
      default:
        return '#8E8E93';
    }
  };

  const isQuotationExpired = (quotation: Quotation) => {
    if (!quotation.valid_until) return false;
    const validUntil = new Date(quotation.valid_until);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return validUntil < today;
  };

  const isInvoiceOverdue = (invoice: Invoice) => {
    if (!invoice.due_date || invoice.status === 'paid') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const renderDocumentItem = (item: Invoice | Quotation, type: 'invoice' | 'quotation') => {
    const isInvoice = type === 'invoice';
    const isOverdue = isInvoice ? isInvoiceOverdue(item as Invoice) : false;
    const isExpired = !isInvoice ? isQuotationExpired(item as Quotation) : false;
    const statusColor = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => {
          router.push({
            pathname: isInvoice ? '/invoice-detail' : '/quotation-detail',
            params: { id: item.id }
          });
        }}
      >
        <View style={styles.documentIcon}>
          <Icon 
            name={isInvoice ? 'file-invoice-dollar' : 'quote-right'} 
            size={16} 
            color={isInvoice ? '#C3B1E1' : '#10b981'} 
          />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentNumber}>
            {isInvoice ? (item as Invoice).invoice_number : (item as Quotation).quotation_number}
          </Text>
          <View style={styles.documentMeta}>
            <Text style={[styles.documentStatus, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              {isOverdue && ' • Overdue'}
              {isExpired && ' • Expired'}
            </Text>
            <Text style={styles.documentDate}>
              {isInvoice 
                ? `Due: ${formatDate((item as Invoice).due_date)}`
                : `Valid until: ${formatDate((item as Quotation).valid_until)}`
              }
            </Text>
          </View>
        </View>
        <View style={styles.documentAmountContainer}>
          <Text style={styles.documentAmount}>{formatCurrency(item.total)}</Text>
          <Icon name="chevron-right" size={14} color="#8E8E93" />
        </View>
      </TouchableOpacity>
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
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>Client Details</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchClientDocuments}
        >
          <Icon name="rotate" size={16} color="#C3B1E1" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        {renderHeader()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.clientProfileCard}>
            <View style={styles.clientProfileHeader}>
              <ShimmerLine width={80} height={80} borderRadius={40} />
              <View style={styles.clientProfileInfo}>
                <ShimmerLine width={200} height={24} borderRadius={6} style={{ marginBottom: 8 }} />
                <ShimmerLine width={150} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
                <ShimmerLine width={180} height={18} borderRadius={6} />
              </View>
            </View>
          </View>
          
          <View style={styles.contactInfoSection}>
            <ShimmerLine width={150} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <ShimmerLine width="100%" height={40} borderRadius={8} style={{ marginBottom: 12 }} />
            <ShimmerLine width="100%" height={40} borderRadius={8} style={{ marginBottom: 12 }} />
            <ShimmerLine width="100%" height={40} borderRadius={8} />
          </View>

          <View style={styles.statisticsSection}>
            <ShimmerLine width={150} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.statisticsGrid}>
              <View style={styles.statItem}>
                <ShimmerLine width={40} height={40} borderRadius={8} style={{ marginBottom: 8 }} />
                <ShimmerLine width={60} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                <ShimmerLine width={50} height={12} borderRadius={4} />
              </View>
              <View style={styles.statItem}>
                <ShimmerLine width={40} height={40} borderRadius={8} style={{ marginBottom: 8 }} />
                <ShimmerLine width={60} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                <ShimmerLine width={50} height={12} borderRadius={4} />
              </View>
              <View style={styles.statItem}>
                <ShimmerLine width={40} height={40} borderRadius={8} style={{ marginBottom: 8 }} />
                <ShimmerLine width={80} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
                <ShimmerLine width={50} height={12} borderRadius={4} />
              </View>
            </View>
          </View>

          <View style={styles.documentsSection}>
            <ShimmerLine width={100} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
            <ShimmerDocumentItem />
            <ShimmerDocumentItem />
          </View>

          <View style={styles.quickActionsSection}>
            <ShimmerLine width={120} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
            <View style={styles.quickActionsGrid}>
              <ShimmerLine width="48%" height={80} borderRadius={12} />
              <ShimmerLine width="48%" height={80} borderRadius={12} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchClientDocuments}
            tintColor="#C3B1E1"
            colors={['#C3B1E1']}
          />
        }
      >
        {/* Client Profile Card */}
        <View style={styles.clientProfileCard}>
          <View style={styles.clientProfileHeader}>
            <View style={styles.clientModalAvatar}>
              <Text style={styles.clientModalAvatarText}>
                {client.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.clientProfileInfo}>
              <Text style={styles.clientModalName}>{client.name}</Text>
              {client.company && (
                <Text style={styles.clientModalCompany}>{client.company}</Text>
              )}
              {client.total_amount > 0 && (
                <Text style={styles.clientModalTotalAmount}>
                  Total Spent: {formatCurrency(client.total_amount)}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactInfoSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {client.email ? (
            <View style={styles.contactItem}>
              <Icon name="envelope" size={16} color="#C3B1E1" />
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{client.email}</Text>
            </View>
          ) : null}
          
          {client.phone ? (
            <View style={styles.contactItem}>
              <Icon name="phone" size={16} color="#C3B1E1" />
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>{client.phone}</Text>
            </View>
          ) : null}
          
          {client.address ? (
            <View style={styles.contactItem}>
              <Icon name="location-dot" size={16} color="#C3B1E1" />
              <Text style={styles.contactLabel}>Address:</Text>
              <Text style={styles.contactValue}>{client.address}</Text>
            </View>
          ) : null}
        </View>

        {/* Statistics */}
        <View style={styles.statisticsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statisticsGrid}>
            <View style={styles.statItem}>
              <Icon name="file-invoice-dollar" size={24} color="#C3B1E1" />
              <Text style={styles.statNumber}>{client.invoice_count}</Text>
              <Text style={styles.statLabel}>Invoices</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="quote-right" size={24} color="#10b981" />
              <Text style={styles.statNumber}>{client.quotation_count}</Text>
              <Text style={styles.statLabel}>Quotes</Text>
            </View>
            
            <View style={styles.statItem}>
              <Icon name="money-bill-wave" size={24} color="#3b82f6" />
              <Text style={styles.statNumber}>{formatCurrency(client.total_amount)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Invoices List */}
        {documents.invoices.length > 0 && (
          <View style={styles.documentsSection}>
            <View style={styles.documentsHeader}>
              <Text style={styles.sectionTitle}>Invoices</Text>
              <TouchableOpacity onPress={() => router.push('/invoices')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.documentsList}>
              {documents.invoices.slice(0, 5).map((invoice) => (
                <View key={`invoice-${invoice.id}`}>
                  {renderDocumentItem(invoice, 'invoice')}
                </View>
              ))}
              {documents.invoices.length > 5 && (
                <TouchableOpacity 
                  style={styles.moreDocumentsButton}
                  onPress={() => router.push('/invoices')}
                >
                  <Text style={styles.moreDocumentsText}>
                    +{documents.invoices.length - 5} more invoices
                  </Text>
                  <Icon name="chevron-right" size={14} color="#C3B1E1" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Quotations List */}
        {documents.quotations.length > 0 && (
          <View style={styles.documentsSection}>
            <View style={styles.documentsHeader}>
              <Text style={styles.sectionTitle}>Quotations</Text>
              <TouchableOpacity onPress={() => router.push('/quotations')}>
                <Text style={[styles.viewAllText, { color: '#10b981' }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.documentsList}>
              {documents.quotations.slice(0, 5).map((quotation) => (
                <View key={`quotation-${quotation.id}`}>
                  {renderDocumentItem(quotation, 'quotation')}
                </View>
              ))}
              {documents.quotations.length > 5 && (
                <TouchableOpacity 
                  style={styles.moreDocumentsButton}
                  onPress={() => router.push('/quotations')}
                >
                  <Text style={[styles.moreDocumentsText, { color: '#10b981' }]}>
                    +{documents.quotations.length - 5} more quotes
                  </Text>
                  <Icon name="chevron-right" size={14} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* No Documents State */}
        {documents.invoices.length === 0 && documents.quotations.length === 0 && (
          <View style={styles.noDocumentsSection}>
            <Icon name="file-circle-exclamation" size={50} color="#8E8E93" />
            <Text style={styles.noDocumentsTitle}>No Documents Yet</Text>
            <Text style={styles.noDocumentsText}>
              This client doesn't have any invoices or quotations yet
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {
                router.push({
                  pathname: '/create-invoice',
                  params: {
                    clientName: client.name,
                    clientEmail: client.email,
                    clientPhone: client.phone,
                    clientCompany: client.company,
                    clientAddress: client.address,
                  }
                });
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]}>
                <Icon name="file-invoice-dollar" size={20} color="#C3B1E1" />
              </View>
              <Text style={styles.quickActionText}>Create Invoice</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => {
                router.push({
                  pathname: '/create-quotation',
                  params: {
                    clientName: client.name,
                    clientEmail: client.email,
                    clientPhone: client.phone,
                    clientCompany: client.company,
                    clientAddress: client.address,
                  }
                });
              }}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Icon name="quote-right" size={20} color="#10b981" />
              </View>
              <Text style={styles.quickActionText}>Create Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  clientProfileCard: {
    margin: 20,
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  clientProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  clientProfileInfo: {
    flex: 1,
  },
  clientModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientModalAvatarText: {
    color: '#C3B1E1',
    fontSize: 32,
    fontWeight: '700',
  },
  clientModalName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  clientModalCompany: {
    color: '#8E8E93',
    fontSize: 16,
    marginBottom: 4,
  },
  clientModalTotalAmount: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfoSection: {
    backgroundColor: '#000000',
    margin: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 20,
    gap: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  contactLabel: {
    color: '#8E8E93',
    fontSize: 14,
    minWidth: 60,
    paddingTop: 2,
  },
  contactValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  statisticsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statisticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  documentsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  documentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  documentsList: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    overflow: 'hidden',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    gap: 12,
  },
  documentIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentNumber: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentMeta: {
    gap: 2,
  },
  documentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  documentDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  documentAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  moreDocumentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  moreDocumentsText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  noDocumentsSection: {
    backgroundColor: '#000000',
    margin: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 40,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  noDocumentsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  noDocumentsText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActionsSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});