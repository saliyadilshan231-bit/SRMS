import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/auth';
import { Stack } from 'expo-router';
import React from 'react';
import { useTheme } from '@/context/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface SettingItemProps {
  iconName: any; // Type according to your IconSymbol definitions
  title: string;
  subtitle: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isFirst?: boolean;
  isLast?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  iconName,
  title,
  subtitle,
  onPress,
  rightElement,
  isFirst,
  isLast,
}) => {
  const colors = useThemeColors();
  
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        isFirst && styles.settingItemFirst,
        isLast && styles.settingItemLast,
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
          <IconSymbol size={22} name={iconName} color={colors.iconHeader} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.settingSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
        </View>
      </View>
      {rightElement || <IconSymbol size={16} name="chevron.right" color={colors.border} />}
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Blue Header Section */}
      <View style={[styles.blueHeader, isDark && { backgroundColor: colors.card }]}>
        <SafeAreaView>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your account & preferences</Text>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* User Profile Card */}
        <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.iconBg }]}>
            <Text style={[styles.avatarText, { color: colors.iconHeader }]}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.userText}>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.userEmail, { color: colors.subtext }]}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.iconBg }]}>
            <IconSymbol size={16} name="pencil" color={colors.iconHeader} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? colors.accent : colors.primary }]}>PREFERENCES</Text>
        <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem
            iconName="bell.fill"
            title="Notifications"
            subtitle="Receive push & email updates"
            isFirst
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#EDF2F7', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingItem
            iconName="moon.fill"
            title="Dark Mode"
            subtitle={isDark ? "On" : "Off"}
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#EDF2F7', true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingItem
            iconName="globe"
            title="Language"
            subtitle="English (Default)"
            isLast
          />
        </View>

        {/* Account Section */ }
        <Text style={[styles.sectionTitle, { color: isDark ? colors.accent : colors.primary }]}>ACCOUNT</Text>
        <View style={[styles.whiteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem
            iconName="lock.fill"
            title="Change Password"
            subtitle="Update your security credentials"
            isFirst
            onPress={() => { }}
          />
          <SettingItem
            iconName="shield.fill"
            title="Privacy & Security"
            subtitle="Manage data & permissions"
            onPress={() => { }}
          />
          <SettingItem
            iconName="info.circle.fill"
            title="About SRMS"
            subtitle="Version 1.0.0"
            isLast
            onPress={() => { }}
          />
        </View>

        {/* Session Section & Logout */}
        <Text style={[styles.sectionTitle, { color: isDark ? colors.accent : colors.primary }]}>SESSION</Text>
        <TouchableOpacity 
          style={[
            styles.logoutButton, 
            { backgroundColor: isDark ? 'rgba(229,62,62,0.1)' : '#FFF5F5', borderColor: isDark ? '#E53E3E' : '#FED7D7' }
          ]} 
          onPress={logout}
        >
          <IconSymbol size={18} name="rectangle.portrait.and.arrow.right" color="#E53E3E" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer Version Text */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>
            SRMS v1.0.0 · Student Resource Management System
          </Text>
        </View>
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC', // Light background below blue header
  },
  blueHeader: {
    backgroundColor: '#0B173B', // Main blue color from image
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    zIndex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    marginTop: 20, // Separate from header instead of overlap
    paddingBottom: 20,
    zIndex: 2,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // White for user card
    borderRadius: 25,
    padding: 15,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B173B',
  },
  userText: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0B173B',
  },
  userEmail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B173B', // Blue section title color
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 5,
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    overflow: 'hidden', // Required to respect inner item corner radius
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  settingItemFirst: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  settingItemLast: {
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    borderBottomWidth: 0, // No border on the last item
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF4FF', // Light blue icon bg
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F5', // Light red for logout
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  logoutText: {
    color: '#E53E3E', // Red logout text
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '500',
  },
});