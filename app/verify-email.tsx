import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { account } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';

type VerifyStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const { userId, secret } = useLocalSearchParams<{ userId?: string; secret?: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    let mounted = true;

    async function verifyEmail() {
      if (!userId || !secret) {
        if (mounted) {
          setStatus('error');
          setMessage('Invalid verification link. Please request a new email verification link.');
        }
        return;
      }

      try {
        await account.updateVerification(String(userId), String(secret));
        if (mounted) {
          setStatus('success');
          setMessage('Your email has been verified. You can now log in.');
        }
      } catch {
        if (mounted) {
          setStatus('error');
          setMessage('Verification failed or link expired. Please request a new verification link.');
        }
      }
    }

    verifyEmail();

    return () => {
      mounted = false;
    };
  }, [userId, secret]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.card}>
        {status === 'loading' ? <ActivityIndicator size="large" color="#0A0A5C" /> : null}

        <ThemedText type="title" style={styles.title}>
          Email Verification
        </ThemedText>

        <ThemedText style={styles.message}>{message}</ThemedText>

        {status !== 'loading' ? (
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
            <ThemedText style={styles.buttonText}>Go to Login</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#FFFFFF',
    gap: 12,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
  },
  message: {
    textAlign: 'center',
    opacity: 0.8,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#0A0A5C',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
