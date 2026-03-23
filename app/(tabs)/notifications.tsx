import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack } from 'expo-router';
import React from 'react';
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

const notifications: Notification[] = [
  {
    id: '1',
    title: 'Task Reminder',
    message: 'You have an upcoming assignment due tomorrow',
    timestamp: '2 hours ago',
    icon: 'checkmark.circle.fill',
    color: '#0A0A5C',
    read: false,
  },
  {
    id: '2',
    title: 'Kuppi Session',
    message: 'New study group session scheduled for Friday',
    timestamp: '4 hours ago',
    icon: 'person.2.fill',
    color: '#D4A5C5',
    read: false,
  },
  {
    id: '3',
    title: 'Wellbeing Check-in',
    message: 'How are you feeling today?',
    timestamp: '1 day ago',
    icon: 'heart.fill',
    color: '#E8B4A8',
    read: true,
  },
  {
    id: '4',
    title: 'Feedback Response',
    message: 'You received new feedback on your submission',
    timestamp: '2 days ago',
    icon: 'bubble.right.fill',
    color: '#C4B5AB',
    read: true,
  },
];

export default function NotificationsScreen() {
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
          <IconSymbol size={24} name="ellipsis" color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
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
    color: '#1a1a1a',
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
