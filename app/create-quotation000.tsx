import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Alert,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function CreateQuotationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  // Form state
  const [quotationNumber, setQuotationNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  
  const [issueDate, setIssueDate] = useState(new Date());
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)); // 30 days from now
  
  const [items, setItems] = useState<QuotationItem[]>([
    { id: '1', description: '', quantity: 1, price: 0, total: 0 }
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  
  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [calendarMode, setCalendarMode] = useState<'issue' | 'valid' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Generate quotation number
  useEffect(() => {
    const generateQuotationNumber = () => {
      const prefix = 'QT';
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `${prefix}-${year}${month}-${random}`;
    };
    
    setQuotationNumber(generateQuotationNumber());
  }, []);

  // Load clients and products
  useEffect(() => {
    fetchClients();
    fetchProducts();
  }, []);

  // Calculate totals when items change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal - discount);
  }, [items, discount]);

  const fetchClients = async () => {
    try {
      // Since you don't have a clients table, we'll create mock clients from existing data
      const invoicesResponse = await fetch(`${SUPABASE_URL}/rest/v1/invoices?select=client_name,client_email,client_phone,client_address&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      const quotationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/quotations?select=client_name,client_email,client_phone,client_company,client_address&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (invoicesResponse.ok && quotationsResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        const quotationsData = await quotationsResponse.json();
        
        const clientsMap = new Map<string, Client>();
        
        // Process invoices
        invoicesData.forEach((item: any) => {
          if (item.client_name) {
            const clientKey = `${item.client_name}-${item.client_email || ''}`;
            if (!clientsMap.has(clientKey)) {
              clientsMap.set(clientKey, {
                id: clientKey,
                name: item.client_name,
                email: item.client_email || '',
                phone: item.client_phone || '',
                company: '',
                address: item.client_address || '',
              });
            }
          }
        });

        // Process quotations
        quotationsData.forEach((item: any) => {
          if (item.client_name) {
            const clientKey = `${item.client_name}-${item.client_email || ''}`;
            if (!clientsMap.has(clientKey)) {
              clientsMap.set(clientKey, {
                id: clientKey,
                name: item.client_name,
                email: item.client_email || '',
                phone: item.client_phone || '',
                company: item.client_company || '',
                address: item.client_address || '',
              });
            } else {
              // Update company if available
              const client = clientsMap.get(clientKey)!;
              if (item.client_company && !client.company) {
                client.company = item.client_company;
              }
            }
          }
        });

        const clientsArray = Array.from(clientsMap.values());
        setClients(clientsArray);
        setFilteredClients(clientsArray);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=id,name,description,price&order=name`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-KE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calendar functions
  const openCalendar = (mode: 'issue' | 'valid') => {
    setCalendarMode(mode);
    setSelectedDate(mode === 'issue' ? issueDate : validUntil);
    setShowCalendarModal(true);
  };

  const handleDateSelect = () => {
    if (calendarMode === 'issue') {
      setIssueDate(selectedDate);
    } else if (calendarMode === 'valid') {
      setValidUntil(selectedDate);
    }
    setShowCalendarModal(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  // Client search
  useEffect(() => {
    if (clientSearchQuery.trim() === '') {
      setFilteredClients(clients);
    } else {
      const query = clientSearchQuery.toLowerCase();
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.company.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [clientSearchQuery, clients]);

  // Item management
  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Calculate total if quantity or price changes
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setItems(updatedItems);
  };

  // Product selection
  const selectProduct = (product: Product) => {
    if (selectedItemIndex !== null) {
      const updatedItems = [...items];
      updatedItems[selectedItemIndex] = {
        ...updatedItems[selectedItemIndex],
        description: product.name,
        price: product.price,
        total: updatedItems[selectedItemIndex].quantity * product.price,
      };
      setItems(updatedItems);
    }
    setShowProductSearch(false);
    setSelectedItemIndex(null);
  };

  // Client selection
  const selectClient = (client: Client) => {
    setClientName(client.name);
    setClientEmail(client.email);
    setClientPhone(client.phone);
    setClientCompany(client.company);
    setClientAddress(client.address);
    setShowClientSearch(false);
    setClientSearchQuery('');
  };

  // Save quotation
  const saveQuotation = async (status: 'draft' | 'pending' = 'draft') => {
    if (!clientName.trim()) {
      Alert.alert('Error', 'Client name is required');
      return;
    }

    // Validate items
    const hasInvalidItems = items.some(item => 
      !item.description.trim() || item.quantity <= 0 || item.price < 0
    );
    
    if (hasInvalidItems) {
      Alert.alert('Error', 'Please fill all item fields with valid values');
      return;
    }

    setLoading(true);
    try {
      const quotationData = {
        quotation_number: quotationNumber,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_company: clientCompany,
        client_address: clientAddress,
        issue_date: issueDate.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal: subtotal,
        discount: discount,
        total: total,
        notes: notes,
        status: status,
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(quotationData),
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          `Quotation ${status === 'draft' ? 'saved as draft' : 'sent successfully'}!`,
          [{ 
            text: 'OK', 
            onPress: () => router.push('/quotations')
          }]
        );
      } else {
        throw new Error('Failed to save quotation');
      }
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      Alert.alert('Error', `Failed to save quotation: ${error.message}`);
    } finally {
      setLoading(false);
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
            <Icon name="chevron-left" size={20} color="#10b981" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>Create Quotation</Text>
        </View>
        <TouchableOpacity 
          style={styles.saveDraftButton}
          onPress={() => saveQuotation('draft')}
          disabled={loading}
        >
          <Icon name="save" size={16} color="#10b981" />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClientSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name="user" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Client Information</Text>
      </View>
      
      <View style={styles.clientSearchContainer}>
        <TouchableOpacity 
          style={styles.clientSearchButton}
          onPress={() => setShowClientSearch(true)}
        >
          <Icon name="search" size={16} color="#10b981" />
          <Text style={styles.clientSearchText}>Search existing clients</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <View style={styles.inputContainer}>
          <Icon name="user" size={16} color="#10b981" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            placeholderTextColor="#8E8E93"
            value={clientName}
            onChangeText={setClientName}
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Company</Text>
        <View style={styles.inputContainer}>
          <Icon name="building" size={16} color="#10b981" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Company Ltd"
            placeholderTextColor="#8E8E93"
            value={clientCompany}
            onChangeText={setClientCompany}
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="envelope" size={16} color="#10b981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="john@company.com"
              placeholderTextColor="#8E8E93"
              value={clientEmail}
              onChangeText={setClientEmail}
              keyboardType="email-address"
            />
          </View>
        </View>
        
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={16} color="#10b981" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="0712345678"
              placeholderTextColor="#8E8E93"
              value={clientPhone}
              onChangeText={setClientPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Address</Text>
        <View style={styles.inputContainer}>
          <Icon name="location-dot" size={16} color="#10b981" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="123 Street, City, Country"
            placeholderTextColor="#8E8E93"
            value={clientAddress}
            onChangeText={setClientAddress}
            multiline
          />
        </View>
      </View>
    </View>
  );

  const renderQuotationDetails = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name="quote-right" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Quotation Details</Text>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Quotation Number</Text>
        <View style={[styles.inputContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
          <Icon name="hashtag" size={16} color="#10b981" style={styles.inputIcon} />
          <Text style={styles.quotationNumberText}>{quotationNumber}</Text>
        </View>
      </View>

      <View style={styles.formRow}>
        <TouchableOpacity 
          style={[styles.formGroup, { flex: 1, marginRight: 8 }]}
          onPress={() => openCalendar('issue')}
        >
          <Text style={styles.label}>Issue Date</Text>
          <View style={[styles.inputContainer, styles.dateInput]}>
            <Icon name="calendar" size={16} color="#10b981" style={styles.inputIcon} />
            <Text style={styles.dateText}>{formatDate(issueDate)}</Text>
            <Icon name="chevron-down" size={14} color="#8E8E93" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}
          onPress={() => openCalendar('valid')}
        >
          <Text style={styles.label}>Valid Until</Text>
          <View style={[styles.inputContainer, styles.dateInput]}>
            <Icon name="calendar-check" size={16} color="#10b981" style={styles.inputIcon} />
            <Text style={styles.dateText}>{formatDate(validUntil)}</Text>
            <Icon name="chevron-down" size={14} color="#8E8E93" style={{ marginLeft: 8 }} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItemsSection = () => (
    <View style={styles.section}>
      <View style={[styles.sectionHeader, { marginBottom: 16 }]}>
        <Icon name="list-check" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Quotation Items</Text>
        <TouchableOpacity 
          style={styles.addItemButton}
          onPress={addItem}
        >
          <Icon name="plus" size={16} color="#10b981" />
          <Text style={styles.addItemText}>Add Item</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemsHeader}>
        <Text style={[styles.itemHeaderText, { flex: 3 }]}>Description</Text>
        <Text style={[styles.itemHeaderText, { flex: 1 }]}>Qty</Text>
        <Text style={[styles.itemHeaderText, { flex: 2 }]}>Price</Text>
        <Text style={[styles.itemHeaderText, { flex: 2 }]}>Total</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {items.map((item, index) => (
        <View key={item.id} style={styles.itemRow}>
          <TouchableOpacity 
            style={[styles.itemInputContainer, { flex: 3, marginRight: 8 }]}
            onPress={() => {
              setSelectedItemIndex(index);
              setShowProductSearch(true);
            }}
          >
            <TextInput
              style={styles.itemInput}
              placeholder="Item description"
              placeholderTextColor="#8E8E93"
              value={item.description}
              onChangeText={(text) => updateItem(item.id, 'description', text)}
            />
            <Icon name="search" size={14} color="#8E8E93" />
          </TouchableOpacity>
          
          <TextInput
            style={[styles.itemInput, { flex: 1, marginRight: 8, textAlign: 'center' }]}
            placeholder="1"
            placeholderTextColor="#8E8E93"
            value={item.quantity.toString()}
            onChangeText={(text) => updateItem(item.id, 'quantity', parseInt(text) || 0)}
            keyboardType="numeric"
          />
          
          <TextInput
            style={[styles.itemInput, { flex: 2, marginRight: 8, textAlign: 'right' }]}
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            value={item.price.toString()}
            onChangeText={(text) => updateItem(item.id, 'price', parseFloat(text) || 0)}
            keyboardType="numeric"
          />
          
          <View style={[styles.totalContainer, { flex: 2, marginRight: 8 }]}>
            <Text style={styles.totalText}>{formatCurrency(item.total)}</Text>
          </View>
          
          {items.length > 1 && (
            <TouchableOpacity 
              style={styles.removeItemButton}
              onPress={() => removeItem(item.id)}
            >
              <Icon name="trash" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderTotalsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name="calculator" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Totals</Text>
      </View>
      
      <View style={styles.totalsRow}>
        <Text style={styles.totalLabel}>Subtotal</Text>
        <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
      </View>
      
      <View style={styles.totalsRow}>
        <View style={styles.discountContainer}>
          <Icon name="tag" size={16} color="#f59e0b" style={{ marginRight: 8 }} />
          <Text style={styles.totalLabel}>Discount</Text>
        </View>
        <View style={styles.discountInputContainer}>
          <Text style={styles.currencySymbol}>KES</Text>
          <TextInput
            style={styles.discountInput}
            placeholder="0.00"
            placeholderTextColor="#8E8E93"
            value={discount.toString()}
            onChangeText={(text) => setDiscount(parseFloat(text) || 0)}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={[styles.totalsRow, styles.grandTotalRow]}>
        <Text style={styles.grandTotalLabel}>Grand Total</Text>
        <Text style={styles.grandTotalValue}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );

  const renderNotesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name="note-sticky" size={20} color="#10b981" />
        <Text style={styles.sectionTitle}>Notes</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Icon name="pen-to-square" size={16} color="#10b981" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Add any additional notes or terms..."
          placeholderTextColor="#8E8E93"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>
    </View>
  );

  const renderCalendarModal = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const currentDate = selectedDate;
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthDays = getMonthDays(currentDate);
    const weeks = [];
    
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }
    
    const isSelectedDate = (date: Date | null) => {
      if (!date) return false;
      if (calendarMode === 'issue') return isSameDay(date, issueDate);
      if (calendarMode === 'valid') return isSameDay(date, validUntil);
      return false;
    };

    const isToday = (date: Date | null) => {
      if (!date) return false;
      const today = new Date();
      return isSameDay(date, today);
    };

    return (
      <Modal
        visible={showCalendarModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <TouchableOpacity 
          style={styles.calendarModalOverlay}
          activeOpacity={1}
          onPress={() => setShowCalendarModal(false)}
        >
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                Select {calendarMode === 'issue' ? 'Issue Date' : 'Valid Until Date'}
              </Text>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarNavigation}>
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                <Icon name="chevron-left" size={16} color="#10b981" />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthYear}>
                {monthNames[currentMonth]} {currentYear}
              </Text>
              
              <TouchableOpacity 
                style={styles.calendarNavButton}
                onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                <Icon name="chevron-right" size={16} color="#10b981" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarDaysHeader}>
              {dayNames.map(day => (
                <View key={day} style={styles.calendarDayHeader}>
                  <Text style={styles.calendarDayHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.calendarWeek}>
                  {week.map((date, dayIndex) => (
                    <TouchableOpacity
                      key={dayIndex}
                      style={[
                        styles.calendarDay,
                        date && isSelectedDate(date) && styles.calendarDaySelected,
                        date && isToday(date) && styles.calendarDayToday,
                      ]}
                      onPress={() => date && setSelectedDate(date)}
                      disabled={!date}
                    >
                      <Text style={[
                        styles.calendarDayText,
                        date && isSelectedDate(date) && styles.calendarDayTextSelected,
                        date && isToday(date) && styles.calendarDayTextToday,
                        !date && styles.calendarDayTextEmpty,
                      ]}>
                        {date ? date.getDate() : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity 
                style={styles.calendarCancelButton}
                onPress={() => setShowCalendarModal(false)}
              >
                <Text style={styles.calendarCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.calendarSelectButton}
                onPress={handleDateSelect}
              >
                <Text style={styles.calendarSelectText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderClientSearchModal = () => (
    <Modal
      visible={showClientSearch}
      transparent
      animationType="slide"
      onRequestClose={() => setShowClientSearch(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowClientSearch(false)} style={styles.modalBackButton}>
            <Icon name="arrow-left" size={20} color="#10b981" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Client</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search clients..."
            placeholderTextColor="#8E8E93"
            value={clientSearchQuery}
            onChangeText={setClientSearchQuery}
            autoFocus
          />
        </View>
        
        {filteredClients.length > 0 ? (
          <FlatList
            data={filteredClients}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clientItem}
                onPress={() => selectClient(item)}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientItemName}>{item.name}</Text>
                  {item.company && (
                    <Text style={styles.clientItemCompany}>{item.company}</Text>
                  )}
                  {item.email && (
                    <Text style={styles.clientItemEmail}>{item.email}</Text>
                  )}
                </View>
                <Icon name="chevron-right" size={16} color="#8E8E93" />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.clientsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noResults}>
            <Icon name="users" size={50} color="#8E8E93" />
            <Text style={styles.noResultsText}>No clients found</Text>
            <Text style={styles.noResultsSubtext}>
              {clientSearchQuery ? 'Try a different search' : 'Create a quotation to add clients'}
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderProductSearchModal = () => (
    <Modal
      visible={showProductSearch}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowProductSearch(false);
        setSelectedItemIndex(null);
      }}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => {
            setShowProductSearch(false);
            setSelectedItemIndex(null);
          }} style={styles.modalBackButton}>
            <Icon name="arrow-left" size={20} color="#10b981" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Product</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => selectProduct(item)}
              >
                <View style={styles.productIcon}>
                  <Icon name="box" size={20} color="#10b981" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.productDescription}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.productPriceContainer}>
                  <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.noResults}>
            <Icon name="box" size={50} color="#8E8E93" />
            <Text style={styles.noResultsText}>No products found</Text>
            <Text style={styles.noResultsSubtext}>Add products in the products section</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  const renderActions = () => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.cancelButton]}
        onPress={() => router.back()}
        disabled={loading}
      >
        <Icon name="times" size={18} color="#FFFFFF" />
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.sendButton]}
        onPress={() => saveQuotation('pending')}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#000000" />
        ) : (
          <>
            <Icon name="paper-plane" size={18} color="#000000" />
            <Text style={styles.sendButtonText}>Send Quotation</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderClientSection()}
        {renderQuotationDetails()}
        {renderItemsSection()}
        {renderTotalsSection()}
        {renderNotesSection()}
        
        <View style={styles.spacer} />
      </ScrollView>
      
      {renderActions()}
      {renderCalendarModal()}
      {renderClientSearchModal()}
      {renderProductSearchModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Header
  header: {
    backgroundColor: '#15171C',
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveDraftText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  // Main Content
  scrollContent: {
    paddingBottom: 120,
  },
  spacer: {
    height: 20,
  },
  // Sections
  section: {
    backgroundColor: '#15171C',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Form
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  label: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  quotationNumberText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
  },
  dateInput: {
    paddingVertical: 12,
  },
  dateText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  // Client Search
  clientSearchContainer: {
    marginBottom: 20,
  },
  clientSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clientSearchText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  // Items
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  addItemText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    marginBottom: 12,
  },
  itemHeaderText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 8,
  },
  itemInput: {
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 8,
  },
  totalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Totals
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  grandTotalRow: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  totalLabel: {
    color: '#8E8E93',
    fontSize: 16,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 8,
  },
  currencySymbol: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  discountInput: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 4,
    minWidth: 60,
    textAlign: 'right',
  },
  grandTotalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  grandTotalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: '700',
  },
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#10b981',
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Calendar Modal
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  calendarModalContent: {
    backgroundColor: '#15171C',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#24262B',
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  calendarTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  calendarNavButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMonthYear: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  calendarDayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayHeaderText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  calendarGrid: {
    padding: 20,
  },
  calendarWeek: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDaySelected: {
    backgroundColor: '#10b981',
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#10b981',
  },
  calendarDayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#000000',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#10b981',
    fontWeight: '700',
  },
  calendarDayTextEmpty: {
    color: 'transparent',
  },
  calendarFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  calendarCancelButton: {
    flex: 1,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarSelectButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  calendarSelectText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#15171C',
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15171C',
    margin: 20,
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
    fontSize: 16,
    paddingVertical: 12,
  },
  clientsList: {
    paddingHorizontal: 20,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clientAvatarText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '700',
  },
  clientInfo: {
    flex: 1,
  },
  clientItemName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  clientItemCompany: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 2,
  },
  clientItemEmail: {
    color: '#8E8E93',
    fontSize: 12,
  },
  // Products
  productsList: {
    paddingHorizontal: 20,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  productDescription: {
    color: '#8E8E93',
    fontSize: 12,
  },
  productPriceContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  productPrice: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  // No Results
  noResults: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  noResultsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
});