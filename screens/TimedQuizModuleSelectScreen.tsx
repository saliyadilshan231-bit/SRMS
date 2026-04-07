// @ts-nocheck
import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TIMED_QUIZ_MODULES } from '@/constants/timedQuizContent';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { KUPPI_LIBRARY_BANNERS } from '@/constants/kuppiPalette';

const DARK = '#041E42';
const DARK_MID = '#0A2463';
const SKY = '#7DD3FC';
const WHITE = '#FFFFFF';
const YELLOW = '#FACC15';
const YELLOW_DEEP = '#EAB308';

/** Light blue panel only — quiz-themed icons (study · time · score). */
function QuizHeroIcons() {
  return (
    <View style={heroStyles.panel} pointerEvents="none">
      <View style={heroStyles.iconBubble}>
        <Ionicons name="school-outline" size={26} color={DARK} />
      </View>
      <View style={[heroStyles.iconBubble, heroStyles.iconBubbleCenter]}>
        <Ionicons name="timer-outline" size={34} color={DARK} />
      </View>
      <View style={heroStyles.iconBubble}>
        <Ionicons name="trophy-outline" size={26} color={DARK} />
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#BAE6FD',
    borderWidth: 1.5,
    borderColor: 'rgba(56,189,248,0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(4,30,66,0.12)',
  },
  iconBubbleCenter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 2,
    borderColor: 'rgba(250,204,21,0.55)',
  },
});

export default function TimedQuizModuleSelectScreen() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const role = await AsyncStorage.getItem(STORAGE_KEYS.loginRole);
      if (!cancelled && role === 'peerTutor') {
        router.replace('/dashboard');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const startQuiz = useCallback(
    (m) => {
      router.push({
        pathname: '/timed-quiz-challenge',
        params: { moduleId: m.id },
      });
    },
    [router],
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[DARK, DARK_MID, '#082f5e']} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}
            hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={WHITE} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <QuizHeroIcons />

          <View style={styles.titleBlock}>
            <LinearGradient
              colors={[YELLOW, YELLOW_DEEP]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.quizTimeBadge}>
              <Text style={styles.quizTimeText}>QUIZ TIME</Text>
            </LinearGradient>
            <Text style={styles.headline}>Pick a module</Text>
            <Text style={styles.sub}>
              Each module has its own timed challenge — questions match what you study.
            </Text>
          </View>

          {TIMED_QUIZ_MODULES.map((m) => {
            const banner = KUPPI_LIBRARY_BANNERS[m.bannerIndex] || KUPPI_LIBRARY_BANNERS[0];
            return (
              <Pressable
                key={m.id}
                onPress={() => startQuiz(m)}
                style={({ pressed }) => [styles.moduleCard, pressed && styles.moduleCardPressed]}>
                <LinearGradient colors={banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.moduleStripe} />
                <View style={styles.moduleBody}>
                  <View style={styles.moduleIcon}>
                    <Ionicons name="layers-outline" size={22} color={DARK} />
                  </View>
                  <View style={styles.moduleText}>
                    <Text style={styles.moduleTitle} numberOfLines={2}>
                      {m.title}
                    </Text>
                    <Text style={styles.moduleSub} numberOfLines={2}>
                      {m.subtitle}
                    </Text>
                  </View>
                  <View style={styles.startPill}>
                    <Ionicons name="play" size={16} color={DARK} />
                    <Text style={styles.startPillText}>Start</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK },
  safe: { flex: 1 },
  topRow: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  backPressed: { opacity: 0.85 },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 22,
  },
  quizTimeBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    marginBottom: 12,
  },
  quizTimeText: {
    fontSize: 18,
    fontFamily: 'Roboto_900Black',
    color: DARK,
    letterSpacing: 2,
  },
  headline: {
    fontSize: 26,
    fontFamily: 'Roboto_900Black',
    color: WHITE,
    textAlign: 'center',
  },
  sub: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Roboto_400Regular',
    color: SKY,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  moduleCard: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  moduleCardPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.99 }],
  },
  moduleStripe: {
    height: 5,
    width: '100%',
  },
  moduleBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: 'rgba(56,189,248,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.45)',
  },
  moduleText: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  moduleTitle: {
    fontSize: 16,
    fontFamily: 'Roboto_700Bold',
    color: DARK,
  },
  moduleSub: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
    color: '#475569',
  },
  startPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: YELLOW,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: YELLOW_DEEP,
  },
  startPillText: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 13,
    color: DARK,
  },
});

