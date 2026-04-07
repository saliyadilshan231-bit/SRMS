// @ts-nocheck
import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { sessionSchedulingCreateModulesParams } from '@/constants/sessionSchedulingFaculties';
import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';

function paramStr(v) {
  if (v == null) return '';
  return String(Array.isArray(v) ? v[0] : v);
}

const NAVY = '#0A0A5C';
const SCREEN_BG = '#F4F4F4';
const HERO_GRADIENT = ['#003366', '#004080', '#001F3F'];

export default function TutorSessionModuleChoiceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleId = paramStr(params.moduleId);
  const moduleTitleParam = paramStr(params.moduleTitle);
  const facultyId = paramStr(params.facultyId);
  const facultyTitleParam = paramStr(params.facultyTitle);

  const moduleTitleDecoded = useMemo(() => {
    if (!moduleTitleParam) {
      const m = TIMED_QUIZ_MODULES.find((x) => x.id === moduleId);
      return m?.title || 'Module';
    }
    try {
      return decodeURIComponent(moduleTitleParam);
    } catch {
      return moduleTitleParam;
    }
  }, [moduleId, moduleTitleParam]);

  const facultyTitlePass = facultyTitleParam || '';

  useEffect(() => {
    if (!moduleId) {
      router.replace({
        pathname: '/session-scheduling-modules',
        params: sessionSchedulingCreateModulesParams,
      });
    }
  }, [moduleId, router]);

  const goPoll = useCallback(() => {
    router.push({
      pathname: '/create-session-poll',
      params: {
        moduleId,
        moduleTitle: encodeURIComponent(moduleTitleDecoded),
        facultyId,
        facultyTitle: facultyTitlePass,
      },
    });
  }, [router, moduleId, moduleTitleDecoded, facultyId, facultyTitlePass]);

  const goKuppiLink = useCallback(() => {
    router.push({
      pathname: '/tutor-module-kuppi-link',
      params: {
        moduleId,
        moduleTitle: encodeURIComponent(moduleTitleDecoded),
        facultyId,
        facultyTitle: facultyTitlePass,
      },
    });
  }, [router, moduleId, moduleTitleDecoded, facultyId, facultyTitlePass]);

  if (!moduleId) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={SCREEN_BG} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} style={styles.backRow} hitSlop={12}>
            <View style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="#1E293B" />
            </View>
          </Pressable>

          <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.hero}>
            <Text style={styles.heroLabel}>Create session scheduling</Text>
            <Text style={styles.heroModule} numberOfLines={2}>
              {moduleTitleDecoded}
            </Text>
            <Text style={styles.heroHint}>Choose what you want to set up for this module.</Text>
          </LinearGradient>

          <Pressable
            onPress={goPoll}
            style={({ pressed }) => [styles.choiceCard, pressed && styles.choicePressed]}>
            <View style={[styles.choiceIcon, { backgroundColor: 'rgba(125,211,252,0.35)' }]}>
              <Ionicons name="bar-chart-outline" size={26} color={NAVY} />
            </View>
            <View style={styles.choiceText}>
              <Text style={styles.choiceTitle}>Create poll</Text>
              <Text style={styles.choiceSub}>
                Add voting time options and publish so students can pick a slot.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
          </Pressable>

          <Pressable
            onPress={goKuppiLink}
            style={({ pressed }) => [styles.choiceCard, pressed && styles.choicePressed]}>
            <View style={[styles.choiceIcon, { backgroundColor: 'rgba(250,204,21,0.4)' }]}>
              <Ionicons name="videocam-outline" size={26} color={NAVY} />
            </View>
            <View style={styles.choiceText}>
              <Text style={styles.choiceTitle}>Kuppi meeting link</Text>
              <Text style={styles.choiceSub}>
                Save the Zoom or Teams URL for this module. It is used when you confirm a session after voting.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#94A3B8" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCREEN_BG },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },
  backRow: { marginBottom: 12, alignSelf: 'flex-start' },
  backBtn: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  hero: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
    marginBottom: 6,
  },
  heroModule: {
    fontSize: 22,
    fontFamily: 'Roboto_700Bold',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  heroHint: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
  },
  choiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  choicePressed: { opacity: 0.92 },
  choiceIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceText: { flex: 1, minWidth: 0 },
  choiceTitle: {
    fontSize: 17,
    fontFamily: 'Roboto_700Bold',
    color: NAVY,
    marginBottom: 4,
  },
  choiceSub: {
    fontSize: 13,
    fontFamily: 'Roboto_400Regular',
    color: '#64748B',
    lineHeight: 19,
  },
});

