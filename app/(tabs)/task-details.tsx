import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager } from '@/context/task-manager';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks } = useTaskManager();

  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>Task not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const deadlineDisplay = task.deadline
    ? new Date(task.deadline).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'No deadline set';

  const statusColor =
    task.status === 'Completed'
      ? '#48BB78'
      : task.status === 'In Progress'
      ? '#D69E2E'
      : '#718096';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Dark Blue Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <IconSymbol size={20} name="chevron.left" color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Task Details</Text>
            <View style={{ width: 45 }} />
          </View>

          {/* Status Badge in header */}
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{task.status}</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main info card */}
        <View style={styles.card}>
          {/* Tags row */}
          <View style={styles.tagRow}>
            <View style={styles.moduleTag}>
              <Text style={styles.moduleTagText}>{task.module}</Text>
            </View>
            <View style={styles.typeTag}>
              <Text style={styles.typeTagText}>{task.type}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{task.title}</Text>

          {/* Description */}
          {task.description ? (
            <Text style={styles.description}>{task.description}</Text>
          ) : (
            <Text style={styles.descriptionEmpty}>No description provided.</Text>
          )}

          <View style={styles.divider} />

          {/* Detail Rows */}
          <DetailRow icon="calendar" label="Deadline" value={deadlineDisplay} />
          <DetailRow icon="person.fill" label="Category" value={task.categories.join(', ')} />
          <DetailRow icon="chart.bar.fill" label="Progress" value={`${task.progress}%`} />
          <DetailRow icon="doc.fill" label="Submission" value={task.submissionStatus} />
          <DetailRow
            icon="clock.fill"
            label="Created At"
            value={new Date(task.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
          />
        </View>

        {/* Progress Bar */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PROGRESS</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${task.progress}%` as any }]} />
          </View>
          <Text style={styles.progressLabel}>{task.progress}% completed</Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(tabs)/focus')}>
          <IconSymbol size={18} name="timer" color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Start Focus Session</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(tabs)/task-insights')}>
          <Text style={styles.secondaryBtnText}>View All Tasks</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconBox}>
        <IconSymbol size={18} name={icon} color="#0B173B" />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#E53E3E', marginBottom: 20 },
  backBtn: {
    backgroundColor: '#0B173B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backBtnText: { color: '#FFF', fontWeight: 'bold' },

  header: {
    backgroundColor: '#0B173B',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 30,
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  statusContainer: { alignItems: 'center', marginTop: 15 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  scrollContent: { paddingHorizontal: 20, marginTop: -15, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  tagRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  moduleTag: {
    backgroundColor: '#0B173B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  moduleTagText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  typeTag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeTagText: { color: '#0B173B', fontSize: 12, fontWeight: '700' },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    lineHeight: 30,
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 10,
  },
  descriptionEmpty: {
    fontSize: 14,
    color: '#A0AEC0',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: '#EDF2F7', marginVertical: 15 },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  detailIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: { flex: 1 },
  detailLabel: { fontSize: 11, color: '#A0AEC0', fontWeight: '700', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#2D3748', fontWeight: '700' },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A0AEC0',
    marginBottom: 12,
    letterSpacing: 1,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: '#EDF2F7',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0B173B',
    borderRadius: 8,
  },
  progressLabel: { fontSize: 13, color: '#718096', fontWeight: '600', textAlign: 'right' },

  primaryBtn: {
    backgroundColor: '#0B173B',
    borderRadius: 18,
    paddingVertical: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  secondaryBtnText: { color: '#4A5568', fontSize: 16, fontWeight: '700' },
});
