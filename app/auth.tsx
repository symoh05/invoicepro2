import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

// Simple Supabase client initialization (server-safe)
const supabaseUrl = 'https://balpwwwsmekiwtznuqnd.supabase.co'; // Replace
const supabaseAnonKey = 'sb_publishable_MXWTSjd8S8no2SgVip5RPw_DNhJsk6e'; // Replace

let supabase: any = null;

// Initialize Supabase only on client side
const getSupabaseClient = () => {
  if (typeof window === 'undefined') return null; // Server-side
  
  if (!supabase) {
    const { createClient } = require('@supabase/supabase-js');
    
    // Custom storage for Expo SecureStore
    const storage = {
      getItem: async (key: string) => {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.error('Error setting secure store item:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.error('Error removing secure store item:', error);
        }
      },
    };

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  
  return supabase;
};

export default function AuthScreen() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is already logged in (client-side only)
  useEffect(() => {
    if (!isClient) return;

    const checkSession = async () => {
      try {
        const client = getSupabaseClient();
        if (!client) return;
        
        const { data: { session } } = await client.auth.getSession();
        if (session) {
          router.replace('/'); // Redirect to main app
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    if (isClient) {
      const client = getSupabaseClient();
      if (client) {
        const { data: { subscription } } = client.auth.onAuthStateChange(
          (event: any, session: any) => {
            if (session) {
              router.replace('/');
            }
          }
        );

        return () => subscription.unsubscribe();
      }
    }
  }, [isClient]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin) {
      if (!name) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      if (!client) {
        Alert.alert('Error', 'Authentication not available');
        return;
      }

      if (isLogin) {
        // Login
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert('Login Failed', error.message);
        } else {
          Alert.alert('Success', 'Logged in successfully!');
        }
      } else {
        // Register
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        });

        if (error) {
          Alert.alert('Registration Failed', error.message);
        } else {
          if (data.user?.identities?.length === 0) {
            Alert.alert(
              'User Exists',
              'User already registered. Please login instead.'
            );
            setIsLogin(true);
          } else if (data.session) {
            Alert.alert('Success', 'Account created successfully!');
          } else {
            Alert.alert(
              'Check Your Email',
              'Registration successful! Please check your email to confirm your account.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsLogin(true);
                    setEmail('');
                    setPassword('');
                    setName('');
                    setConfirmPassword('');
                  },
                },
              ]
            );
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    setIsLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) return;
      
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: 'invoicepro://reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Sent',
          'Password reset instructions have been sent to your email.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        <ActivityIndicator size="large" color="#C3B1E1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.logo}>
          <Icon name="file-invoice-dollar" size={24} color="#C3B1E1" />
          <Text style={styles.logoText}>InvoicePro</Text>
        </View>
      </View>
    </View>
  );

  const renderInput = (
    icon: string,
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    secureTextEntry = false,
    keyboardType: any = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Icon name={icon as any} size={16} color="#C3B1E1" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        editable={!isLoading}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      {renderHeader()}
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </Text>
              <Text style={styles.authSubtitle}>
                {isLogin 
                  ? 'Sign in to manage your invoices' 
                  : 'Sign up to get started with InvoicePro'}
              </Text>
            </View>

            {!isLogin && renderInput('user', 'Full Name', name, setName)}
            
            {renderInput('envelope', 'Email Address', email, setEmail, false, 'email-address')}
            
            {renderInput('lock', 'Password', password, setPassword, true)}
            
            {!isLogin && renderInput('lock', 'Confirm Password', confirmPassword, setConfirmPassword, true)}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Sign In' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsLogin(!isLogin);
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              <Text style={styles.toggleText}>
                {isLogin 
                  ? "Don't have an account? Sign Up" 
                  : 'Already have an account? Sign In'}
              </Text>
              <Icon 
                name={isLogin ? 'arrow-right' : 'arrow-left'} 
                size={12} 
                color="#C3B1E1" 
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity
                style={styles.forgotButton}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <Icon name="lightbulb" size={20} color="#C3B1E1" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Getting Started</Text>
              <Text style={styles.infoText}>
                {isLogin 
                  ? 'Use your registered email and password to access your account.'
                  : 'Create an account to start managing invoices and quotations.'}
              </Text>
            </View>
          </View>

          {/* Quick Test Button - Remove in production */}
          {__DEV__ && isLogin && (
            <TouchableOpacity
              style={[styles.testButton, isLoading && styles.testButtonDisabled]}
              onPress={() => {
                setEmail('test@example.com');
                setPassword('password123');
              }}
              disabled={isLoading}
            >
              <Text style={styles.testButtonText}>Fill Test Credentials</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#15171C',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#24262B',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  authCard: {
    backgroundColor: '#15171C',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#24262B',
    padding: 24,
    marginBottom: 20,
  },
  authHeader: {
    marginBottom: 30,
  },
  authTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  authSubtitle: {
    color: '#8E8E93',
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#24262B',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: '#C3B1E1',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  toggleText: {
    color: '#C3B1E1',
    fontSize: 14,
    fontWeight: '500',
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(195, 177, 225, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 177, 225, 0.2)',
    padding: 20,
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoTitle: {
    color: '#C3B1E1',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  testButton: {
    backgroundColor: 'rgba(195, 177, 225, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 177, 225, 0.3)',
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    color: '#C3B1E1',
    fontSize: 14,
  },
});