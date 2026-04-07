import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY;

const gradePoints: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  D: 1.0, F: 0,
};

const gradeOptions = Object.keys(gradePoints);
const yearOptions = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Graduating'];
const semesterOptions = ['Semester 1', 'Semester 2'];

type CourseRow = {
  id: string;
  module: string;
  credits: string;
  grade: string;
  year: string;
  semester: string;
};

function parseNum(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GradeAnalystScreen() {
  const router = useRouter();

  const [currentYear, setCurrentYear] = useState('2nd Year');

  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  const [rows, setRows] = useState<CourseRow[]>([
    { id: '1', module: 'OOP', credits: '3', grade: 'A-', year: '2nd Year', semester: 'Semester 1' },
    { id: '2', module: 'Database Systems', credits: '3', grade: 'B+', year: '2nd Year', semester: 'Semester 1' },
    { id: '3', module: 'Networks', credits: '2', grade: 'A', year: '2nd Year', semester: 'Semester 2' },
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

    const target = parseNum(targetGpa);
    const future = parseNum(futureCredits);
    const requiredPoints = target * (totalCredits + future) - qualityPoints;
    const requiredAvg = future > 0 ? requiredPoints / future : 0;

    const distribution = gradeOptions.reduce<Record<string, number>>((acc, grade) => {
      acc[grade] = rows.filter((row) => row.grade === grade).length;
      return acc;
    }, {});

    let guidance = 'Enter future credits to estimate required average grade point.';
    if (future > 0) {
      if (requiredAvg > 4) guidance = 'Target is currently unrealistic. Increase future credits or lower target GPA.';
      else if (requiredAvg < 0) guidance = 'You are already above target GPA with current records.';
      else if (requiredAvg >= 3.7) guidance = 'Need mostly A-/A grades to hit the target.';
      else if (requiredAvg >= 3.0) guidance = 'Need solid B to A- range across upcoming modules.';
      else guidance = 'Target is achievable with consistent passing performance.';
    }

    return { qualityPoints, totalCredits, gpa, distribution, requiredAvg, guidance };
  }, [rows, targetGpa, futureCredits]);

  async function getAIAdvice() {
    setLoadingAI(true);
    setAiAdvice('');

    // Filter modules ONLY from the selected year
    const filteredRows = rows.filter(row => row.year === currentYear);

    const hasModules = filteredRows.length > 0;

    const moduleList = hasModules
      ? filteredRows
        .map(row => `- ${row.module} (${row.credits} credits, ${row.semester}): ${row.grade}`)
        .join('\n')
      : 'No modules recorded for this year yet.';

    const prompt = `You are a professional career advisor specializing in Computing and Information Technology students.

Student Profile:
- Current Year: ${currentYear}
- Current GPA: ${calc.gpa.toFixed(2)}
- Target GPA: ${targetGpa}
- Modules completed in ${currentYear}:
${moduleList}

${hasModules ? `
Task:
Analyze the student's performance in these specific modules and provide exactly 5 concise, actionable career guidance points.
- Highlight strengths from high grades and suggest how to leverage them (e.g., advanced projects, specializations).
- Address weaker areas and recommend ways to improve those skills for better employability.
- Suggest relevant certifications, personal projects, open-source contributions, internships, or portfolio pieces that directly align with the modules taken (e.g., OOP → build full-stack apps, Networks → home lab or cybersecurity projects, Database → data engineering portfolio).
- Link everything to real career paths like software development, data science, networking, or cloud engineering.

` : `
Task:
No modules recorded yet for ${currentYear}. Provide 5 practical pieces of advice focused on building a strong foundation for CV and portfolio this year.
Suggest beginner-friendly projects, GitHub setup, personal website creation, entry-level certifications, and early internship preparation suitable for a ${currentYear} Computing student.
`}

Structure your response as clear bullet points only.
Use a professional, encouraging, and forward-looking tone.
Focus purely on career growth, skill development, CV, and portfolio — do not include any study or academic tips.`;

    try {
      const response = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data: any = await response.json();
      let text = data?.choices?.[0]?.message?.content?.trim() || 'AI returned empty response. Please try again.';

      setAiAdvice(text);

    } catch (err: any) {
      console.error('AI Advice Error:', err);
      let message = 'Failed to get career guidance. ';
      if (err.message.includes('429')) message += 'Rate limit reached. Wait 30-60 seconds.';
      else if (err.message.includes('401') || err.message.includes('403')) message += 'Invalid API key.';
      else message += 'Check your internet connection and try again.';
      setAiAdvice(message);
    } finally {
      setLoadingAI(false);
    }
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        module: `Module ${prev.length + 1}`,
        credits: '3',
        grade: 'B',
        year: currentYear,
        semester: 'Semester 1',
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
        {/* Top Bar */}
        <View style={styles.topStripWrap}>
          <View style={styles.topStripCard}>
            <TouchableOpacity style={styles.topStripIconBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/task-insights')}>
              <IconSymbol size={24} name="chevron.left" color="#65707D" />
            </TouchableOpacity>
            <Text style={styles.topStripTitle}>Grade Analyst</Text>
            <TouchableOpacity style={styles.topStripIconBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/notifications')}>
              <IconSymbol size={22} name="bell.fill" color="#18326E" />
              <View style={styles.notifyDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Course Inputs */}
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

                {/* Grade Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeRow}>
                  {gradeOptions.map((grade) => (
                    <TouchableOpacity
                      key={`${row.id}-${grade}`}
                      style={[styles.gradeChip, row.grade === grade && styles.gradeChipActive]}
                      onPress={() => updateRow(row.id, { grade })}
                    >
                      <Text style={[styles.gradeChipText, row.grade === grade && styles.gradeChipTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Year Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeRow}>
                  {yearOptions.map((y) => (
                    <TouchableOpacity
                      key={`${row.id}-year-${y}`}
                      style={[styles.yearChipSmall, row.year === y && styles.yearChipSmallActive]}
                      onPress={() => updateRow(row.id, { year: y })}
                    >
                      <Text style={[styles.yearChipTextSmall, row.year === y && styles.yearChipTextSmallActive]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Semester Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeRow}>
                  {semesterOptions.map((sem) => (
                    <TouchableOpacity
                      key={`${row.id}-sem-${sem}`}
                      style={[styles.semChip, row.semester === sem && styles.semChipActive]}
                      onPress={() => updateRow(row.id, { semester: sem })}
                    >
                      <Text style={[styles.semChipText, row.semester === sem && styles.semChipTextActive]}>
                        {sem}
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

        {/* GPA Snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current GPA Snapshot</Text>
          <Text style={styles.metric}>Total Credits: {calc.totalCredits.toFixed(1)}</Text>
          <Text style={styles.metric}>Quality Points: {calc.qualityPoints.toFixed(2)}</Text>
          <Text style={styles.metricMain}>Current GPA: {calc.gpa.toFixed(2)}</Text>
        </View>

        {/* Target GPA Planner */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target GPA Planner</Text>
          <TextInput style={styles.input} value={targetGpa} onChangeText={setTargetGpa} keyboardType="numeric" placeholder="Target GPA (e.g. 3.5)" />
          <TextInput style={styles.input} value={futureCredits} onChangeText={setFutureCredits} keyboardType="numeric" placeholder="Upcoming credits" />
          <Text style={styles.metric}>Required average grade point: {calc.requiredAvg.toFixed(2)}</Text>
          <Text style={styles.guidance}>{calc.guidance}</Text>
        </View>

        {/* Current Academic Year */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Academic Year</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearChip, currentYear === year && styles.yearChipActive]}
                onPress={() => setCurrentYear(year)}
              >
                <Text style={[styles.yearChipText, currentYear === year && styles.yearChipTextActive]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Career Guidance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Career Guidance</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={getAIAdvice}>
            <Text style={styles.primaryBtnText}>
              {loadingAI ? 'Generating Career Guidance...' : 'Get Career Guidance'}
            </Text>
          </TouchableOpacity>

          {loadingAI && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}

          {aiAdvice ? (
            <View style={styles.aiBox}>
              <Text style={styles.aiText}>{aiAdvice}</Text>
            </View>
          ) : null}
        </View>

        {/* Grade Distribution */}
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
  container: { flex: 1, backgroundColor: '#a8a8c9' },
  content: { padding: 14, paddingBottom: 100, gap: 12 },

  topStripWrap: { height: 84, marginBottom: 8, backgroundColor: '#a8a8c9', justifyContent: 'center', paddingHorizontal: 2 },
  topStripCard: { height: 56, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  topStripIconBtn: { padding: 10, borderRadius: 17, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' },
  topStripTitle: { fontSize: 24, fontWeight: '700', color: '#020202', letterSpacing: 0.3 },
  notifyDot: { position: 'absolute', right: 6, top: 6, width: 8, height: 8, borderRadius: 5, backgroundColor: '#FF5A5A' },

  section: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#5E7D97',
    backgroundColor: '#F4F5EF',
    padding: 14,
  },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#1D1D1D', marginBottom: 10 },

  rowCard: { borderWidth: 1, borderColor: '#c7d3df', borderRadius: 12, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  rowBottom: { marginTop: 8, gap: 8 },

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
  moduleInput: { fontWeight: '600' },
  creditsInput: { width: 110 },

  gradeRow: { maxWidth: '100%' },

  // Grade chips
  gradeChip: {
    borderWidth: 1,
    borderColor: '#d5dde5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  gradeChipActive: { backgroundColor: '#2E5578', borderColor: '#2E5578' },
  gradeChipText: { color: '#234', fontWeight: '700', fontSize: 12 },
  gradeChipTextActive: { color: '#fff' },

  // Small Year chips for each row
  yearChipSmall: {
    borderWidth: 1,
    borderColor: '#d5dde5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  yearChipSmallActive: { backgroundColor: '#2E5578', borderColor: '#2E5578' },
  yearChipTextSmall: { color: '#234', fontWeight: '600', fontSize: 12 },
  yearChipTextSmallActive: { color: '#fff' },

  // Semester chips
  semChip: {
    borderWidth: 1,
    borderColor: '#d5dde5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  semChipActive: { backgroundColor: '#2E5578', borderColor: '#2E5578' },
  semChipText: { color: '#234', fontWeight: '600', fontSize: 12 },
  semChipTextActive: { color: '#fff' },

  // Global Year selector chips
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d5dde5',
  },
  yearChipActive: { backgroundColor: '#2E5578', borderColor: '#2E5578' },
  yearChipText: { color: '#234', fontWeight: '600', fontSize: 14 },
  yearChipTextActive: { color: '#fff' },

  removeBtn: { alignSelf: 'flex-start', borderRadius: 8, backgroundColor: '#FFE5E0', paddingHorizontal: 10, paddingVertical: 6 },
  removeBtnText: { color: '#A63822', fontWeight: '700' },

  primaryBtn: { marginTop: 2, backgroundColor: '#2E5578', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  metric: { fontSize: 16, color: '#1F2E3A', marginBottom: 6, fontWeight: '600' },
  metricMain: { fontSize: 30, color: '#1F2E3A', fontWeight: '800', marginTop: 6 },
  guidance: { marginTop: 8, fontSize: 14, color: '#2E5578', fontWeight: '600', lineHeight: 20 },

  distGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  distCard: { width: 62, borderRadius: 10, paddingVertical: 8, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#d5dde5' },
  distGrade: { fontSize: 12, fontWeight: '800', color: '#2E5578' },
  distCount: { marginTop: 4, fontSize: 18, fontWeight: '800', color: '#1D1D1D' },

  aiBox: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d5dde5',
  },
  aiText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#1F2E3A',
    fontWeight: '500',
  },
});