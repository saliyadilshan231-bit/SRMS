import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { LibreBaskerville_700Bold } from '@expo-google-fonts/libre-baskerville';

import { AuthProvider, useAuth } from '@/context/auth';
import { TaskManagerProvider, useTaskManager } from '@/context/task-manager';
import { SRMSThemeProvider, useTheme } from '@/context/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePathname, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export const unstable_settings = {
  initialRouteName: '(tabs)',
  anchor: 'index',
};

function FloatingMiniTimer() {
    const { focusSession, setMinimized, tasks } = useTaskManager();
    const router = useRouter();
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

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
    LibreBaskerville_700Bold,
  });

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
    if (isLoading || hasSeenOnboarding === null || !fontsLoaded) return;
    const inOnboarding = pathname === '/';
    const kuppiRoutes = [
      'login-peer-tutor', 'peer-tutor-register', 'peer-tutor-signup',
      'kuppi-management', 'login-student', 'kuppi-dashboard',
      'library', 'library-upload', 'tutor-library-module-select',
      'timed-quiz', 'timed-quiz-challenge', 'tutor-session-module-choice',
      'tutor-module-kuppi-link', 'create-session-poll', 'edit-session-poll',
      'session-scheduling-modules', 'session-scheduling-polls',
      'student-zoom-link-detail', 'student-zoom-links-list'
    ];
    const isKuppiPath = kuppiRoutes.includes(segments[0]);

    const inAuthGroup =
      segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'verify-email' || segments[0] === 'admin-register' ||
      isKuppiPath || inOnboarding;
    const inTabsGroup = segments[0] === '(tabs)';

    if (!hasSeenOnboarding) {
      if (!inOnboarding && !inAuthGroup) {
        router.replace('/');
      }
      return;
    }

    const inKuppiGroup = isKuppiPath || inOnboarding;

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && !inTabsGroup && !pathname.startsWith('/(tabs)') && !inKuppiGroup) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router, hasSeenOnboarding, pathname, fontsLoaded]);

  if (isLoading || hasSeenOnboarding === null || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth / app flow first — (tabs) last so the app never opens Home/Dashboard by mistake */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="kuppi-management" options={{ headerShown: false }} />
        <Stack.Screen name="kuppi-dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="admin-register" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="login-peer-tutor" options={{ headerShown: false }} />
        <Stack.Screen name="login-student" options={{ headerShown: false }} />
        <Stack.Screen name="peer-tutor-register" options={{ headerShown: false }} />
        <Stack.Screen name="peer-tutor-signup" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerShown: false }} />
        <Stack.Screen name="student-zoom-link-detail" options={{ headerShown: false }} />
        <Stack.Screen name="student-zoom-links-list" options={{ headerShown: false }} />
        <Stack.Screen name="library" options={{ headerShown: false }} />
        <Stack.Screen name="library-upload" options={{ headerShown: false }} />
        <Stack.Screen name="tutor-library-module-select" options={{ headerShown: false }} />
        <Stack.Screen name="timed-quiz" options={{ headerShown: false }} />
        <Stack.Screen name="timed-quiz-challenge" options={{ headerShown: false }} />
        <Stack.Screen name="tutor-session-module-choice" options={{ headerShown: false }} />
        <Stack.Screen name="tutor-module-kuppi-link" options={{ headerShown: false }} />
        <Stack.Screen name="create-session-poll" options={{ headerShown: false }} />
        <Stack.Screen name="edit-session-poll" options={{ headerShown: false }} />
        <Stack.Screen name="session-scheduling-modules" options={{ headerShown: false }} />
        <Stack.Screen name="session-scheduling-polls" options={{ headerShown: false }} />
        <Stack.Screen name="module/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
