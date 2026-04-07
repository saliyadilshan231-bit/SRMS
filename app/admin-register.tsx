import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/context/auth';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminRegisterScreen() {
  const { adminRegister } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Real-time validation functions
  const validateName = (value: string) => {
    const newErrors = { ...errors };
    if (!value.trim()) {
      newErrors.name = 'Name is required';
    } else if (value.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else {
      delete newErrors.name;
    }
    setErrors(newErrors);
  };

  const validateEmail = (value: string) => {
    const newErrors = { ...errors };
    if (!value) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      newErrors.email = 'Please enter a valid email address';
    } else {
      delete newErrors.email;
    }
    setErrors(newErrors);
  };

  const validatePassword = (value: string) => {
    const newErrors = { ...errors };
    if (!value) {
      newErrors.password = 'Password is required';
    } else if (value.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(value)) {
      newErrors.password = 'Must contain uppercase letter';
    } else if (!/[a-z]/.test(value)) {
      newErrors.password = 'Must contain lowercase letter';
    } else if (!/[0-9]/.test(value)) {
      newErrors.password = 'Must contain a number';
    } else {
      delete newErrors.password;
    }
    setErrors(newErrors);
  };

  const validateConfirmPassword = (value: string) => {
    const newErrors = { ...errors };
    if (!value) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (value !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    } else {
      delete newErrors.confirmPassword;
    }
    setErrors(newErrors);
  };

  async function handleRegister() {
    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      Alert.alert('Please fix all errors before registering');
      return;
    }

    // Validate all fields one more time
    if (!name || !email || !role || !gender || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const result = await adminRegister({
        name: name.trim(),
        email: email.trim(),
        password,
        gender,
        role,
      });

      if (result.verificationEmailSent) {
        Alert.alert(
          'Verify Your Email',
          'We sent a verification link to your email address. Please verify your email and then log in.'
        );
      } else {
        Alert.alert(
          'Account Created',
          'Your account was created, but verification email is not configured yet. Add the redirect URL in Appwrite and try resending verification.'
        );
      }

      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.header}>
            <ThemedText type="title" style={styles.title}>SRMS Admin</ThemedText>
            <ThemedText style={styles.subtitle}>Create your admin account</ThemedText>
          </View>

          <View style={styles.form}>
            <ThemedText style={styles.label}>Full Name</ThemedText>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter your name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(text) => {
                setName(text);
                validateName(text);
              }}
              autoCapitalize="words"
            />
            {errors.name && <ThemedText style={styles.errorText}>{errors.name}</ThemedText>}

            <ThemedText style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errors.email && <ThemedText style={styles.errorText}>{errors.email}</ThemedText>}

            <ThemedText style={styles.label}>Role</ThemedText>
            <View style={styles.roleContainer}>
              {['Admin', 'Counciler'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.roleButton,
                    role === option && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole(option)}
                >
                  <ThemedText
                    style={[
                      styles.roleText,
                      role === option && styles.roleTextActive,
                    ]}
                  >
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.label}>Gender</ThemedText>
            <View style={styles.roleContainer}>
              {['Male', 'Female', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.roleButton,
                    gender === option && styles.roleButtonActive,
                  ]}
                  onPress={() => setGender(option)}
                >
                  <ThemedText
                    style={[
                      styles.roleText,
                      gender === option && styles.roleTextActive,
                    ]}
                  >
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText style={styles.label}>Password</ThemedText>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="At least 8 characters"
              placeholderTextColor="#999"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validatePassword(text);
              }}
              secureTextEntry
            />
            {errors.password && <ThemedText style={styles.errorText}>{errors.password}</ThemedText>}

            <ThemedText style={styles.label}>Confirm Password</ThemedText>
            <TextInput
              style={[styles.input, errors.confirmPassword && styles.inputError]}
              placeholder="Re-enter your password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                validateConfirmPassword(text);
              }}
              secureTextEntry
            />
            {errors.confirmPassword && <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Register Admin</ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <ThemedText style={styles.footerText}>Already have an account? </ThemedText>
              <Link href="/login" asChild>
                <TouchableOpacity>
                  <ThemedText style={styles.link}>Login</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#1C3165',
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  inputError: {
    borderColor: '#E53935',
    backgroundColor: '#FFEBEE',
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#1C3165',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  footerText: {
    color: '#FFFFFF',
  },
  link: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  roleButtonActive: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  roleText: {
    fontSize: 14,
    color: '#1C3165',
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
