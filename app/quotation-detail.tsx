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
  Alert,
  Modal,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  TextInput,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import NetInfo from '@react-native-community/netinfo';

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

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_address: string;
  issue_date: string;
  valid_until: string;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes: string;
  terms: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

type ActionItem = {
  label: string;
  icon: string;
  color: string;
  action: string;
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

const ShimmerInfoCard = () => (
  <View style={[styles.infoCard, { backgroundColor: '#000000', borderColor: '#24262B' }]}>
    <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
      <View style={{ flex: 1 }}>
        <ShimmerLine width={40} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLine width={100} height={16} borderRadius={6} />
      </View>
      <View style={{ flex: 1 }}>
        <ShimmerLine width={40} height={12} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerLine width={100} height={16} borderRadius={6} />
      </View>
    </View>
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ShimmerLine width={100} height={16} borderRadius={4} />
        <ShimmerLine width={120} height={24} borderRadius={4} />
      </View>
      <View style={{ backgroundColor: 'rgba(36, 38, 43, 0.5)', borderRadius: 10, padding: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <ShimmerLine width={80} height={14} borderRadius={4} />
          <ShimmerLine width={100} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  </View>
);

const ShimmerSectionCard = () => (
  <View style={[styles.sectionCard, { backgroundColor: '#000000', borderColor: '#24262B' }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <ShimmerLine width={18} height={18} borderRadius={4} />
      <ShimmerLine width={120} height={20} borderRadius={6} />
    </View>
    <ShimmerLine width="100%" height={100} borderRadius={8} />
  </View>
);

export default function QuotationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [convertingToInvoice, setConvertingToInvoice] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  // Check and request media permissions
  useEffect(() => {
    const checkPermissions = async () => {
      if (Platform.OS === 'web') {
        setHasMediaPermission(true);
        return;
      }
      
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        setHasMediaPermission(status === 'granted');
      } catch (error) {
        console.warn('Media library permission error:', error);
        setHasMediaPermission(false);
      }
    };
    
    checkPermissions();
  }, []);

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
            fetchQuotation();
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

  // Fetch quotation details from Supabase
  const fetchQuotation = async () => {
    if (!id) return;
    
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${id}`, {
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
        setQuotation(data[0]);
        setSelectedStatus(data[0].status);
      } else {
        Alert.alert('Error', 'Quotation not found');
        router.back();
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      Alert.alert('Error', 'Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
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
      case 'accepted':
        return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', text: 'Accepted' };
      case 'pending':
        return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', text: 'Pending' };
      case 'rejected':
        return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'Rejected' };
      case 'draft':
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Draft' };
      case 'cancelled':
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Cancelled' };
      case 'expired':
        return { color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', text: 'Expired' };
      default:
        return { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Unknown' };
    }
  };

  const getDaysUntilExpiry = () => {
    if (!quotation) return 0;
    const expiryDate = new Date(quotation.valid_until);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isQuotationExpired = () => {
    if (!quotation) return false;
    return getDaysUntilExpiry() < 0;
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
  };

  // Generate PDF from quotation data
  const generateQuotationHTML = () => {
    if (!quotation) return '';
    
    const itemsHTML = quotation.items.map((item, index) => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.description || ''}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity || 0}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">KES ${(item.price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">KES ${(item.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    const termsHTML = quotation.terms && quotation.terms.length > 0 ? `
      <div class="terms-section">
        <div class="terms-title">Terms & Conditions</div>
        <ul class="terms-list">
          ${quotation.terms.map((term: string) => `<li>${term}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const notesHTML = quotation.notes ? `
      <div class="notes-section">
        <div class="notes-title">Notes</div>
        <div>${quotation.notes.replace(/\n/g, '<br>')}</div>
      </div>
    ` : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation #${quotation.quotation_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { width: 800px; background: #fff; margin: 20px auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; }
          .header { position: relative; padding: 20px; }
          .header::before { content: ""; position: absolute; top: 0; left: 0; width: 70%; height: 80px; background: rgba(0,31,61,1); clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); }
          .header::after { content: ""; position: absolute; top: 0; right: 0; width: 60%; height: 80px; background: #C3B1E1; clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%); }
          .header-content { position: relative; display: flex; justify-content: space-between; align-items: center; z-index: 2; }
          .logo { font-size: 24px; font-weight: bold; color: white; position: relative; padding-left: 20px; }
          .company-info { text-align: right; color: white; position: relative; padding-right: 20px; font-size: 14px; }
          .quotation-title { background: rgba(0,31,61,1); color: #fff; padding: 10px; text-align: center; font-size: 24px; margin: 20px 0; }
          .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .client-info { flex: 1; }
          .quotation-details { flex: 1; text-align: right; }
          .details strong { font-size: 14px; }
          .details p { margin: 5px 0; font-size: 14px; }
          .table-container { width: 100%; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: black; color: #fff; padding: 10px; text-align: center; font-size: 14px; border: 1px solid #ddd; }
          td { padding: 10px; border: 1px solid #ddd; text-align: center; font-size: 14px; }
          .total-row { font-weight: bold; background: #f4f4f4; }
          .total { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
          .footer { position: relative; margin-top: 30px; height: 60px; display: flex; align-items: center; justify-content: space-between; color: white; font-weight: bold; padding: 0 20px; z-index: 2; overflow: hidden; }
          .footer::before { content: ""; position: absolute; left: 0; width: 70%; height: 100%; background: #C3B1E1; clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%); z-index: -1; }
          .footer::after { content: ""; position: absolute; right: 0; width: 50%; height: 100%; background: rgba(0,31,61,1); clip-path: polygon(15% 0, 100% 0, 100% 100%, 0 100%); z-index: -1; }
          .footer-left, .footer-right { position: relative; font-size: 14px; padding: 0 20px; }
          .notes-section { margin-top: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #f59e0b; font-size: 14px; }
          .notes-title { font-weight: bold; margin-bottom: 8px; color: #92400e; }
          .terms-section { margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #C3B1E1; font-size: 14px; }
          .terms-title { font-weight: bold; margin-bottom: 8px; color: #C3B1E1; }
          .terms-list { padding-left: 20px; }
          .terms-list li { margin-bottom: 5px; }
          @media print { body { padding: 0; background: white; } .container { box-shadow: none; margin: 0; width: 100%; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-content">
              <div class="logo">Aksa Genset Services</div>
              <div class="company-info">
                P.O. Box 65516-00600, Nairobi <br>
                Phone: 0722222257 <br>
                Contact: Mr. Peter Kamau
              </div>
            </div>
          </div>
          
          <div class="quotation-title">QUOTATION</div>
          
          <div class="details">
            <div class="client-info">
              <p><strong>Bill To:</strong> ${quotation.client_name}</p>
              ${quotation.client_company ? `<p><strong>Company:</strong> ${quotation.client_company}</p>` : ''}
              ${quotation.client_email ? `<p><strong>Email:</strong> ${quotation.client_email}</p>` : ''}
              ${quotation.client_phone ? `<p><strong>Phone:</strong> ${quotation.client_phone}</p>` : ''}
              ${quotation.client_address ? `<p><strong>Address:</strong> ${quotation.client_address}</p>` : ''}
            </div>
            
            <div class="quotation-details">
              <p><strong>Quotation No:</strong> ${quotation.quotation_number}</p>
              <p><strong>Date:</strong> ${formatDate(quotation.issue_date)}</p>
              <p><strong>Valid Until:</strong> ${formatDate(quotation.valid_until)}</p>
              <p><strong>Status:</strong> ${quotation.status.toUpperCase()}</p>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Description</th><th>Quantity</th><th>Unit Price (Ksh)</th><th>Total Price (Ksh)</th></tr>
              </thead>
              <tbody>
                ${itemsHTML}
                ${quotation.discount > 0 ? `
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;"><strong>Subtotal</strong></td>
                    <td class="amount-cell"><strong>KES ${quotation.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong></td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="4" style="text-align: right;"><strong>Discount</strong></td>
                    <td class="amount-cell"><strong>- KES ${quotation.discount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong></td>
                  </tr>
                ` : ''}
                <tr class="total-row">
                  <td colspan="4" style="text-align: right;"><strong>Total Quoted Amount</strong></td>
                  <td class="amount-cell"><strong>KES ${quotation.total.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          ${termsHTML}
          ${notesHTML}
          
          <div class="total"><strong>Thank you for your business!</strong></div>
          
          <div class="footer">
            <div class="footer-left">Contact: info@aksagensetservices.co.ke</div>
            <div class="footer-right">Phone: 0722222257</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const generateAndSharePDF = async () => {
    if (!quotation) return;
    
    setDownloadingPDF(true);
    try {
      const html = generateQuotationHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share Quotation ${quotation.quotation_number}`,
        UTI: 'com.adobe.pdf',
      });
      showSuccess('Quotation PDF shared successfully!');
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', `Failed to generate PDF: ${error.message}`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const generateAndDownloadPDF = async () => {
    if (!quotation) return;
    
    setDownloadingPDF(true);
    try {
      const html = generateQuotationHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      
      if (Platform.OS === 'android') {
        try {
          if (!hasMediaPermission) {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') throw new Error('Media library permission denied');
            setHasMediaPermission(true);
          }
          const filename = `quotation_${quotation.quotation_number}_${Date.now()}.pdf`;
          const asset = await MediaLibrary.createAssetAsync(uri);
          const album = await MediaLibrary.getAlbumAsync('Downloads');
          if (album) await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          else await MediaLibrary.createAlbumAsync('Downloads', asset, false);
          showSuccess('Quotation PDF saved to Downloads!');
        } catch (error) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save Quotation ${quotation.quotation_number}`, UTI: 'com.adobe.pdf' });
          showSuccess('Use the share dialog to save the PDF!');
        }
      } else if (Platform.OS === 'ios') {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Save Quotation ${quotation.quotation_number}`, UTI: 'com.adobe.pdf' });
        showSuccess('Use the share dialog to save to Files!');
      } else {
        if (Platform.OS === 'web') {
          const response = await fetch(uri);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `quotation_${quotation.quotation_number}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          showSuccess('Quotation PDF downloaded!');
        }
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      if (error.message.includes('permission')) Alert.alert('Permission Required', 'Please grant storage permissions to save the PDF file.', [{ text: 'OK' }]);
      else Alert.alert('Error', `Failed to download PDF: ${error.message}`);
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handleAction = async (action: string) => {
    setShowActionsModal(false);
    
    switch (action) {
      case 'edit':
        router.push({ pathname: '/edit-quotation', params: { id: quotation?.id } });
        break;
      case 'share':
        await generateAndSharePDF();
        break;
      case 'download':
        await generateAndDownloadPDF();
        break;
      case 'duplicate':
        await handleDuplicate();
        break;
      case 'delete':
        handleDelete();
        break;
      case 'change_status':
        setShowStatusModal(true);
        break;
      case 'convert_to_invoice':
        await handleConvertToInvoice();
        break;
      case 'send_email':
        await handleSendEmail();
        break;
      case 'print':
        await generateAndSharePDF();
        break;
    }
  };

  const handleDuplicate = async () => {
    if (!quotation) return;
    
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const quotationNumber = `QT-${year}${month}-${random}`;
      
      const duplicateQuotation = {
        ...quotation,
        quotation_number: quotationNumber,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      delete duplicateQuotation.id;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(duplicateQuotation),
      });

      if (response.ok) {
        const newQuotation = await response.json();
        showSuccess('Quotation duplicated successfully!');
        setTimeout(() => {
          router.replace({ pathname: '/quotation-detail', params: { id: newQuotation[0]?.id } });
        }, 1500);
      } else {
        throw new Error('Duplicate failed');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to duplicate quotation: ${error.message}`);
    }
  };

  const handleDelete = () => {
    if (!quotation) return;
    
    Alert.alert(
      'Delete Quotation',
      `Are you sure you want to delete quotation ${quotation.quotation_number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${quotation.id}`, {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_KEY,
                  'Authorization': `Bearer ${SUPABASE_KEY}`,
                  'Prefer': 'return=minimal',
                },
              });

              if (response.ok) {
                showSuccess('Quotation deleted successfully!');
                setTimeout(() => router.replace('/quotations'), 1500);
              } else {
                throw new Error('Delete failed');
              }
            } catch (error: any) {
              Alert.alert('Error', `Failed to delete quotation: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    
    setConvertingToInvoice(true);
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoiceNumber = `INV-${year}${month}-${random}`;
      
      const invoiceData = {
        invoice_number: invoiceNumber,
        client_name: quotation.client_name,
        client_email: quotation.client_email,
        client_phone: quotation.client_phone,
        client_address: quotation.client_address,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: quotation.items,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        total: quotation.total,
        notes: quotation.notes,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const newInvoice = await response.json();
        showSuccess('Quotation converted to invoice successfully!');
        setTimeout(() => {
          router.replace({ pathname: '/invoice-detail', params: { id: newInvoice[0]?.id } });
        }, 1500);
      } else {
        throw new Error('Convert to invoice failed');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to convert to invoice: ${error.message}`);
    } finally {
      setConvertingToInvoice(false);
    }
  };

  const handleSendEmail = async () => {
    if (!quotation) return;
    
    setSendingEmail(true);
    try {
      const html = generateQuotationHTML();
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      
      const email = quotation.client_email;
      if (!email) {
        Alert.alert('Error', 'Client email is required to send quotation');
        return;
      }
      
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Email Quotation ${quotation.quotation_number}`,
        UTI: 'com.adobe.pdf',
      });
      
      showSuccess('Quotation sent via email!');
    } catch (error: any) {
      console.error('Email error:', error);
      Alert.alert('Error', 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!quotation) return;
    
    setUpdating(true);
    try {
      const updateData = {
        status: selectedStatus,
        updated_at: new Date().toISOString(),
      };
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations?id=eq.${quotation.id}`, {
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
        showSuccess('Status updated successfully!');
        setShowStatusModal(false);
        fetchQuotation();
      } else {
        throw new Error('Status update failed');
      }
    } catch (error: any) {
      Alert.alert('Error', `Failed to update status: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const renderHeader = () => {
    const status = quotation ? getStatusColor(quotation.status) : { color: '#8E8E93', bg: 'rgba(142, 142, 147, 0.1)', text: 'Loading...' };
    const isExpired = quotation ? isQuotationExpired() : false;
    const daysUntilExpiry = quotation ? getDaysUntilExpiry() : 0;
    
    return (
      <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="chevron-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setShowActionsModal(true)}
          >
            <Icon name="ellipsis-vertical" size={20} color="#C3B1E1" />
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
  };

  const renderQuotationInfoCard = () => {
    if (!quotation) return null;
    
    const daysUntilExpiry = getDaysUntilExpiry();
    const isExpired = isQuotationExpired();

    return (
      <View style={[styles.infoCard, isSmallScreen && styles.infoCardSmall]}>
        <View style={styles.quotationHeader}>
          <View style={styles.quotationNumberContainer}>
            <Icon name="hashtag" size={16} color="#C3B1E1" />
            <Text style={[styles.quotationNumber, isSmallScreen && styles.quotationNumberSmall]}>
              {quotation.quotation_number}
            </Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quotation.status).bg }]}>
            <Icon name={quotation.status === 'accepted' ? 'check-circle' : 'clock'} size={12} color={getStatusColor(quotation.status).color} />
            <Text style={[styles.statusText, { color: getStatusColor(quotation.status).color }]}>
              {getStatusColor(quotation.status).text}
            </Text>
            {isExpired && (
              <Text style={[styles.expiredText, { color: '#ef4444' }]}> • Expired</Text>
            )}
          </View>
        </View>
        
        <View style={styles.clientNameContainer}>
          <Icon name="building" size={16} color="#C3B1E1" />
          <Text style={[styles.clientName, isSmallScreen && styles.clientNameSmall]}>
            {quotation.client_name}
          </Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={12} color="#8E8E93" />
            <Text style={styles.infoLabel}>Issued Date</Text>
            <Text style={styles.infoValue}>{formatDate(quotation.issue_date)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="calendar-day" size={12} color="#8E8E93" />
            <Text style={styles.infoLabel}>Valid Until</Text>
            <Text style={[styles.infoValue, isExpired && styles.expiredValue]}>
              {formatDate(quotation.valid_until)}
            </Text>
            {isExpired ? (
              <Text style={styles.expiryDaysOverdue}>Expired {Math.abs(daysUntilExpiry)} days ago</Text>
            ) : (
              <Text style={styles.expiryDays}>Valid for {daysUntilExpiry} more days</Text>
            )}
          </View>
        </View>
        
        {quotation && !isExpired && daysUntilExpiry <= 7 && (
          <View style={styles.expiryWarning}>
            <Icon name="exclamation-triangle" size={14} color="#f59e0b" />
            <Text style={styles.expiryWarningText}>
              {daysUntilExpiry === 0 ? 'Expires today' : `Expires in ${daysUntilExpiry} days`}
            </Text>
          </View>
        )}
        
        <View style={styles.amountSection}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amountValue}>{formatCurrency(quotation.total)}</Text>
          </View>
          
          <View style={styles.breakdown}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Subtotal</Text>
              <Text style={styles.breakdownValue}>{formatCurrency(quotation.subtotal)}</Text>
            </View>
            
            {quotation.discount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Discount</Text>
                <Text style={[styles.breakdownValue, { color: '#ef4444' }]}>
                  -{formatCurrency(quotation.discount)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderClientInfo = () => {
    if (!quotation) return null;
    
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
            <Text style={styles.clientValue}>{quotation.client_name}</Text>
          </View>
          
          {quotation.client_company && (
            <View style={styles.clientRow}>
              <Icon name="building" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Company:</Text>
              <Text style={styles.clientValue}>{quotation.client_company}</Text>
            </View>
          )}
          
          {quotation.client_email && (
            <View style={styles.clientRow}>
              <Icon name="envelope" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Email:</Text>
              <Text style={styles.clientValue}>{quotation.client_email}</Text>
            </View>
          )}
          
          {quotation.client_phone && (
            <View style={styles.clientRow}>
              <Icon name="phone" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Phone:</Text>
              <Text style={styles.clientValue}>{quotation.client_phone}</Text>
            </View>
          )}
          
          {quotation.client_address && (
            <View style={styles.clientRow}>
              <Icon name="location-dot" size={14} color="#8E8E93" />
              <Text style={styles.clientLabel}>Address:</Text>
              <Text style={styles.clientValue}>{quotation.client_address}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderItemsTable = () => {
    if (!quotation) return null;
    
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
        
        {quotation.items.map((item, index) => (
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
        
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(quotation.subtotal)}</Text>
          </View>
          
          {quotation.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(quotation.discount)}</Text>
            </View>
          )}
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{formatCurrency(quotation.total)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderNotesAndTerms = () => {
    if (!quotation) return null;
    
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
        
        {quotation.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{quotation.notes}</Text>
          </View>
        ) : null}
        
        {quotation.terms && quotation.terms.length > 0 ? (
          <View style={styles.termsSection}>
            <Text style={styles.termsLabel}>Terms & Conditions:</Text>
            {quotation.terms.map((term, index) => (
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

  const renderActionButtons = () => {
    if (!quotation) return null;
    
    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.pdfButton]}
          onPress={() => handleAction('download')}
          disabled={downloadingPDF}
        >
          {downloadingPDF ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Icon name="download" size={18} color="#000000" />
              <Text style={styles.actionButtonText}>Download PDF</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.shareButton]}
          onPress={() => handleAction('share')}
          disabled={downloadingPDF}
        >
          <Icon name="share" size={18} color="#000000" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.emailButton]}
          onPress={() => handleAction('send_email')}
          disabled={sendingEmail}
        >
          {sendingEmail ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Icon name="envelope" size={18} color="#000000" />
              <Text style={styles.actionButtonText}>Email PDF</Text>
            </>
          )}
        </TouchableOpacity>
        
        {quotation.status === 'accepted' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.convertButton]}
            onPress={() => handleAction('convert_to_invoice')}
            disabled={convertingToInvoice}
          >
            {convertingToInvoice ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <>
                <Icon name="file-invoice-dollar" size={18} color="#000000" />
                <Text style={styles.actionButtonText}>Convert to Invoice</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActionsModal = () => {
    const actions: ActionItem[] = [
      { label: 'Edit Quotation', icon: 'pen-to-square', color: '#C3B1E1', action: 'edit' },
      { label: 'Download PDF', icon: 'download', color: '#C3B1E1', action: 'download' },
      { label: 'Share PDF', icon: 'share', color: '#3b82f6', action: 'share' },
      { label: 'Send via Email', icon: 'envelope', color: '#3b82f6', action: 'send_email' },
      { label: 'Duplicate', icon: 'copy', color: '#8b5cf6', action: 'duplicate' },
      { label: 'Convert to Invoice', icon: 'file-invoice-dollar', color: '#f59e0b', action: 'convert_to_invoice' },
      { label: 'Update Status', icon: 'check', color: '#C3B1E1', action: 'change_status' },
      { label: 'Print', icon: 'print', color: '#C3B1E1', action: 'print' },
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
          <View style={[styles.modalContent, styles.modalContentSmall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quotation Actions</Text>
              <TouchableOpacity onPress={() => setShowActionsModal(false)}>
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {quotation && (
              <View style={styles.modalInfo}>
                <Text style={styles.modalQuotationNumber}>{quotation.quotation_number}</Text>
                <Text style={styles.modalClient}>{quotation.client_name}</Text>
                <Text style={styles.modalAmount}>{formatCurrency(quotation.total)}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalActionButton}
                  onPress={() => handleAction(action.action)}
                >
                  <View style={[styles.modalActionIcon, { backgroundColor: `${action.color}15` }]}>
                    <Icon name={action.icon as any} size={18} color={action.color} />
                  </View>
                  <Text style={styles.modalActionText}>{action.label}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={[styles.modalActionButton, styles.deleteActionButton]}
                onPress={() => handleAction('delete')}
              >
                <View style={[styles.modalActionIcon, { backgroundColor: '#ef444415' }]}>
                  <Icon name="trash" size={18} color="#ef4444" />
                </View>
                <Text style={[styles.modalActionText, styles.deleteActionText]}>Delete Quotation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderStatusModal = () => {
    const statusOptions = [
      { value: 'pending', label: 'Pending', color: '#f59e0b' },
      { value: 'accepted', label: 'Accepted', color: '#10b981' },
      { value: 'rejected', label: 'Rejected', color: '#ef4444' },
      { value: 'cancelled', label: 'Cancelled', color: '#8E8E93' },
      { value: 'draft', label: 'Draft', color: '#8E8E93' },
    ];
    
    return (
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Icon name="times" size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {quotation && (
              <View style={styles.statusModalContent}>
                <Text style={styles.statusQuotationNumber}>{quotation.quotation_number}</Text>
                <Text style={styles.statusClient}>{quotation.client_name}</Text>
                <Text style={styles.statusCurrent}>
                  Current Status: <Text style={{ color: getStatusColor(quotation.status).color, fontWeight: '700' }}>
                    {getStatusColor(quotation.status).text}
                  </Text>
                </Text>
                
                <View style={styles.statusOptions}>
                  {statusOptions.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      style={[
                        styles.statusOptionButton,
                        selectedStatus === status.value && styles.statusOptionButtonActive,
                        { borderColor: status.color }
                      ]}
                      onPress={() => setSelectedStatus(status.value)}
                    >
                      <View style={[styles.statusOptionDot, { backgroundColor: status.color }]} />
                      <Text style={[
                        styles.statusOptionText,
                        selectedStatus === status.value && styles.statusOptionTextActive
                      ]}>
                        {status.label}
                      </Text>
                      {selectedStatus === status.value && (
                        <Icon name="check" size={16} color={status.color} style={styles.statusCheckIcon} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={[styles.updateStatusButton, updating && styles.disabledButton]}
                  onPress={handleStatusUpdate}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Icon name="check" size={18} color="#000000" />
                      <Text style={styles.updateStatusText}>Update Status</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowSuccessModal(false)}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContent}>
          <View style={styles.successIconContainer}>
            <Icon name="check-circle" size={60} color="#10b981" />
          </View>
          
          <Text style={styles.successTitle}>Success!</Text>
          <Text style={styles.successMessage}>{successMessage}</Text>
          
          <TouchableOpacity 
            style={styles.successButton}
            onPress={() => setShowSuccessModal(false)}
          >
            <Text style={styles.successButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={[styles.header, { backgroundColor: '#000000' }]}>
          <View style={styles.headerTop}>
            <View style={[styles.backButton, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]} />
            <View style={[styles.menuButton, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]} />
          </View>
        </View>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <ShimmerInfoCard />
          <ShimmerSectionCard />
          <ShimmerSectionCard />
          <ShimmerSectionCard />
          <View style={styles.actionButtons}>
            <ShimmerLine width="100%" height={52} borderRadius={12} />
            <ShimmerLine width="100%" height={52} borderRadius={12} />
            <ShimmerLine width="100%" height={52} borderRadius={12} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!quotation) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <Icon name="quote-right" size={60} color="#8E8E93" />
        <Text style={styles.errorText}>Quotation not found</Text>
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
      {renderNetworkAlert()}
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderQuotationInfoCard()}
        {renderClientInfo()}
        {renderItemsTable()}
        {renderNotesAndTerms()}
        {renderActionButtons()}
      </ScrollView>
      
      {renderActionsModal()}
      {renderStatusModal()}
      {renderSuccessModal()}
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
    gap: 4,
  },
  offlineBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  headerSmall: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
    gap: 16,
  },
  infoCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  infoCardSmall: {
    padding: 16,
  },
  quotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  quotationNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quotationNumber: {
    color: '#C3B1E1',
    fontSize: 24,
    fontWeight: '700',
  },
  quotationNumberSmall: {
    fontSize: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  expiredText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clientNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  clientNameSmall: {
    fontSize: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expiredValue: {
    color: '#ef4444',
  },
  expiryDays: {
    color: '#10b981',
    fontSize: 11,
    marginTop: 4,
  },
  expiryDaysOverdue: {
    color: '#ef4444',
    fontSize: 11,
    marginTop: 4,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    padding: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  expiryWarningText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '500',
  },
  amountSection: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  amountValue: {
    color: '#C3B1E1',
    fontSize: 24,
    fontWeight: '700',
  },
  breakdown: {
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: '#8E8E93',
    fontSize: 13,
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#24262B',
  },
  sectionCardSmall: {
    padding: 16,
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
    fontSize: 11,
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
    fontSize: 13,
    lineHeight: 18,
  },
  itemQuantity: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  itemPrice: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'right',
  },
  itemTotal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
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
    fontSize: 13,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  pdfButton: {
    backgroundColor: '#f59e0b',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
  },
  emailButton: {
    backgroundColor: '#8b5cf6',
  },
  convertButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  modalContentSmall: {
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalInfo: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
    gap: 4,
  },
  modalQuotationNumber: {
    color: '#C3B1E1',
    fontSize: 16,
    fontWeight: '700',
  },
  modalClient: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  modalAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    padding: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(36, 38, 43, 0.5)',
  },
  deleteActionButton: {
    borderBottomWidth: 0,
    marginTop: 0,
  },
  modalActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    flex: 1,
  },
  deleteActionText: {
    color: '#ef4444',
  },
  statusModalContent: {
    padding: 20,
    alignItems: 'center',
  },
  statusQuotationNumber: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusClient: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
  },
  statusCurrent: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 24,
  },
  statusOptions: {
    width: '100%',
    gap: 10,
    marginBottom: 24,
  },
  statusOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24262B',
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
  },
  statusOptionButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
  },
  statusOptionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    color: '#FFFFFF',
    fontSize: 15,
    flex: 1,
  },
  statusOptionTextActive: {
    fontWeight: '600',
  },
  statusCheckIcon: {
    marginLeft: 'auto',
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 10,
    width: '100%',
  },
  disabledButton: {
    opacity: 0.7,
  },
  updateStatusText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successModalContent: {
    backgroundColor: '#15171C',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
    width: '100%',
    maxWidth: 400,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  successMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  successButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  successButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
});