import { IconSymbol } from '@/components/ui/icon-symbol';
import { TaskItem, useTaskManager } from '@/context/task-manager';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const getLocalDate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

const RING_R = 125;
const RING_SIZE = 310;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;
const TICK_COUNT = 60;

// ── Decorative Background ───────────────────────────────────────────────────
function DecorativeBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[s.decorativeCircle, { top: -100, right: -150, width: 450, height: 450, borderRadius: 225 }]} />
      <View style={[s.decorativeCircle, { bottom: -100, left: -150, width: 400, height: 400, borderRadius: 200 }]} />
    </View>
  );
}

// ── Completion Modal ────────────────────────────────────────────────────────
function CompletionModal({ visible, onDismiss, onReturn }: { visible: boolean; onDismiss: () => void; onReturn: () => void }) {
  if (!visible) return null;
  return (
    <View style={s.modalOverlay}>
      <View style={s.modalBox}>
        <View style={s.modalHeader}>
          <View style={s.modalIconWrap}>
            <IconSymbol size={20} name="clock.fill" color="#0B173B" />
          </View>
          <Text style={s.modalHeaderTitle}>Clock</Text>
          <TouchableOpacity onPress={onDismiss} style={s.modalHeaderClose}>
            <IconSymbol size={18} name="xmark" color="#718096" />
          </TouchableOpacity>
        </View>

        <View style={s.modalContent}>
          <Text style={s.modalGreeting}>Great job!</Text>
          <Text style={s.modalSub}>You have completed your focus session. Want to start another one?</Text>
        </View>

        <View style={s.modalFooter}>
          <TouchableOpacity
            style={s.modalBtnPrimary}
            onPress={() => { onDismiss(); onReturn(); }}
          >
            <Text style={s.modalBtnTextPrimary}>Start Another Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.modalBtnSecondary} onPress={onReturn}>
            <Text style={s.modalBtnTextSecondary}>Go to Prep</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Animated SVG ring ────────────────────────────────────────────────────────
function ProgressRing({ progress, isBreak }: { progress: number; isBreak: boolean }) {
  const animVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animVal, {
      toValue: progress,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const ringColor = isBreak ? '#48BB78' : '#FFFFFF';
  const center = RING_SIZE / 2;

  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = (i / TICK_COUNT) * 2 * Math.PI - Math.PI / 2;
    const innerR = i % 5 === 0 ? RING_R + 18 : RING_R + 12;
    const outerR = RING_R + 25;
    return {
      x1: center + innerR * Math.cos(angle),
      y1: center + innerR * Math.sin(angle),
      x2: center + outerR * Math.cos(angle),
      y2: center + outerR * Math.sin(angle),
      isMajor: i % 5 === 0,
    };
  });

  return (
    <View style={{ width: RING_SIZE, height: RING_SIZE }}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {ticks.map((t, i) => (
          <Line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke={t.isMajor ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}
            strokeWidth={t.isMajor ? 3 : 2}
            strokeLinecap="round"
          />
        ))}
        <Circle
          cx={center} cy={center} r={RING_R}
          stroke="rgba(255,255,255,0.08)" strokeWidth={10} fill="none"
        />
        <AnimatedCircle
          cx={center} cy={center} r={RING_R}
          stroke={ringColor} strokeWidth={10} fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle as any);

// ── Emoji-based Growing Plant ──────────────────────────────────────────────
function GrowingPlant({ progress, isRunning }: { progress: number; isRunning: boolean }) {
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(swayAnim, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(swayAnim, { toValue: -1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    } else {
      Animated.spring(swayAnim, { toValue: 0, useNativeDriver: true }).start();
    }
  }, [isRunning]);

  const rotate = swayAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-5deg', '5deg'] });
  // Scale increases as progress grows
  const scale = 1 + (progress / 100) * 0.8;

  const getEmoji = () => {
    if (progress < 33) return '🌱';
    if (progress < 66) return '🌿';
    return '🌳';
  };

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale }] }}>
      <Text style={{ fontSize: 75 }}>{getEmoji()}</Text>
    </Animated.View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FocusScreen() {
  const {
    tasks,
    focusSession,
    enterFocus,
    toggleFocus,
    resetFocus,
    exitFocus,
    dismissFocusModal,
    adjustFocusTime,
    adjustBreakTime,
    setFocusTask,
    setSkipBreak,
    addQuickFocusTask,
    isSyncing,
    setMinimized
  } = useTaskManager();

  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');

  const {
    uiMode,
    isPaused,
    phase,
    secondsLeft,
    focusMin,
    breakMin,
    skipBreak,
    selectedTaskId,
    plantProgress,
    completedSessions,
    showCompletionModal,
    isMinimized
  } = focusSession;

  // ── Session History Processing ───────────────────────
  const { todaySessions, historyGroups, totalFiveDayMins, totalFiveDaySessions } = useMemo(() => {
    const now = new Date();
    const todayStr = getLocalDate(now);

    // Group all sessions by YYYY-MM-DD
    const groups: Record<string, typeof completedSessions> = {};
    completedSessions.forEach(s => {
      // Use the 'date' field if it exists, otherwise extract from 'time' or $createdAt
      const d = s.date.includes('T') ? getLocalDate(new Date(s.date)) : s.date;
      if (!groups[d]) groups[d] = [];
      groups[d].push(s);
    });

    // Extract Today
    const today = groups[todayStr] || [];

    // Extract last 4 days history (excluding today)
    const history: { dateLabel: string; sessions: typeof completedSessions }[] = [];
    for (let i = 1; i <= 4; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      if (groups[dStr]) {
        let label = "";
        if (i === 1) label = "Yesterday";
        else {
          label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).replace(',', ' ·');
        }
        history.push({ dateLabel: label, sessions: groups[dStr] });
      }
    }

    // Calc totals for the 5-day window
    let totalMins = 0;
    let totalSess = 0;
    [today, ...history.map(h => h.sessions)].forEach(list => {
      list.forEach(s => {
        totalMins += s.minutes;
        totalSess += 1;
      });
    });

    return { todaySessions: today, historyGroups: history, totalFiveDayMins: totalMins, totalFiveDaySessions: totalSess };
  }, [completedSessions]);

  const selectedTask = useMemo(
    () => tasks.find((t: TaskItem) => t.id === selectedTaskId) ?? tasks[0],
    [tasks, selectedTaskId]
  );

  const isRunning = !isPaused;
  const focusSecs = focusMin * 60;
  const breakSecs = breakMin * 60;

  // Session progress: 0 to 100
  const liveProgress = phase === 'running'
    ? ((focusSecs - secondsLeft) / focusSecs) * 100
    : phase === 'break'
      ? ((breakSecs - secondsLeft) / breakSecs) * 100
      : 0;

  const displayProgress = liveProgress;

  async function handleQuickAdd() {
    if (!quickTitle.trim()) return;
    try {
      await addQuickFocusTask(quickTitle.trim());
      setQuickTitle('');
      setShowQuickAdd(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to add quick task.');
    }
  }

  function handleEndSession() {
    Alert.alert(
      'End Session?',
      'Are you sure you want to stop this focus session? progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Session', style: 'destructive', onPress: exitFocus }
      ]
    );
  }

  if (isSyncing && uiMode === 'prep') {
    return (
      <SafeAreaView style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ marginTop: 12, color: '#fff', fontWeight: '600' }}>Syncing focus data...</Text>
      </SafeAreaView>
    );
  }

  // ── PREP / MINIMIZED UI ──────────────────────────────
  if (uiMode === 'prep' || isMinimized) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" />
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={s.headerSafe}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.headerIconBtn} onPress={() => router.push('/(tabs)/task-insights')}>
              <IconSymbol size={18} name="chevron.left" color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Focus Session</Text>
            <View style={{ width: 44 }} />
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={s.prepScroll} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <Text style={s.cardTitle}>Task to Study Session</Text>
              <TouchableOpacity style={s.addTaskBtn} onPress={() => { setShowQuickAdd((v) => !v); setQuickTitle(''); }}>
                <IconSymbol size={13} name={showQuickAdd ? 'xmark' : 'plus'} color="#0B173B" />
                <Text style={s.addTaskBtnText}>{showQuickAdd ? 'Cancel' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
            {showQuickAdd && (
              <View style={s.quickRow}>
                <TextInput style={s.quickInput} placeholder="Task title…" placeholderTextColor="#A0AEC0"
                  value={quickTitle} onChangeText={setQuickTitle} onSubmitEditing={handleQuickAdd}
                  returnKeyType="done" autoFocus />
                <TouchableOpacity style={s.quickConfirm} onPress={handleQuickAdd}>
                  <IconSymbol size={16} name="checkmark" color="#fff" />
                </TouchableOpacity>
              </View>
            )}
            <View style={s.chipRow}>
              {tasks.map((t: TaskItem) => {
                const active = t.id === selectedTaskId;
                return (
                  <TouchableOpacity key={t.id} style={[s.chip, active && s.chipActive]} onPress={() => setFocusTask(t.id)}>
                    <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>{t.title}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={s.readyCard}>
            <Text style={s.readyTitle}>Get ready to focus</Text>
            <Text style={s.readySub}>We'll turn off notifications and app alerts during each session. For longer sessions, we'll add a short break.</Text>

            <View style={s.pickerBox}>
              <View style={s.pickerLeft}>
                <Text style={s.pickerNum}>{focusMin}</Text>
                <Text style={s.pickerUnit}>mins</Text>
              </View>
              <View style={s.pickerArrows}>
                <TouchableOpacity style={s.arrowBtn} onPress={() => adjustFocusTime(5)}>
                  <IconSymbol size={18} name="plus" color="#0B173B" />
                </TouchableOpacity>
                <View style={s.arrowDivider} />
                <TouchableOpacity style={s.arrowBtn} onPress={() => adjustFocusTime(-5)}>
                  <IconSymbol size={18} name="minus" color="#0B173B" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={s.breakLabel}>{skipBreak ? "You'll have no breaks" : `You'll have a ${breakMin}-min break`}</Text>

            <View style={s.breakRow}>
              <TouchableOpacity style={s.skipRow} onPress={() => setSkipBreak(!skipBreak)}>
                <View style={[s.checkbox, skipBreak && s.checkboxActive]}>
                  {skipBreak && <IconSymbol size={12} name="checkmark" color="#fff" />}
                </View>
                <Text style={s.skipText}>Skip breaks</Text>
              </TouchableOpacity>
              {!skipBreak && (
                <View style={s.breakPicker}>
                  <TouchableOpacity onPress={() => adjustBreakTime(-1)} style={s.breakArrow}><IconSymbol size={14} name="minus" color="#0B173B" /></TouchableOpacity>
                  <Text style={s.breakNum}>{breakMin}m</Text>
                  <TouchableOpacity onPress={() => adjustBreakTime(1)} style={s.breakArrow}><IconSymbol size={14} name="plus" color="#0B173B" /></TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity style={s.startBtn} onPress={enterFocus}>
              <IconSymbol size={20} name="play.fill" color="#fff" />
              <Text style={s.startBtnText}>Start focus session</Text>
            </TouchableOpacity>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Today's Activity</Text>
            {todaySessions.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🌱</Text>
                <Text style={s.emptyText}>No sessions completed yet today.</Text>
                <Text style={s.emptySub}>Start a session and your plant will grow!</Text>
              </View>
            ) : (
              <>
                <View style={s.statsRow}>
                  <StatChip num={todaySessions.length} label="Sessions" />
                  <StatChip num={todaySessions.reduce((a, c) => a + c.minutes, 0)} label="Minutes" />
                  <StatChip num={plantProgress} label="Total Trees grown" />
                </View>
                {todaySessions.map((sess, i) => (
                  <View key={i} style={s.logRow}>
                    <View style={s.logDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.logTitle} numberOfLines={1}>{sess.taskTitle}</Text>
                      <Text style={s.logMeta}>{sess.minutes} min focus · {sess.breakMin} min break · {sess.time}</Text>
                    </View>
                    <Text style={{ fontSize: 18 }}>✅</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Activity History Session */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Activity History</Text>
            {historyGroups.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>📜</Text>
                <Text style={s.emptyText}>No recent history found.</Text>
                <Text style={s.emptySub}>Your focus sessions from the last 5 days will appear here.</Text>
              </View>
            ) : (
              <>
                <Text style={s.historySub}>Last 5 days summary: {totalFiveDaySessions} sessions · {totalFiveDayMins} mins</Text>
                {historyGroups.map((group, gIdx) => (
                  <View key={gIdx} style={s.historyGroup}>
                    <Text style={s.historyDateHeader}>{group.dateLabel}</Text>
                    {group.sessions.map((sess, sIdx) => (
                      <View key={sIdx} style={[s.logRow, { borderTopWidth: sIdx === 0 ? 0 : 1, paddingTop: sIdx === 0 ? 0 : 12 }]}>
                        <View style={[s.logDot, { backgroundColor: '#CBD5E0' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.logTitle} numberOfLines={1}>{sess.taskTitle}</Text>
                          <Text style={s.logMeta}>{sess.minutes} min · {sess.time}</Text>
                        </View>
                        <IconSymbol size={14} name="checkmark" color="#48BB78" />
                      </View>
                    ))}
                  </View>
                ))}
              </>
            )}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ── ACTIVE SESSION UI ─────────────────────────────────
  const isBreak = phase === 'break';
  return (
    <View style={[s.container, { backgroundColor: '#0B1124' }, isBreak && s.containerBreak]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      <DecorativeBackground />

      <SafeAreaView style={s.headerSafe}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.headerIconBtn} onPress={() => setMinimized(true)}>
            <IconSymbol size={22} name="chevron.down" color="#fff" />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: 'rgba(255,255,255,0.9)' }]}>{isBreak ? '☕ Break' : 'Focus'}</Text>
          <View style={{ width: 44 }} />
        </View>
      </SafeAreaView>

      <View style={s.activeCenter}>
        <Text style={s.activeTaskName} numberOfLines={1}>{selectedTask?.title || 'Session'}</Text>

        <View style={s.ringWrap}>
          <ProgressRing progress={liveProgress} isBreak={isBreak} />
          <View style={s.ringInner}>
            <GrowingPlant progress={displayProgress} isRunning={isRunning} />
            <Text style={s.timerText}>{formatTime(secondsLeft)}</Text>
          </View>
        </View>

        <Text style={s.phaseLabel}>{isBreak ? `Break · ${breakMin} min` : `Session · ${focusMin} min`}</Text>

        <View style={s.controls}>
          <TouchableOpacity style={s.toggleBtn} onPress={toggleFocus}>
            <IconSymbol size={28} name={isPaused ? "play.fill" : "pause.fill"} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.resetBtn} onPress={resetFocus}>
            <IconSymbol size={22} name="arrow.counterclockwise" color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.resetBtn} onPress={handleEndSession}>
            <IconSymbol size={20} name="stop.fill" color="#F56565" />
          </TouchableOpacity>
        </View>

        <View style={s.plantHint}>
          <Text style={s.plantHintText}>Growth: {Math.round(displayProgress)}%</Text>
        </View>
      </View>

      <CompletionModal
        visible={showCompletionModal}
        onDismiss={dismissFocusModal}
        onReturn={() => { dismissFocusModal(); exitFocus(); }}
      />
    </View>
  );
}

function StatChip({ num, label }: { num: number | string; label: string }) {
  return (
    <View style={s.statChip}>
      <Text style={s.statNum}>{num}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B173B' },
  containerBreak: { backgroundColor: '#0D2118' },
  decorativeCircle: { position: 'absolute', backgroundColor: '#1A2342', opacity: 0.4 },
  headerSafe: { backgroundColor: 'transparent' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerIconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  prepScroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0B173B' },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  addTaskBtnText: { fontSize: 13, fontWeight: '700', color: '#0B173B' },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickInput: { flex: 1, backgroundColor: '#EDF2F7', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  quickConfirm: { width: 46, height: 46, borderRadius: 14, backgroundColor: '#0B173B', justifyContent: 'center', alignItems: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0B173B', borderColor: '#0B173B' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  chipTextActive: { color: '#fff' },
  readyCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, marginBottom: 16 },
  readyTitle: { fontSize: 22, fontWeight: '800', color: '#0B173B', textAlign: 'center', marginBottom: 8 },
  readySub: { fontSize: 14, color: '#718096', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  pickerBox: { flexDirection: 'row', alignSelf: 'center', borderRadius: 20, borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', marginBottom: 20 },
  pickerLeft: { width: 120, paddingVertical: 18, alignItems: 'center', justifyContent: 'center' },
  pickerNum: { fontSize: 52, fontWeight: '800', color: '#0B173B', lineHeight: 58 },
  pickerUnit: { fontSize: 14, color: '#718096', fontWeight: '600' },
  pickerArrows: { width: 56, borderLeftWidth: 1.5, borderLeftColor: '#E2E8F0' },
  arrowBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  arrowDivider: { height: 1.5, backgroundColor: '#E2E8F0' },
  breakLabel: { fontSize: 15, fontWeight: '700', color: '#4A5568', textAlign: 'center', marginBottom: 14 },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#CBD5E0', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: '#0B173B', borderColor: '#0B173B' },
  skipText: { fontSize: 15, color: '#4A5568', fontWeight: '600' },
  breakPicker: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EDF2F7', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  breakArrow: { padding: 4 },
  breakNum: { fontSize: 16, fontWeight: '800', color: '#0B173B', minWidth: 32, textAlign: 'center' },
  startBtn: { backgroundColor: '#0B173B', borderRadius: 18, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  startBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 18 },
  emptyEmoji: { fontSize: 38, marginBottom: 8 },
  emptyText: { fontSize: 15, fontWeight: '700', color: '#4A5568', marginBottom: 4 },
  emptySub: { fontSize: 13, color: '#A0AEC0', textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statChip: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#EDF2F7' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#0B173B' },
  statLabel: { fontSize: 11, color: '#718096', fontWeight: '600', marginTop: 2 },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F4FF', gap: 12 },
  logDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#48BB78' },
  logTitle: { fontSize: 14, fontWeight: '700', color: '#2D3748' },
  logMeta: { fontSize: 12, color: '#A0AEC0', marginTop: 2 },
  historySub: { fontSize: 12, color: '#718096', fontWeight: '600', marginBottom: 15, marginTop: 4 },
  historyGroup: { marginTop: 15 },
  historyDateHeader: { fontSize: 13, fontWeight: '800', color: '#4A5568', backgroundColor: '#F7FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  activeCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  activeTaskName: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
  ringWrap: { justifyContent: 'center', alignItems: 'center', marginBottom: 16, width: RING_SIZE, height: RING_SIZE },
  ringInner: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timerText: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1, marginTop: 4 },
  phaseLabel: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 32 },
  controls: { flexDirection: 'row', gap: 20, alignItems: 'center', marginBottom: 28 },
  toggleBtn: { width: 75, height: 75, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  resetBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' },
  plantHint: { backgroundColor: '#1E293B', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, opacity: 0.9 },
  plantHintText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '700' },
  // Modal Styles
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 },
  modalBox: { backgroundColor: '#F7FAFC', borderRadius: 12, width: '100%', maxWidth: 450, paddingHorizontal: 0, paddingVertical: 0, overflow: 'hidden', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' },
  modalIconWrap: { width: 20, height: 20, marginRight: 10 },
  modalHeaderTitle: { fontSize: 13, color: '#4A5568', flex: 1 },
  modalHeaderClose: { padding: 4 },
  modalContent: { padding: 24 },
  modalGreeting: { fontSize: 24, fontWeight: '500', color: '#2D3748', marginBottom: 12 },
  modalSub: { fontSize: 16, color: '#4A5568', lineHeight: 22 },
  modalFooter: { flexDirection: 'row', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#EDF2F7' },
  modalBtnSecondary: { flex: 1, backgroundColor: '#FFF', borderRadius: 4, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
  modalBtnPrimary: { flex: 1, backgroundColor: '#FFF', borderRadius: 4, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E0' },
  modalBtnTextSecondary: { fontSize: 14, color: '#2D3748' },
  modalBtnTextPrimary: { fontSize: 14, color: '#2D3748' },
});