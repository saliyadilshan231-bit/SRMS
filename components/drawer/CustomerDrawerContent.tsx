import { DrawerContentScrollView } from '@react-navigation/drawer';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NAV_ITEMS = [
  { id: 'index',         label: 'Dashboard',    icon: '⊞' },
  { id: 'mood-checkin',  label: 'Mood Check-in', icon: '😊' },
  { id: 'counseling',    label: 'Counseling',    icon: '💬' },
  { id: 'recovery-plan', label: 'Recovery Plan', icon: '🛡️' },
  { id: 'insights',      label: 'Insights',      icon: '📊' },
  { id: 'settings',      label: 'Settings',      icon: '⚙️' },
];

export default function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (id: string) => {
    if (id === 'index') return pathname === '/' || pathname === '/index';
    return pathname.includes(id);
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
      <View style={styles.brand}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>💚</Text>
        </View>
        <View>
          <Text style={styles.brandName}>SRMS Wellbeing</Text>
          <Text style={styles.brandSub}>Support Portal</Text>
        </View>
      </View>

      <FlatList
        data={NAV_ITEMS}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const active = isActive(item.id);
          return (
            <TouchableOpacity
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => router.push(item.id === 'index' ? '/' : `/${item.id}`as any)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>IG</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Inothma Gunawardhana</Text>
          <Text style={styles.userSub}>CS-2024</Text>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C2B2B', paddingBottom: 16 },
  brand: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#2D3748', gap: 10 },
  brandIcon: { width: 36, height: 36, backgroundColor: '#2DD4BF', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { fontSize: 18 },
  brandName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  brandSub: { color: '#A0AEC0', fontSize: 11 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 8, marginVertical: 2, borderRadius: 8, gap: 12 },
  navItemActive: { backgroundColor: '#2DD4BF' },
  navIcon: { fontSize: 16 },
  navLabel: { color: '#A0AEC0', fontSize: 14 },
  navLabelActive: { color: '#fff', fontWeight: '600' },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2D3748', marginTop: 'auto', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#2DD4BF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  userSub: { color: '#A0AEC0', fontSize: 11 },
});