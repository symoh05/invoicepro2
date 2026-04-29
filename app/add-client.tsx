import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';
import NetInfo from '@react-native-community/netinfo';

// Supabase configuration
const SUPABASE_URL = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  notes: string;
}

interface AlertMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  showClose?: boolean;
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

export default function AddClientScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    notes: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  // Custom alerts state
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Don't reset if we just submitted successfully
      if (!isSubmitting) {
        resetForm();
      }
    }, [])
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  // Network monitoring
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

  const showAlert = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, duration = 4000) => {
    const id = Date.now().toString();
    const newAlert: AlertMessage = { id, type, title, message, duration, showClose: true };
    
    setAlerts(prev => [...prev, newAlert]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const showConfirm = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning',
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    setConfirmConfig({ title, message, type, onConfirm, onCancel });
    setShowConfirmModal(true);
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Client name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone) {
      const cleanedPhone = formData.phone.replace(/\s/g, '');
      if (!/^[0-9+\-\s()]{10,15}$/.test(cleanedPhone)) {
        newErrors.phone = 'Please enter a valid phone number (10-15 digits)';
      }
    }
    
    if (formData.notes && formData.notes.length > 500) {
      newErrors.notes = 'Notes cannot exceed 500 characters';
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      showAlert('warning', 'Validation Error', 'Please check the form for errors before submitting.');
    }
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!isConnected) {
      showNetworkMessage('error');
      showAlert('error', 'Offline Mode', 'You need an internet connection to add a client. Please check your connection.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    
    try {
      const clientData = {
        quotation_number: `CLIENT-${Date.now().toString().slice(-6)}`,
        client_name: formData.name.trim(),
        client_email: formData.email.trim() || null,
        client_phone: formData.phone.trim() || null,
        client_company: formData.company.trim() || null,
        client_address: formData.address.trim() || null,
        issue_date: new Date().toISOString().split('T')[0],
        valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{
          description: 'Client Registration',
          quantity: 1,
          price: 0,
          total: 0,
        }],
        subtotal: 0,
        discount: 0,
        total: 0,
        notes: formData.notes.trim() || null,
        terms: ['This is a client registration record'],
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/quotations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        showConfirm(
          'Success!',
          'Client added successfully! They will now appear in your clients list.',
          'success',
          () => {
            resetForm();
            router.push('/clients');
            showAlert('success', 'Client Added', 'The client has been successfully registered.');
          }
        );
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        
        if (errorData.message?.includes('quotation_number')) {
          showAlert('error', 'Duplicate Entry', 'A client with similar details already exists. Please check the clients list.');
        } else {
          showAlert('error', 'Server Error', errorData.message || 'Failed to save client. Please try again.');
        }
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      
      if (error.message?.includes('Network request failed') || !isConnected) {
        showNetworkMessage('error');
        showAlert('error', 'Network Error', 'Failed to connect to the server. Please check your internet connection.');
      } else {
        showAlert('error', 'Unexpected Error', error.message || 'An unexpected error occurred. Please try again.');
      }
      setIsSubmitting(false);
    } finally {
      setLoading(false);
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
    const message = isError ? 'Check your internet connection' : 'Back online. Ready to add client.';

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

  const renderCustomAlert = (alert: AlertMessage) => {
    const getAlertStyles = () => {
      switch (alert.type) {
        case 'success':
          return {
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.3)',
            iconColor: '#10b981',
            iconName: 'circle-check',
          };
        case 'error':
          return {
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            iconColor: '#ef4444',
            iconName: 'circle-exclamation',
          };
        case 'warning':
          return {
            backgroundColor: 'rgba(245, 159, 11, 0.15)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            iconColor: '#f59e0b',
            iconName: 'triangle-exclamation',
          };
        case 'info':
          return {
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            iconColor: '#3b82f6',
            iconName: 'circle-info',
          };
      }
    };

    const stylesConfig = getAlertStyles();

    return (
      <View key={alert.id} style={[styles.customAlert, {
        backgroundColor: stylesConfig.backgroundColor,
        borderColor: stylesConfig.borderColor,
      }]}>
        <View style={[styles.customAlertIcon, { backgroundColor: `${stylesConfig.iconColor}20` }]}>
          <Icon name={stylesConfig.iconName as any} size={16} color={stylesConfig.iconColor} />
        </View>
        <View style={styles.customAlertText}>
          <Text style={[styles.customAlertTitle, { color: stylesConfig.iconColor }]}>
            {alert.title}
          </Text>
          <Text style={styles.customAlertMessage}>
            {alert.message}
          </Text>
        </View>
        {alert.showClose && (
          <TouchableOpacity 
            onPress={() => removeAlert(alert.id)}
            style={[styles.customAlertClose, { backgroundColor: `${stylesConfig.iconColor}20` }]}
          >
            <Icon name="xmark" size={12} color={stylesConfig.iconColor} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderConfirmModal = () => {
    if (!confirmConfig) return null;

    const getModalStyles = () => {
      switch (confirmConfig.type) {
        case 'success':
          return {
            iconColor: '#10b981',
            iconName: 'circle-check',
            primaryButtonColor: '#10b981',
          };
        case 'error':
          return {
            iconColor: '#ef4444',
            iconName: 'circle-exclamation',
            primaryButtonColor: '#ef4444',
          };
        case 'warning':
          return {
            iconColor: '#f59e0b',
            iconName: 'triangle-exclamation',
            primaryButtonColor: '#f59e0b',
          };
      }
    };

    const modalStyles = getModalStyles();

    return (
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirmModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={[styles.modalIcon, { backgroundColor: `${modalStyles.iconColor}20` }]}>
                <Icon name={modalStyles.iconName as any} size={28} color={modalStyles.iconColor} />
              </View>
              <Text style={styles.modalTitle}>{confirmConfig.title}</Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{confirmConfig.message}</Text>
            </View>
            
            <View style={styles.modalActions}>
              {confirmConfig.onCancel && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    confirmConfig.onCancel?.();
                    setShowConfirmModal(false);
                  }}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: modalStyles.primaryButtonColor }]}
                onPress={() => {
                  confirmConfig.onConfirm();
                  setShowConfirmModal(false);
                }}
              >
                <Text style={styles.modalConfirmText}>OK</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, isSmallScreen && styles.headerSmall]}>
      <View style={[styles.headerContent, isSmallScreen && styles.headerContentSmall]}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (formData.name || formData.email || formData.phone) {
                showConfirm(
                  'Discard Changes?',
                  'You have unsaved changes. Are you sure you want to leave?',
                  'warning',
                  () => router.back(),
                  () => {}
                );
              } else {
                router.back();
              }
            }}
          >
            <Icon name="chevron-left" size={20} color="#C3B1E1" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Icon name="user-plus" size={20} color="#C3B1E1" style={styles.headerIcon} />
            <Text style={[styles.headerTitle, isSmallScreen && styles.headerTitleSmall]}>
              Add New Client
            </Text>
          </View>
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

  const renderFormField = (
    label: string,
    field: keyof ClientFormData,
    icon: string,
    placeholder: string,
    required: boolean = false,
    multiline: boolean = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
  ) => (
    <View style={styles.formGroup}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.requiredStar}> *</Text>}
        </Text>
        {errors[field] && (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-circle" size={12} color="#ef4444" />
            <Text style={styles.errorText}>{errors[field]}</Text>
          </View>
        )}
      </View>
      <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
        <Icon name={icon as any} size={16} color={errors[field] ? "#ef4444" : "#C3B1E1"} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textarea]}
          value={formData[field]}
          onChangeText={(value) => handleInputChange(field, value)}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          keyboardType={keyboardType}
          editable={!loading}
          maxLength={multiline ? 500 : undefined}
        />
        {multiline && (
          <Text style={styles.charCount}>
            {formData[field]?.length || 0}/500
          </Text>
        )}
      </View>
      {errors[field] && (
        <View style={styles.errorHint}>
          <Icon name="lightbulb" size={12} color="#f59e0b" />
          <Text style={styles.errorHintText}>
            {field === 'name' ? 'Enter client\'s full name' :
             field === 'email' ? 'Format: name@example.com' :
             field === 'phone' ? 'Format: 0722 222257' :
             field === 'notes' ? 'Keep notes concise' : 'Check input format'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Network Alert */}
      {renderNetworkAlert()}
      
      {/* Custom Alerts */}
      <View style={styles.alertsContainer}>
        {alerts.map(renderCustomAlert)}
      </View>
      
      {renderHeader()}
      
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Form Introduction */}
          <View style={styles.introSection}>
            <View style={styles.introIconContainer}>
              <Icon name="address-card" size={40} color="#C3B1E1" />
            </View>
            <Text style={styles.introTitle}>Add New Client</Text>
            <Text style={styles.introText}>
              Fill in the client details below. Clients will automatically appear in your clients list.
            </Text>
            
            {!isConnected && (
              <View style={styles.offlineWarning}>
                <Icon name="triangle-exclamation" size={16} color="#f59e0b" />
                <Text style={styles.offlineWarningText}>
                  You are offline. Client will be saved locally and synced when connection is restored.
                </Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            {renderFormField(
              'Full Name',
              'name',
              'user',
              'Enter client full name (required)',
              true
            )}
            
            {renderFormField(
              'Email Address',
              'email',
              'envelope',
              'client@example.com (optional)',
              false,
              false,
              'email-address'
            )}
            
            {renderFormField(
              'Phone Number',
              'phone',
              'phone',
              '0722 222257 (optional)',
              false,
              false,
              'phone-pad'
            )}
            
            {renderFormField(
              'Company Name',
              'company',
              'building',
              'Company name (optional)',
              false
            )}
            
            {renderFormField(
              'Address',
              'address',
              'location-dot',
              'Street, City, Postal Code (optional)',
              false,
              true
            )}
            
            {renderFormField(
              'Notes',
              'notes',
              'sticky-note',
              'Additional notes about this client (optional)',
              false,
              true
            )}
          </View>

          {/* Form Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton, 
                (!isConnected || loading) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text style={styles.loadingText}>Adding Client...</Text>
                </View>
              ) : (
                <>
                  <Icon name="user-check" size={18} color="#000000" style={styles.buttonIcon} />
                  <Text style={styles.submitButtonText}>
                    {!isConnected ? 'Save Locally' : 'Add Client'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                if (formData.name || formData.email || formData.phone) {
                  showConfirm(
                    'Discard Changes?',
                    'You have unsaved changes. Are you sure you want to leave?',
                    'warning',
                    () => router.back(),
                    () => {}
                  );
                } else {
                  router.back();
                }
              }}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Status Indicators */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Icon name="shield-check" size={14} color="#10b981" />
              <Text style={styles.statusText}>Secure connection</Text>
            </View>
            <View style={styles.statusItem}>
              <Icon name="sync" size={14} color="#3b82f6" />
              <Text style={styles.statusText}>
                {isConnected ? 'Online - Real-time sync' : 'Offline - Local save only'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Confirm Modal */}
      {renderConfirmModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  // Custom Alerts
  alertsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    gap: 8,
  },
  customAlert: {
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  customAlertIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customAlertText: {
    flex: 1,
  },
  customAlertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  customAlertMessage: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 16,
  },
  customAlertClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#000000',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#24262B',
    overflow: 'hidden',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalBody: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  modalMessage: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  modalCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  headerTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIcon: {
    opacity: 0.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  headerTitleSmall: {
    fontSize: 20,
  },
  // Introduction Section
  introSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    gap: 12,
  },
  introIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  introTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  introText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  offlineWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  offlineWarningText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  // Form Container
  formContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  formGroup: {
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  requiredStar: {
    color: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#000000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 12,
    minHeight: 48,
    position: 'relative',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 12,
    minHeight: 48,
    paddingLeft: 36,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    paddingBottom: 24,
  },
  charCount: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    color: '#8E8E93',
    fontSize: 11,
  },
  errorHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  errorHintText: {
    color: '#f59e0b',
    fontSize: 11,
    flex: 1,
  },
  // Actions Container
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C3B1E1',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 12,
    gap: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    opacity: 0.9,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
  },
  // Status Container
  statusContainer: {
    backgroundColor: 'rgba(36, 38, 43, 0.5)',
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: '#8E8E93',
    fontSize: 12,
  },
});