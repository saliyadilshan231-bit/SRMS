import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager } from '@/context/task-manager';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusScreen() {
  const { tasks, sessions, logStudySession } = useTaskManager();
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? '');
  const [studyMinutes, setStudyMinutes] = useState('25');
  const [breakMinutes, setBreakMinutes] = useState('5');

  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [distractionFree, setDistractionFree] = useState(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [tasks, selectedTaskId]
  );

  const taskSessionSummary = useMemo(() => {
    if (!selectedTask) return { count: 0, minutes: 0 };
    const current = sessions.filter((s) => s.taskId === selectedTask.id && s.completed);
    return {
      count: current.length,
      minutes: current.reduce((sum, item) => sum + item.durationMinutes, 0),
    };
  }, [sessions, selectedTask]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            setIsBreak(true);
            setIsRunning(false);
            const breakSecs = (Number(breakMinutes) || 5) * 60;
            Alert.alert('Study session ended', 'Break time started.');
            logCompletion(true);
            return breakSecs;
          }

          setIsBreak(false);
          setIsRunning(false);
          const focusSecs = (Number(studyMinutes) || 25) * 60;
          Alert.alert('Break ended', 'Ready for next focus session.');
          return focusSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isBreak, breakMinutes, studyMinutes]);

  function startSession() {
    const focusSecs = Math.max(1, Number(studyMinutes) || 25) * 60;
    setIsBreak(false);
    setSecondsLeft(focusSecs);
    setIsRunning(true);
    setStartedAt(new Date().toISOString());
  }

  function pauseSession() {
    setIsRunning(false);
  }

  function resetSession() {
    setIsRunning(false);
    setIsBreak(false);
    const focusSecs = Math.max(1, Number(studyMinutes) || 25) * 60;
    setSecondsLeft(focusSecs);
    if (startedAt) {
      logCompletion(false);
      setStartedAt(null);
    }
  }

  function logCompletion(completed: boolean) {
    if (!selectedTask || !startedAt) return;
    logStudySession(
      selectedTask.id,
      Math.max(1, Number(studyMinutes) || 25),
      Math.max(1, Number(breakMinutes) || 5),
      completed
    );
    setStartedAt(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topStripWrap}>
          <View style={styles.topStripCard}>
            <TouchableOpacity
              style={styles.topStripIconBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/task-insights')}>
              <IconSymbol size={24} name="chevron.left" color="#65707D" />
            </TouchableOpacity>

            <Text style={styles.topStripTitle}>Focus</Text>

            <TouchableOpacity
              style={styles.topStripIconBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/notifications')}>
              <IconSymbol size={22} name="bell.fill" color="#18326E" />
              <View style={styles.notifyDot} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.pageTitle}>Focus & Study Session Manager</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task to Study Session Conversion</Text>
          <View style={styles.taskChips}>
            {tasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.chip, selectedTask?.id === task.id && styles.chipActive]}
                onPress={() => setSelectedTaskId(task.id)}>
                <Text style={[styles.chipText, selectedTask?.id === task.id && styles.chipTextActive]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!distractionFree && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pomodoro Timer Settings</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={studyMinutes}
              onChangeText={setStudyMinutes}
              placeholder="Study minutes (default 25)"
            />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={breakMinutes}
              onChangeText={setBreakMinutes}
              placeholder="Break minutes (default 5)"
            />
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Distraction-Free Mode</Text>
              <Switch value={distractionFree} onValueChange={setDistractionFree} />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Session</Text>
          <Text style={styles.taskName}>{selectedTask?.title || 'No task selected'}</Text>
          <Text style={styles.phaseText}>{isBreak ? 'Break' : 'Focus'}</Text>
          <Text style={styles.timerText}>{formatTime(secondsLeft)}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryBtn} onPress={startSession}>
              <Text style={styles.primaryBtnText}>Start Study Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pauseSession}>
              <Text style={styles.secondaryBtnText}>Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={resetSession}>
              <Text style={styles.secondaryBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Tracking</Text>
          <Text style={styles.summaryText}>Sessions for selected task: {taskSessionSummary.count}</Text>
          <Text style={styles.summaryText}>Total time spent: {taskSessionSummary.minutes} minutes</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study History</Text>
          {sessions.length === 0 && <Text style={styles.summaryText}>No sessions recorded yet.</Text>}
          {sessions.map((session) => {
            const task = tasks.find((item) => item.id === session.taskId);
            return (
              <View key={session.id} style={styles.historyCard}>
                <Text style={styles.historyText}>Task: {task?.title || session.taskId}</Text>
                <Text style={styles.historyText}>Date: {new Date(session.startedAt).toLocaleString()}</Text>
                <Text style={styles.historyText}>
                  Duration: {session.durationMinutes}m + break {session.breakMinutes}m
                </Text>
                <Text style={styles.historyText}>Completed: {session.completed ? 'Yes' : 'No'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A5C',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  topStripWrap: {
    height: 84,
    marginHorizontal: -16,
    marginBottom: 8,
    backgroundColor: '#0A0A5C',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  topStripCard: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  topStripIconBtn: {
    padding: 10,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topStripTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2A38',
    letterSpacing: 0.3,
  },
  notifyDot: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#FF5A5A',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D5A7B',
    marginBottom: 10,
  },
  taskChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
  },
  chipActive: {
    borderColor: '#F2856D',
    backgroundColor: '#F2856D',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  chipTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    marginBottom: 8,
  },
  toggleRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  taskName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f1f1f',
    marginBottom: 6,
  },
  phaseText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#F2856D',
    letterSpacing: 1,
  },
  actions: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#2D5A7B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 13,
  },
  summaryText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 4,
  },
  historyCard: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  historyText: {
    fontSize: 12,
    color: '#444',
    marginBottom: 2,
  },
});
