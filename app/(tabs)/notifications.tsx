import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager, TaskItem } from '@/context/task-manager';
import { Stack } from 'expo-router';
import React, { useMemo } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  icon: React.ComponentProps<typeof IconSymbol>['name'];
  color: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const { tasks } = useTaskManager();

  const dynamicNotifications: Notification[] = useMemo(() => {
    const list: Notification[] = [];
    const now = new Date();

    tasks.forEach((task: TaskItem) => {
      if (task.deadline) {
        // Attempt to parse deadline. Format might be "YYYY-MM-DD HH:MM" or ISO
        const d = new Date(task.deadline);
        const diffHours = (d.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0 && task.progress < 100) {
          list.push({
            id: `overdue-${task.id}`,
            title: 'Overdue Task',
            message: `"${task.title}" was due at ${task.deadline.split('T')[0]}`,
            timestamp: 'Action required',
            icon: 'exclamationmark.triangle.fill',
            color: '#E53E3E',
            read: false,
          });
        } else if (diffHours > 0 && diffHours < 24) {
          list.push({
            id: `upcoming-${task.id}`,
            title: 'Upcoming Deadline',
            message: `"${task.title}" is due soon!`,
            timestamp: 'In less than 24h',
            icon: 'clock.fill',
            color: '#D69E2E',
            read: false,
          });
        }
      }
    });

    // Add completion notifications if any tasks are 100%
    tasks.filter(t => t.progress === 100).slice(0, 3).forEach(task => {
        list.push({
            id: `done-${task.id}`,
            title: 'Task Completed',
            message: `Well done! You finished "${task.title}".`,
            timestamp: 'Great job!',
            icon: 'checkmark.circle.fill',
            color: '#48BB78',
            read: true
        });
    });

    // Add static ones for filler if empty
    if (list.length === 0) {
      list.push({
        id: 'welcome',
        title: 'Welcome to SRMS',
        message: 'Your tasks are now synced with Appwrite Cloud.',
        timestamp: 'Just now',
        icon: 'checkmark.circle.fill',
        color: '#48BB78',
        read: true,
      });
    }

    return list;
  }, [tasks]);

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadNotification,
      ]}
      activeOpacity={0.7}
    >
      <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
        <IconSymbol size={24} name={item.icon} color={item.color} />
      </View>

      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={1}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      {!item.read && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity>
          <IconSymbol size={24} name="ellipsis" color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={dynamicNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A5C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  unreadNotification: {
    backgroundColor: '#F5F5F7',
    borderLeftWidth: 4,
    borderLeftColor: '#0A0A5C',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0A5C',
    marginLeft: 8,
  },
});
