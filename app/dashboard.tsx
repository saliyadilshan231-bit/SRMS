import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth';
import { Stack, useRouter } from 'expo-router';
import { SymbolViewProps } from 'expo-symbols';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface ProjectCard {
  id: string;
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
  date: string;
  progress: number;
  primaryColor: string;
}

const projects: ProjectCard[] = [
  {
    id: '1',
    title: 'Task Management',
    description: 'Organize your academic work',
    icon: 'checkmark.circle.fill',
    date: 'May 30, 2025',
    progress: 65,
    primaryColor: '#2D5A7B',
  },
  {
    id: '2',
    title: 'Kuppi Management',
    description: 'Manage study groups',
    icon: 'person.2.fill',
    date: 'May 30, 2025',
    progress: 40,
    primaryColor: '#E8B4A8',
  },
  {
    id: '3',
    title: 'Wellbeing',
    description: 'Track wellness',
    icon: 'heart.fill',
    date: 'May 30, 2025',
    progress: 55,
    primaryColor: '#D4A5C5',
  },
  {
    id: '4',
    title: 'Feedback Management',
    description: 'Collect insights',
    icon: 'bubble.right.fill',
    date: 'May 30, 2025',
    progress: 80,
    primaryColor: '#C4B5AB',
  },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  const getProjectRoute = (projectId: string) => {
    switch (projectId) {
      case '1':
        return '/(tabs)/task-insights' as const;
      case '2':
        return '/(tabs)/focus' as const;
      case '3':
        return '/(tabs)/progress' as const;
      case '4':
        return '/(tabs)/grade-analyst' as const;
      default:
        return undefined;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topStripWrap}>
          <View style={styles.topStripCard}>
            <TouchableOpacity style={styles.topStripIconBtn} activeOpacity={0.85}>
              <IconSymbol size={24} name="square.grid.2x2.fill" color="#65707D" />
            </TouchableOpacity>

            <Text style={styles.topStripTitle}>Home</Text>

            <TouchableOpacity
              style={styles.topStripIconBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(tabs)/notifications')}>
              <IconSymbol size={22} name="bell.fill" color="#18326E" />
              <View style={styles.notifyDot} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hi {user?.name?.split(' ')[0] || 'User'}!</Text>
            <Text style={styles.subGreeting}>{getGreeting()}</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <IconSymbol size={20} name="magnifyingglass" color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor="#CCC"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeTitle}>Welcome!</Text>
            <Text style={styles.welcomeDesc}>Let's schedule your projects</Text>
          </View>
          <View style={styles.welcomeIconContainer}>
            <IconSymbol size={60} name="laptopcomputer" color="#0A0A5C" />
          </View>
        </View>

        <View style={styles.projectsHeader}>
          <Text style={styles.projectsTitle}>Ongoing Projects</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>view all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.projectsGrid}>
          {projects.slice(0, 2).map((project) => (
            <ProjectCardItem
              key={project.id}
              project={project}
              onPress={() => {
                const route = getProjectRoute(project.id);
                if (route) {
                  router.push(route);
                }
              }}
            />
          ))}
        </View>

        <View style={styles.projectsGrid}>
          {projects.slice(2, 4).map((project) => (
            <ProjectCardItem
              key={project.id}
              project={project}
              onPress={() => {
                const route = getProjectRoute(project.id);
                if (route) {
                  router.push(route);
                }
              }}
            />
          ))}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProjectCardItem({
  project,
  onPress,
}: {
  project: ProjectCard;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.projectCard, { backgroundColor: project.id === '1' ? '#2D5A7B' : '#F5F5F7' }]}
      activeOpacity={0.8}
      onPress={onPress}>
      <View style={styles.projectHeader}>
        <View
          style={[
            styles.projectIconBox,
            { backgroundColor: project.id === '1' ? 'rgba(255,255,255,0.2)' : '#E8E8EA' },
          ]}>
          <IconSymbol
            size={24}
            name={project.icon}
            color={project.id === '1' ? '#FFF' : project.primaryColor}
          />
        </View>
        <TouchableOpacity>
          <IconSymbol size={16} name="ellipsis" color={project.id === '1' ? '#FFF' : '#999'} />
        </TouchableOpacity>
      </View>

      <View style={styles.projectMeta}>
        <Text
          style={[
            styles.projectDate,
            { color: project.id === '1' ? 'rgba(255,255,255,0.7)' : '#999' },
          ]}>
          {project.date}
        </Text>
        <Text style={[styles.projectTitle, { color: project.id === '1' ? '#FFF' : '#1a1a1a' }]}>
          {project.title}
        </Text>
        <Text
          style={[
            styles.projectDescription,
            { color: project.id === '1' ? 'rgba(255,255,255,0.8)' : '#666' },
          ]}>
          {project.description}
        </Text>
      </View>

      <View style={styles.projectProgress}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${project.progress}%`,
                backgroundColor: project.id === '1' ? '#FFF' : '#0A0A5C',
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: project.id === '1' ? '#FFF' : '#666' }]}>
          {project.progress}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A5C',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topStripWrap: {
    height: 84,
    marginHorizontal: -16,
    marginBottom: 12,
    backgroundColor: '#0A0A5C',
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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  subGreeting: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A0A5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },
  welcomeCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#0A0A5C',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D5A7B',
    marginBottom: 4,
  },
  welcomeDesc: {
    fontSize: 13,
    color: '#999',
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  viewAll: {
    fontSize: 13,
    color: '#0A0A5C',
    fontWeight: '600',
  },
  projectsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  projectCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectMeta: {
    marginBottom: 12,
  },
  projectDate: {
    fontSize: 11,
    marginBottom: 4,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 12,
  },
  projectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 28,
  },
});