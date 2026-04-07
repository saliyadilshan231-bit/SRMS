// @ts-nocheck
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import KuppiWelcomeBackground from '@/components/KuppiWelcomeBackground';

export default function KuppiManagementLandingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  // Keep "KUPPI MANAGEMENT" on one line so the last "T" doesn't wrap on iPhone width.
  const isNarrowPhone = width < 420;
  const heroFontSize = isNarrowPhone ? 32 : 36;
  const heroLetterSpacing = isNarrowPhone ? 0.35 : 0.8;
  const heroLineHeight = isNarrowPhone ? 38 : 44;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <KuppiWelcomeBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <Text
            style={[
              styles.heroTitle,
              {
                fontSize: heroFontSize,
                letterSpacing: heroLetterSpacing,
                lineHeight: heroLineHeight,
              },
            ]}
              numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}>
              KUPPI
              {'\n'}
              MANAGEMENT
          </Text>
          <View style={styles.glassCard}>
            <Text style={styles.subtitle}>Choose your role to continue</Text>

            <TouchableOpacity
              style={styles.studentButton}
              activeOpacity={0.9}
              onPress={() => router.push('/login')}>
              <LinearGradient
                colors={['#0A0A5C', '#152281']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.studentButtonFill}>
                <Ionicons name="school-outline" size={20} color="#FFFFFF" />
                <Text style={styles.studentText}>STUDENT</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.tutorButton}
              activeOpacity={0.9}
              onPress={() => router.push('/login-peer-tutor')}>
              <Ionicons name="people-outline" size={20} color="#0A0A5C" />
              <Text style={styles.tutorText}>PEER TUTOR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#051525',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroTitle: {
    width: '100%',
    maxWidth: 560,
    marginBottom: 22,
    paddingHorizontal: 8,
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 36,
    fontFamily: 'LibreBaskerville_700Bold',
    letterSpacing: 0.8,
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 14,
  },
  glassCard: {
    width: '100%',
    maxWidth: 470,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingVertical: 28,
    paddingHorizontal: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 14,
  },
  subtitle: {
    marginTop: 0,
    marginBottom: 24,
    color: '#415A79',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: 'Roboto_500Medium',
  },
  studentButton: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 14,
    marginBottom: 12,
  },
  studentButtonFill: {
    minHeight: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  tutorButton: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#0A0A5C',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  studentText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 0.4,
  },
  tutorText: {
    color: '#0A0A5C',
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    letterSpacing: 0.4,
  },
});
