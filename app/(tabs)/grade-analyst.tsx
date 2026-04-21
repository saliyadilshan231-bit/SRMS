import { IconSymbol } from '@/components/ui/icon-symbol';
import { DATABASE_ID, GRADES_COLLECTION_ID, useAuth } from '@/context/auth';
import { databases } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Stack, useRouter } from 'expo-router';


import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY || '';

const gradePoints: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7,
  'B+': 3.3, B: 3.0, 'B-': 2.7,
  'C+': 2.3, C: 2.0, 'C-': 1.7,
  D: 1.0, F: 0,
};

const gradeOptions = Object.keys(gradePoints);
const yearOptions = ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Graduating'];

const yearMap: Record<string, number> = {
  '1st Year': 1, '2nd Year': 2, '3rd Year': 3, 'Final Year': 4, 'Graduating': 5
};
const revYearMap: Record<number, string> = {
  1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: 'Final Year', 5: 'Graduating'
};

const semesterMap: Record<string, number> = {
  'Semester 1': 1, 'Semester 2': 2, 'All': 0
};
const revSemesterMap: Record<number, string> = {
  1: 'Semester 1', 2: 'Semester 2', 0: 'Semester 1' // Default back to sem 1 if for some reason it's 0
};

type CourseRow = {
  id: string;
  module: string;
  credits: string;
  grade: string;
  year: string;
  semester: string;
};

