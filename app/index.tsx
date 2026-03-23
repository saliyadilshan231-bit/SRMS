import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  async function handleGetStarted() {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (error) {
      console.warn('AsyncStorage write failed in onboarding:', error);
    }
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={require('../assets/images/icon.png')} style={styles.image} resizeMode="contain" />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to SRMS</Text>
          <Text style={styles.title2}>Your All-in-One Student Success Platform</Text>

          <View style={styles.card2}>
            <Text style={styles.description1}>Manage Your Tasks</Text>
            <Text style={styles.description}>Plan, track, and complete your academic tasks.</Text>
          </View>

          <View style={styles.card2}>
            <Text style={styles.description1}>Join Kuppi Sessions</Text>
            <Text style={styles.description}>Learn and collaborate with your peers.</Text>
          </View>

          <View style={styles.card2}>
            <Text style={styles.description1}>Find Wellbeing Support</Text>
            <Text style={styles.description}>Access counseling and stress relief tools.</Text>
          </View>

          <View style={styles.card2}>
            <Text style={styles.description1}>Get Feedback & AI chatbot</Text>
            <Text style={styles.description}>Receive guidance and 24/7 chatbot support.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#F2856D',
    width: width * 0.95,
    height: '98%',
    borderRadius: 40,
    padding: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
  },
  card2: {
    backgroundColor: '#f0ac9c',
    borderRadius: 20,
    padding: 8,
    paddingVertical: 10,
    marginBottom: 15,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  textContainer: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  title2: {
    fontSize: 19,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#FFF',
    lineHeight: 22,
    opacity: 0.9,
  },
  description1: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 7,
  },
  button: {
    backgroundColor: '#FFF',
    width: '100%',
    height: 50,
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
