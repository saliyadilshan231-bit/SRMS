import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager } from '@/context/task-manager';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProgressScreen() {
  const { tasks, updateTaskProgress, isSyncing } = useTaskManager();
  const router = useRouter();

  // පින්තූරයේ ඇති පරිදි දත්ත නොමැති නම් පෙන්වීමට උදාහරණ දත්ත
  const displayTasks = tasks.length > 0 ? tasks : [
    { id: 'TASK-1001', title: 'OOP Assignment 02', progress: 45, status: 'In Progress', deadline: '2026-03-26, 09:41' },
    { id: 'TASK-1002', title: 'DS Quiz Revision', progress: 10, status: 'To Do', deadline: '2026-03-28, 14:00' }
  ];

  const [selectedTaskId, setSelectedTaskId] = useState(displayTasks[0]?.id ?? '');
  const [tempProgress, setTempProgress] = useState(50);

  const formatShortId = (task: any) => {
    if (!task) return '';
    const prefix = task.title.split(' ')[0].substring(0, 3).toUpperCase();
    const shortId = task.id.slice(-4).toUpperCase();
    return `${prefix}-${shortId}`;
  };

  const selectedTask = useMemo(
    () => displayTasks.find((t: any) => t.id === selectedTaskId) || displayTasks[0],
    [displayTasks, selectedTaskId]
  );

  const stats = {
    total: displayTasks.length,
    submitted: displayTasks.filter((t: any) => t.status === 'Completed').length || 1,
    inProgress: displayTasks.filter((t: any) => t.status !== 'Completed').length || 2,
  };

  const [isApplying, setIsApplying] = useState(false);

  const handleApplyProgress = async () => {
    if (!selectedTask) return;
    setIsApplying(true);
    try {
      await updateTaskProgress({ taskId: selectedTask.id, progress: tempProgress });
      Alert.alert('Success', 'Progress updated successfully!');
    } catch (e) {
      Alert.alert('Error', 'Failed to update progress.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isSyncing) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0B173B" />
        <Text style={{ marginTop: 12, color: '#0B173B', fontWeight: '600' }}>Loading progress...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Area */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/task-insights')}>
            <IconSymbol size={18} name="chevron.left" color="#0B173B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={{ width: 45 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageMainTitle}>Progress & Submissions</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#0B173B' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Tasks</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#48BB78' }]}>{stats.submitted}</Text>
            <Text style={styles.statLabel}>Submitted</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#F6AD55' }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
        </View>

        {/* Selection Section */}
        <View style={styles.whiteSection}>
          <Text style={styles.sectionLabel}>Select Task</Text>
          <View style={styles.taskChips}>
            {displayTasks.map((task: any) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.chip, selectedTaskId === task.id && styles.chipActive]}
                onPress={() => setSelectedTaskId(task.id)}>
                <Text style={[styles.chipText, selectedTaskId === task.id && styles.chipTextActive]}>
                  {task.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Task Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLine}><Text style={styles.boldLabel}>Task ID:</Text> {formatShortId(selectedTask)}</Text>
            <Text style={styles.infoLine}>
              <Text style={styles.boldLabel}>Status:</Text>
              <Text style={{ color: '#F6AD55' }}> {selectedTask?.status}</Text>
            </Text>
            <Text style={styles.infoLine}><Text style={styles.boldLabel}>Progress:</Text> {selectedTask?.progress}%</Text>
            <Text style={styles.infoLine}><Text style={styles.boldLabel}>Submission:</Text> Not Submitted</Text>
            <Text style={styles.infoLine}><Text style={styles.boldLabel}>Deadline:</Text> {selectedTask?.deadline}</Text>
          </View>
        </View>

        {/* Progress Update Blue Panel */}
        <View style={styles.updatePanel}>
          <Text style={styles.panelTitle}>Progress Update (0-100)</Text>

          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTempProgress(p => Math.max(0, p - 5))}>
              <IconSymbol size={24} name="minus" color="#0B173B" />
            </TouchableOpacity>

            <Text style={styles.counterValue}>{tempProgress}</Text>

            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => setTempProgress(p => Math.min(100, p + 5))}>
              <IconSymbol size={24} name="plus" color="#0B173B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.applyBtn, isApplying && { opacity: 0.7 }]}
            onPress={handleApplyProgress}
            disabled={isApplying}
          >
            {isApplying ? (
              <ActivityIndicator color="#0B173B" />
            ) : (
              <Text style={styles.applyBtnText}>Apply Progress</Text>
            )}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  headerSafeArea: {
    backgroundColor: '#F7FAFC',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBtn: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
  },
  bellBtn: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifyDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
    borderWidth: 1.5,
    borderColor: '#EBF4FF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  pageMainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0B173B',
    marginBottom: 25,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  whiteSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0B173B',
    marginBottom: 15,
  },
  taskChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: '#0B173B',
    borderColor: '#0B173B',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  infoBox: {
    backgroundColor: '#F7FAFC',
    borderRadius: 18,
    padding: 15,
    gap: 8,
  },
  infoLine: {
    fontSize: 14,
    color: '#4A5568',
  },
  boldLabel: {
    fontWeight: '800',
    color: '#2D3748',
  },
  updatePanel: {
    backgroundColor: '#0B173B',
    borderRadius: 30,
    padding: 25,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
  },
  counterBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  applyBtn: {
    backgroundColor: '#EDF2F7',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0B173B',
  },
});