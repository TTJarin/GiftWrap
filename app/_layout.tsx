// app/_layout.tsx
import { Stack, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MyTabBar from './MyTabBar';

export default function RootLayout() {
  const pathname = usePathname();
  const hideTabBar = pathname === '/' || pathname === '/welcome';

  return (
    <SafeAreaProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' }
        }}
      />
      {!hideTabBar && <MyTabBar />}
    </SafeAreaProvider>
  );
}
