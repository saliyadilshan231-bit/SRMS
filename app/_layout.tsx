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

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Must match first real screen so tabs/home never open before auth flow.
  anchor: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth / app flow first — (tabs) last so the app never opens Home/Dashboard by mistake */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="kuppi-management" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="login-peer-tutor" options={{ headerShown: false }} />
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
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
