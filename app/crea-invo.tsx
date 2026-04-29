import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';
import * as SecureStore from 'expo-secure-store';

// Supabase configuration - SAME AS YOUR AUTH PAGE
const supabaseUrl = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const supabaseAnonKey = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
};

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [invoiceData, setInvoiceData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    client_address: '',
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    notes: '',
    items: [
      { id: '1', description: '', quantity: 1, price: 0, total: 0 },
    ] as InvoiceItem[],
    discount: 0,
    subtotal: 0,
    total: 0,
    status: 'draft',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [loadingInvoiceNumber, setLoadingInvoiceNumber] = useState(false);

  // Generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      setLoadingInvoiceNumber(true);
      
      // Get the latest invoice number from Supabase
      const response = await fetch(`${supabaseUrl}/rest/v1/invoices?select=invoice_number&order=created_at.desc&limit=1`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lastInvoice = data[0].invoice_number;
          const match = lastInvoice.match(/(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1]);
            const nextNumber = lastNumber + 1;
            setInvoiceData(prev => ({ 
              ...prev, 
              invoice_number: `INV-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}` 
            }));
          } else {
            setInvoiceData(prev => ({ 
              ...prev, 
              invoice_number: `INV-${new Date().getFullYear()}-001` 
            }));
          }
        } else {
          setInvoiceData(prev => ({ 
            ...prev, 
            invoice_number: `INV-${new Date().getFullYear()}-001` 
          }));
        }
      } else {
        setInvoiceData(prev => ({ 
          ...prev, 
          invoice_number: `INV-${new Date().getFullYear()}-001` 
        }));
      }
    } catch (error) {
      console.error('Error generating invoice number:', error);
      setInvoiceData(prev => ({ 
        ...prev, 
        invoice_number: `INV-${new Date().getFullYear()}-001` 
      }));
    } finally {
      setLoadingInvoiceNumber(false);
    }
  };

  // Load next invoice number on mount
  useEffect(() => {
    generateNextInvoiceNumber();
  }, []);

  const handleItemChange = (id: string, field: string, value: string | number) => {
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          const quantity = Number(updatedItem.quantity) || 0;
          const price = Number(updatedItem.price) || 0;
          updatedItem.total = quantity * price;
        }
        return updatedItem;
      }
      return item;
    });

    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal - invoiceData.discount;

    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
      subtotal,
      total,
    });
  };

  const addItem = () => {
    const newId = (invoiceData.items.length + 1).toString();
    const newItem = {
      id: newId,
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    });
  };

  const removeItem = (id: string) => {
    if (invoiceData.items.length === 1) {
      Alert.alert('Cannot Remove', 'At least one item is required');
      return;
    }
    const updatedItems = invoiceData.items.filter(item => item.id !== id);
    setInvoiceData({
      ...invoiceData,
      items: updatedItems,
    });
  };

  const validateForm = () => {
    if (!invoiceData.client_name.trim()) {
      Alert.alert('Validation Error', 'Client name is required');
      return false;
    }
    
    if (!invoiceData.due_date) {
      Alert.alert('Validation Error', 'Due date is required');
      return false;
    }

    for (const item of invoiceData.items) {
      if (!item.description.trim()) {
        Alert.alert('Validation Error', 'Item description is required');
        return false;
      }
      if (item.quantity <= 0) {
        Alert.alert('Validation Error', 'Quantity must be greater than 0');
        return false;
      }
      if (item.price <= 0) {
        Alert.alert('Validation Error', 'Price must be greater than 0');
        return false;
      }
    }

    return true;
  };

  // Save invoice to Supabase
  const saveInvoiceToSupabase = async (status: 'draft' | 'pending') => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      const invoicePayload = {
        invoice_number: invoiceData.invoice_number,
        client_name: invoiceData.client_name,
        client_email: invoiceData.client_email,
        client_phone: invoiceData.client_phone,
        client_address: invoiceData.client_address,
        issue_date: invoiceData.issue_date,
        due_date: invoiceData.due_date,
        items: invoiceData.items,
        subtotal: invoiceData.subtotal,
        discount: invoiceData.discount,
        total: invoiceData.total,
        notes: invoiceData.notes,
        status: status,
      };

      const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invoicePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save invoice: ${response.status} - ${errorText}`);
      }

      const savedInvoice = await response.json();
      
      Alert.alert(
        'Success', 
        status === 'draft' 
          ? 'Invoice saved as draft successfully!' 
          : 'Invoice saved and marked as pending!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({ 
                pathname: '/invoice-detail', 
                params: { id: savedInvoice[0]?.id || '' } 
              });
            }
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save invoice: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = () => saveInvoiceToSupabase('draft');
  const handleSaveSend = () => saveInvoiceToSupabase('pending');

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Icon name="arrow-left" size={20} color="#C3B1E1" />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>
          Create Invoice
        </Text>
        <Text style={[styles.headerSubtitle, isSmallScreen && styles.headerSubtitleSmall]}>
          {loadingInvoiceNumber ? 'Loading...' : invoiceData.invoice_number}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.headerActionButton}
        onPress={() => {
          Alert.alert('Invoice Options', 'Select an action', [
            { 
              text: 'Clear Form', 
              style: 'destructive', 
              onPress: () => {
                Alert.alert('Clear Form', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Clear', 
                    style: 'destructive', 
                    onPress: () => {
                      setInvoiceData({
                        client_name: '',
                        client_email: '',
                        client_phone: '',
                        client_address: '',
                        invoice_number: invoiceData.invoice_number,
                        issue_date: new Date().toISOString().split('T')[0],
                        due_date: '',
                        notes: '',
                        items: [{ id: '1', description: '', quantity: 1, price: 0, total: 0 }],
                        discount: 0,
                        subtotal: 0,
                        total: 0,
                        status: 'draft',
                      });
                    }
                  }
                ]);
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]);
        }}
      >
        <Icon name="ellipsis-vertical" size={20} color="#C3B1E1" />
      </TouchableOpacity>
    </View>
  );

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, editable = true, icon }: any) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, isSmallScreen && styles.inputLabelSmall]}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon && (
          <Icon name={icon} size={16} color="#C3B1E1" style={styles.inputIcon} />
        )}
        <TextInput
          style={[
            styles.input,
            isSmallScreen && styles.inputSmall,
            multiline && { height: 80, textAlignVertical: 'top' },
            !editable && { backgroundColor: '#475569' }
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType={keyboardType}
          multiline={multiline}
          editable={editable}
          blurOnSubmit={false}
          returnKeyType="next"
        />
      </View>
    </View>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Client Information Section */}
            <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="user" size={18} color="#C3B1E1" />
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Client Information
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Client Name *"
                    value={invoiceData.client_name}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, client_name: text})}
                    placeholder="Enter client name"
                    icon="user"
                  />
                </View>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Email"
                    value={invoiceData.client_email}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, client_email: text})}
                    placeholder="client@example.com"
                    keyboardType="email-address"
                    icon="envelope"
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Phone"
                    value={invoiceData.client_phone}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, client_phone: text})}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                    icon="phone"
                  />
                </View>
                <View style={[styles.inputColumn, { flex: 2 }]}>
                  <InputField
                    label="Address"
                    value={invoiceData.client_address}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, client_address: text})}
                    placeholder="Enter full address"
                    multiline
                    icon="location-dot"
                  />
                </View>
              </View>
            </View>

            {/* Invoice Details Section */}
            <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="file-invoice" size={18} color="#C3B1E1" />
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Invoice Details
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Invoice Number"
                    value={invoiceData.invoice_number}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, invoice_number: text})}
                    placeholder="INV-2024-001"
                    editable={false}
                    icon="hashtag"
                  />
                </View>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Issue Date"
                    value={invoiceData.issue_date}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, issue_date: text})}
                    placeholder="YYYY-MM-DD"
                    icon="calendar"
                  />
                </View>
                <View style={styles.inputColumn}>
                  <InputField
                    label="Due Date *"
                    value={invoiceData.due_date}
                    onChangeText={(text: string) => setInvoiceData({...invoiceData, due_date: text})}
                    placeholder="YYYY-MM-DD"
                    icon="calendar-day"
                  />
                </View>
              </View>
            </View>

            {/* Items Section */}
            <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="list-check" size={18} color="#C3B1E1" />
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Items & Services
                  </Text>
                </View>
                <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                  <Icon name="plus" size={16} color="#C3B1E1" />
                  <Text style={styles.addItemText}>Add Item</Text>
                </TouchableOpacity>
              </View>

              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.tableCell, { flex: 2.5 }]}>
                  <Text style={styles.tableHeaderText}>Description *</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableHeaderText}>Qty</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableHeaderText}>Price (KES)</Text>
                </View>
                <View style={styles.tableCell}>
                  <Text style={styles.tableHeaderText}>Total (KES)</Text>
                </View>
                <View style={[styles.tableCell, { width: 40 }]}>
                  <Text style={styles.tableHeaderText}></Text>
                </View>
              </View>

              {/* Items List */}
              {invoiceData.items.map((item, index) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, { flex: 2.5 }]}>
                    <TextInput
                      style={[styles.tableInput, isSmallScreen && styles.tableInputSmall]}
                      value={item.description}
                      onChangeText={(text) => handleItemChange(item.id, 'description', text)}
                      placeholder="Item description"
                      placeholderTextColor="#64748b"
                      blurOnSubmit={false}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.tableCell}>
                    <TextInput
                      style={[styles.tableInput, isSmallScreen && styles.tableInputSmall, { textAlign: 'center' }]}
                      value={item.quantity.toString()}
                      onChangeText={(text) => handleItemChange(item.id, 'quantity', parseFloat(text) || 0)}
                      placeholder="1"
                      keyboardType="numeric"
                      blurOnSubmit={false}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.tableCell}>
                    <TextInput
                      style={[styles.tableInput, isSmallScreen && styles.tableInputSmall, { textAlign: 'right' }]}
                      value={item.price.toString()}
                      onChangeText={(text) => handleItemChange(item.id, 'price', parseFloat(text) || 0)}
                      placeholder="0.00"
                      keyboardType="numeric"
                      blurOnSubmit={false}
                      returnKeyType="done"
                    />
                  </View>
                  <View style={styles.tableCell}>
                    <Text style={[styles.tableTotal, isSmallScreen && styles.tableTotalSmall]}>
                      {item.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, { width: 40, alignItems: 'center' }]}>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Icon name="trash" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Summary Section */}
            <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="calculator" size={18} color="#C3B1E1" />
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Summary
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Subtotal</Text>
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>
                  KES {invoiceData.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.summaryLabel, isSmallScreen && styles.summaryLabelSmall]}>Discount</Text>
                  <TouchableOpacity onPress={() => {
                    Alert.prompt(
                      'Discount',
                      'Enter discount amount in KES:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Apply', 
                          onPress: (value) => {
                            const discount = parseFloat(value || '0');
                            setInvoiceData({
                              ...invoiceData,
                              discount,
                              total: invoiceData.subtotal - discount,
                            });
                          }
                        }
                      ],
                      'plain-text',
                      invoiceData.discount.toString()
                    );
                  }}>
                    <Icon name="pen" size={12} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.summaryValue, isSmallScreen && styles.summaryValueSmall]}>
                  KES {invoiceData.discount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={[styles.summaryDivider]} />

              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, isSmallScreen && styles.totalLabelSmall]}>Total</Text>
                <Text style={[styles.totalValue, isSmallScreen && styles.totalValueSmall]}>
                  KES {invoiceData.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Notes Section */}
            <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Icon name="sticky-note" size={18} color="#C3B1E1" />
                  <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
                    Notes
                  </Text>
                </View>
              </View>
              
              <TextInput
                style={[styles.notesInput, isSmallScreen && styles.notesInputSmall]}
                value={invoiceData.notes}
                onChangeText={(text) => setInvoiceData({...invoiceData, notes: text})}
                placeholder="Add any additional notes or terms..."
                placeholderTextColor="#64748b"
                multiline
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonsGrid}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveDraftButton]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                >
                  <Icon name="save" size={18} color="#C3B1E1" />
                  <Text style={[styles.actionButtonText, styles.saveDraftText]}>
                    {isSaving ? 'Saving...' : 'Save Draft'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveSendButton]}
                  onPress={handleSaveSend}
                  disabled={isSaving}
                >
                  <Icon name="paper-plane" size={18} color="#000000" />
                  <Text style={[styles.actionButtonText, styles.saveSendText]}>
                    {isSaving ? 'Saving...' : 'Save & Send'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    backgroundColor: '#15171C',
  },
  headerSmall: {
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerTitleSmall: {
    fontSize: 18,
  },
  headerSubtitle: {
    color: '#C3B1E1',
    fontSize: 12,
    marginTop: 2,
  },
  headerSubtitleSmall: {
    fontSize: 11,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#24262B',
    borderLeftWidth: 4,
    borderLeftColor: '#C3B1E1',
  },
  sectionCardSmall: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionTitleSmall: {
    fontSize: 16,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
  },
  addItemText: {
    color: '#C3B1E1',
    fontSize: 12,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#C3B1E1',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputLabelSmall: {
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  inputSmall: {
    paddingVertical: 10,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputColumn: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    marginBottom: 8,
  },
  tableCell: {
    paddingHorizontal: 4,
  },
  tableHeaderText: {
    color: '#C3B1E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  tableInput: {
    backgroundColor: '#0A0A0B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#24262B',
    minHeight: 36,
  },
  tableInputSmall: {
    fontSize: 13,
    paddingVertical: 6,
    minHeight: 32,
  },
  tableTotal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  tableTotalSmall: {
    fontSize: 13,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  summaryLabel: {
    color: '#C3B1E1',
    fontSize: 14,
  },
  summaryLabelSmall: {
    fontSize: 13,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  summaryValueSmall: {
    fontSize: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#24262B',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
    marginTop: 10,
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  totalLabelSmall: {
    fontSize: 16,
  },
  totalValue: {
    color: '#C3B1E1',
    fontSize: 24,
    fontWeight: '700',
  },
  totalValueSmall: {
    fontSize: 22,
  },
  notesInput: {
    backgroundColor: '#0A0A0B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#24262B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  notesInputSmall: {
    fontSize: 14,
    minHeight: 80,
  },
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 30,
  },
  actionButtonsGrid: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  saveDraftButton: {
    backgroundColor: 'transparent',
    borderColor: '#C3B1E1',
  },
  saveSendButton: {
    backgroundColor: '#C3B1E1',
    borderColor: '#C3B1E1',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveDraftText: {
    color: '#C3B1E1',
  },
  saveSendText: {
    color: '#000000',
  },
});