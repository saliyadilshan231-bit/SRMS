import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager } from '@/context/task-manager';

function toShortDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

function withinDays(iso: string, days: number) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  return now - then <= days * 24 * 60 * 60 * 1000;
}

export default function ProgressScreen() {
  const { tasks, updateTaskProgress, addSubmission } = useTaskManager();
  const router = useRouter();

  const [selectedTaskId, setSelectedTaskId] = useState(tasks[0]?.id ?? '');
  const [progressInput, setProgressInput] = useState('50');
  const [submissionLink, setSubmissionLink] = useState('');
  const [submissionFile, setSubmissionFile] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? tasks[0],
    [tasks, selectedTaskId]
  );

  const analytics = useMemo(() => {
    const completedOnTime = tasks.filter(
      (task) => task.submissionStatus === 'Submitted' && task.status === 'Completed'
    ).length;

    const lateSubmissions = tasks.reduce(
      (count, task) => count + task.submissions.filter((item) => item.isLate).length,
      0
    );

    const completionTimes = tasks
      .filter((task) => task.submissions.length > 0)
      .map((task) => {
        const first = task.submissions[task.submissions.length - 1];
        const created = new Date(task.createdAt).getTime();
        const submitted = new Date(first.submittedAt).getTime();
        return Math.max(0, (submitted - created) / (1000 * 60 * 60));
      });

    const avgCompletionHours = completionTimes.length
      ? Math.round(completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length)
      : 0;

    const weeklyDone = tasks.filter((task) => task.progressHistory.some((item) => withinDays(item.recordedAt, 7) && item.status === 'Completed')).length;
    const monthlyDone = tasks.filter((task) => task.progressHistory.some((item) => withinDays(item.recordedAt, 30) && item.status === 'Completed')).length;

    const byModule = tasks.reduce<Record<string, { total: number; completed: number }>>((acc, task) => {
      if (!acc[task.module]) {
        acc[task.module] = { total: 0, completed: 0 };
      }
      acc[task.module].total += 1;
      if (task.status === 'Completed') acc[task.module].completed += 1;
      return acc;
    }, {});

    return {
      completedOnTime,
      lateSubmissions,
      avgCompletionHours,
      weeklyDone,
      monthlyDone,
      byModule,
    };
  }, [tasks]);

  function applyProgress(value: number) {
    if (!selectedTask) return;
    updateTaskProgress({ taskId: selectedTask.id, progress: value });
  }

  function submitAttempt() {
    if (!selectedTask) return;
    if (!submissionLink.trim() && !submissionFile.trim()) {
      Alert.alert('No submission data', 'Add at least a link or file name.');
      return;
    }

    addSubmission({
      taskId: selectedTask.id,
      link: submissionLink,
      fileName: submissionFile,
      notes: submissionNotes,
    });

    setSubmissionLink('');
    setSubmissionFile('');
    setSubmissionNotes('');
    Alert.alert('Submission added', 'Submission history updated successfully.');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <View style={styles.topStripWrap}>
              <View style={styles.topStripCard}>
                <TouchableOpacity
                  style={styles.topStripIconBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/task-insights')}>
                  <IconSymbol size={24} name="chevron.left" color="#65707D" />
                </TouchableOpacity>

                <Text style={styles.topStripTitle}>Progress</Text>

                <TouchableOpacity
                  style={styles.topStripIconBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/notifications')}>
                  <IconSymbol size={22} name="bell.fill" color="#18326E" />
                  <View style={styles.notifyDot} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.pageTitle}>Progress & Submission Tracking</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Task</Text>
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

              {selectedTask && (
                <View style={styles.metaBlock}>
                  <Text style={styles.metaText}>Task ID: {selectedTask.id}</Text>
                  <Text style={styles.metaText}>Current status: {selectedTask.status}</Text>
                  <Text style={styles.metaText}>Progress: {selectedTask.progress}%</Text>
                  <Text style={styles.metaText}>Submission status: {selectedTask.submissionStatus}</Text>
                  <Text style={styles.metaText}>Deadline: {toShortDate(selectedTask.deadline)}</Text>
                </View>
              )}
            </View>

            {selectedTask && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Update (0 - 100)</Text>
                <View style={styles.progressRow}>
                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => applyProgress(Math.max(0, selectedTask.progress - 10))}>
                    <Text style={styles.adjustBtnText}>-10</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.progressInput}
                    value={progressInput}
                    keyboardType="numeric"
                    onChangeText={setProgressInput}
                    placeholder="Enter %"
                  />

                  <TouchableOpacity
                    style={styles.adjustBtn}
                    onPress={() => applyProgress(Math.min(100, selectedTask.progress + 10))}>
                    <Text style={styles.adjustBtnText}>+10</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => applyProgress(Number(progressInput) || 0)}>
                  <Text style={styles.primaryButtonText}>Apply Progress</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedTask && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Submission Management</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Submission link (Drive/GitHub/LMS)"
                  value={submissionLink}
                  onChangeText={setSubmissionLink}
                />
                <TextInput
                  style={styles.input}
                  placeholder="File name (PDF/DOCX/ZIP)"
                  value={submissionFile}
                  onChangeText={setSubmissionFile}
                />
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="Notes"
                  value={submissionNotes}
                  onChangeText={setSubmissionNotes}
                  multiline
                />
                <TouchableOpacity style={styles.primaryButton} onPress={submitAttempt}>
                  <Text style={styles.primaryButtonText}>Add Submission Attempt</Text>
                </TouchableOpacity>

                <Text style={styles.subTitle}>Submission History</Text>
                {selectedTask.submissions.length === 0 && <Text style={styles.empty}>No attempts yet.</Text>}
                {selectedTask.submissions.map((attempt) => (
                  <View key={attempt.id} style={styles.historyCard}>
                    <Text style={styles.historyText}>Time: {toShortDate(attempt.submittedAt)}</Text>
                    <Text style={styles.historyText}>Late: {attempt.isLate ? `Yes (${attempt.lateByHours}h)` : 'No'}</Text>
                    {!!attempt.link && <Text style={styles.historyText}>Link: {attempt.link}</Text>}
                    {!!attempt.fileName && <Text style={styles.historyText}>File: {attempt.fileName}</Text>}
                  </View>
                ))}
              </View>
            )}

            {selectedTask && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress History</Text>
                {selectedTask.progressHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyCard}>
                    <Text style={styles.historyText}>Recorded: {toShortDate(entry.recordedAt)}</Text>
                    <Text style={styles.historyText}>Progress: {entry.progress}%</Text>
                    <Text style={styles.historyText}>Status: {entry.status}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Analytics & Reports</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsCard}>
                  <Text style={styles.metricLabel}>Weekly Completed</Text>
                  <Text style={styles.metricValue}>{analytics.weeklyDone}</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.metricLabel}>Monthly Completed</Text>
                  <Text style={styles.metricValue}>{analytics.monthlyDone}</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.metricLabel}>On-time Completed</Text>
                  <Text style={styles.metricValue}>{analytics.completedOnTime}</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.metricLabel}>Late Submissions</Text>
                  <Text style={styles.metricValue}>{analytics.lateSubmissions}</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.metricLabel}>Avg Completion (h)</Text>
                  <Text style={styles.metricValue}>{analytics.avgCompletionHours}</Text>
                </View>
              </View>

              <Text style={styles.subTitle}>Module Workload & Completion</Text>
              {Object.entries(analytics.byModule).map(([module, item]) => (
                <View key={module} style={styles.historyCard}>
                  <Text style={styles.historyText}>Module: {module}</Text>
                  <Text style={styles.historyText}>Tasks: {item.total}</Text>
                  <Text style={styles.historyText}>
                    Completion Rate: {item.total ? Math.round((item.completed / item.total) * 100) : 0}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        }
        renderItem={() => null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDE7B5',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  topStripWrap: {
    height: 84,
    marginHorizontal: -16,
    marginBottom: 8,
    backgroundColor: '#FDE7B5',
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
    marginBottom: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  chipActive: {
    backgroundColor: '#0A0A5C',
    borderColor: '#0A0A5C',
  },
  chipText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  metaBlock: {
    marginTop: 10,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  metaText: {
    color: '#444',
    fontSize: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  adjustBtn: {
    backgroundColor: '#2D5A7B',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  adjustBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  progressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
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
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#2D5A7B',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  subTitle: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  empty: {
    color: '#666',
    fontSize: 12,
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
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analyticsCard: {
    width: '48%',
    backgroundColor: '#fff5f2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffe4dc',
  },
  metricLabel: {
    fontSize: 11,
    color: '#666',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0A0A5C',
    marginTop: 4,
  },
});

