import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const gradePoints: Record<string, number> = {
  'A+': 4.0, A: 4.0, 'A-': 3.7, 'B+': 3.3, B: 3.0, 'B-': 2.7, 'C+': 2.3, C: 2.0
};
const gradeOptions = Object.keys(gradePoints);

type CourseRow = {
  id: string;
  module: string;
  credits: number;
  grade: string;
};

export default function GradeAnalystScreen() {
  const router = useRouter();

  const [rows, setRows] = useState<CourseRow[]>([
    { id: '1', module: 'OOP', credits: 3, grade: 'A-' },
    { id: '2', module: 'Database Systems', credits: 3, grade: 'B+' },
    { id: '3', module: 'Networks', credits: 2, grade: 'A' },
  ]);

  const calc = useMemo(() => {
    const qualityPoints = rows.reduce((sum, row) => sum + row.credits * gradePoints[row.grade], 0);
    const totalCredits = rows.reduce((sum, row) => sum + row.credits, 0);
    const gpa = totalCredits > 0 ? qualityPoints / totalCredits : 0;

    let gradeLetter = 'F';
    if (gpa >= 3.7) gradeLetter = 'A-';
    else if (gpa >= 3.3) gradeLetter = 'B+';
    else if (gpa >= 3.0) gradeLetter = 'B';
    else if (gpa >= 2.7) gradeLetter = 'B-';
    else if (gpa >= 2.3) gradeLetter = 'C+';
    else if (gpa >= 2.0) gradeLetter = 'C';

    return { gpa: gpa.toFixed(2), gradeLetter };
  }, [rows]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: `${Date.now()}`, module: 'New Course', credits: 3, grade: 'B' },
    ]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id));
  }

  function updateGrade(id: string, grade: string) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, grade } : row)));
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Row */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol size={18} name="chevron.left" color="#1C3165" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Grade Analyst</Text>
          <View style={{ width: 45 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* GPA Blue Card */}
        <View style={styles.gpaCard}>
          <Text style={styles.gpaLabel}>CURRENT GPA</Text>
          <Text style={styles.gpaValue}>{calc.gpa}</Text>
          <View style={styles.gradeBadge}>
            <Text style={styles.gradeBadgeText}>{calc.gradeLetter}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Course Inputs</Text>

        {/* Course Cards List */}
        {rows.map((row) => (
          <View key={row.id} style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{row.module}</Text>
              <Text style={styles.courseCredits}>{row.credits} Credits</Text>
            </View>

            {/* Grades Grid */}
            <View style={styles.gradesGrid}>
              {gradeOptions.map((grade) => {
                const isActive = row.grade === grade;
                return (
                  <TouchableOpacity
                    key={`${row.id}-${grade}`}
                    style={[styles.gradeChip, isActive && styles.gradeChipActive]}
                    onPress={() => updateGrade(row.id, grade)}
                  >
                    <Text style={[styles.gradeChipText, isActive && styles.gradeChipTextActive]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(row.id)}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Course Dashed Button */}
        <TouchableOpacity style={styles.addCourseBtn} onPress={addRow}>
          <Text style={styles.addCourseBtnText}>+ Add Course</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC', // ලා අළු පසුබිම
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
  backBtn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: '#EBF4FF', // ලා නිල් පසුබිම බටන් සඳහා
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
    borderRadius: 12,
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
  },
  gpaCard: {
    backgroundColor: '#1C3165', // පින්තූරයේ ඇති නිල් පාට
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    // Shadow (iOS/Android)
    shadowColor: '#1C3165',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gpaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  gpaValue: {
    fontSize: 70,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 5,
    marginBottom: 10,
  },
  gradeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 25,
    paddingVertical: 10,
  },
  gradeBadgeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1C3165', // නිල් පාට ශීර්ෂය
    marginBottom: 20,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
  },
  courseCredits: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
  },
  gradesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gradeChip: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradeChipActive: {
    backgroundColor: '#1C3165',
    borderColor: '#1C3165',
  },
  gradeChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#718096',
  },
  gradeChipTextActive: {
    color: '#FFFFFF',
  },
  removeBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  removeBtnText: {
    color: '#E53E3E',
    fontWeight: '700',
    fontSize: 13,
  },
  addCourseBtn: {
    borderWidth: 2,
    borderColor: '#1C3165',
    borderStyle: 'dashed', // තිත් සහිත දාරය
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  addCourseBtnText: {
    color: '#1C3165',
    fontSize: 16,
    fontWeight: '700',
  },
});