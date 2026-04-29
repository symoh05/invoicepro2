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
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import NetInfo from '@react-native-community/netinfo';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  invoice_count: number;
  quotation_count: number;
  total_amount: number;
}

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

const ShimmerClientCard = () => (
  <View style={[styles.clientCard, { backgroundColor: '#000000', borderColor: '#24262B' }]}>
    <View style={styles.clientCardHeader}>
      <ShimmerLine width={48} height={48} borderRadius={24} />
      <View style={styles.clientInfo}>
        <ShimmerLine width={150} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
        <ShimmerLine width={100} height={14} borderRadius={6} style={{ marginBottom: 4 }} />
        <ShimmerLine width={120} height={14} borderRadius={6} />
      </View>
      <ShimmerLine width={32} height={32} borderRadius={8} />
    </View>
    <View style={styles.clientCardBody}>
      <ShimmerLine width={200} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
      <ShimmerLine width={180} height={14} borderRadius={4} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 }}>
        <ShimmerLine width={80} height={12} borderRadius={4} />
        <ShimmerLine width={80} height={12} borderRadius={4} />
      </View>
    </View>
  </View>
);

export default function ClientsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Fetch clients from invoices and quotations
  const fetchClients = async () => {
    try {
      setRefreshing(true);
      
      // Fetch invoices
      const invoicesResponse = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=id,client_name,client_email,client_phone,client_address,total,status&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      // Fetch quotations
      const quotationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/quotations?select=id,client_name,client_email,client_phone,client_company,client_address,total,status&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (invoicesResponse.ok && quotationsResponse.ok) {
        const invoicesData: Invoice[] = await invoicesResponse.json();
        const quotationsData: Quotation[] = await quotationsResponse.json();
        
        // Process and combine clients from both sources
        const clientsMap = new Map<string, Client>();
        
        // Process invoices
        invoicesData.forEach((invoice: Invoice) => {
          if (!invoice.client_name) return;
          
          const clientKey = `${invoice.client_name.toLowerCase()}-${invoice.client_email?.toLowerCase() || ''}`;
          
          if (!clientsMap.has(clientKey)) {
            clientsMap.set(clientKey, {
              id: clientKey,
              name: invoice.client_name,
              email: invoice.client_email || '',
              phone: '',
              company: '',
              address: '',
              invoice_count: 0,
              quotation_count: 0,
              total_amount: 0,
            });
          }
          
          const client = clientsMap.get(clientKey)!;
          client.invoice_count++;
          if (invoice.status === 'paid') {
            client.total_amount += parseFloat(invoice.total.toString());
          }
        });
        
        // Process quotations
        quotationsData.forEach((quotation: Quotation) => {
          if (!quotation.client_name) return;
          
          const clientKey = `${quotation.client_name.toLowerCase()}-${quotation.client_email?.toLowerCase() || ''}`;
          
          if (!clientsMap.has(clientKey)) {
            clientsMap.set(clientKey, {
              id: clientKey,
              name: quotation.client_name,
              email: quotation.client_email || '',
              phone: '',
              company: '',
              address: '',
              invoice_count: 0,
              quotation_count: 0,
              total_amount: 0,
            });
          }
          
          const client = clientsMap.get(clientKey)!;
          client.quotation_count++;
          // Update contact info if available from quotation
          if (quotation.client_phone && !client.phone) {
            client.phone = quotation.client_phone;
          }
          if (quotation.client_company && !client.company) {
            client.company = quotation.client_company;
          }
        });
        
        // Convert map to array and sort by name
        const clientsArray = Array.from(clientsMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setClients(clientsArray);
      } else {
        throw new Error(`Failed to fetch data`);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      Alert.alert('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const onRefresh = async () => {
    await fetchClients();
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const handleAction = async (action: string, client: Client) => {
    setShowActionsModal(false);
    
    switch (action) {
      case 'view':
        router.push({
          pathname: '/client-detail',
          params: {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            company: client.company,
            address: client.address,
            invoice_count: client.invoice_count.toString(),
            quotation_count: client.quotation_count.toString(),
            total_amount: client.total_amount.toString(),
          }
        });
        break;
        
      case 'edit':
        Alert.alert('Info', 'Edit client feature coming soon!');
        break;
        
      case 'create_invoice':
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
        break;
        
      case 'create_quotation':
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
        break;
        
      case 'share':
        Alert.alert('Info', 'Share client feature coming soon!');
        break;
    }
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
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>Clients</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Icon name="rotate" size={16} color="#C3B1E1" />
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
          placeholder="Search clients..."
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
    </View>
  );

  const renderClientCard = ({ item }: { item: Client }) => {
    return (
      <TouchableOpacity
        style={styles.clientCard}
        activeOpacity={0.7}
        onPress={() => handleAction('view', item)}
        onLongPress={() => {
          setSelectedClient(item);
          setShowActionsModal(true);
        }}
      >
        <View style={styles.clientCardHeader}>
          <View style={styles.clientAvatar}>
            <Text style={styles.clientAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName} numberOfLines={1}>{item.name}</Text>
            {item.company && (
              <Text style={styles.clientCompany} numberOfLines={1}>{item.company}</Text>
            )}
            {item.total_amount > 0 && (
              <Text style={styles.clientTotalAmount}>
                {formatCurrency(item.total_amount)}
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              setSelectedClient(item);
              setShowActionsModal(true);
            }}
          >
            <Icon name="ellipsis-vertical" size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <View style={styles.clientCardBody}>
          {item.email && (
            <View style={styles.contactRow}>
              <Icon name="envelope" size={12} color="#8E8E93" />
              <Text style={styles.contactText} numberOfLines={1}>{item.email}</Text>
            </View>
          )}
          
          {item.phone && (
            <View style={styles.contactRow}>
              <Icon name="phone" size={12} color="#8E8E93" />
              <Text style={styles.contactText} numberOfLines={1}>{item.phone}</Text>
            </View>
          )}
          
          <View style={styles.documentsRow}>
            <View style={styles.documentCount}>
              <Icon name="file-invoice-dollar" size={12} color="#C3B1E1" />
              <Text style={styles.documentCountText}>{item.invoice_count} Invoices</Text>
            </View>
            <View style={styles.documentCount}>
              <Icon name="quote-right" size={12} color="#10b981" />
              <Text style={styles.documentCountText}>{item.quotation_count} Quotes</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="users" size={60} color="#8E8E93" />
      <Text style={styles.emptyStateTitle}>No clients found</Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery ? 'Try changing your search criteria' : 'Create invoices or quotes to automatically add clients'}
      </Text>
      {!searchQuery && (
        <TouchableOpacity 
          style={styles.emptyStateButton}
          onPress={() => router.push('/create-invoice')}
        >
          <Icon name="plus" size={16} color="#000000" />
          <Text style={styles.emptyStateButtonText}>Create First Invoice</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActionsModal = () => {
    const actions = [
      { label: 'View Details', icon: 'eye', color: '#C3B1E1', action: 'view' },
      { label: 'Create Invoice', icon: 'file-invoice-dollar', color: '#C3B1E1', action: 'create_invoice' },
      { label: 'Create Quote', icon: 'quote-right', color: '#10b981', action: 'create_quotation' },
      { label: 'Edit Client', icon: 'pen-to-square', color: '#f59e0b', action: 'edit' },
      { label: 'Share Contact', icon: 'share', color: '#3b82f6', action: 'share' },
    ];
    
    return (
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
              <Text style={styles.modalTitle}>Client Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {selectedClient && (
              <View style={styles.modalInfo}>
                <View style={styles.modalClientAvatar}>
                  <Text style={styles.modalClientAvatarText}>
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.modalClientName}>{selectedClient.name}</Text>
                {selectedClient.company && (
                  <Text style={styles.modalClientCompany}>{selectedClient.company}</Text>
                )}
              </View>
            )}

            <View style={styles.modalActions}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalActionButton}
                  onPress={() => selectedClient && handleAction(action.action, selectedClient)}
                >
                  <Icon name={action.icon as any} size={18} color={action.color} />
                  <Text style={styles.modalActionText}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Filter clients based on search
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // SHIMMER LOADING STATE
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={[styles.header, { backgroundColor: '#000000' }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <View style={[styles.backButton, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]} />
              <ShimmerLine width={80} height={26} borderRadius={4} />
            </View>
            <ShimmerLine width={36} height={36} borderRadius={8} />
          </View>
        </View>
        <View style={styles.searchContainer}>
          <ShimmerLine width="100%" height={48} borderRadius={8} />
        </View>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ShimmerLine width={120} height={24} borderRadius={4} style={{ marginBottom: 16, marginLeft: 20 }} />
          <View style={styles.clientsList}>
            <ShimmerClientCard />
            <ShimmerClientCard />
            <ShimmerClientCard />
            <ShimmerClientCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <View style={styles.mainContent}>
        {renderSearchBar()}
        
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
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {filteredClients.length} {filteredClients.length === 1 ? 'Client' : 'Clients'}
            </Text>
            {searchQuery && (
              <Text style={styles.resultsSubtitle}>
                Found {filteredClients.length} {filteredClients.length === 1 ? 'result' : 'results'}
              </Text>
            )}
          </View>

          {filteredClients.length > 0 ? (
            <FlatList
              data={filteredClients}
              renderItem={renderClientCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.clientsList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      </View>
      
      {renderActionsModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Header Styles
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
  // Search Bar
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
  // Main Content
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultsSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  // Clients List
  clientsList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  // Client Card
  clientCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  clientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientAvatarText: {
    color: '#C3B1E1',
    fontSize: 20,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  clientCompany: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 2,
  },
  clientTotalAmount: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientCardBody: {
    gap: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  documentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  documentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  documentCountText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  // Empty State
  emptyState: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 40,
    alignItems: 'center',
    marginHorizontal: 20,
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
  emptyStateSubtitle: {
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
  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
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
    gap: 12,
  },
  modalClientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClientAvatarText: {
    color: '#C3B1E1',
    fontSize: 22,
    fontWeight: '700',
  },
  modalClientName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalClientCompany: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
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
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});