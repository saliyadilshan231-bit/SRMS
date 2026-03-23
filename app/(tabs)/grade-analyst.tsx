import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const gradePoints: Record<string, number> = {
  'A+': 4.0,
  A: 4.0,
  'A-': 3.7,
  'B+': 3.3,
  B: 3.0,
  'B-': 2.7,
  'C+': 2.3,
  C: 2.0,
  'C-': 1.7,
  D: 1.0,
  F: 0,
};

const gradeOptions = Object.keys(gradePoints);

type CourseRow = {
  id: string;
  module: string;
  credits: string;
  grade: string;
};

function parseNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GradeAnalystScreen() {
  const router = useRouter();

  const [rows, setRows] = useState<CourseRow[]>([
    { id: '1', module: 'OOP', credits: '3', grade: 'A-' },
    { id: '2', module: 'Database Systems', credits: '3', grade: 'B+' },
    { id: '3', module: 'Networks', credits: '2', grade: 'A' },
  ]);

  const [targetGpa, setTargetGpa] = useState('3.5');
  const [futureCredits, setFutureCredits] = useState('12');

  const calc = useMemo(() => {
    const qualityPoints = rows.reduce((sum, row) => {
      const credits = parseNum(row.credits);
      const gp = gradePoints[row.grade] ?? 0;
      return sum + credits * gp;
    }, 0);

    const totalCredits = rows.reduce((sum, row) => sum + parseNum(row.credits), 0);
    const gpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;

    const distribution = gradeOptions.reduce<Record<string, number>>((acc, grade) => {
      acc[grade] = rows.filter((row) => row.grade === grade).length;
      return acc;
    }, {});

    const target = parseNum(targetGpa);
    const future = parseNum(futureCredits);
    const requiredPoints = target * (totalCredits + future) - qualityPoints;
    const requiredAvg = future > 0 ? requiredPoints / future : 0;

    let guidance = 'Enter future credits to estimate required average grade point.';
    if (future > 0) {
      if (requiredAvg > 4) {
        guidance = 'Target is currently unrealistic. Increase future credits or lower target GPA.';
      } else if (requiredAvg < 0) {
        guidance = 'You are already above target GPA with current records.';
      } else if (requiredAvg >= 3.7) {
        guidance = 'Need mostly A-/A grades to hit the target.';
      } else if (requiredAvg >= 3.0) {
        guidance = 'Need solid B to A- range across upcoming modules.';
      } else {
        guidance = 'Target is achievable with consistent passing performance.';
      }
    }

    return {
      qualityPoints,
      totalCredits,
      gpa,
      distribution,
      requiredAvg,
      guidance,
    };
  }, [rows, targetGpa, futureCredits]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        module: `Module ${prev.length + 1}`,
        credits: '3',
        grade: 'B',
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateRow(id: string, patch: Partial<CourseRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
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

            <Text style={styles.topStripTitle}>Grade Analyst</Text>

            <TouchableOpacity
              style={styles.topStripIconBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/notifications')}>
              <IconSymbol size={22} name="bell.fill" color="#18326E" />
              <View style={styles.notifyDot} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Course Inputs</Text>
          {rows.map((row) => (
            <View key={row.id} style={styles.rowCard}>
              <TextInput
                style={[styles.input, styles.moduleInput]}
                value={row.module}
                onChangeText={(text) => updateRow(row.id, { module: text })}
                placeholder="Module name"
              />

              <View style={styles.rowBottom}>
                <TextInput
                  style={[styles.input, styles.creditsInput]}
                  value={row.credits}
                  onChangeText={(text) => updateRow(row.id, { credits: text })}
                  keyboardType="numeric"
                  placeholder="Credits"
                />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeRow}>
                  {gradeOptions.map((grade) => (
                    <TouchableOpacity
                      key={`${row.id}-${grade}`}
                      style={[styles.gradeChip, row.grade === grade && styles.gradeChipActive]}
                      onPress={() => updateRow(row.id, { grade })}>
                      <Text style={[styles.gradeChipText, row.grade === grade && styles.gradeChipTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(row.id)}>
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={addRow}>
            <Text style={styles.primaryBtnText}>Add Module</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current GPA Snapshot</Text>
          <Text style={styles.metric}>Total Credits: {calc.totalCredits.toFixed(1)}</Text>
          <Text style={styles.metric}>Quality Points: {calc.qualityPoints.toFixed(2)}</Text>
          <Text style={styles.metricMain}>Current GPA: {calc.gpa.toFixed(2)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target GPA Planner</Text>
          <TextInput
            style={styles.input}
            value={targetGpa}
            onChangeText={setTargetGpa}
            keyboardType="numeric"
            placeholder="Target GPA (e.g. 3.5)"
          />
          <TextInput
            style={styles.input}
            value={futureCredits}
            onChangeText={setFutureCredits}
            keyboardType="numeric"
            placeholder="Upcoming credits"
          />

          <Text style={styles.metric}>Required average grade point: {calc.requiredAvg.toFixed(2)}</Text>
          <Text style={styles.guidance}>{calc.guidance}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grade Distribution</Text>
          <View style={styles.distGrid}>
            {gradeOptions.map((grade) => (
              <View key={grade} style={styles.distCard}>
                <Text style={styles.distGrade}>{grade}</Text>
                <Text style={styles.distCount}>{calc.distribution[grade]}</Text>
              </View>
            ))}
          </View>
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
    padding: 14,
    paddingBottom: 100,
    gap: 12,
  },
  topStripWrap: {
    height: 84,
    marginBottom: 8,
    backgroundColor: '#0A0A5C',
    justifyContent: 'center',
    paddingHorizontal: 2,
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
  section: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#5E7D97',
    backgroundColor: '#F4F5EF',
    padding: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1D1D1D',
    marginBottom: 10,
  },
  rowCard: {
    borderWidth: 1,
    borderColor: '#c7d3df',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  rowBottom: {
    marginTop: 8,
    gap: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d5dde5',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#1F2E3A',
  },
  moduleInput: {
    fontWeight: '600',
  },
  creditsInput: {
    width: 110,
  },
  gradeRow: {
    maxWidth: '100%',
  },
  gradeChip: {
    borderWidth: 1,
    borderColor: '#d5dde5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  gradeChipActive: {
    backgroundColor: '#2E5578',
    borderColor: '#2E5578',
  },
  gradeChipText: {
    color: '#234',
    fontWeight: '700',
    fontSize: 12,
  },
  gradeChipTextActive: {
    color: '#fff',
  },
  removeBtn: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#FFE5E0',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnText: {
    color: '#A63822',
    fontWeight: '700',
  },
  primaryBtn: {
    marginTop: 2,
    backgroundColor: '#2E5578',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  metric: {
    fontSize: 16,
    color: '#1F2E3A',
    marginBottom: 6,
    fontWeight: '600',
  },
  metricMain: {
    fontSize: 30,
    color: '#1F2E3A',
    fontWeight: '800',
    marginTop: 6,
  },
  guidance: {
    marginTop: 8,
    fontSize: 14,
    color: '#2E5578',
    fontWeight: '600',
    lineHeight: 20,
  },
  distGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  distCard: {
    width: 62,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d5dde5',
  },
  distGrade: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2E5578',
  },
  distCount: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#1D1D1D',
  },
});
