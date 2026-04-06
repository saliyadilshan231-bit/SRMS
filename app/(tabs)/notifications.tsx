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
  const { notifications, markNotifAsRead, deleteNotification, markAllNotifsAsRead, isSyncing } = useTaskManager();

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'urgent':
        return { name: 'exclamationmark.triangle.fill' as any, color: '#E53E3E' };
      case 'warning':
        return { name: 'clock.fill' as any, color: '#D69E2E' };
      case 'smart':
        return { name: 'robot.fill' as any, color: '#4A5568' };
      case 'success':
        return { name: 'checkmark.circle.fill' as any, color: '#48BB78' };
      default:
        return { name: 'bell.fill' as any, color: '#4299E1' };
    }
  };

  const renderNotification = ({ item }: { item: any }) => {
    const config = getIconConfig(item.type);
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          item.unread && styles.unreadNotification,
        ]}
        activeOpacity={0.7}
        onPress={() => item.unread && markNotifAsRead(item.id)}
      >
        <View style={[styles.iconBox, { backgroundColor: config.color + '20' }]}>
          <IconSymbol size={24} name={config.name} color={config.color} />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notifHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <TouchableOpacity onPress={() => deleteNotification(item.id)}>
               <IconSymbol size={16} name="xmark" color="#999" />
            </TouchableOpacity>
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.tagText}>{item.tag}</Text>
            <Text style={styles.timestamp}>{item.time}</Text>
          </View>
        </View>

        {item.unread && <View style={styles.unreadBadge} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.subtitle}>
            {notifications.filter(n => n.unread).length} Unread Messages
          </Text>
        </View>
        <TouchableOpacity onPress={markAllNotifsAsRead}>
          <Text style={styles.clearAllText}>Mark all as read</Text>
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
        ListEmptyComponent={
          !isSyncing ? (
            <View style={styles.emptyContainer}>
              <IconSymbol size={64} name="bell.slash" color="#FFFFFF40" />
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySub}>Your task alerts will appear here</Text>
            </View>
          ) : null
        }
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
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginTop: 2,
  },
  clearAllText: {
    color: '#4299E1',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F0F4FF',
    borderLeftWidth: 4,
    borderLeftColor: '#4299E1',
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
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#4A4A4A',
    lineHeight: 18,
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4299E1',
    backgroundColor: '#4299E115',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4299E1',
    position: 'absolute',
    top: 14,
    right: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 14,
    color: '#FFFFFF80',
    marginTop: 8,
    textAlign: 'center',
  },
});
