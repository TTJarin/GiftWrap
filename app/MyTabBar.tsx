import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, scaleFont, verticalScale } from './scale';

type AppRoute = '/homepage' | '/cart' | '/profile';

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const hiddenRoutes = ['/login', '/signup', '/checkout'];

  if (hiddenRoutes.some((r) => pathname.startsWith(r))) return null;

  const tabs: { name: string; icon: string; route: AppRoute }[] = [
    { name: 'Home', icon: 'home-outline', route: '/homepage' },
    { name: 'Cart', icon: 'cart-outline', route: '/cart' },
    { name: 'Profile', icon: 'person-outline', route: '/profile' },
  ];

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.nav}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.route);
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tabButton}
              onPress={() => router.push(tab.route)}
            >
              <Ionicons
                name={tab.icon as any}
                size={scaleFont(26)}
                color={isActive ? '#D50000' : 'gray'}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF3E0',
    borderTopLeftRadius: scale(12),
    borderTopRightRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: verticalScale(65),
    backgroundColor: '#FFF3E0',
    paddingBottom: verticalScale(5),
  },
  tabButton: { 
    alignItems: 'center', 
    flex: 1,
    paddingVertical: verticalScale(8),
  },
  label: { 
    fontSize: scaleFont(10), 
    color: 'gray', 
    marginTop: verticalScale(2) 
  },
  labelActive: { 
    color: '#D50000', 
    fontWeight: '600' 
  },
});
