import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  type TaskCategory,
  type TaskItem,
  type TaskType,
  useTaskManager,
} from '@/context/task-manager';

const taskTypes: TaskType[] = ['Assignment', 'Lab', 'Quiz', 'Study'];
const categories: TaskCategory[] = ['Individual', 'Group', 'Revision'];

type ViewMode = 'list' | 'card' | 'module';
type SortMode = 'date' | 'module' | 'alpha';

export default function TasksScreen() {
  const { modules, tasks, createTask } = useTaskManager();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('Assignment');
  const [moduleName, setModuleName] = useState(modules[0]);
  const [selectedCategories, setSelectedCategories] = useState<TaskCategory[]>(['Individual']);
  const [deadline, setDeadline] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [fileInput, setFileInput] = useState('');

  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('All');
  const [filterType, setFilterType] = useState<'All' | TaskType>('All');
  const [filterCategory, setFilterCategory] = useState<'All' | TaskCategory>('All');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filteredTasks = useMemo(() => {
    let data = [...tasks];

    if (filterModule !== 'All') {
      data = data.filter((task) => task.module === filterModule);
    }

    if (filterType !== 'All') {
      data = data.filter((task) => task.type === filterType);
    }

    if (filterCategory !== 'All') {
      data = data.filter((task) => task.categories.includes(filterCategory));
    }

    const keyword = search.trim().toLowerCase();
    if (keyword) {
      data = data.filter(
        (task) =>
          task.title.toLowerCase().includes(keyword) ||
          task.description.toLowerCase().includes(keyword) ||
          task.module.toLowerCase().includes(keyword)
      );
    }

    if (sortMode === 'alpha') {
      data.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortMode === 'module') {
      data.sort((a, b) => a.module.localeCompare(b.module));
    } else {
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return data;
  }, [tasks, filterModule, filterType, filterCategory, search, sortMode]);

  const groupedByModule = useMemo(() => {
    return filteredTasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
      if (!acc[task.module]) acc[task.module] = [];
      acc[task.module].push(task);
      return acc;
    }, {});
  }, [filteredTasks]);

  function toggleCategory(category: TaskCategory) {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        const next = prev.filter((item) => item !== category);
        return next.length ? next : ['Individual'];
      }
      return [...prev, category];
    });
  }

  function submitTask() {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a task title.');
      return;
    }

    createTask({
      title,
      description,
      type,
      categories: selectedCategories,
      module: moduleName,
      deadline: deadline.trim() || undefined,
      links: linkInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      files: fileInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });

    setTitle('');
    setDescription('');
    setType('Assignment');
    setModuleName(modules[0]);
    setSelectedCategories(['Individual']);
    setDeadline('');
    setLinkInput('');
    setFileInput('');
    Alert.alert('Task created', 'Your new task was added successfully.');
  }

  function renderTaskCard(task: TaskItem) {
    return (
      <View style={styles.taskCard}>
        <View style={styles.taskHeaderRow}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{task.type}</Text>
          </View>
        </View>

        <Text style={styles.taskMeta}>ID: {task.id}</Text>
        <Text style={styles.taskMeta}>Module: {task.module}</Text>
        <Text style={styles.taskMeta}>Categories: {task.categories.join(', ')}</Text>
        <Text style={styles.taskMeta}>Created: {new Date(task.createdAt).toLocaleString()}</Text>
        <Text style={styles.taskMeta}>Updated: {new Date(task.updatedAt).toLocaleString()}</Text>
        {!!task.description && <Text style={styles.taskDescription}>{task.description}</Text>}

        {!!task.attachments.links.length && (
          <Text style={styles.taskMeta}>Links: {task.attachments.links.join(' | ')}</Text>
        )}

        {!!task.attachments.files.length && (
          <Text style={styles.taskMeta}>Files: {task.attachments.files.join(', ')}</Text>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={viewMode === 'module' ? [] : filteredTasks}
        keyExtractor={(item) => item.id}
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

                <Text style={styles.topStripTitle}>Tasks</Text>

                <TouchableOpacity
                  style={styles.topStripIconBtn}
                  activeOpacity={0.85}
                  onPress={() => router.push('/(tabs)/notifications')}>
                  <IconSymbol size={22} name="bell.fill" color="#18326E" />
                  <View style={styles.notifyDot} />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.pageTitle}>Task Creation & Organization</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Create Task</Text>
              <TextInput style={styles.input} placeholder="Task title" value={title} onChangeText={setTitle} />
              <TextInput
                style={[styles.input, styles.multiInput]}
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>Task Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {taskTypes.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, type === item && styles.chipActive]}
                    onPress={() => setType(item)}>
                    <Text style={[styles.chipText, type === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Module/Course (dropdown style)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {modules.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, moduleName === item && styles.chipActive]}
                    onPress={() => setModuleName(item)}>
                    <Text style={[styles.chipText, moduleName === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Categories (multi-select)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, selectedCategories.includes(item) && styles.chipActive]}
                    onPress={() => toggleCategory(item)}>
                    <Text
                      style={[
                        styles.chipText,
                        selectedCategories.includes(item) && styles.chipTextActive,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Deadline (YYYY-MM-DDTHH:mm:ssZ)"
                value={deadline}
                onChangeText={setDeadline}
              />
              <TextInput
                style={styles.input}
                placeholder="Attachment links (comma separated)"
                value={linkInput}
                onChangeText={setLinkInput}
              />
              <TextInput
                style={styles.input}
                placeholder="Attachment file names (comma separated)"
                value={fileInput}
                onChangeText={setFileInput}
              />

              <TouchableOpacity style={styles.primaryButton} onPress={submitTask}>
                <Text style={styles.primaryButtonText}>Create Task</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Task Organization</Text>

              <TextInput
                style={styles.input}
                placeholder="Search by task name or keyword"
                value={search}
                onChangeText={setSearch}
              />

              <Text style={styles.label}>Filter by Module</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {['All', ...modules].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, filterModule === item && styles.chipActive]}
                    onPress={() => setFilterModule(item)}>
                    <Text style={[styles.chipText, filterModule === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Filter by Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {(['All', ...taskTypes] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, filterType === item && styles.chipActive]}
                    onPress={() => setFilterType(item)}>
                    <Text style={[styles.chipText, filterType === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Filter by Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
                {(['All', ...categories] as const).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, filterCategory === item && styles.chipActive]}
                    onPress={() => setFilterCategory(item)}>
                    <Text style={[styles.chipText, filterCategory === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Sorting</Text>
              <View style={styles.rowWrap}>
                {(['date', 'module', 'alpha'] as SortMode[]).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, sortMode === item && styles.chipActive]}
                    onPress={() => setSortMode(item)}>
                    <Text style={[styles.chipText, sortMode === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Task List Views</Text>
              <View style={styles.rowWrap}>
                {(['list', 'card', 'module'] as ViewMode[]).map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, viewMode === item && styles.chipActive]}
                    onPress={() => setViewMode(item)}>
                    <Text style={[styles.chipText, viewMode === item && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {viewMode === 'module' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Module-wise Grouped View</Text>
                {Object.keys(groupedByModule).length === 0 && (
                  <Text style={styles.emptyText}>No tasks found for current filters.</Text>
                )}
                {Object.entries(groupedByModule).map(([module, moduleTasks]) => (
                  <View key={module} style={styles.groupBlock}>
                    <Text style={styles.groupTitle}>{module}</Text>
                    {moduleTasks.map((task) => (
                      <View key={task.id}>{renderTaskCard(task)}</View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => {
          if (viewMode === 'list' || viewMode === 'card') {
            return renderTaskCard(item);
          }
          return null;
        }}
        ListEmptyComponent={
          viewMode !== 'module' ? <Text style={styles.emptyText}>No tasks found for current filters.</Text> : null
        }
        contentContainerStyle={styles.content}
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
    gap: 12,
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
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D5A7B',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e2e2',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
  },
  multiInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rowScroll: {
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#f7f7f7',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#0A0A5C',
    borderColor: '#0A0A5C',
  },
  chipText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  chipTextActive: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: '#2D5A7B',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#efefef',
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#f0f3ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2D5A7B',
  },
  taskMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 13,
    color: '#2c2c2c',
    marginTop: 6,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  groupBlock: {
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A5C',
    marginBottom: 6,
  },
});

