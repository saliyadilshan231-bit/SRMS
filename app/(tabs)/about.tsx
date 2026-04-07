import { IconSymbol } from '@/components/ui/icon-symbol';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Review = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
};

export default function AboutScreen() {
  const router = useRouter();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: '1',
      name: 'Kasun Perera',
      rating: 5,
      comment: 'Academix has completely transformed how I track my academic progress. The Grade Analyst is incredibly helpful!',
      date: 'March 2026',
    },
  ]);

  // Form States
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitReview = () => {
    if (!reviewerName.trim() || !comment.trim()) {
      Alert.alert('Missing Information', 'Please enter your name and review.');
      return;
    }

    setSubmitting(true);

    const currentDate = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(new Date());

    const newReview: Review = {
      id: Date.now().toString(),
      name: reviewerName.trim(),
      rating,
      comment: comment.trim(),
      date: currentDate,
    };

    setReviews((prev) => [newReview, ...prev]);

    setReviewerName('');
    setRating(5);
    setComment('');
    setShowReviewModal(false);
    setSubmitting(false);

    Keyboard.dismiss();
    Alert.alert('Thank You!', 'Your review has been submitted successfully.');
  };

  const handleDeleteReview = (id: string, name: string) => {
    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete ${name}'s review?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setReviews((prev) => prev.filter((review) => review.id !== id));
          },
        },
      ]
    );
  };

  const renderStars = (selectedRating: number, interactive = false) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <TouchableOpacity
        key={index}
        disabled={!interactive}
        onPress={() => interactive && setRating(index + 1)}
      >
        <IconSymbol
          size={28}
          name={index < selectedRating ? 'star.fill' : 'star'}
          color={index < selectedRating ? '#FACC15' : '#D1D5DB'}
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Bar */}
        <View style={styles.topStripWrap}>
          <View style={styles.topStripCard}>
            <TouchableOpacity style={styles.topStripIconBtn} onPress={() => router.back()}>
              <IconSymbol size={24} name="chevron.left" color="#65707D" />
            </TouchableOpacity>
            <Text style={styles.topStripTitle}>About Academix </Text>
            <View style={{ width: 44 }} />
          </View>
        </View>

        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../../assets/images/srms_app_hero.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>Empowering Your Academic Journey</Text>
            <Text style={styles.heroSubtitle}>Academix</Text>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.description}>
            SRMS is designed to bridge the gap between academic data and student success.
            We provide powerful tools to track, analyze, and optimize your performance throughout your degree.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureCard}>
            <IconSymbol size={32} name="chart.bar.fill" color="#18326E" />
            <Text style={styles.featureTitle}>Grade Analyst</Text>
            <Text style={styles.featureDesc}>Smart GPA tracking and predictive analytics for your modules.</Text>
          </View>
          <View style={styles.featureCard}>
            <IconSymbol size={32} name="checkmark.circle.fill" color="#18326E" />
            <Text style={styles.featureTitle}>Task Insights</Text>
            <Text style={styles.featureDesc}>Deep dives into your tasks and productivity patterns.</Text>
          </View>
          <View style={styles.featureCard}>
            <IconSymbol size={32} name="bubble.left.and.bubble.right.fill" color="#18326E" />
            <Text style={styles.featureTitle}>AI Advisor</Text>
            <Text style={styles.featureDesc}>Professional career guidance powered by advanced AI models.</Text>
          </View>
          <View style={styles.featureCard}>
            <IconSymbol size={32} name="timer" color="#18326E" />
            <Text style={styles.featureTitle}>Focus Mode</Text>
            <Text style={styles.featureDesc}>Eliminate distractions and hit your study goals efficiently.</Text>
          </View>
        </View>

        {/* Student Reviews Section */}
        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>Student Reviews</Text>
          </View>

          {/* Write a Review Button */}
          <TouchableOpacity
            style={styles.writeReviewBtn}
            onPress={() => setShowReviewModal(true)}
          >
            <IconSymbol size={20} name="pencil.and.outline" color="#FFFFFF" />
            <Text style={styles.writeReviewText}>Write a Review</Text>
          </TouchableOpacity>

          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet. Be the first to share your experience!</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.name}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>

                <View style={styles.starsContainer}>
                  {renderStars(review.rating)}
                </View>

                <Text style={styles.reviewComment}>{review.comment}</Text>

                {/* Delete Button - Bottom Right Corner */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteReview(review.id, review.name)}
                >
                  <IconSymbol size={20} name="trash" color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Built for Students */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Built for Students</Text>
          <View style={styles.teamImageContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/600x200/18326E/FFFFFF?text=SRMS+Team' }}
              style={styles.teamImage}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.description}>
            Developed with a "Student-First" philosophy, SRMS is continuously evolving
            to provide the most user-friendly and feature-rich experience possible.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>SRMS Version 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2026 SRMS Team. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Write Review Modal */}
      <Modal
        visible={showReviewModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReviewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <IconSymbol size={28} name="xmark.circle.fill" color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={reviewerName}
              onChangeText={setReviewerName}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.modalLabel}>Rating</Text>
            <View style={styles.starsContainerModal}>
              {renderStars(rating, true)}
            </View>

            <Text style={styles.modalLabel}>Your Review</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience with SRMS..."
              multiline
              numberOfLines={5}
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              onSubmitEditing={handleSubmitReview}
              blurOnSubmit={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                <Text style={styles.submitText}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  content: { paddingBottom: 100 },

  topStripWrap: { height: 84, backgroundColor: '#f0f4f8', justifyContent: 'center', paddingHorizontal: 16 },
  topStripCard: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topStripIconBtn: {
    padding: 10,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  topStripTitle: { fontSize: 24, fontWeight: '700', color: '#020202', letterSpacing: 0.3 },

  heroContainer: { height: 240, marginHorizontal: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: '#18326E', marginBottom: 24 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 50, 110, 0.75)',
    padding: 20
  },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  heroSubtitle: { color: '#e0e0e0', fontSize: 13, fontWeight: '600' },

  section: { paddingHorizontal: 20, marginBottom: 32 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#18326E', marginBottom: 12 },
  description: { fontSize: 15, color: '#4A5568', lineHeight: 24, fontWeight: '500' },

  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3
  },
  featureTitle: { fontSize: 16, fontWeight: '700', color: '#18326E', marginTop: 12, marginBottom: 6 },
  featureDesc: { fontSize: 12, color: '#65707D', lineHeight: 18, fontWeight: '500' },

  // Reviews Section
  reviewsHeader: { marginBottom: 16 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerName: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  reviewDate: { fontSize: 13, color: '#9CA3AF' },
  starsContainer: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  reviewComment: { fontSize: 15, color: '#4B5563', lineHeight: 22 },

  // Delete Button - Bottom Right Corner
  deleteBtn: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },

  noReviews: { textAlign: 'center', color: '#9CA3AF', fontStyle: 'italic', paddingVertical: 30 },

  writeReviewBtn: {
    backgroundColor: '#18326E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginBottom: 24,
  },
  writeReviewText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Built for Students
  teamImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  teamImage: { width: '100%', height: '100%' },

  footer: { alignItems: 'center', paddingBottom: 40 },
  versionText: { fontSize: 12, fontWeight: '700', color: '#18326E', marginBottom: 4 },
  copyrightText: { fontSize: 11, color: '#A0AEC0', fontWeight: '500' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: '800', color: '#18326E' },
  modalLabel: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 130,
    textAlignVertical: 'top',
  },
  starsContainerModal: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelText: { color: '#4B5563', fontWeight: '600', fontSize: 16 },
  submitBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#18326E',
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});