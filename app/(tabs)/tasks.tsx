import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  type TaskCategory,
  type TaskType,
  useTaskManager,
} from '@/context/task-manager';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const taskTypes: TaskType[] = ['Assignment', 'Lab', 'Quiz', 'Study'];
const categories: TaskCategory[] = ['Individual', 'Group', 'Revision'];
const priorities = [
  { label: 'Low', color: '#48BB78', bg: '#F0FFF4' },
  { label: 'Medium', color: '#D69E2E', bg: '#FFFAF0' },
  { label: 'High', color: '#E53E3E', bg: '#FFF5F5' },
];

export default function TasksScreen() {
  const { modules, createTask, isSyncing } = useTaskManager();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('Assignment');
  const [isCreating, setIsCreating] = useState(false);

  const modulesByYear: Record<string, string[]> = {
    '1st Year': [
      'Introduction to Programming',
      'Mathematics for Computing',
      'Communication Skills',
      'Introduction to Computer System',
      'Information System & Data Modeling',
      'Internet & Web Technologies',
      'English for Academic Purpose',
      'Object Oriented Concept'
    ],
    '2nd Year': [
      'Operating Systems and System Administration',
      'Computer Networks',
      'Database Management Systems',
      'Object Oriented Programming',
      'Software Engineering',
      'Probability & Statistics',
      'Employability Skills Development',
      'Professional Skills',
      'IT Project',
      'Data Structures & Algorithms',
      'Mobile Application Development'
    ],
    '3rd Year': [
      'Employability Skills Development - Seminar',
      'IT Project Management',
      'Programming Applications and Frameworks',
      'Database Systems',
      'Network Design and Management',
      'Business Management for IT',
      'Data Science & Analytics',
      'Information Assurance & Security',
      'Human Computer Interaction'
    ]
  };
  const [selectedYear, setSelectedYear] = useState<string>('1st Year');
  const [moduleName, setModuleName] = useState(modules[0] || 'OOP');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('Individual');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [priority, setPriority] = useState('Medium');

  async function submitTask() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a task title.');
      return;
    }

    setIsCreating(true);
    try {
      const newTaskId = await createTask({
        title,
        description,
        type,
        categories: [selectedCategory],
        module: moduleName,
        deadline: `${deadlineDate} ${deadlineTime}`.trim() || undefined,
        priority: priority,
      });

      setTitle('');
      setDescription('');

      // Navigate to the newly created task's full details page
      router.push(`/(tabs)/task-details?id=${newTaskId}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  if (isSyncing) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#1C3165" />
         <Text style={{ marginTop: 10, color: '#1C3165', fontWeight: '600' }}>Syncing with Appwrite...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header Area */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(tabs)/task-insights')}>
          <IconSymbol size={18} name="chevron.left" color="#1C3165" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasks</Text>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageMainTitle}>Task Creation & Organization</Text>

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Create Task</Text>

          <TextInput
            style={styles.input}
            placeholder="Task title"
            placeholderTextColor="#A0AEC0"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={[styles.input, styles.multiInput]}
            placeholder="Description..."
            placeholderTextColor="#A0AEC0"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Text style={styles.fieldLabel}>TASK TYPE</Text>
          <View style={styles.chipRow}>
            {taskTypes.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, type === item && styles.chipActive]}
                onPress={() => setType(item)}>
                <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>YEAR</Text>
          <View style={styles.chipRow}>
            {Object.keys(modulesByYear).map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.chip, selectedYear === year && styles.chipActive]}
                onPress={() => {
                  setSelectedYear(year);
                  setModuleName(modulesByYear[year][0]); // Auto-select first module of new year
                }}>
                <Text style={[styles.chipText, selectedYear === year && styles.chipTextActive]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>MODULE / COURSE</Text>
          <View style={styles.chipRow}>
            {modulesByYear[selectedYear].map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, moduleName === item && styles.chipActive]}
                onPress={() => setModuleName(item)}>
                <Text style={[styles.chipText, moduleName === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>CATEGORIES</Text>
          <View style={styles.chipRow}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, selectedCategory === item && styles.chipActive]}
                onPress={() => setSelectedCategory(item)}>
                <Text style={[styles.chipText, selectedCategory === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>DEADLINE</Text>
          <View style={styles.deadlineRow}>
            <TextInput
              style={[styles.input, { flex: 2, marginBottom: 0 }]}
              placeholder="YYYY-MM-DD"
              value={deadlineDate}
              onChangeText={setDeadlineDate}
            />
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="HH:MM"
              value={deadlineTime}
              onChangeText={setDeadlineTime}
            />
          </View>

          <Text style={styles.fieldLabel}>PRIORITY</Text>
          <View style={styles.chipRow}>
            {priorities.map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.priorityChip,
                  { backgroundColor: p.bg, borderColor: p.color },
                  priority === p.label && { borderWidth: 2 }
                ]}
                onPress={() => setPriority(p.label)}>
                <Text style={[styles.priorityText, { color: p.color }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.createButton, isCreating && { opacity: 0.7 }]} 
            onPress={submitTask}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Task →</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    opacity: 0.95,
    resizeMode: 'cover',
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
    fontSize: 18,
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
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C3165',
    marginBottom: 20,
    marginTop: 10,
  },
  formCard: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1C3165',
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
    marginTop: 15,
    marginBottom: 8,
  },
  yearSubLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0AEC0',
    marginBottom: 8,
    marginTop: 5,
  },
  input: {
    backgroundColor: '#EDF2F7',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D3748',
    marginBottom: 10,
  },
  multiInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: '#1C3165',
    borderColor: '#1C3165',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#1C3165',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});