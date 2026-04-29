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
  Modal,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  TextInput, // ADDED THIS IMPORT
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import BottomNav from './components/BottomNav';

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

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [updating, setUpdating] = useState(false);

  // Fetch invoice details from Supabase
  const fetchInvoice = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${id}`, {
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
      if (data && data.length > 0) {
        setInvoice(data[0]);
        // Set payment amount to remaining balance
        const remaining = data[0].total - (data[0].paid_amount || 0);
        setPaymentAmount(remaining.toString());
      } else {
        Alert.alert('Error', 'Invoice not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      Alert.alert('Error', 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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

  const getDaysUntilDue = () => {
    if (!invoice) return 0;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isInvoiceOverdue = () => {
    if (!invoice || invoice.status === 'paid') return false;
    return getDaysUntilDue() < 0;
  };

  const handleAction = async (action: string) => {
    setShowActionsModal(false);
    
    switch (action) {
      case 'edit':
        Alert.alert('Info', 'Edit feature coming soon!');
        break;
        
      case 'share':
        await handleShare();
        break;
        
      case 'download':
        Alert.alert('Info', 'PDF download feature coming soon!');
        break;
        
      case 'duplicate':
        await handleDuplicate();
        break;
        
      case 'delete':
        handleDelete();
        break;
        
      case 'mark_paid':
        setShowPaymentModal(true);
        break;
        
      case 'send_email':
        await handleSendEmail();
        break;
        
      case 'print':
        Alert.alert('Info', 'Print feature coming soon!');
        break;
    }
  };

  const handleShare = async () => {
    if (!invoice) return;
    
    try {
      const shareContent = {
        title: `Invoice ${invoice.invoice_number}`,
        message: `Invoice ${invoice.invoice_number} for ${invoice.client_name}\nAmount: ${formatCurrency(invoice.total)}\nDue: ${formatDate(invoice.due_date)}`,
        url: `https://your-app.com/invoice/${invoice.id}`, // Replace with your actual URL
      };
      
      const result = await Share.share(shareContent);
      
      if (result.action === Share.sharedAction) {
        console.log('Shared successfully');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share invoice');
    }
  };

  const handleDuplicate = async () => {
    if (!invoice) return;
    
    Alert.alert(
      'Duplicate Invoice',
      'Create a copy of this invoice?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Duplicate', 
          onPress: async () => {
            try {
              // Generate new invoice number
              const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
              
              const duplicateInvoice = {
                ...invoice,
                invoice_number: invoiceNumber,
                status: 'draft',
                paid_amount: 0,
                paid_date: null,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
              
              delete duplicateInvoice.id;
              
              const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
                method: 'POST',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation',
                },
                body: JSON.stringify(duplicateInvoice),
              });

              if (response.ok) {
                const newInvoice = await response.json();
                Alert.alert(
                  'Success', 
                  'Invoice duplicated successfully!',
                  [
                    { 
                      text: 'View Copy', 
                      onPress: () => router.replace({ 
                        pathname: '/invoice-detail', 
                        params: { id: newInvoice[0]?.id } 
                      })
                    },
                    { text: 'OK', style: 'default' }
                  ]
                );
              } else {
                throw new Error('Duplicate failed');
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to duplicate invoice: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    if (!invoice) return;
    
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice ${invoice.invoice_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice.id}`, {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Prefer': 'return=minimal',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Invoice deleted successfully!');
                router.replace('/invoices');
              } else {
                throw new Error('Delete failed');
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete invoice: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    const email = invoice.client_email;
    if (!email) {
      Alert.alert('Error', 'Client email is required to send invoice');
      return;
    }
    
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
    const body = encodeURIComponent(
      `Dear ${invoice.client_name},\n\nPlease find attached invoice ${invoice.invoice_number} for ${formatCurrency(invoice.total)}.\n\nDue Date: ${formatDate(invoice.due_date)}\n\nThank you,\nYour Company`
    );
    
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'No email client available');
      }
    } catch (error) {
      console.error('Email error:', error);
      Alert.alert('Error', 'Failed to open email client');
    }
  };

  const handlePayment = async () => {
    if (!invoice) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }
    
    const remaining = invoice.total - (invoice.paid_amount || 0);
    if (amount > remaining) {
      Alert.alert('Error', `Payment amount cannot exceed remaining balance of ${formatCurrency(remaining)}`);
      return;
    }
    
    setUpdating(true);
    try {
      const updatedPaidAmount = (invoice.paid_amount || 0) + amount;
      const newStatus = updatedPaidAmount >= invoice.total ? 'paid' : 'partial';
      
      const updateData = {
        paid_amount: updatedPaidAmount,
        status: newStatus,
        payment_method: paymentMethod,
        paid_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices?id=eq.${invoice.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        Alert.alert('Success', 'Payment recorded successfully!');
        setShowPaymentModal(false);
        fetchInvoice(); // Refresh invoice data
      } else {
        throw new Error('Payment update failed');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to record payment: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const renderHeader = () => {
    const status = invoice ? getStatusColor(invoice.status) : { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Loading...' };
    
    return (
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowActionsModal(true)}
          >
            <Icon name="ellipsis-vertical" size={20} color="#C3B1E1" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={[styles.invoiceNumber, isSmallScreen && styles.invoiceNumberSmall]}>
              {invoice ? invoice.invoice_number : 'Loading...'}
            </Text>
            <Text style={[styles.clientName, isSmallScreen && styles.clientNameSmall]}>
              {invoice ? invoice.client_name : 'Loading invoice...'}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
            {isInvoiceOverdue() && (
              <Text style={styles.overdueText}> • Overdue</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderInvoiceInfo = () => {
    if (!invoice) return null;
    
    const daysUntilDue = getDaysUntilDue();
    const isOverdue = isInvoiceOverdue();
    const paidAmount = invoice.paid_amount || 0;
    const remaining = invoice.total - paidAmount;
    const paymentStatus = invoice.status === 'paid' ? 'Paid' : 
                         paidAmount > 0 ? 'Partial' : 'Unpaid';

    return (
      <View style={[styles.infoCard, isSmallScreen && styles.infoCardSmall]}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={14} color="#8E8E93" />
            <Text style={styles.infoLabel}>Issued Date</Text>
            <Text style={styles.infoValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="clock" size={14} color="#8E8E93" />
            <Text style={styles.infoLabel}>Due Date</Text>
            <Text style={[styles.infoValue, isOverdue && styles.overdueValue]}>
              {formatDate(invoice.due_date)}
            </Text>
            {isOverdue ? (
              <Text style={styles.dueDaysOverdue}>Overdue by {Math.abs(daysUntilDue)} days</Text>
            ) : invoice.status !== 'paid' && (
              <Text style={styles.dueDays}>Due in {daysUntilDue} days</Text>
            )}
          </View>
        </View>
        
        <View style={styles.paymentStatus}>
          <View style={styles.paymentStatusItem}>
            <Text style={styles.paymentStatusLabel}>Total Amount</Text>
            <Text style={styles.paymentStatusValue}>{formatCurrency(invoice.total)}</Text>
          </View>
          
          <View style={styles.paymentStatusItem}>
            <Text style={styles.paymentStatusLabel}>Amount Paid</Text>
            <Text style={[styles.paymentStatusValue, { color: '#10b981' }]}>
              {formatCurrency(paidAmount)}
            </Text>
          </View>
          
          <View style={styles.paymentStatusItem}>
            <Text style={styles.paymentStatusLabel}>Balance Due</Text>
            <Text style={[styles.paymentStatusValue, { color: remaining > 0 ? '#ef4444' : '#10b981' }]}>
              {formatCurrency(remaining)}
            </Text>
          </View>
          
          <View style={[styles.paymentStatusBadge, { 
            backgroundColor: paymentStatus === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : 
                           paymentStatus === 'Partial' ? 'rgba(245, 158, 11, 0.1)' : 
                           'rgba(239, 68, 68, 0.1)' 
          }]}>
            <Text style={{ 
              color: paymentStatus === 'Paid' ? '#10b981' : 
                     paymentStatus === 'Partial' ? '#f59e0b' : 
                     '#ef4444',
              fontSize: 12,
              fontWeight: '600',
            }}>
              {paymentStatus}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderClientInfo = () => {
    if (!invoice) return null;
    
    return (
      <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="building" size={18} color="#C3B1E1" />
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
              Client Information
            </Text>
          </View>
        </View>
        
        <View style={styles.clientInfo}>
          <View style={styles.clientRow}>
            <Icon name="user" size={14} color="#8E8E93" />
            <Text style={styles.clientLabel}>Name:</Text>
            <Text style={styles.clientValue}>{invoice.client_name}</Text>
          </View>
          
          {invoice.client_company && (
            <View style={styles.clientRow}>
              <Icon name="building" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Company:</Text>
              <Text style={styles.clientValue}>{invoice.client_company}</Text>
            </View>
          )}
          
          {invoice.client_email && (
            <View style={styles.clientRow}>
              <Icon name="envelope" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Email:</Text>
              <Text style={styles.clientValue}>{invoice.client_email}</Text>
            </View>
          )}
          
          {invoice.client_phone && (
            <View style={styles.clientRow}>
              <Icon name="phone" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Phone:</Text>
              <Text style={styles.clientValue}>{invoice.client_phone}</Text>
            </View>
          )}
          
          {invoice.client_address && (
            <View style={styles.clientRow}>
              <Icon name="location-dot" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Address:</Text>
              <Text style={styles.clientValue}>{invoice.client_address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItemsTable = () => {
    if (!invoice) return null;
    
    return (
      <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="list-check" size={18} color="#C3B1E1" />
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
              Items
            </Text>
          </View>
        </View>
        
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <View style={[styles.tableCell, { flex: 3 }]}>
            <Text style={styles.tableHeaderText}>Description</Text>
          </View>
          <View style={[styles.tableCell, { width: 60 }]}>
            <Text style={styles.tableHeaderText}>Qty</Text>
          </View>
          <View style={[styles.tableCell, { width: 100 }]}>
            <Text style={styles.tableHeaderText}>Price (KES)</Text>
          </View>
          <View style={[styles.tableCell, { width: 100 }]}>
            <Text style={styles.tableHeaderText}>Total (KES)</Text>
          </View>
        </View>
        
        {/* Items List */}
        {invoice.items.map((item, index) => (
          <View key={item.id || index} style={styles.tableRow}>
            <View style={[styles.tableCell, { flex: 3 }]}>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
            <View style={[styles.tableCell, { width: 60 }]}>
              <Text style={styles.itemQuantity}>{item.quantity}</Text>
            </View>
            <View style={[styles.tableCell, { width: 100 }]}>
              <Text style={styles.itemPrice}>{item.price.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={[styles.tableCell, { width: 100 }]}>
              <Text style={styles.itemTotal}>{item.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
        ))}
        
        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          
          {invoice.tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
          )}
          
          {invoice.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.discount)}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNotesAndTerms = () => {
    if (!invoice) return null;
    
    return (
      <View style={[styles.sectionCard, isSmallScreen && styles.sectionCardSmall]}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Icon name="sticky-note" size={18} color="#C3B1E1" />
            <Text style={[styles.sectionTitle, isSmallScreen && styles.sectionTitleSmall]}>
              Notes & Terms
            </Text>
          </View>
        </View>
        
        {invoice.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        ) : null}
        
        {invoice.terms && invoice.terms.length > 0 ? (
          <View style={styles.termsSection}>
            <Text style={styles.termsLabel}>Terms & Conditions:</Text>
            {invoice.terms.map((term, index) => (
              <View key={index} style={styles.termItem}>
                <Text style={styles.termBullet}>•</Text>
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderPaymentButton = () => {
    if (!invoice || invoice.status === 'paid') return null;
    
    const paidAmount = invoice.paid_amount || 0;
    const remaining = invoice.total - paidAmount;
    
    return (
      <TouchableOpacity 
        style={[styles.payButton, isSmallScreen && styles.payButtonSmall]}
        onPress={() => setShowPaymentModal(true)}
      >
        <Icon name="credit-card" size={18} color="#000000" />
        <Text style={styles.payButtonText}>
          {paidAmount > 0 ? `Pay ${formatCurrency(remaining)}` : `Pay ${formatCurrency(invoice.total)}`}
        </Text>
      </TouchableOpacity>
    );
  };

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
            <Text style={styles.modalTitle}>Invoice Actions</Text>
            <TouchableOpacity onPress={() => setShowActionsModal(false)}>
              <Icon name="times" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          {invoice && (
            <View style={styles.modalInfo}>
              <Text style={styles.modalInvoiceNumber}>{invoice.invoice_number}</Text>
              <Text style={styles.modalClient}>{invoice.client_name}</Text>
              <Text style={styles.modalAmount}>{formatCurrency(invoice.total)}</Text>
            </View>
          )}

          <View style={styles.modalActions}>
            {['edit', 'share', 'download', 'duplicate', 'mark_paid', 'send_email', 'print'].map((action) => (
              <TouchableOpacity
                key={action}
                style={styles.modalActionButton}
                onPress={() => handleAction(action)}
              >
                <Icon 
                  name={
                    action === 'edit' ? 'pen-to-square' :
                    action === 'share' ? 'share' :
                    action === 'download' ? 'download' :
                    action === 'duplicate' ? 'copy' :
                    action === 'mark_paid' ? 'credit-card' :
                    action === 'send_email' ? 'envelope' :
                    'print'
                  } 
                  size={18} 
                  color="#C3B1E1" 
                />
                <Text style={styles.modalActionText}>
                  {action === 'mark_paid' ? 'Mark as Paid' :
                   action === 'send_email' ? 'Send via Email' :
                   action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.modalActionButton, styles.deleteActionButton]}
              onPress={() => handleAction('delete')}
            >
              <Icon name="trash" size={18} color="#ef4444" />
              <Text style={[styles.modalActionText, styles.deleteActionText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
              <Icon name="times" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          {invoice && (
            <View style={styles.paymentModalContent}>
              <Text style={styles.paymentInvoiceNumber}>{invoice.invoice_number}</Text>
              <Text style={styles.paymentClient}>{invoice.client_name}</Text>
              <Text style={styles.paymentTotal}>Total: {formatCurrency(invoice.total)}</Text>
              
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentLabel}>Payment Amount (KES)</Text>
                <View style={styles.paymentInputContainer}>
                  <Text style={styles.currencySymbol}>KES</Text>
                  <TextInput
                    style={styles.paymentInput}
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#8E8E93"
                  />
                </View>
                
                <Text style={styles.paymentMethodLabel}>Payment Method</Text>
                <View style={styles.paymentMethods}>
                  {['cash', 'mpesa', 'bank_transfer', 'card'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        paymentMethod === method && styles.paymentMethodButtonActive
                      ]}
                      onPress={() => setPaymentMethod(method)}
                    >
                      <Text style={[
                        styles.paymentMethodText,
                        paymentMethod === method && styles.paymentMethodTextActive
                      ]}>
                        {method === 'mpesa' ? 'M-Pesa' : 
                         method === 'bank_transfer' ? 'Bank Transfer' : 
                         method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={[styles.confirmPaymentButton, updating && styles.disabledButton]}
                  onPress={handlePayment}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#000000" />
                      <Text style={styles.confirmPaymentText}>Confirm Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#C3B1E1" />
        <Text style={styles.loadingText}>Loading invoice...</Text>
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Icon name="file-invoice" size={60} color="#8E8E93" />
        <Text style={styles.errorText}>Invoice not found</Text>
        <TouchableOpacity 
          style={styles.backButtonFull}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderInvoiceInfo()}
        {renderClientInfo()}
        {renderItemsTable()}
        {renderNotesAndTerms()}
        
        <View style={styles.actionButtons}>
          {renderPaymentButton()}
        </View>
      </ScrollView>
      
      <BottomNav />
      {renderActionsModal()}
      {renderPaymentModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#C3B1E1',
    fontSize: 16,
    marginTop: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonFull: {
    backgroundColor: '#C3B1E1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Header Styles
  header: {
    backgroundColor: '#15171C',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  headerSmall: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  invoiceNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  invoiceNumberSmall: {
    fontSize: 24,
  },
  clientName: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '500',
  },
  clientNameSmall: {
    fontSize: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overdueText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },
  // Info Card
  infoCard: {
    backgroundColor: '#15171C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  infoCardSmall: {
    padding: 16,
    borderRadius: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  overdueValue: {
    color: '#ef4444',
  },
  dueDays: {
    color: '#f59e0b',
    fontSize: 12,
    marginTop: 4,
  },
  dueDaysOverdue: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  paymentStatus: {
    gap: 12,
  },
  paymentStatusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatusLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  paymentStatusValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 4,
  },
  // Section Card
  sectionCard: {
    backgroundColor: '#15171C',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  sectionCardSmall: {
    padding: 16,
    borderRadius: 14,
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
  // Client Info
  clientInfo: {
    gap: 12,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  clientLabel: {
    color: '#8E8E93',
    fontSize: 14,
    width: 80,
  },
  clientValue: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    marginBottom: 10,
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableHeaderText: {
    color: '#C3B1E1',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  itemDescription: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
  },
  itemQuantity: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  itemPrice: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'right',
  },
  itemTotal: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  // Summary Section
  summarySection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  totalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: '700',
  },
  // Notes & Terms
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  notesText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  termsSection: {
    marginTop: 20,
  },
  termsLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 12,
  },
  termItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  termBullet: {
    color: '#C3B1E1',
    fontSize: 16,
    marginRight: 10,
  },
  termText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // Action Buttons
  actionButtons: {
    paddingBottom: 40,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 12,
  },
  payButtonSmall: {
    paddingVertical: 16,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
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
  modalInfo: {
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  deleteActionButton: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  deleteActionText: {
    color: '#ef4444',
  },
  // Payment Modal
  paymentModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  paymentInvoiceNumber: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentClient: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  paymentTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  paymentInfo: {
    width: '100%',
  },
  paymentLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  paymentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24262B',
    marginBottom: 20,
  },
  currencySymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  paymentInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    paddingVertical: 14,
  },
  paymentMethodLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 12,
  },
  paymentMethods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  paymentMethodButtonActive: {
    backgroundColor: 'rgba(195, 177, 225, 0.2)',
    borderColor: '#C3B1E1',
  },
  paymentMethodText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  paymentMethodTextActive: {
    color: '#C3B1E1',
    fontWeight: '600',
  },
  confirmPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  confirmPaymentText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});