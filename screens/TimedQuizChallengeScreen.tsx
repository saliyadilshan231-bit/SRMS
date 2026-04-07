// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getQuizQuestionsForModule, getTimedQuizModule } from '@/constants/timedQuizContent';
import { STORAGE_KEYS } from '@/constants/storageKeys';

const SECONDS = 18;
const DARK = '#041E42';
const LIGHT_BLUE = '#38BDF8';
const SKY = '#7DD3FC';
const WHITE = '#FFFFFF';
const YELLOW = '#FACC15';
const YELLOW_DEEP = '#EAB308';
const GOOD = '#34D399';
const BLACK = '#0F172A';
const GLASS_BASE = '#F5F8FF';
const MUTED_TEXT = '#475569';

/** Soft white “liquid glass” stack — light blur + airy gradients */
function QuizLiquidGlassBackground() {
  const blurIntensity = Platform.OS === 'android' ? 40 : 56;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={['#FFFFFF', '#F0F7FF', '#E8F2FC', '#FAFCFF', '#F5F8FF']}
        locations={[0, 0.28, 0.52, 0.78, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.92)', 'rgba(224,242,254,0.35)', 'rgba(255,255,255,0.75)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.55)', 'transparent', 'rgba(147,197,253,0.22)']}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <BlurView
        intensity={blurIntensity}
        tint="light"
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.48)', 'rgba(255,255,255,0.08)', 'rgba(248,250,252,0.38)']}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function TimedQuizChallengeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const moduleId =
    typeof params.moduleId === 'string' ? params.moduleId : params.moduleId?.[0] || '3';

  const questions = useMemo(() => getQuizQuestionsForModule(moduleId), [moduleId]);
  const moduleMeta = useMemo(() => getTimedQuizModule(moduleId), [moduleId]);
  const moduleTitle = moduleMeta?.title || 'Timed quiz';

  const [phase, setPhase] = useState('playing');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS);
  const [lastCorrect, setLastCorrect] = useState(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);

  const total = questions.length;
  const current = questions[index];

  indexRef.current = index;
  scoreRef.current = score;
  streakRef.current = streak;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimerBar = useCallback(() => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: SECONDS * 1000,
      useNativeDriver: false,
    }).start();
  }, [progressAnim]);

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

  useEffect(() => {
    setPhase('playing');
    setIndex(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setTimeLeft(SECONDS);
    setLastCorrect(null);
    clearTimer();
    progressAnim.setValue(1);
  }, [moduleId, clearTimer, progressAnim]);

  const goNext = useCallback(
    (pointsAdded, wasCorrect) => {
      clearTimer();
      const i = indexRef.current;
      const nextIndex = i + 1;
      const newScore = scoreRef.current + pointsAdded;
      const newStreak = wasCorrect ? streakRef.current + 1 : 0;
      setScore(newScore);
      if (wasCorrect) setCorrectCount((c) => c + 1);
      setStreak(newStreak);
      setLastCorrect(wasCorrect);

      if (nextIndex >= total) {
        setPhase('done');
        return;
      }
      setIndex(nextIndex);
      setTimeLeft(SECONDS);
      resetTimerBar();
    },
    [total, clearTimer, resetTimerBar],
  );

  const onTimeout = useCallback(() => {
    goNext(0, false);
  }, [goNext]);

  useEffect(() => {
    if (lastCorrect === null) return undefined;
    const id = setTimeout(() => setLastCorrect(null), 800);
    return () => clearTimeout(id);
  }, [lastCorrect]);

  useEffect(() => {
    if (phase !== 'playing' || total === 0) return;
    resetTimerBar();
    setTimeLeft(SECONDS);
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearTimer();
          requestAnimationFrame(() => onTimeout());
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  }, [index, phase, total, resetTimerBar, clearTimer, onTimeout]);

  const onPick = useCallback(
    (optionIndex) => {
      if (phase !== 'playing' || !current) return;
      clearTimer();
      const ok = optionIndex === current.correct;
      const bonus = Math.max(0, Math.floor(timeLeft / 3));
      const points = ok ? 100 + bonus : 0;
      goNext(points, ok);
    },
    [phase, current, timeLeft, goNext, clearTimer],
  );

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (total === 0 || !current) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <QuizLiquidGlassBackground />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <Text style={styles.fallbackText}>No questions for this module.</Text>
          <Pressable onPress={() => router.back()} style={styles.fallbackBtn}>
            <Text style={styles.fallbackBtnText}>Go back</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  if (phase === 'done') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <QuizLiquidGlassBackground />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.resultWrap}>
            <LinearGradient colors={[YELLOW, YELLOW_DEEP]} style={styles.resultBadge}>
              <Ionicons name="trophy" size={48} color={DARK} />
            </LinearGradient>
            <Text style={styles.resultTitle}>RUN COMPLETE</Text>
            <Text style={styles.resultModule} numberOfLines={2}>
              {moduleTitle}
            </Text>
            <Text style={styles.resultMarksLine} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
              {correctCount} out of {total}
            </Text>
            <Text style={styles.resultScoreLabel}>marks</Text>
            <Pressable
              onPress={() => router.replace('/timed-quiz')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}>
              <LinearGradient
                colors={[LIGHT_BLUE, SKY]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtnGrad}>
                <Text style={styles.primaryBtnText}>Choose another module</Text>
              </LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.replace('/dashboard')} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Back to dashboard</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <QuizLiquidGlassBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.hud}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.hudIcon}>
            <Ionicons name="close" size={24} color={BLACK} />
          </Pressable>
          <View style={styles.hudCenter}>
            <Text style={styles.hudLabel}>TIMED MODULE QUIZ</Text>
            <Text style={styles.hudModule} numberOfLines={1}>
              {moduleTitle}
            </Text>
          </View>
          <View style={styles.hudScoreBox}>
            <Text style={styles.hudScoreVal}>{score}</Text>
            <Text style={styles.hudScoreTag}>pts</Text>
          </View>
        </View>

        <View style={styles.timerTrack}>
          <Animated.View style={[styles.timerFill, { width: barWidth, backgroundColor: YELLOW }]} />
        </View>
        <View style={styles.timerRow}>
          <Ionicons name="timer-outline" size={18} color={YELLOW} />
          <Text style={styles.timerText}>{timeLeft}s</Text>
          <Text style={styles.qProgress}>
            Q{index + 1}/{total}
          </Text>
        </View>

        {lastCorrect !== null && (
          <View style={[styles.toast, lastCorrect ? styles.toastGood : styles.toastBad]}>
            <Ionicons name={lastCorrect ? 'checkmark-circle' : 'close-circle'} size={18} color="#fff" />
            <Text style={styles.toastText}>{lastCorrect ? 'Nice! +' : 'Keep going!'}</Text>
          </View>
        )}

        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.questionBox}>
            <Text style={styles.question}>{current.q}</Text>
          </View>
          {current.options.map((opt, i) => (
            <Pressable
              key={i}
              onPress={() => onPick(i)}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
              <View style={styles.optionKey}>
                <Text style={styles.optionKeyText}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={styles.optionText}>{opt}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.footerBar}>
          <View style={styles.streakPill}>
            <Ionicons name="flash" size={16} color={YELLOW} />
            <Text style={styles.streakText}>Streak ×{streak}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GLASS_BASE },
  safe: { flex: 1, paddingHorizontal: 18 },
  fallbackText: {
    color: MUTED_TEXT,
    fontFamily: 'Roboto_500Medium',
    textAlign: 'center',
    marginTop: 40,
  },
  fallbackBtn: {
    marginTop: 20,
    alignSelf: 'center',
    padding: 14,
    backgroundColor: YELLOW,
    borderRadius: 12,
  },
  fallbackBtnText: {
    fontFamily: 'Roboto_700Bold',
    color: DARK,
  },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hudIcon: { padding: 8 },
  hudCenter: { flex: 1, alignItems: 'center' },
  hudLabel: {
    fontSize: 10,
    fontFamily: 'Roboto_700Bold',
    color: YELLOW,
    letterSpacing: 1.6,
  },
  hudModule: {
    fontSize: 15,
    fontFamily: 'Roboto_700Bold',
    color: BLACK,
    marginTop: 2,
    maxWidth: '90%',
  },
  hudScoreBox: {
    alignItems: 'flex-end',
    minWidth: 56,
  },
  hudScoreVal: {
    fontSize: 22,
    fontFamily: 'Roboto_900Black',
    color: LIGHT_BLUE,
  },
  hudScoreTag: {
    fontSize: 10,
    fontFamily: 'Roboto_500Medium',
    color: MUTED_TEXT,
  },
  timerTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.35)',
  },
  timerFill: {
    height: '100%',
    borderRadius: 4,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  timerText: {
    fontSize: 18,
    fontFamily: 'Roboto_900Black',
    color: YELLOW,
  },
  qProgress: {
    marginLeft: 'auto',
    fontSize: 13,
    fontFamily: 'Roboto_600SemiBold',
    color: MUTED_TEXT,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 10,
  },
  toastGood: { backgroundColor: 'rgba(52,211,153,0.4)' },
  toastBad: { backgroundColor: 'rgba(248,113,113,0.35)' },
  toastText: {
    color: '#fff',
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 13,
  },
  cardScroll: {
    flex: 1,
    marginTop: 4,
  },
  cardScrollContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  questionBox: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 5,
  },
  question: {
    fontSize: 19,
    fontFamily: 'Roboto_900Black',
    color: BLACK,
    lineHeight: 27,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    marginBottom: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.78)',
    overflow: 'hidden',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  optionPressed: {
    borderColor: YELLOW_DEEP,
    borderWidth: 2,
    opacity: 0.96,
  },
  optionKey: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: YELLOW,
  },
  optionKeyText: {
    fontFamily: 'Roboto_900Black',
    color: YELLOW,
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Roboto_500Medium',
    color: BLACK,
    lineHeight: 21,
  },
  footerBar: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(250,204,21,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.45)',
  },
  streakText: {
    color: YELLOW,
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 13,
  },
  resultWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  resultBadge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 12,
    fontFamily: 'Roboto_700Bold',
    color: MUTED_TEXT,
    letterSpacing: 2,
  },
  resultModule: {
    fontSize: 20,
    fontFamily: 'Roboto_700Bold',
    color: BLACK,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  resultMarksLine: {
    fontSize: 40,
    fontFamily: 'Roboto_900Black',
    color: DARK,
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  resultScoreLabel: {
    fontSize: 14,
    color: MUTED_TEXT,
    fontFamily: 'Roboto_500Medium',
    marginTop: -4,
    marginBottom: 24,
  },
  primaryBtn: {
    borderRadius: 14,
    width: '100%',
    maxWidth: 320,
    overflow: 'hidden',
  },
  primaryBtnGrad: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.9 },
  primaryBtnText: {
    color: DARK,
    fontFamily: 'Roboto_700Bold',
    fontSize: 16,
  },
  secondaryBtn: {
    marginTop: 14,
    padding: 12,
  },
  secondaryBtnText: {
    color: DARK,
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 15,
  },
});

