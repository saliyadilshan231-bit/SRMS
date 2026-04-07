import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth';
import { useTaskManager } from '@/context/task-manager';
import { useTheme } from '@/context/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ionicons } from '@expo-vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface ProjectCard {
  id: string;
  title: string;
  description: string;
  icon: any;
  date: string;
  progress: number;
  bgColor: string;
  isDark: boolean;
  accentColor: string;
  route?: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { tasks, sessions } = useTaskManager();
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const [searchText, setSearchText] = useState('');

  const userName = user?.name?.split(' ')[0] || 'Pasindu';

  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

  const dynamicProjects = useMemo(() => {
    const totalTasks = tasks.length;
    const avgProgress = totalTasks > 0
      ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
      : 0;

    // Get latest task date or default
    const latestTask = tasks.length > 0
      ? [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
      : null;

    const taskDate = latestTask
      ? new Date(latestTask.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'No tasks yet';

    return [
      {
        id: '1',
        title: 'Task Management',
        description: totalTasks > 0 ? `${totalTasks} Active Tasks` : 'Organize your academic work',
        icon: 'checkmark.square.fill',
        date: taskDate,
        progress: avgProgress,
        bgColor: '#3A025B',
        isDark: true,
        accentColor: '#FFFFFF',
        route: '/(tabs)/task-insights' as const,
      },
      {
        id: '2',
        title: 'Kuppi Management',
        description: 'Manage study groups',
        icon: 'person.2.fill' as any,
        date: 'June 15, 2025',
        progress: 40,
        bgColor: '#FFFFFF',
        isDark: false,
        accentColor: '#3A025B',
        route: '/(tabs)/focus' as const,
      },
      {
        id: '3',
        title: 'Wellbeing',
        description: 'Track wellness',
        icon: 'heart.fill' as any,
        date: 'June 10, 2025',
        progress: 55,
        bgColor: '#FFFFFF',
        isDark: false,
        accentColor: '#48BB78',
        route: '/(tabs)/wellbeing' as const,
      },
      {
        id: '4',
        title: 'Feedback',
        description: 'Collect insights',
        icon: 'bubble.left.fill' as any,
        date: 'June 05, 2025',
        progress: 30,
        bgColor: '#FFFFFF',
        isDark: false,
        accentColor: '#ECC94B',
        route: '/(tabs)/grade-analyst' as const,
      },
    ];
  }, [tasks]);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const avgProgress = totalTasks > 0
      ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / totalTasks)
      : 0;
    const sessionCount = sessions.length;

    return {
      avgProgress: `${avgProgress}%`,
      sessionCount: String(sessionCount),
      resourceCount: '12'
    };
  }, [tasks, sessions]);

  const [displayDate, setDisplayDate] = useState('');
  const [displayGreeting, setDisplayGreeting] = useState('GOOD MORNING.');

  useEffect(() => {
    const updateHeader = () => {
      const now = new Date();
      const hours = now.getHours();

      // Update Greeting
      if (hours < 12) setDisplayGreeting("GOOD MORNING.");
      else if (hours < 18) setDisplayGreeting("GOOD AFTERNOON.");
      else setDisplayGreeting("GOOD EVENING.");

      // Update Date Format: "Saturday · April 4, 2026"
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      const dateStr = now.toLocaleDateString('en-US', options);
      const formattedDate = dateStr.replace(',', ' ·');
      setDisplayDate(formattedDate);
    };

    updateHeader();
    // Refresh every minute to ensure the greeting/date stays current
    const interval = setInterval(updateHeader, 60000);
    return () => clearInterval(interval);
  }, []);

  const initials = userName.substring(0, 2).toUpperCase() || 'PA';

  // Dynamic Full Month Calendar Logic
  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // Adjust for Monday start (0=Mon, 6=Sun)
    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

    const days = [];
    // Previous month filler
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, isCurrent: false });
    }
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrent: true, isToday: i === today });
    }
    // Next month filler
    const totalSlots = 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, isCurrent: false });
    }
    return days;
  }, [displayDate]); // Recalculate if date changes (once per minute)


  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.navy }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Blue Section */}
      <View style={[styles.blueHeader, { backgroundColor: isDark ? colors.background : colors.navy }]}>
        <SafeAreaView>
          <View style={styles.topBar}>
            {/* Initials Avatar */}
            <View style={[styles.avatarContainer, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <Text style={[styles.avatarText, { color: colors.iconHeader }]}>{initials}</Text>
            </View>

            {/* Notification Bell */}
            <TouchableOpacity
              style={[styles.bellButton, { backgroundColor: colors.iconBg, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/notifications')}
            >
              <Ionicons name="notifications" size={20} color={colors.iconHeader} />
              <View style={styles.redDot} />
            </TouchableOpacity>
          </View>

          <View style={styles.greetingSection}>
            <Text style={[styles.greetingText, { color: isDark ? colors.accent : '#8A9DBA' }]}>{displayGreeting}</Text>
            <Text style={styles.welcomeText}>Welcome Back, {userName}</Text>
            <Text style={[styles.dateText, { color: isDark ? colors.accent : '#8A9DBA' }]}>{displayDate}</Text>
          </View>

          {/* Restored Search Bar styled for new UI */}
          <View style={[styles.searchBar, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
            <IconSymbol size={18} name="magnifyingglass" color={isDark ? colors.accent : '#8A9DBA'} />
            <TextInput
              style={[styles.searchInput, { color: colors.white }]}
              placeholder="Search tasks..."
              placeholderTextColor={isDark ? colors.accent : '#8A9DBA'}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <Text style={styles.statNumber}>{stats.sessionCount}</Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.accent : '#8A9DBA' }]}>Sessions</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <Text style={styles.statNumber}>{stats.avgProgress}</Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.accent : '#8A9DBA' }]}>Progress</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.iconBg, borderColor: colors.border }]}>
              <Text style={styles.statNumber}>{stats.resourceCount}</Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.accent : '#8A9DBA' }]}>Resources</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Bottom Content Area */}
      <View style={[styles.whiteContentWrapper, { backgroundColor: isDark ? colors.background : colors.navy }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.whiteContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.white : colors.navy }]}>Ongoing Projects</Text>

          {/* Feature Cards properly mapping old data */}
          {dynamicProjects.map((project: any, index: number) => {
            const iconBgColors = ['#E0EEFF', '#F3EAFF', '#FFF5E0', '#E0F8EA'];
            const iconBgColor = iconBgColors[index % iconBgColors.length];
            const iconColor = ['#5C8EE6', '#8D55CD', '#D29922', '#38A169'][index % iconBgColors.length];

            return (
              <TouchableOpacity
                key={project.id}
                style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => project.route && router.push(project.route)}
              >
                <View style={[styles.featureIconBg, { backgroundColor: isDark ? colors.iconBg : iconBgColor }]}>
                  <IconSymbol name={project.icon} size={24} color={isDark ? colors.white : iconColor} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>{project.title}</Text>
                  <Text style={[styles.featureSubtitle, { color: colors.subtext }]}>{project.description}</Text>
                  <Text style={[styles.projectDate, { color: isDark ? colors.accent : '#A0AEC0' }]}>{project.date}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={isDark ? colors.accent : "#D1D5DB"} />
              </TouchableOpacity>
            );
          })}

          {/* Motivation Card */}
          <View style={[styles.motivationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.motivationIconBg, { backgroundColor: colors.iconBg }]}>
              <IconSymbol name="square.grid.2x2.fill" size={20} color={isDark ? colors.accent : "#8A9BB1"} />
            </View>
            <Text style={[styles.motivationText, { color: colors.subtext }]}>
              Small steps every day add up to big results —{'\n'}keep going, {userName}!
            </Text>
          </View>

          {/* New Full Width Calendar */}
          <View style={[styles.calendarBoxFull, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeaderRow}>
              <Text style={[styles.calendarTitle, { color: colors.text }]}>{monthName} Calendar</Text>
              <View style={styles.calendarDot} />
            </View>
            <View style={styles.calendarDaysRow}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <Text key={i} style={[styles.calendarDayText, { color: colors.subtext }]}>{d}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((item: any, idx: number) => (
                <View key={idx} style={styles.calendarSlot}>
                  {item.isToday ? (
                    <View style={[styles.calendarDateActiveBg, { backgroundColor: isDark ? colors.white : colors.navy }]}>
                      <Text style={[styles.calendarDateActiveText, { color: isDark ? colors.navy : colors.white }]}>{item.day}</Text>
                    </View>
                  ) : (
                    <Text style={[styles.calendarDateText, { color: colors.text }, !item.isCurrent && { color: isDark ? colors.primary : '#CBD5E0' }]}>
                      {item.day}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomRow}>
            {/* Support Box */}
            <View style={[styles.supportBox, { backgroundColor: isDark ? colors.card : '#1C3165', borderColor: colors.border, borderWidth: isDark ? 1 : 0 }]}>
              <View>
                <Text style={styles.supportTitleSmall}>DO YOU NEED ANY</Text>
                <Text style={styles.supportTitleLarge}>SUPPORT?</Text>
              </View>
              <TouchableOpacity style={styles.supportButton}>
                <Text style={styles.supportButtonText}>Get Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C3165',
  },
  blueHeader: {
    backgroundColor: '#1C3165',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1D2A51',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#293C6E',
  },
  avatarText: {
    color: '#8A9DBA',
    fontWeight: '700',
    fontSize: 15,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#1D2A51',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#293C6E',
  },
  redDot: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F56565',
  },
  greetingSection: {
    marginTop: 25,
  },
  greetingText: {
    color: '#8A9DBA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  welcomeText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  dateText: {
    color: '#8A9DBA',
    fontSize: 12,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D2A51',
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 50,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#293C6E',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1D2A51',
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#293C6E',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#8A9DBA',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  whiteContentWrapper: {
    flex: 1,
    backgroundColor: '#1C3165',
  },
  whiteContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionTitle: {
    color: '#1C3165',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    color: '#1C3165',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureSubtitle: {
    color: '#8A9DBA',
    fontSize: 13,
  },

  projectDate: {
    fontSize: 10,
    color: '#A0AEC0',
    fontWeight: '600',
    marginTop: 5,
  },
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    marginBottom: 25,
  },
  motivationIconBg: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  motivationText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  supportBox: {
    width: '100%',
    backgroundColor: '#1C3165',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  supportTitleSmall: {
    color: '#8A9DBA',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  supportTitleLarge: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 0,
  },
  supportButton: {
    backgroundColor: '#ECC94B',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  supportButtonText: {
    color: '#1C3165',
    fontWeight: '800',
    fontSize: 13,
  },
  calendarBoxFull: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 15,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calendarTitle: {
    color: '#1C3165',
    fontWeight: '800',
    fontSize: 16,
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ECC94B',
  },
  calendarDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  calendarDayText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarSlot: {
    width: '14%',
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  calendarDateText: {
    fontSize: 13,
    color: '#4A5568',
    fontWeight: '700',
  },
  calendarDateActiveBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1C3165',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDateActiveText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
