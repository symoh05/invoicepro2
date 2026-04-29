import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/FontAwesome6';

const { width } = Dimensions.get('window');

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isActive = (path: string) => pathname === path;

  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: 'house', 
      path: '/' 
    },
    { 
      id: 'invoices', 
      label: 'Invoices', 
      icon: 'file-invoice-dollar', 
      path: '/invoices' 
    },
    { 
      id: 'create', 
      label: 'Create', 
      icon: 'plus', 
      path: null,
      isFAB: true 
    },
    { 
      id: 'quotations', 
      label: 'Quotes', 
      icon: 'quote-right', 
      path: '/quotations' 
    },
    { 
      id: 'more', 
      label: 'More', 
      icon: 'bars', 
      path: '/more' 
    },
  ];

  const handleNavigation = (item: any) => {
    if (item.path && !item.isFAB) {
      router.push(item.path);
    } else if (item.isFAB) {
      router.push('/create-options');
    }
  };

  const isSmallScreen = width < 375;
  const isMediumScreen = width < 414;

  // Calculate equal spacing for 5 items (including FAB position)
  const containerWidth = isSmallScreen ? width - 30 : width - 40;
  const itemWidth = containerWidth / 5;

  return (
    <View style={[styles.fixedContainer, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.container, isSmallScreen && styles.containerSmall, { width: containerWidth }]}>
        <View style={styles.navWrapper}>
          {navItems.map((item) => {
            if (item.isFAB) {
              return (
                <View 
                  key={item.id} 
                  style={[
                    styles.fabContainer,
                    { width: itemWidth }
                  ]}
                >
                  <TouchableOpacity
                    style={[styles.fabButton, isSmallScreen && styles.fabButtonSmall]}
                    onPress={() => router.push('/create-options')}
                    activeOpacity={0.9}
                  >
                    <Icon 
                      name="plus" 
                      size={isSmallScreen ? 22 : 24} 
                      color="#000000" 
                    />
                  </TouchableOpacity>
                </View>
              );
            }

            const active = isActive(item.path || '');
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.navItem,
                  active && styles.navItemActive,
                  isSmallScreen && styles.navItemSmall,
                  { width: itemWidth }
                ]}
                onPress={() => handleNavigation(item)}
                activeOpacity={0.7}
              >
                <Icon
                  name={item.icon}
                  size={isMediumScreen ? 18 : 20}
                  color={active ? '#C3B1E1' : '#8E8E93'}
                  style={styles.navIcon}
                />
                <Text
                  style={[
                    styles.navLabel,
                    isSmallScreen && styles.navLabelSmall,
                    active && styles.navLabelActive
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#24262B',
    borderRadius: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  containerSmall: {
    paddingVertical: 5,
    borderRadius: 25,
  },
  navWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    height: 43,
  },
  fabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(195, 177, 225, 0.15)',
    borderRadius: 12,
  },
  navItemSmall: {
    height: 48,
  },
  navIcon: {
    marginBottom: 3,
  },
  navLabel: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  navLabelSmall: {
    fontSize: 9,
  },
  navLabelActive: {
    color: '#C3B1E1',
    fontWeight: '600',
  },
  fabButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#C3B1E1',
    position: 'absolute',
    top: -20,
    left: '50%',
    transform: [{ translateX: -26 }],
  },
  fabButtonSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    transform: [{ translateX: -24 }],
    top: -18,
  },
});