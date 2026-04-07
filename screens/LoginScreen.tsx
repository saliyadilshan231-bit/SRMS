// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

import LoginGlassBackground from '@/components/LoginGlassBackground';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const NAVY = '#0A0A5C';
const MUTED = '#5B6B7C';

/** Student portal: local part must end with `.student` before @gmail.com */
function isValidStudentEmail(value) {
  return /^[a-zA-Z0-9._%+-]+\.student@gmail\.com$/i.test(value.trim());
}

/** Peer tutor portal: local part must end with `.tutor` before @gmail.com */
function isValidTutorEmail(value) {
  return /^[a-zA-Z0-9._%+-]+\.tutor@gmail\.com$/i.test(value.trim());
}

function isValidLoginEmail(value, peerTutor) {
  return peerTutor ? isValidTutorEmail(value) : isValidStudentEmail(value);
}

const MAX_SAVED_EMAILS = 10;
const MAX_SUGGESTIONS = 6;

async function readRecentLoginEmails() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.recentLoginEmails);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((e) => typeof e === 'string' && e.includes('@'))
      : [];
  } catch {
    return [];
  }
}

async function appendRecentLoginEmail(emailNorm) {
  try {
    const prev = await readRecentLoginEmails();
    const next = [emailNorm, ...prev.filter((e) => e !== emailNorm)].slice(0, MAX_SAVED_EMAILS);
    await AsyncStorage.setItem(STORAGE_KEYS.recentLoginEmails, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function emailMatchesQuery(savedEmail, queryRaw) {
  const q = queryRaw.trim().toLowerCase();
  if (!q) return true;
  const lower = savedEmail.toLowerCase();
  if (lower.includes(q)) return true;
  const local = lower.split('@')[0] || '';
  if (local.startsWith(q)) return true;
  const firstSegment = local.split('.')[0] || '';
  return firstSegment.startsWith(q);
}

/**
 * Student or peer tutor — light glass background (peer tutor registration style); frosted card.
 * @param {{ variant?: 'student' | 'peerTutor' }} props
 */
export default function LoginScreen({ variant = 'student' }) {
  const isPeerTutor = variant === 'peerTutor';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedEmails, setSavedEmails] = useState([]);
  const [emailFocused, setEmailFocused] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const recent = await readRecentLoginEmails();
      const lastSession = await AsyncStorage.getItem(STORAGE_KEYS.studentEmail);
      const merged = [...recent];
      if (lastSession?.trim() && !merged.includes(lastSession.trim().toLowerCase())) {
        merged.push(lastSession.trim().toLowerCase());
      }
      const stay = await AsyncStorage.getItem(STORAGE_KEYS.stayLoggedIn);
      if (!cancelled) {
        setSavedEmails(merged);
        setStayLoggedIn(stay === '1');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emailSuggestions = useMemo(() => {
    if (!emailFocused || savedEmails.length === 0) return [];
    const pool = savedEmails.filter((e) =>
      isPeerTutor ? isValidTutorEmail(e) : isValidStudentEmail(e),
    );
    if (pool.length === 0) return [];
    const q = email.trim();
    if (!q) return pool.slice(0, MAX_SUGGESTIONS);
    return pool.filter((e) => emailMatchesQuery(e, q)).slice(0, MAX_SUGGESTIONS);
  }, [email, emailFocused, savedEmails, isPeerTutor]);

  const showEmailSuggestions = emailFocused && emailSuggestions.length > 0;

  const applySuggestedEmail = useCallback((addr) => {
    setEmail(addr);
    Keyboard.dismiss();
    setEmailFocused(false);
  }, []);

  const emailFormatHint = isPeerTutor ? 'name.tutor@gmail.com' : 'name.student@gmail.com';

  const emailError = useMemo(() => {
    if (!touched) return '';
    if (!email.trim()) return 'Email is required.';
    if (!isValidLoginEmail(email, isPeerTutor)) {
      return isPeerTutor
        ? 'Use tutor format: name.tutor@gmail.com'
        : 'Use format: name.student@gmail.com';
    }
    return '';
  }, [email, touched, isPeerTutor]);

  const passwordError = useMemo(() => {
    if (!touched) return '';
    if (!password.trim()) return 'Password is required.';
    if (password.trim().length < 8) return 'At least 8 characters.';
    return '';
  }, [password, touched]);

  const canSubmit = !emailError && !passwordError && email.trim() && password.trim();

  const onForgotPassword = useCallback(() => {
    Alert.alert('Forgot password', 'Contact your administrator or use your institution reset flow.');
  }, []);

  const onLogin = async () => {
    setTouched(true);
    if (email.trim().length > 0 && !isValidLoginEmail(email, isPeerTutor)) {
      Alert.alert(
        'Invalid email',
        isPeerTutor
          ? 'Peer tutors must use: name.tutor@gmail.com'
          : 'Students must use: name.student@gmail.com',
      );
      return;
    }
    if (password.trim().length > 0 && password.trim().length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (!canSubmit) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 550));
      const emailNorm = email.trim().toLowerCase();
      await AsyncStorage.setItem(STORAGE_KEYS.studentEmail, emailNorm);
      await AsyncStorage.setItem(STORAGE_KEYS.loginRole, isPeerTutor ? 'peerTutor' : 'student');
      await AsyncStorage.setItem(STORAGE_KEYS.stayLoggedIn, stayLoggedIn ? '1' : '0');
      // Store last-login timestamp so other screens (e.g. calendar) can highlight it.
      await AsyncStorage.setItem(STORAGE_KEYS.lastLoginAt, new Date().toISOString());
      const localPart = emailNorm.split('@')[0] || '';
      const itFromEmail = localPart.match(/^(it\d+)/i);
      if (itFromEmail) {
        await AsyncStorage.setItem(STORAGE_KEYS.studentId, itFromEmail[1].toUpperCase());
      }
      await appendRecentLoginEmail(emailNorm);
      setSavedEmails((prev) => [emailNorm, ...prev.filter((e) => e !== emailNorm)].slice(0, MAX_SAVED_EMAILS));
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <LoginGlassBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name={isPeerTutor ? 'people-outline' : 'school-outline'}
                    size={28}
                    color={NAVY}
                  />
                </View>
                <View style={styles.headerText}>
                  <Text style={styles.brand}>Kuppi Management</Text>
                  <View style={styles.roleChip}>
                    <Text style={styles.roleChipText}>{isPeerTutor ? 'Peer tutor' : 'Student'}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.title}>
                {isPeerTutor ? 'Tutor sign in' : 'Welcome back'}
              </Text>
              <Text style={styles.subtitle}>
                {isPeerTutor
                  ? `Use your tutor email (${emailFormatHint}) and password.`
                  : 'Sign in with your student account.'}
              </Text>

              <View style={styles.fieldBlock}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.emailWrap}>
                  <View style={[styles.inputRow, !!emailError && styles.inputRowError]}>
                    <Ionicons name="mail-outline" size={20} color={MUTED} style={styles.inputIcon} />
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => {
                        setTouched(true);
                        setTimeout(() => setEmailFocused(false), 220);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      placeholder={emailFormatHint}
                      placeholderTextColor="#9CA3AF"
                      style={styles.input}
                    />
                  </View>
                  {showEmailSuggestions ? (
                    <View style={styles.suggestions}>
                      <Text style={styles.suggestionsHint}>
                        {email.trim() ? 'Tap to fill' : 'Recent logins'}
                      </Text>
                      {emailSuggestions.map((addr) => (
                        <Pressable
                          key={addr}
                          onPress={() => applySuggestedEmail(addr)}
                          style={({ pressed }) => [styles.suggestionRow, pressed && styles.suggestionPressed]}>
                          <Ionicons name="time-outline" size={16} color={MUTED} />
                          <Text style={styles.suggestionEmail} numberOfLines={1}>
                            {addr}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
                {!!emailError ? <Text style={styles.error}>{emailError}</Text> : null}
              </View>

              <Text style={[styles.label, styles.passwordLabel]}>Password</Text>
              <View style={[styles.inputRow, !!passwordError && styles.inputRowError]}>
                <Ionicons name="lock-closed-outline" size={20} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onBlur={() => setTouched(true)}
                  secureTextEntry={!showPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#9CA3AF"
                  style={styles.input}
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={10}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={MUTED}
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}

              <View style={styles.auxRow}>
                <Pressable style={styles.stayRow} onPress={() => setStayLoggedIn((s) => !s)} hitSlop={8}>
                  <Ionicons
                    name={stayLoggedIn ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={NAVY}
                  />
                  <Text style={styles.stayText}>Stay logged in</Text>
                </Pressable>
                <Pressable onPress={onForgotPassword} hitSlop={8}>
                  <Text style={styles.forgot}>Forgot password?</Text>
                </Pressable>
              </View>

              <TouchableOpacity
                style={styles.loginBtn}
                onPress={onLogin}
                disabled={loading}
                activeOpacity={0.9}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginBtnText}>Login</Text>
                )}
              </TouchableOpacity>

              {isPeerTutor ? (
                <View style={styles.signUpFooter}>
                  <Text style={styles.signUpFooterText}>
                    {"Don't have an account? "}
                    <Text
                      style={styles.signUpLink}
                      onPress={() => router.push('/peer-tutor-signup')}
                      accessibilityRole="link">
                      Sign up
                    </Text>
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E8F4FC',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(147,197,253,0.75)',
    shadowColor: 'rgba(15,58,110,0.14)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.65)',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  brand: {
    fontSize: 18,
    fontFamily: 'Roboto_900Black',
    color: NAVY,
    letterSpacing: 0.3,
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(224,242,254,0.85)',
  },
  roleChipText: {
    fontSize: 11,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: MUTED,
    lineHeight: 20,
    marginBottom: 22,
  },
  fieldBlock: {
    position: 'relative',
    zIndex: 20,
  },
  emailWrap: {
    position: 'relative',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
    marginBottom: 8,
  },
  passwordLabel: {
    marginTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(147,197,253,0.85)',
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.72)',
    minHeight: 50,
  },
  inputRowError: {
    borderColor: '#DC2626',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_400Regular',
    color: '#111827',
    paddingVertical: 12,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: 'Roboto_500Medium',
    color: '#DC2626',
  },
  suggestions: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '100%',
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(147,197,253,0.75)',
    maxHeight: 200,
    zIndex: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    paddingVertical: 6,
  },
  suggestionsHint: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    fontSize: 11,
    color: MUTED,
    fontFamily: 'Roboto_500Medium',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  suggestionPressed: {
    backgroundColor: 'rgba(10,10,92,0.05)',
  },
  suggestionEmail: {
    flex: 1,
    fontSize: 14,
    color: NAVY,
    fontFamily: 'Roboto_400Regular',
  },
  auxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  stayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stayText: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#374151',
  },
  forgot: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: NAVY,
  },
  loginBtn: {
    marginTop: 20,
    backgroundColor: NAVY,
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
  },
  signUpFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  signUpFooterText: {
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 22,
  },
  signUpLink: {
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    textDecorationLine: 'underline',
  },
});

