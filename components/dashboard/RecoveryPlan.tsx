import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants/theme';
import { getRecoveryPlan, RecoveryTask, TriggerEvent, updateRecoveryTask } from '../../lib/mockData';



const STATUS_COLORS: any = {
  Done: { bg: '#F0FFF4', border: '#68D391', text: '#276749' },
  Pending: { bg: '#F7FAFC', border: '#CBD5E0', text: '#718096' },
};

const STATUS_ICONS: any = { Done: '✅', Pending: '⭕' };

const TYPE_COLORS: any = {
  academic: { bg: COLORS.primaryLight, color: COLORS.primaryDark, label: '🎓 Academic' },
  wellbeing: { bg: '#F0FFF4', color: COLORS.alertGreen, label: '💚 Wellbeing' },
  admin: { bg: '#FFFBEB', color: '#D97706', label: '📋 Admin' },
};

export default function RecoveryPlan() {
  const [tasks, setTasks] = useState<RecoveryTask[]>([]);
  const [triggers, setTriggers] = useState<TriggerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getRecoveryPlan();
    setTasks(data.tasks);
    setTriggers(data.triggers);
    setLoading(false);
  };

  const doneCount = tasks.filter(t => t.isCompleted).length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const markDone = async (id: string) => {
    // Optimistically update UI so progress bar responds instantly
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: true } : t));
    await updateRecoveryTask(id, true);
  };

  const getPlanStatus = () => {
    if (progress === 100) return { label: '🎉 Complete!', bg: '#F0FFF4', border: '#68D391', text: '#276749' };
    if (progress >= 50) return { label: '⚡ In Progress', bg: '#FFFBEB', border: '#F6AD55', text: '#975A16' };
    return { label: '🔴 Active Plan', bg: '#FFF5F5', border: '#FC8181', text: '#C53030' };
  };

  const status = getPlanStatus();

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Analyzing your wellbeing data...</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>🛡️ Adaptive Recovery Plan</Text>
      <Text style={styles.sub}>
        Auto-generated based on your mood patterns, counseling history, and wellbeing data. Updates dynamically as your situation changes.
      </Text>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View>
            <Text style={styles.progressTitle}>Recovery Progress</Text>
            <Text style={styles.progressSub}>{doneCount} of {tasks.length} steps completed</Text>
          </View>
          <View style={[styles.statusBadgeOuter, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: COLORS.sidebarBg }]} />
        </View>
        <Text style={styles.progressPercent}>{progress}% complete</Text>

        {progress === 100 && (
          <View style={styles.congratsBox}>
            <Text style={styles.congratsText}>🎉 Amazing work! You've completed all recovery steps. Consider booking a follow-up session with your counselor.</Text>
          </View>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.sidebarBg }]}>{tasks.length}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#68D391' }]}>{doneCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FC8181' }]}>{tasks.length - doneCount}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: COLORS.alertPurple }]}>{triggers.length}</Text>
          <Text style={styles.statLabel}>Triggers</Text>
        </View>
      </View>

      {/* Trigger Events */}
      <Text style={styles.sectionTitle}>⚡ Detected Trigger Events</Text>
      <Text style={styles.sectionSub}>These anomalies were automatically detected from your wellbeing data and generated your recovery plan.</Text>
      {triggers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>✅ No active anomalies detected in the past 14 days.</Text>
        </View>
      ) : (
        triggers.map((item) => (
          <View key={item.id} style={styles.triggerCard}>
            <View style={styles.triggerRow}>
              <Text style={styles.triggerIcon}>{item.icon}</Text>
              <View style={styles.triggerContent}>
                <View style={styles.triggerTitleRow}>
                  <Text style={styles.triggerTitle}>{item.title}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.triggerDate}>Detected: {item.date}</Text>
                <Text style={styles.triggerBody}>{item.body}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      {/* Recovery Tasks */}
      <Text style={styles.sectionTitle}>📋 Auto-Generated Recovery Checklist</Text>
      <Text style={styles.sectionSub}>Tap a task to expand and mark it complete. Your progress updates in real-time.</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>✅ You're all caught up! No recovery tasks needed right now.</Text>
        </View>
      ) : (
        tasks.map((item) => {
          const taskStatus = item.isCompleted ? 'Done' : 'Pending';
          const colors = STATUS_COLORS[taskStatus];
          const typeInfo = TYPE_COLORS[item.type];
          const isExpanded = expanded === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.stepCard, { borderLeftColor: colors.border, backgroundColor: colors.bg }]}
              onPress={() => setExpanded(isExpanded ? null : item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.stepHeader}>
                <Text style={styles.stepIcon}>{STATUS_ICONS[taskStatus]}</Text>
                <View style={styles.stepTitleContainer}>
                  <Text style={[styles.stepTitle, item.isCompleted && styles.stepTitleDone]}>
                    {item.title}
                  </Text>
                  <View style={[styles.typeTag, { backgroundColor: typeInfo.bg }]}>
                    <Text style={[styles.typeTagText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                  <Text style={[styles.statusText, { color: colors.text }]}>{taskStatus}</Text>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {isExpanded && (
                <View style={styles.stepExpanded}>
                  <Text style={styles.stepBody}>{item.description}</Text>
                  {!item.isCompleted && (
                    <TouchableOpacity
                      style={styles.markDoneBtn}
                      onPress={() => markDone(item.id)}
                    >
                      <Text style={styles.markDoneBtnText}>✅ Mark as Complete</Text>
                    </TouchableOpacity>
                  )}
                  {item.isCompleted && (
                    <View style={styles.completedBanner}>
                      <Text style={styles.completedBannerText}>✅ Completed — Great work!</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  loadingText: { fontSize: 14, color: '#64748B', textAlign: 'center' },
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#F8FAFC' },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 8, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: '#64748B', lineHeight: 22, marginBottom: 24, paddingRight: 20 },

  progressCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 5 }, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  progressSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  statusBadgeOuter: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  statusBadgeText: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden' },
  progressFill: { height: 12, backgroundColor: '#0A0A5C', borderRadius: 6 },
  progressPercent: { fontSize: 13, color: '#64748B', marginTop: 10, textAlign: 'right', fontWeight: '600' },
  congratsBox: { backgroundColor: '#F0FFF4', borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: '#86EFAC' },
  congratsText: { fontSize: 13, color: '#166534', lineHeight: 20, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: COLORS.sidebarBg, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  statNumber: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 6, marginTop: 12, letterSpacing: -0.4 },
  sectionSub: { fontSize: 13, color: '#64748B', marginBottom: 16, lineHeight: 20 },
  emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#F1F5F9', borderStyle: 'dashed' },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', fontWeight: '500' },

  triggerCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  triggerRow: { flexDirection: 'row', gap: 14 },
  triggerIcon: { fontSize: 24, marginTop: 2 },
  triggerContent: { flex: 1 },
  triggerTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 6 },
  triggerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  tag: { backgroundColor: COLORS.sidebarBg, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, color: COLORS.white, fontWeight: '600', letterSpacing: 0.5 },
  triggerDate: { fontSize: 12, color: '#64748B', marginBottom: 6, fontWeight: '500' },
  triggerBody: { fontSize: 13, color: '#475569', lineHeight: 20 },

  stepCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderLeftWidth: 5, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepTitleContainer: { flex: 1 },
  stepIcon: { fontSize: 20 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  stepTitleDone: { textDecorationLine: 'line-through', color: '#94A3B8' },
  typeTag: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  typeTagText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '700' },
  expandIcon: { fontSize: 12, color: '#94A3B8', paddingLeft: 4 },

  stepExpanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  stepBody: { fontSize: 13, color: '#475569', lineHeight: 22, marginBottom: 12 },
  markDoneBtn: { backgroundColor: COLORS.sidebarBg, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4, shadowColor: COLORS.sidebarBg, shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  markDoneBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  completedBanner: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#86EFAC', alignItems: 'center' },
  completedBannerText: { color: '#166534', fontSize: 13, fontWeight: '600' },
});