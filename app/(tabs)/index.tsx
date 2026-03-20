import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '@/context/auth';

export default function HomeTabScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.card}>
        <Text style={styles.title}>Welcome to SRMS</Text>
        <Text style={styles.subtitle}>{user ? `Hello, ${user.name}` : 'You are signed in'}</Text>

        <Text style={styles.description}>Use the tabs below to explore features and manage your student life.</Text>

        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={logout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDE7B5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#F2856D',
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFF',
    lineHeight: 24,
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#FFF',
    width: 180,
    height: 48,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#F2856D',
    fontSize: 18,
    fontWeight: 'bold',
  },
});