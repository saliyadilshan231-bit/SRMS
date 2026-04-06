import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTaskManager } from '@/context/task-manager';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Types and static data removed - now imported from context

export default function NotificationHubScreen() {
  const router = useRouter();
  const { notifications: items, markAllNotifsAsRead, markNotifAsRead, deleteNotification } = useTaskManager();

  const stats = useMemo(() => {
    const urgent = items.filter((n) => n.type === 'urgent').length;
    const warning = items.filter((n) => n.type === 'warning').length;
    const smart = items.filter((n) => n.type === 'smart').length;
    const unread = items.filter((n) => n.unread).length;
    return { urgent, upcoming: warning, smartTips: smart, unread };
  }, [items]);

  const smartSuggestion = useMemo(() => {
    return items.find(n => n.type === 'smart' || n.type === 'urgent');
  }, [items]);

  const displayDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  function getNotificationStyle(type: string) {
    const styleMap: Record<string, { bg: string; icon: string; dot: string; tag: string }> = {
      urgent: { bg: '#FFEBEE', icon: '🚨', dot: '#E53935', tag: '#FFEBEE' },
      warning: { bg: '#FFF3E0', icon: '⏰', dot: '#FB8C00', tag: '#FFF3E0' },
      smart: { bg: '#E8EAF6', icon: '🤖', dot: '#0B173B', tag: '#E8EAF6' },
      success: { bg: '#E8F5E9', icon: '✅', dot: '#43A047', tag: '#E8F5E9' },
      info: { bg: '#E3F2FD', icon: '📋', dot: '#1976D2', tag: '#E3F2FD' },
      muted: { bg: '#F0F0F0', icon: '📢', dot: '#BDBDBD', tag: '#E8EAF6' },
    };
    return styleMap[type] || styleMap.muted;
  }

  function getTagColor(type: string) {
    const colorMap: Record<string, string> = {
      urgent: '#E53935',
      warning: '#FB8C00',
      smart: '#0B173B',
      success: '#43A047',
      info: '#1976D2',
      muted: '#0B173B',
    };
    return colorMap[type] || '#0B173B';
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B173B" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* HERO HEADER */}
      <View style={styles.hero}>
        <View style={styles.heroNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.push('/(tabs)/task-insights')}>
            <IconSymbol size={20} name="chevron.left" color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Notifications</Text>
          <View style={styles.navBtnWithDot}>
            <IconSymbol size={20} name="bell.fill" color="#FFFFFF" />
            {stats.unread > 0 && <View style={styles.notifDot} />}
          </View>
        </View>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaText}>{stats.unread} unread</Text>
          <View style={styles.heroMetaDot} />
          <Text style={styles.heroMetaText}>Today, {displayDate}</Text>
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* SUMMARY STRIP */}
          <View style={styles.strip}>
            <View style={styles.stripCard}>
              <Text style={styles.stripIcon}>🔴</Text>
              <Text style={[styles.stripVal, styles.stripValRed]}>{stats.urgent}</Text>
              <Text style={styles.stripLabel}>Urgent</Text>
            </View>
            <View style={styles.stripCard}>
              <Text style={styles.stripIcon}>🟡</Text>
              <Text style={[styles.stripVal, styles.stripValOrange]}>{stats.upcoming}</Text>
              <Text style={styles.stripLabel}>Upcoming</Text>
            </View>
            <View style={styles.stripCard}>
              <Text style={styles.stripIcon}>🤖</Text>
              <Text style={[styles.stripVal, styles.stripValPurple]}>{stats.smartTips}</Text>
              <Text style={styles.stripLabel}>Smart Tips</Text>
            </View>
          </View>

          {/* SMART SUGGESTION */}
          {smartSuggestion && (
            <View style={styles.smartWrap}>
              <View style={styles.smartCard}>
                <Text style={styles.smartIcon}>🤖</Text>
                <View style={styles.smartPill}>
                  <Text style={styles.smartPillText}>✨ AI Suggestion</Text>
                </View>
                <Text style={styles.smartTitle}>{smartSuggestion.title}</Text>
                <Text style={styles.smartBody}>
                  {smartSuggestion.body}
                </Text>
                <View style={styles.smartActions}>
                  <TouchableOpacity
                    style={styles.smartBtnWhite}
                    onPress={() => {
                      markNotifAsRead(smartSuggestion.id);
                      router.push('/(tabs)/focus');
                    }}
                  >
                    <Text style={styles.smartBtnWhiteText}>▶ Start Focus</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smartBtnGhost}
                    onPress={() => markNotifAsRead(smartSuggestion.id)}
                  >
                    <Text style={styles.smartBtnGhostText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* SECTION LABEL */}
          <View style={styles.secLabel}>
            <Text style={styles.secLabelText}>{items.length > 0 ? 'Recent' : 'No Notifications'}</Text>
            {stats.unread > 0 && (
              <TouchableOpacity onPress={markAllNotifsAsRead}>
                <Text style={styles.secLabelAction}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* NOTIFICATION LIST */}
          <View style={styles.notifList}>
            {items.map((notification, index) => {
              const style = getNotificationStyle(notification.type);
              const tagColor = getTagColor(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  onPress={() => markNotifAsRead(notification.id)}
                  style={[
                    styles.notifItem,
                    notification.unread && styles.notifItemUnread,
                    index < items.length - 1 && styles.notifItemBorder,
                  ]}
                >
                  {notification.unread && (
                    <View
                      style={[styles.unreadBar, { backgroundColor: style.dot }]}
                    />
                  )}
                  <View style={[styles.udot, { backgroundColor: style.dot }]} />
                  <View style={[styles.notifIcon, { backgroundColor: style.bg }]}>
                    <Text style={styles.notifIconText}>{notification.icon}</Text>
                  </View>
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeaderRow}>
                      <Text style={styles.notifTitle}>{notification.title}</Text>
                      <TouchableOpacity 
                        onPress={() => deleteNotification(notification.id)}
                        style={styles.deleteBtn}
                      >
                        <IconSymbol size={16} name="trash.fill" color="#A8AECF" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.notifBody}>{notification.body}</Text>
                    <View style={styles.notifFooter}>
                      <View style={[styles.ntag, { backgroundColor: style.tag }]}>
                        <Text style={[styles.ntagText, { color: tagColor }]}>
                          {notification.tag}
                        </Text>
                      </View>
                      <Text style={styles.notifTime}>{notification.time}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FF',
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
    backgroundColor: '#0B173B',
  },
  heroNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  navBtn: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  navBtnWithDot: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E53935',
    borderWidth: 2,
    borderColor: '#F4F5FF',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  heroMetaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  strip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  stripCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DDE0F5',
    shadowColor: '#0B173B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 3,
  },
  stripIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  stripVal: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  stripValRed: {
    color: '#E53935',
  },
  stripValOrange: {
    color: '#FB8C00',
  },
  stripValPurple: {
    color: '#0B173B',
  },
  stripLabel: {
    fontSize: 10,
    color: '#7178A8',
    marginTop: 3,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  smartWrap: {
    paddingHorizontal: 18,
    paddingBottom: 4,
  },
  smartCard: {
    backgroundColor: '#0B173B',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0B173B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 8,
  },
  smartIcon: {
    fontSize: 34,
    opacity: 0.2,
    marginBottom: 10,
  },
  smartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  smartPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  smartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 18,
  },
  smartBody: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 18,
    marginBottom: 14,
  },
  smartActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smartBtnWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  smartBtnWhiteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B173B',
  },
  smartBtnGhost: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  smartBtnGhostText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 8,
  },
  secLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B173B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secLabelAction: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B173B',
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
  },
  notifList: {
    marginHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDE0F5',
    overflow: 'hidden',
    shadowColor: '#0B173B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 3,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
  },
  notifItemUnread: {
    backgroundColor: 'rgba(92,107,192,0.05)',
  },
  notifItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5FF',
  },
  unreadBar: {
    position: 'absolute',
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderRadius: 0,
  },
  udot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 19,
  },
  notifIconText: {
    fontSize: 19,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1C2E',
    lineHeight: 17,
  },
  notifBody: {
    fontSize: 11,
    color: '#7178A8',
    marginTop: 3,
    lineHeight: 17,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  ntag: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 50,
  },
  ntagText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notifTime: {
    fontSize: 10,
    color: '#A8AECF',
    fontWeight: '600',
  },
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteBtn: {
    padding: 4,
    opacity: 0.6,
  },
});
