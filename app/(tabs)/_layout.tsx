import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function TabLayout() {
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtext,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.card, borderTopColor: colors.border }],
        tabBarLabelStyle: styles.tabBarLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
          title: 'Tasks',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="checkmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null,
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          href: null,
          title: 'Focus',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="timer" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="notificationHub"
        options={{
          href: null,
          title: 'Notification Hub',
        }}
      />
      <Tabs.Screen
        name="task-insights"
        options={{
          href: null,
          title: 'Task Insights',
        }}
      />
      <Tabs.Screen
        name="grade-analyst"
        options={{
          href: null,
          title: 'Grade Analyst',
        }}
      />
      <Tabs.Screen
        name="task-details"
        options={{
          href: null,
          title: 'Task Details',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="gear" color={color} />,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="info.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="register"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopColor: '#E8E8E8',
    borderTopWidth: 1,
    height: 70,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});