import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { saveScreenerResult } from '../../lib/appwrite';

interface ClinicalHealthScreenerProps {
  onComplete: () => void;
  onNavigate: (view: string, data?: any) => void;
}

const QUESTIONS = [
  "Feeling nervous, anxious, or on edge?",
  "Not being able to stop or control worrying?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling bad about yourself - or that you are a failure or have let yourself or your family down?",
  "Poor appetite or overeating?",
  "Trouble concentrating on things, such as reading the newspaper or watching television?"
];

const OPTIONS = [
  { label: 'Not at all', score: 0 },
  { label: 'Several days', score: 1 },
  { label: 'More than half the days', score: 2 },
  { label: 'Nearly every day', score: 3 },
];

export default function ClinicalHealthScreener({ onComplete, onNavigate }: ClinicalHealthScreenerProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectOption = (score: number) => {
    setAnswers(prev => ({ ...prev, [currentStep]: score }));

    // Auto-advance after a short delay for a smooth experience
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 350);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to submit a diagnostic.');
      return;
    }

    setIsSaving(true);
    try {
      const flatAnswers = QUESTIONS.map((_, i) => answers[i] || 0);
      await saveScreenerResult({
        studentId: user.$id,
        totalScore,
        riskLevel: isHighRisk ? 'High Priority' : 'Stable',
        answers: flatAnswers,
      });
      setIsSubmitted(true);
    } catch (error: any) {
      Alert.alert('Submission Error', error.message || 'Could not save diagnostic results.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const isHighRisk = totalScore > 10;

  if (isSubmitted) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.resultCard}>
          <View style={[styles.badge, isHighRisk ? styles.badgeHighRisk : styles.badgeStable]}>
            <Text style={[styles.badgeText, isHighRisk ? styles.badgeTextHighRisk : styles.badgeTextStable]}>
              {isHighRisk ? 'High Priority' : 'Stable'}
            </Text>
          </View>

          <Text style={styles.resultTitle}>
            {isHighRisk ? 'Immediate Support Recommended' : 'Routine Wellbeing Check'}
          </Text>

          <Text style={styles.resultDescription}>
            {isHighRisk
              ? 'Based on your diagnostic screening, we recommend connecting with a counselor to discuss how you have been feeling lately.'
              : 'Your responses indicate that you are managing reasonably well right now. Regular self-care can help maintain this state.'}
          </Text>

          {isHighRisk ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnHighRisk]}
              onPress={() => onNavigate('booking', { 
                reason: `Urgent: Priority Counseling requested after High Priority Diagnostic Result (Score: ${totalScore}/21).` 
              })}
            >
              <Text style={styles.actionBtnText}>Request Priority Counseling</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnStable]}
              onPress={() => onNavigate('zenflow')}
            >
              <Text style={styles.actionBtnText}>Start ZenFlow Session</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={onComplete}>
            <Text style={styles.secondaryBtnText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navy Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.headerEmoji}>🩺</Text>
        <Text style={styles.headerTitle}>Clinical Health Screener</Text>
        <Text style={styles.headerSubtitle}>
          Diagnostic Assessment
        </Text>
      </View>

      <View style={styles.innerContent}>
        <Text style={styles.questionIntro}>
          Over the last 2 weeks, how often have you been bothered by the following problems?
        </Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Question {currentStep + 1} of {QUESTIONS.length}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }
              ]}
            />
          </View>
        </View>

      <View style={styles.cardWrapper}>
        <Animated.View
          key={currentStep}
          entering={SlideInRight.duration(400)}
          exiting={SlideOutLeft.duration(400)}
          style={[styles.card, { position: 'absolute', width: '100%' }]}
        >
          <Text style={styles.questionText}>{QUESTIONS[currentStep]}</Text>

          {OPTIONS.map((option) => {
            const isSelected = answers[currentStep] === option.score;
            return (
              <TouchableOpacity
                key={option.score}
                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                onPress={() => handleSelectOption(option.score)}
              >
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      <View style={styles.footerControls}>
        <TouchableOpacity
          style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]}
          onPress={handlePrevious}
          disabled={currentStep === 0}
        >
          <Text style={[styles.navBtnText, currentStep === 0 && styles.navBtnTextDisabled]}>Previous</Text>
        </TouchableOpacity>

        {currentStep === QUESTIONS.length - 1 ? (
          <TouchableOpacity
            style={[styles.submitBtn, (!allAnswered || isSaving) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!allAnswered || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Assessment</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, answers[currentStep] === undefined && styles.navBtnDisabled]}
            onPress={() => setCurrentStep(prev => prev + 1)}
            disabled={answers[currentStep] === undefined}
          >
            <Text style={[styles.navBtnText, answers[currentStep] === undefined && styles.navBtnTextDisabled]}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.1,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBanner: {
    backgroundColor: '#0A0A5C',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  headerEmoji: { fontSize: 32, marginBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 13, color: '#DBEAFE', fontWeight: '600', marginTop: 2, opacity: 0.9 },
  innerContent: { padding: 20 },
  questionIntro: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0A0A5C',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    width: '100%',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#0A0A5C',
    borderRadius: 3,
  },
  cardWrapper: {
    height: 420, // Reduced from 480 to bring buttons up
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.06,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 24,
    lineHeight: 28,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    backgroundColor: '#FAFCFF',
  },
  optionBtnSelected: {
    borderColor: '#0A0A5C',
    backgroundColor: '#F8FAFC',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E0',
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: '#0A0A5C',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A0A5C',
  },
  optionText: {
    fontSize: 15,
    color: '#4A5568',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#0A0A5C',
    fontWeight: '600',
  },
  footerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#DBEAFE', // NavyLight
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  navBtnDisabled: {
    opacity: 0.3,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  navBtnText: {
    color: '#0A0A5C',
    fontWeight: '700',
    fontSize: 15,
  },
  navBtnTextDisabled: {
    color: '#94A3B8',
  },
  submitBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#0A0A5C',
    shadowColor: '#0A0A5C',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Results screen styling
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 4,
    marginTop: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  badgeHighRisk: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FC8181',
  },
  badgeStable: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#68D391',
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeTextHighRisk: {
    color: '#C53030',
  },
  badgeTextStable: {
    color: '#276749',
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultDescription: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionBtnHighRisk: {
    backgroundColor: '#E53E3E',
  },
  actionBtnStable: {
    backgroundColor: Colors.light.tint, // Primary brand
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: Colors.light.tint,
    fontWeight: '600',
    fontSize: 15,
  }
});
