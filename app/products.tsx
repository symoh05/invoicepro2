import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ScrollView,
  Platform,
  Modal,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

// Supabase configuration
const supabaseUrl = 'https://balpwwwsmekiwtznuqnd.supabase.co';
const supabaseAnonKey = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e';

let supabase: any = null;

const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null;
  
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  
  return supabase;
};

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
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

const ShimmerProductCard = () => (
  <View style={[styles.productCard, { backgroundColor: '#000000', borderColor: '#24262B' }]}>
    <View style={styles.productHeader}>
      <View style={styles.productTitleContainer}>
        <ShimmerLine width={16} height={16} borderRadius={4} />
        <ShimmerLine width={150} height={18} borderRadius={4} />
      </View>
      <ShimmerLine width={60} height={28} borderRadius={6} />
    </View>
    <ShimmerLine width="100%" height={40} borderRadius={4} style={{ marginBottom: 12 }} />
    <View style={styles.productDetails}>
      <ShimmerLine width={120} height={14} borderRadius={4} />
      <ShimmerLine width={100} height={14} borderRadius={4} />
      <ShimmerLine width={80} height={20} borderRadius={4} />
    </View>
  </View>
);

const ShimmerStatsCard = () => (
  <View style={styles.statItem}>
    <ShimmerLine width={40} height={40} borderRadius={20} />
    <View style={styles.statInfo}>
      <ShimmerLine width={50} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
      <ShimmerLine width={60} height={12} borderRadius={4} />
    </View>
  </View>
);

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [tableName, setTableName] = useState<string>('products');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Network state
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [showNetworkAlert, setShowNetworkAlert] = useState(false);
  const [networkAlertType, setNetworkAlertType] = useState<'error' | 'success'>('error');
  const networkAlertAnim = useRef(new Animated.Value(0)).current;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
  });

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
            loadProducts();
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

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check for available tables and load data
  useEffect(() => {
    if (!isClient) return;

    const initialize = async () => {
      try {
        await checkAvailableTables();
        await loadProducts();
      } catch (error) {
        console.error('Error initializing:', error);
        Alert.alert('Error', 'Failed to connect to database.');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [isClient]);

  const checkAvailableTables = async () => {
    try {
      const client = getSupabaseClient();
      if (!client) return;

      const possibleTables = ['products', 'inventory', 'items'];

      for (const table of possibleTables) {
        const { data, error } = await client
          .from(table)
          .select('id')
          .limit(1);

        if (!error && data !== null) {
          setTableName(table);
          return;
        }
      }
    } catch (error) {
      console.error('Error checking tables:', error);
    }
  };

  const loadProducts = async () => {
    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setRefreshing(true);
      const client = getSupabaseClient();
      if (!client) return;

      const { data, error } = await client
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          await checkAvailableTables();
          return;
        }
        throw error;
      }
      
      setProducts(data || []);
    } catch (error: any) {
      console.error('Load products error:', error);
      if (!isConnected) {
        showNetworkMessage('error');
      } else {
        Alert.alert('Error', 'Failed to load products: ' + error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
    });
    setCurrentProduct(null);
    setIsEditing(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category || '',
      stock: product.stock.toString(),
    });
    setIsEditing(true);
    setIsModalVisible(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return false;
    }

    if (!formData.price.trim()) {
      Alert.alert('Error', 'Price is required');
      return false;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return false;
    }

    const stock = formData.stock.trim() ? parseInt(formData.stock) : 0;
    if (isNaN(stock) || stock < 0) {
      Alert.alert('Error', 'Please enter a valid stock quantity');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      return;
    }

    try {
      const client = getSupabaseClient();
      if (!client) return;

      const price = parseFloat(formData.price);
      const stock = formData.stock.trim() ? parseInt(formData.stock) : 0;

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: price,
        category: formData.category.trim(),
        stock: stock,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && currentProduct) {
        const { error } = await client
          .from(tableName)
          .update(productData)
          .eq('id', currentProduct.id);

        if (error) throw error;
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        const { error } = await client
          .from(tableName)
          .insert([productData]);

        if (error) throw error;
        Alert.alert('Success', 'Product added successfully!');
      }

      await loadProducts();
      setIsModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', 'Operation failed: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;

    const networkState = await NetInfo.fetch();
    if (!networkState.isConnected) {
      showNetworkMessage('error');
      return;
    }

    try {
      const client = getSupabaseClient();
      if (!client) return;

      const { error } = await client
        .from(tableName)
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      Alert.alert('Success', 'Product deleted successfully!');
      setShowDeleteModal(false);
      setProductToDelete(null);
      await loadProducts();
    } catch (error: any) {
      Alert.alert('Error', 'Delete failed: ' + error.message);
    }
  };

  const renderHeader = () => (
    <View style={[styles.header]}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Icon name="chevron-left" size={20} color="#C3B1E1" />
        </TouchableOpacity>
        <View style={styles.logo}>
          <Icon name="box" size={20} color="#C3B1E1" />
          <Text style={styles.logoText}>Products</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadProducts}
        >
          <Icon name="rotate" size={16} color="#C3B1E1" />
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

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={styles.productTitleContainer}>
          <Icon name="box" size={16} color="#C3B1E1" />
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        <View style={styles.productActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => openEditModal(item)}
          >
            <Icon name="pencil" size={12} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => openDeleteModal(item)}
          >
            <Icon name="trash" size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {item.description ? (
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Icon name="tag" size={12} color="#8E8E93" />
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>
              {item.category || 'Uncategorized'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="layer-group" size={12} color="#8E8E93" />
            <Text style={styles.detailLabel}>Stock:</Text>
            <Text
              style={[
                styles.stockValue,
                item.stock === 0 && { color: '#ef4444' },
                item.stock > 0 && item.stock <= 5 && { color: '#f59e0b' },
                item.stock > 5 && { color: '#10b981' },
              ]}
            >
              {item.stock}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Price:</Text>
          <Text style={styles.priceValue}>
            KES {parseFloat(item.price.toString()).toLocaleString('en-KE', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderAddEditModal = () => (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        setIsModalVisible(false);
        resetForm();
      }}
    >
      <SafeAreaView style={styles.fullModalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <View style={styles.fullModalHeader}>
          <TouchableOpacity
            style={styles.fullModalCloseButton}
            onPress={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            <Icon name="times" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.fullModalTitle}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={styles.fullModalBody}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.fullModalContent}
        >
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Product Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="box" size={18} color="#C3B1E1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter product name"
                placeholderTextColor="#8E8E93"
                value={formData.name}
                onChangeText={(text) => handleInputChange('name', text)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Description</Text>
            <View style={[styles.inputContainer, styles.textareaContainer]}>
              <Icon name="file-lines" size={18} color="#C3B1E1" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Enter product description"
                placeholderTextColor="#8E8E93"
                value={formData.description}
                onChangeText={(text) => handleInputChange('description', text)}
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Category</Text>
            <View style={styles.inputContainer}>
              <Icon name="tag" size={18} color="#C3B1E1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g., Electronics, Clothing, Food"
                placeholderTextColor="#8E8E93"
                value={formData.category}
                onChangeText={(text) => handleInputChange('category', text)}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>
              Price (KES) <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Icon name="money-bill" size={18} color="#C3B1E1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor="#8E8E93"
                value={formData.price}
                onChangeText={(text) => handleInputChange('price', text)}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Stock Quantity</Text>
            <View style={styles.inputContainer}>
              <Icon name="layer-group" size={18} color="#C3B1E1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#8E8E93"
                value={formData.stock}
                onChangeText={(text) => handleInputChange('stock', text)}
                keyboardType="number-pad"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.fullModalFooter}>
          <TouchableOpacity
            style={[styles.fullModalButton, styles.cancelFullButton]}
            onPress={() => {
              setIsModalVisible(false);
              resetForm();
            }}
          >
            <Text style={styles.cancelFullButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fullModalButton, styles.submitFullButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitFullButtonText}>
              {isEditing ? 'Update Product' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={showDeleteModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDeleteModal(false)}
    >
      <View style={styles.deleteModalOverlay}>
        <View style={styles.deleteModalContent}>
          <View style={styles.deleteModalIconContainer}>
            <View style={styles.deleteModalIcon}>
              <Icon name="trash" size={40} color="#ef4444" />
            </View>
          </View>
          
          <Text style={styles.deleteModalTitle}>Delete Product</Text>
          <Text style={styles.deleteModalMessage}>
            Are you sure you want to delete "{productToDelete?.name}"?
          </Text>
          <Text style={styles.deleteModalWarning}>
            This action cannot be undone.
          </Text>
          
          <View style={styles.deleteModalButtons}>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalCancelButton]}
              onPress={() => setShowDeleteModal(false)}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteModalButton, styles.deleteModalConfirmButton]}
              onPress={handleDelete}
            >
              <Icon name="trash" size={16} color="#FFFFFF" />
              <Text style={styles.deleteModalConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <View style={[styles.header, { backgroundColor: '#000000' }]}>
          <View style={styles.headerContent}>
            <View style={[styles.backButton, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]} />
            <ShimmerLine width={120} height={24} borderRadius={4} />
            <ShimmerLine width={36} height={36} borderRadius={8} />
          </View>
        </View>
        <View style={styles.mainContent}>
          <View style={styles.statsBar}>
            <ShimmerStatsCard />
            <ShimmerStatsCard />
          </View>
          <ShimmerLine width="100%" height={52} borderRadius={12} style={{ marginBottom: 20 }} />
          <ShimmerProductCard />
          <ShimmerProductCard />
          <ShimmerProductCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderNetworkAlert()}
      {renderHeader()}
      
      <View style={styles.mainContent}>
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(195, 177, 225, 0.1)' }]}>
              <Icon name="box" size={20} color="#C3B1E1" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{totalProducts}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </View>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Icon name="layer-group" size={20} color="#10b981" />
            </View>
            <View style={styles.statInfo}>
              <Text style={styles.statNumber}>{totalStock.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Stock</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Icon name="plus" size={18} color="#000000" />
          <Text style={styles.addButtonText}>Add New Product</Text>
        </TouchableOpacity>

        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="box-open" size={60} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>No Products Found</Text>
            <Text style={styles.emptyStateText}>
              Add your first product to get started
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={openAddModal}
            >
              <Icon name="plus" size={16} color="#000000" />
              <Text style={styles.emptyStateButtonText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={loadProducts}
          />
        )}
      </View>

      {renderAddEditModal()}
      {renderDeleteModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Network Alert
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
  // Header Styles
  header: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Main Content
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#24262B',
    gap: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#C3B1E1',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 30,
    gap: 12,
  },
  productCard: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  productName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  productActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  productDescription: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  productDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
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
  stockValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  priceLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  priceValue: {
    color: '#C3B1E1',
    fontSize: 18,
    fontWeight: '700',
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#C3B1E1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Full Screen Modal
  fullModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  fullModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  fullModalBody: {
    flex: 1,
  },
  fullModalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  fullModalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#24262B',
  },
  fullModalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelFullButton: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  submitFullButton: {
    backgroundColor: '#C3B1E1',
  },
  cancelFullButtonText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  submitFullButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Form Styles
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    paddingHorizontal: 16,
  },
  textareaContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 3,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  textarea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  // Delete Modal
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteModalContent: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#24262B',
    width: '100%',
    maxWidth: 340,
  },
  deleteModalIconContainer: {
    marginBottom: 20,
  },
  deleteModalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  deleteModalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalMessage: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalWarning: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteModalCancelButton: {
    backgroundColor: 'rgba(142, 142, 147, 0.1)',
    borderWidth: 1,
    borderColor: '#24262B',
  },
  deleteModalConfirmButton: {
    backgroundColor: '#ef4444',
  },
  deleteModalCancelText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteModalConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});