function parseNum(value: string) {
  if (!value) return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function GradeAnalystScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const [currentYear, setCurrentYear] = useState('2nd Year');
  const [currentSemester, setCurrentSemester] = useState('Semester 1');

  const [aiAdvice, setAiAdvice] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  // ML Feedback State
  const [semesterFeedback, setSemesterFeedback] = useState('');
  const [overallFeedback, setOverallFeedback] = useState('');

  const { user } = useAuth();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [targetGpa, setTargetGpa] = useState('3.5');
  const [futureCredits, setFutureCredits] = useState('12');

  // Form States for adding a new module
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCredits, setNewModuleCredits] = useState('3');
  const [newModuleGrade, setNewModuleGrade] = useState('A');

  // Load data from Appwrite on mount
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          GRADES_COLLECTION_ID,
          [Query.equal('userId', user.$id)]
        );

        if (response.documents.length > 0) {
          const mapped = response.documents.map((doc: any) => ({
            id: doc.$id,
            module: doc.module,
            credits: String(doc.credits),
            grade: doc.grade,
            year: typeof doc.year === 'number' ? (revYearMap[doc.year] || '1st Year') : doc.year,
            semester: typeof doc.semester === 'number' ? (revSemesterMap[doc.semester] || 'Semester 1') : doc.semester,
          }));
          setRows(mapped);
        } else {
          // Default initial rows if nothing is in Appwrite
          setRows([]);
        }
        setIsLoaded(true);
      } catch (e) {
        console.error('Failed to load data from Appwrite', e);
        setIsLoaded(true);
      }
    };
    loadData();
  }, [user]);

  // Pulsing animation for FAB
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
    setShowAiModal(true);
    setLoadingAI(true);
    setAiAdvice('');

    const filteredRows = rows.filter(row => row.year === currentYear);
    const hasModules = filteredRows.length > 0;

    const moduleList = hasModules
      ? filteredRows.map(row => `- ${row.module} (${row.credits} credits, ${row.semester}): ${row.grade}`).join('\n')
      : 'No modules recorded for this year yet.';

    const prompt = `You are a professional career advisor specializing in Computing and Information Technology students.

Student Profile:
- Current Year: ${currentYear}
- Current GPA: ${calc.gpa.toFixed(2)}
- Target GPA: ${targetGpa}
- Modules completed in ${currentYear}:
${moduleList}

Provide exactly 5 concise, actionable career guidance points.
Highlight strengths, suggest improvements, recommend relevant projects, certifications, internships, and link to real tech career paths.
Use clear bullet points only. Professional and encouraging tone.`;

    if (!HF_API_KEY || HF_API_KEY === 'YOUR_HUGGING_FACE_TOKEN_HERE') {
      setAiAdvice('Hugging Face API Key is not configured.\n\nPlease create a .env file in the project root and add:\nEXPO_PUBLIC_HF_API_KEY=your_token_here');
      setLoadingAI(false);
      return;
    }

    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
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
        }),
      });

      if (response.status === 401) {
        throw new Error('Unauthorized: Invalid or expired Hugging Face API key.');
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const text = data?.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
      setAiAdvice(text);
    } catch (err: any) {
      console.error('AI Error:', err);
      if (err.message.includes('Unauthorized')) {
        setAiAdvice('Invalid API Key. Please update your .env file with a valid Hugging Face Token.');
      } else {
        setAiAdvice('Failed to get career guidance. Please check your internet and try again.');
      }
    } finally {
      setLoadingAI(false);
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const yearMatch = row.year === currentYear;
      const semMatch = currentSemester === 'All' || row.semester === currentSemester;
      return yearMatch && semMatch;
    });
  }, [rows, currentYear, currentSemester]);

  // ML Feedback Fetch
  useEffect(() => {
    const fetchFeedback = async () => {
      const yearRows = rows.filter(r => r.year === currentYear);
      const semRows = currentSemester === 'All' ? yearRows : yearRows.filter(r => r.semester === currentSemester);
      
      const calcGroupGpa = (groupRows: CourseRow[]) => {
        const qp = groupRows.reduce((s, r) => s + parseNum(r.credits) * (gradePoints[r.grade] ?? 0), 0);
        const tc = groupRows.reduce((s, r) => s + parseNum(r.credits), 0);
        return tc > 0 ? qp / tc : 0;
      };

      const semGpa = calcGroupGpa(semRows);
      const yearGpa = calcGroupGpa(yearRows);

      if (semRows.length === 0 && yearRows.length === 0) {
        setSemesterFeedback('');
        setOverallFeedback('');
        return;
      }

      const semModules = semRows.map(r => r.module);

      try {
        const res = await fetch('http://127.0.0.1:5000/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            semester_gpa: semGpa, 
            overall_gpa: yearGpa,
            year: currentYear,
            semester: currentSemester,
            modules: semModules
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSemesterFeedback(data.semester_feedback);
          setOverallFeedback(data.overall_feedback);
        } else {
          setSemesterFeedback('');
          setOverallFeedback('');
        }
      } catch (err) {
        console.log("Could not fetch ML feedback from local server", err);
      }
    };
    fetchFeedback();
  }, [rows, currentYear, currentSemester]);

  async function addRow() {
    if (!user) {
      Alert.alert('Auth Error', 'You must be logged in to add modules.');
      return;
    }

    if (!newModuleName.trim()) {
      Alert.alert('Missing Information', 'Please enter a module name.');
      return;
    }

    const newRow = {
      module: newModuleName.trim(),
      credits: newModuleCredits,
      grade: newModuleGrade,
      year: currentYear,
      semester: currentSemester === 'All' ? 'Semester 1' : currentSemester,
    };

    try {
      setIsSyncing(true);

      if (!DATABASE_ID || !GRADES_COLLECTION_ID) {
        throw new Error('Appwrite Database or Collection ID is missing.');
      }

      const doc = await databases.createDocument(
        DATABASE_ID,
        GRADES_COLLECTION_ID,
        ID.unique(),
        {
          module: newRow.module,
          credits: newRow.credits,
          grade: newRow.grade,
          year: newRow.year, // Reverting to string
          semester: newRow.semester, // Reverting to string
          userId: user.$id,
        }
      );

      setRows((prev) => [...prev, { ...newRow, id: doc.$id }]);
      setShowAddModal(false);
      setNewModuleName('');
      setNewModuleCredits('3');
      setNewModuleGrade('A');
    } catch (e: any) {
      console.error('Appwrite addRow error:', e);
      Alert.alert(
        'Sync Error',
        `Failed to add module. Error: ${e.message || 'Unknown error'}.`
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function removeRow(id: string) {
    if (!user) return;

    try {
      setIsSyncing(true);
      await databases.deleteDocument(DATABASE_ID, GRADES_COLLECTION_ID, id);
      setRows((prev) => prev.filter((row) => row.id !== id));
    } catch (e) {
      console.error('Failed to remove module from Appwrite', e);
      Alert.alert('Sync Error', 'Failed to remove module.');
    } finally {
      setIsSyncing(false);
    }
  }

  async function updateRow(id: string, patch: Partial<CourseRow>) {
    if (!user) return;

    let validatedPatch = { ...patch };

    // Professional validation for credits
    if (patch.credits !== undefined) {
      const sanitized = patch.credits.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      const val = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : sanitized;
      const num = parseFloat(val);
      validatedPatch.credits = num > 16 ? '16' : val;
    }

    // Optimistically update local state
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...validatedPatch } : row)));

    // Sync to Appwrite
    try {
      const appwritePatch: any = { ...validatedPatch };
      // appwritePatch.credits/year/semester should remain strings if provided

      await databases.updateDocument(DATABASE_ID, GRADES_COLLECTION_ID, id, appwritePatch);
    } catch (e) {
      console.error('Failed to update module in Appwrite', e);
      // We could revert the state here if needed, but for now we'll just log
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
            <IconSymbol size={24} name="chevron.left" color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Grade Analyst</Text>
          <TouchableOpacity style={styles.notifyBtn} onPress={() => router.push('/(tabs)/notifications')}>
            <IconSymbol size={24} name="bell.fill" color="#1E3A8A" />
            <View style={styles.notifyDot} />
          </TouchableOpacity>
        </View>

        {/* Filters - Year & Semester */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionLabel}>Academic Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearScroll}>
            {yearOptions.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.yearPill, currentYear === year && styles.yearPillActive]}
                onPress={() => setCurrentYear(year)}
              >
                <Text style={[styles.yearPillText, currentYear === year && styles.yearPillTextActive]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionLabel}>Semester</Text>
          <View style={styles.semesterContainer}>
            {['Semester 1', 'Semester 2', 'All'].map((sem) => (
              <TouchableOpacity
                key={sem}
                style={[styles.semesterPill, currentSemester === sem && styles.semesterPillActive]}
                onPress={() => setCurrentSemester(sem)}
              >
                <Text style={[styles.semesterPillText, currentSemester === sem && styles.semesterPillTextActive]}>
                  {sem}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modules Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Modules • {currentYear}</Text>
            <Text style={styles.filterTag}>{currentSemester}</Text>
          </View>

          {filteredRows.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol size={56} name="doc.text.fill" color="#CBD5E1" />
              <Text style={styles.emptyText}>No modules found</Text>
              <Text style={styles.emptySubtext}>Add your modules below</Text>
            </View>
          ) : (
            filteredRows.map((row) => (
              <View key={row.id} style={styles.moduleCard}>
                <TextInput
                  style={styles.moduleNameInput}
                  value={row.module}
                  onChangeText={(text) => updateRow(row.id, { module: text })}
                  placeholder="Module Name"
                />

                <View style={styles.moduleRow}>
                  <View style={styles.creditsContainer}>
                    <Text style={styles.label}>Credits</Text>
                    <TextInput
                      style={styles.creditsInput}
                      value={row.credits}
                      onChangeText={(text) => updateRow(row.id, { credits: text })}
                      keyboardType="numeric"
                    />
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
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
                </View>

                <View style={styles.moduleFooter}>
                  <View style={styles.tags}>
                    <View style={styles.tag}><Text style={styles.tagText}>{row.year}</Text></View>
                    <View style={styles.tag}><Text style={styles.tagText}>{row.semester}</Text></View>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(row.id)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <IconSymbol size={20} name="plus" color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Module</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* GPA Snapshot */}
        <View style={[styles.card, styles.gpaCard]}>
          <View style={styles.gpaHeader}>
            <IconSymbol size={20} name="sum" color="#60A5FA" />
            <Text style={styles.gpaLabel}>OVERALL GPA</Text>
          </View>
          <Text style={styles.gpaValue}>{calc.gpa.toFixed(2)}</Text>
          <View style={styles.gpaMeta}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Total Credits</Text>
              <Text style={styles.metaText}>{calc.totalCredits.toFixed(1)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Quality Points</Text>
              <Text style={styles.metaText}>{calc.qualityPoints.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Target GPA Planner */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Target GPA Planner</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Target GPA</Text>
            <TextInput
              style={styles.plannerInput}
              value={targetGpa}
              onChangeText={setTargetGpa}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Upcoming Credits</Text>
            <TextInput
              style={styles.plannerInput}
              value={futureCredits}
              onChangeText={setFutureCredits}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Required Average</Text>
            <Text style={styles.resultValue}>{calc.requiredAvg.toFixed(2)}</Text>
          </View>
          <Text style={styles.guidanceText}>{calc.guidance}</Text>
        </View>

        {/* Grade Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Grade Distribution</Text>
          <View style={styles.distGrid}>
            {gradeOptions.map((grade) => {
              const count = calc.distribution[grade];
              return (
                <View key={grade} style={styles.distItem}>
                  <Text style={styles.distGrade}>{grade}</Text>
                  <View style={[styles.distBar, { height: Math.max(24, count * 14) }]} />
                  <Text style={styles.distCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* AI ML Feedback Card */}
        {(semesterFeedback !== '' || overallFeedback !== '') && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <IconSymbol size={24} name="sparkles" color="#3B82F6" />
              <Text style={styles.cardTitle}>Performance Analysis</Text>
            </View>
            
            {semesterFeedback !== '' && (
              <View style={styles.feedbackBlock}>
                <Text style={styles.feedbackLabel}>Semester Analysis</Text>
                <Text style={styles.feedbackText}>{semesterFeedback}</Text>
              </View>
            )}

            {overallFeedback !== '' && (
              <View style={styles.feedbackBlock}>
                <Text style={styles.feedbackLabel}>Yearly Overview</Text>
                <Text style={styles.feedbackText}>{overallFeedback}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Animated Chatbot FAB - Updated Icon */}
      <TouchableOpacity style={styles.fab} onPress={getAIAdvice} activeOpacity={0.85}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <IconSymbol size={32} name="bubble.left.and.bubble.right.fill" color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>

      {/* Add Module Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Module</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol size={28} name="xmark.circle.fill" color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Module Name</Text>
                <TextInput
                  style={styles.plannerInput}
                  value={newModuleName}
                  onChangeText={setNewModuleName}
                  placeholder="e.g. Data Structures"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Credits</Text>
                <TextInput
                  style={styles.plannerInput}
                  value={newModuleCredits}
                  onChangeText={(text) => {
                    const sanitized = text.replace(/[^0-9.]/g, '');
                    setNewModuleCredits(sanitized);
                  }}
                  keyboardType="numeric"
                  placeholder="e.g. 3"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Grade</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gradeScroll}>
                  {gradeOptions.map((grade) => (
                    <TouchableOpacity
                      key={`new-${grade}`}
                      style={[styles.gradeChip, newModuleGrade === grade && styles.gradeChipActive]}
                      onPress={() => setNewModuleGrade(grade)}
                    >
                      <Text style={[styles.gradeChipText, newModuleGrade === grade && styles.gradeChipTextActive]}>
                        {grade}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.infoBox}>
                <IconSymbol size={20} name="info.circle.fill" color="#3B82F6" />
                <Text style={styles.infoText}>
                  This module will be added to {currentYear}, {currentSemester}.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={addRow}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Module</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Modal */}
      <Modal
        visible={showAiModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AI Career Advisor</Text>
              <TouchableOpacity onPress={() => setShowAiModal(false)}>
                <IconSymbol size={28} name="xmark.circle.fill" color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {loadingAI ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#1E40AF" />
                  <Text style={styles.loadingText}>Analyzing your profile and generating advice...</Text>
                </View>
              ) : (
                <Text style={styles.aiAdviceText}>{aiAdvice}</Text>
              )}
            </ScrollView>

            {!loadingAI && (
              <TouchableOpacity style={styles.modalDoneBtn} onPress={() => setShowAiModal(false)}>
                <Text style={styles.modalDoneText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 16, paddingBottom: 140, gap: 20 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  backBtn: { padding: 8 },
  title: { fontSize: 26, fontWeight: '700', color: '#0F172A', letterSpacing: -0.5 },
  notifyBtn: { padding: 8, position: 'relative' },
  notifyDot: {
    position: 'absolute',
    right: 8,
    top: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F8FAFC',
  },

  filterSection: { gap: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  yearScroll: { marginBottom: 8 },
  yearPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
  },
  yearPillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  yearPillText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  yearPillTextActive: { color: '#FFFFFF' },

  semesterContainer: { flexDirection: 'row', gap: 10 },
  semesterPill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  semesterPillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  semesterPillText: { fontSize: 15, fontWeight: '600', color: '#334155' },
  semesterPillTextActive: { color: '#FFFFFF' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  filterTag: { fontSize: 13, color: '#64748B', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },

  moduleCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleNameInput: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  moduleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  creditsContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  creditsInput: {
    width: 80,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  gradeScroll: { flex: 1 },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  gradeChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  gradeChipText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  gradeChipTextActive: { color: '#FFFFFF' },

  moduleFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  tags: { flexDirection: 'row', gap: 8 },
  tag: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 14 },
  removeText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

  addButton: {
    flex: 1,
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },

  cardActions: { flexDirection: 'row', gap: 12, marginTop: 12 },

  gpaCard: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: '#0F172A',
    borderColor: '#1E40AF',
    shadowColor: '#1E40AF',
    shadowOpacity: 0.2,
  },
  gpaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  gpaLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '700', letterSpacing: 1 },
  gpaValue: { fontSize: 64, fontWeight: '800', color: '#60A5FA', letterSpacing: -2 },
  gpaMeta: {
    flexDirection: 'row',
    alignItems: 'center',    justifyContent: 'center',
    marginTop: 16,
    backgroundColor: 'rgba(30, 64, 175, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  metaBox: { alignItems: 'center' },
  metaLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  metaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  metaDivider: { width: 1, height: 24, backgroundColor: '#334155', marginHorizontal: 24 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  plannerInput: {
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  resultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  resultLabel: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  resultValue: { fontSize: 24, fontWeight: '800', color: '#2563EB' },
  guidanceText: { fontSize: 14, color: '#475569', lineHeight: 20 },

  distGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160, paddingTop: 20 },
  distItem: { alignItems: 'center', width: 32 },
  distGrade: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  distBar: { width: 20, backgroundColor: '#3B82F6', borderRadius: 4, opacity: 0.8 },
  distCount: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 8 },

  feedbackBlock: { marginTop: 12, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  feedbackLabel: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  feedbackText: { fontSize: 15, color: '#334155', lineHeight: 22 },

  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#64748B', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#1E40AF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  modalBody: { padding: 24 },
  
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: { fontSize: 14, color: '#1E40AF', fontWeight: '500' },
  modalSubmitBtn: {
    backgroundColor: '#1E40AF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSubmitText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  loading: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 16 },
  loadingText: { color: '#64748B', fontSize: 15, textAlign: 'center' },
  aiAdviceText: { fontSize: 16, color: '#334155', lineHeight: 26 },
  
  modalDoneBtn: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalDoneText: { color: '#475569', fontWeight: '700', fontSize: 16 },
});