import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STORAGE_KEYS } from '@/constants/storageKeys';

/** Same email rule as login for consistency */
function isValidEmail(value: string): boolean {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(value.trim());
}

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const nameError = useMemo(() => {
    if (!touched) return '';
    if (!fullName.trim()) return 'Full name is required.';
    return '';
  }, [fullName, touched]);

  const emailError = useMemo(() => {
    if (!touched) return '';
    if (!email.trim()) return 'Email is required.';
    if (!isValidEmail(email)) return 'Please use a valid Gmail address (example@gmail.com).';
    return '';
  }, [email, touched]);

  const passwordError = useMemo(() => {
    if (!touched) return '';
    if (!password.trim()) return 'Password is required.';
    if (password.trim().length < 4) return 'Password must be at least 4 characters.';
    return '';
  }, [password, touched]);

  const confirmError = useMemo(() => {
    if (!touched) return '';
    if (!confirmPassword.trim()) return 'Please confirm your password.';
    if (confirmPassword !== password) return 'Passwords do not match.';
    return '';
  }, [confirmPassword, password, touched]);

  const canSubmit: boolean = Boolean(
    !nameError &&
      !emailError &&
      !passwordError &&
      !confirmError &&
      fullName.trim() &&
      email.trim() &&
      password.trim() &&
      confirmPassword.trim(),
  );

  const onRegister = async (): Promise<void> => {
    setTouched(true);
    if (!canSubmit) return;
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.studentFullName, fullName.trim()],
        [STORAGE_KEYS.studentId, studentId.trim()],
      ]);
      // After sign-up, go to Kuppi Management (login) so student re-enters email/password, then Login → Dashboard.
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#05053A', '#0A0A5C', '#0D1B4D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Light blue / white popup — matches login page card feel */}
            <LinearGradient
              colors={['#FFFFFF', '#F4F9FF', '#EEF5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.popupCard}>
              <View style={styles.avatarRing}>
                <Ionicons name="person" size={36} color="#0A0A5C" />
              </View>

              <Text style={styles.cardTitle}>CREATE YOUR ACCOUNT</Text>
              <Text style={styles.cardSubtitle}>Join SRMS Kuppi Management</Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Full name :</Text>
                <View style={[styles.whiteInput, !!nameError && styles.inputError]}>
                  <Ionicons name="person-outline" size={18} color="#0A0A5C" style={styles.fieldIcon} />
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    onBlur={() => setTouched(true)}
                    placeholder="Enter your full name"
                    placeholderTextColor="#8A9BB5"
                    style={styles.fieldInput}
                  />
                </View>
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Student ID (optional) :</Text>
                <View style={styles.whiteInput}>
                  <Ionicons name="id-card-outline" size={18} color="#0A0A5C" style={styles.fieldIcon} />
                  <TextInput
                    value={studentId}
                    onChangeText={setStudentId}
                    autoCapitalize="characters"
                    placeholder="e.g. IT23656888"
                    placeholderTextColor="#8A9BB5"
                    style={styles.fieldInput}
                  />
                </View>
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Email address :</Text>
                <View style={[styles.whiteInput, !!emailError && styles.inputError]}>
                  <Ionicons name="mail-outline" size={18} color="#0A0A5C" style={styles.fieldIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onBlur={() => setTouched(true)}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="student@example.com"
                    placeholderTextColor="#8A9BB5"
                    style={styles.fieldInput}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Password :</Text>
                <View style={[styles.whiteInput, !!passwordError && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#0A0A5C" style={styles.fieldIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onBlur={() => setTouched(true)}
                    secureTextEntry={!showPassword}
                    placeholder="Min. 4 characters"
                    placeholderTextColor="#8A9BB5"
                    style={styles.fieldInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#0A0A5C"
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Confirm password :</Text>
                <View style={[styles.whiteInput, !!confirmError && styles.inputError]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#0A0A5C" style={styles.fieldIcon} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onBlur={() => setTouched(true)}
                    secureTextEntry={!showConfirm}
                    placeholder="Re-enter password"
                    placeholderTextColor="#8A9BB5"
                    style={styles.fieldInput}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} hitSlop={8}>
                    <Ionicons
                      name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#0A0A5C"
                    />
                  </TouchableOpacity>
                </View>
                {confirmError ? <Text style={styles.errorText}>{confirmError}</Text> : null}
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onRegister}
                disabled={loading}
                activeOpacity={0.92}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Login</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  popupCard: {
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 26,
    borderWidth: 1,
    borderColor: '#DDE6F3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#C4D2E6',
  },
  cardTitle: {
    color: '#0A0A5C',
    fontSize: 17,
    fontFamily: 'Roboto_900Black',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  cardSubtitle: {
    color: '#0A0A5C',
    fontSize: 13,
    fontFamily: 'Roboto_500Medium',
    textAlign: 'center',
    opacity: 0.85,
    marginBottom: 20,
    marginTop: 4,
  },
  fieldBlock: {
    marginBottom: 14,
  },
  fieldLabel: {
    color: '#0A0A5C',
    fontSize: 13,
    fontFamily: 'Roboto_700Bold',
    marginBottom: 6,
  },
  whiteInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#C4D2E6',
    shadowColor: '#0A0A5C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#D9534F',
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: '#0A0A5C',
    paddingVertical: 10,
  },
  errorText: {
    marginTop: 4,
    color: '#7F1D1D',
    fontSize: 11,
    fontFamily: 'Roboto_500Medium',
  },
  primaryButton: {
    marginTop: 10,
    alignSelf: 'stretch',
    backgroundColor: '#0A0A5C',
    paddingVertical: 12,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
});
