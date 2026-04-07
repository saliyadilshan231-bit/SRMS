import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth';
import { TaskManagerProvider, useTaskManager } from '@/context/task-manager';
import { SRMSThemeProvider, useTheme } from '@/context/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function FloatingMiniTimer() {
    const { focusSession, setMinimized, tasks } = useTaskManager();
    const router = useRouter();
    const colors = useThemeColors();
    const { uiMode, isMinimized, secondsLeft, focusMin, phase, selectedTaskId } = focusSession;

    if (uiMode !== 'focus' || !isMinimized) return null;

    const selectedTask = tasks.find(t => t.id === selectedTaskId);
    const totalSecs = phase === 'running' ? focusMin * 60 : focusSession.breakMin * 60;
    const progress = ((totalSecs - secondsLeft) / totalSecs) * 100;
    
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = (secondsLeft % 60).toString().padStart(2, '0');

    const handlePress = () => {
        setMinimized(false);
        router.push('/(tabs)/focus');
    };

    return (
        <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={handlePress}
            style={{
                position: 'absolute',
                bottom: 100, // Above tab bar
                right: 20,
                backgroundColor: 'rgba(11, 23, 59, 0.85)',
                padding: 12,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.15)',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                zIndex: 9999,
            }}
        >
            <View style={{ width: 34, height: 34, justifyContent: 'center', alignItems: 'center' }}>
                <Svg width={34} height={34}>
                    <Circle cx="17" cy="17" r="15" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                    <Circle 
                        cx="17" cy="17" r="15" 
                        stroke={phase === 'break' ? '#48BB78' : '#fff'} 
                        strokeWidth="3" fill="none"
                        strokeDasharray={2 * Math.PI * 15}
                        strokeDashoffset={2 * Math.PI * 15 * (1 - progress / 100)}
                        strokeLinecap="round"
                        rotation="-90"
                        origin="17, 17"
                    />
                </Svg>
                <Text style={{ position: 'absolute', fontSize: 10, color: '#fff', fontWeight: 'bold' }}>
                    {phase === 'break' ? '☕' : '🌱'}
                </Text>
            </View>
            <View>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700' }}>
                    {phase === 'break' ? 'BREAK' : 'FOCUS'}
                </Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>{m}:{s}</Text>
            </View>
        </TouchableOpacity>
    );
}

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const { isDark } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingState() {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        if (mounted) setHasSeenOnboarding(value === 'true');
      } catch {
        if (mounted) setHasSeenOnboarding(false);
      }
    }

    loadOnboardingState();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || hasSeenOnboarding === null) return;
    const inOnboarding = pathname === '/';
    const inAuthGroup =
      segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'verify-email' || segments[0] === 'admin-register';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!hasSeenOnboarding) {
      // Allow auth routes after tapping Get Started; otherwise redirect to onboarding.
      if (!inOnboarding && !inAuthGroup) {
        router.replace('/');
      }
      return;
    }

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && !inTabsGroup && !pathname.startsWith('/(tabs)')) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router, hasSeenOnboarding, pathname]);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="admin-register" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <FloatingMiniTimer />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SRMSThemeProvider>
      <AuthProvider>
        <TaskManagerProvider>
          <RootLayoutNav />
        </TaskManagerProvider>
      </AuthProvider>
    </SRMSThemeProvider>
  );
}