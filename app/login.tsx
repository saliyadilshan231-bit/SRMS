import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      // Navigation is now handled by the RootLayoutNav in _layout.tsx based on the user state.
      // But we can also add a router.replace here to be safe and force it.
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Blue Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoWrapper}>
              <Image
                source={require('@/assets/images/Asset 3@2x-8.png')}
                style={styles.logoImage}
              />
            </View>
          </View>

          {/* White Bottom Sheet/Card */}
          <View style={styles.formCard}>
            <View style={styles.welcomeHeader}>
              <ThemedText style={styles.welcomeText}>Welcome back 👋</ThemedText>
              <ThemedText style={styles.signInText}>Sign in to continue</ThemedText>
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.inputLabel}>EMAIL</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="you@university.edu"
                placeholderTextColor="#A0AEC0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <ThemedText style={styles.inputLabel}>PASSWORD</ThemedText>
              <TextInput
                style={styles.textInput}
                placeholder="........"
                placeholderTextColor="#A0AEC0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.loginBtn, isLoading && { opacity: 0.8 }]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ThemedText style={styles.loginBtnText}>Login →</ThemedText>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <ThemedText style={styles.footerNormalText}>Don't have an account? </ThemedText>
                <Link href="/register" asChild>
                  <TouchableOpacity>
                    <ThemedText style={styles.footerLinkText}>Register</ThemedText>
                  </TouchableOpacity>
                </Link>
              </View>

              <View style={styles.footerRow}>
                <ThemedText style={styles.footerNormalText}>Are you an admin/counciler? </ThemedText>
                <Link href="/admin-register" asChild>
                  <TouchableOpacity>
                    <ThemedText style={styles.footerLinkText}>Admin Register</ThemedText>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C3165',
  },
  scrollContent: {
    flexGrow: 1,
  },

  headerSection: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C3165',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  logoSubText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -10,
    opacity: 0.9,
  },

  formCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 50, // රූපයේ පරිදි ලොකු වටකුරු දාර
    borderTopRightRadius: 50,
    paddingHorizontal: 30,
    paddingTop: 45,
    paddingBottom: 40,
    minHeight: 500,
  },
  welcomeHeader: {
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A202C',
  },
  signInText: {
    fontSize: 16,
    color: '#718096',
    marginTop: 5,
    fontWeight: '500',
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
    marginTop: 20,
  },
  textInput: {
    backgroundColor: '#F1F5F9', // ලා නිල්/අළු පාට පසුබිම
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#1A202C',
  },
  loginBtn: {
    backgroundColor: '#1C3165',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 40,
    // Shadow (iOS/Android)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  footerNormalText: {
    color: '#718096',
    fontSize: 14,
  },
  footerLinkText: {
    color: '#1C3165',
    fontSize: 14,
    fontWeight: '700',
  },
});