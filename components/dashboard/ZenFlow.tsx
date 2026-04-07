import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.25;

export default function ZenFlow() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
  const [phase, setPhase] = useState<'Ready' | 'Inhale...' | 'Exhale...' | 'Completed'>('Ready');

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  const startSession = () => {
    setIsActive(true);
    setTimeLeft(120);
    setPhase('Inhale...');

    // Start Breathing Animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, // infinite
      false
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  };

  const stopSession = () => {
    cancelAnimation(scale);
    cancelAnimation(opacity);
    scale.value = withTiming(1, { duration: 1000 });
    opacity.value = withTiming(0.4, { duration: 1000 });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;

          // Every 4 seconds, toggle phase
          // 120 -> 116 (Inhale: 120, 119, 118, 117)
          // 116 -> 112 (Exhale: 116, 115, 114, 113)
          // Mathematical mapping: Total elapsed = 120 - newTime
          // Cycle = Floor(Elapsed / 4)
          // If Cycle is even, Inhale. If odd, Exhale.
          const elapsed = 120 - newTime;
          const cycle = Math.floor(elapsed / 4);
          setPhase(cycle % 2 === 0 ? 'Inhale...' : 'Exhale...');

          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      setPhase('Completed');
      stopSession();
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🧘 ZenFlow: Instant Calm</Text>
      <Text style={styles.sub}>Breathe with the visualizer to lower your heart rate and recenter.</Text>

      <View style={styles.visualizerContainer}>
        <Text style={styles.phaseText}>{phase}</Text>

        <View style={styles.circleWrapper}>
          <Animated.View style={[styles.circle, animatedStyle]}>
            <LinearGradient
              colors={['#EBF8FF', '#0A0A5C']}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </Animated.View>
        </View>

        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      {phase === 'Completed' && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✨ Wellbeing Score Updated +5. Great job!</Text>
        </View>
      )}

      {!isActive ? (
        <TouchableOpacity style={styles.btn} onPress={startSession} activeOpacity={0.8}>
          <Text style={styles.btnText}>
            {phase === 'Completed' ? 'Start Another Session' : 'Start Session (2 min)'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.btnStop} onPress={() => { setIsActive(false); setPhase('Ready'); stopSession(); setTimeLeft(120); }} activeOpacity={0.8}>
          <Text style={styles.btnStopText}>End Session</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.3 },
  sub: { fontSize: 13, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  visualizerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#DBEAFE', // navyLight
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  phaseText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A0A5C',
    marginBottom: 40,
    letterSpacing: 1,
  },
  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  gradient: {
    flex: 1,
    borderRadius: CIRCLE_SIZE / 2,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '300',
    color: '#475569',
    fontVariant: ['tabular-nums'],
    marginTop: 50,
  },
  successBanner: {
    backgroundColor: '#F0FFF4',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#86EFAC',
    alignItems: 'center',
  },
  successText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: '#0A0A5C', // navy
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  btnStop: {
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FC8181',
  },
  btnStopText: { color: '#C53030', fontSize: 15, fontWeight: '700' },
});
