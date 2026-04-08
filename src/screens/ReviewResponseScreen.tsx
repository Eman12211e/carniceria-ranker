import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

interface ReviewResponseScreenProps {
  shopId: string;
  isOwner: boolean;
}

interface ReviewResponse {
  id: string;
  response: string;
  created_at: string;
}

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  review_responses: ReviewResponse[];
  profiles: { display_name: string | null } | null;
  meat_cuts: { name_en: string; name_es: string } | null;
}

export default function ReviewResponseScreen({ shopId, isOwner }: ReviewResponseScreenProps) {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [shopId]);

  async function loadReviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(
        '*, review_responses(*), profiles!user_id(display_name), meat_cuts!cut_id(name_en, name_es)',
      )
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setReviews((data as ReviewItem[]) ?? []);
    }
    setLoading(false);
  }

  async function handleSubmitReply(reviewId: string) {
    if (!replyText.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.rpc('respond_to_review', {
      p_review_id: reviewId,
      p_response: replyText.trim(),
    });

    if (error) {
      Alert.alert(
        isSpanish ? 'Error' : 'Error',
        error.message,
      );
    } else {
      setReplyingTo(null);
      setReplyText('');
      loadReviews();
    }
    setSubmitting(false);
  }

  function renderStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isSpanish ? 'es-MX' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function renderReview({ item }: { item: ReviewItem }) {
    const cutName = item.meat_cuts
      ? isSpanish
        ? item.meat_cuts.name_es
        : item.meat_cuts.name_en
      : null;
    const reviewerName =
      item.profiles?.display_name ??
      (isSpanish ? 'Anónimo' : 'Anonymous');
    const hasResponse = item.review_responses && item.review_responses.length > 0;

    return (
      <View style={styles.reviewCard}>
        {/* Review Header */}
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewerName}>{reviewerName}</Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Rating */}
        <Text style={styles.stars}>{renderStars(item.rating)}</Text>

        {/* Cut name */}
        {cutName && <Text style={styles.cutName}>{cutName}</Text>}

        {/* Comment */}
        {item.comment && <Text style={styles.comment}>{item.comment}</Text>}

        {/* Existing Response */}
        {hasResponse && (
          <View style={styles.responseCard}>
            <Text style={styles.responseLabel}>
              {isSpanish ? 'Respuesta del dueño' : 'Owner Response'}
            </Text>
            <Text style={styles.responseText}>
              {item.review_responses[0].response}
            </Text>
            <Text style={styles.responseDate}>
              {formatDate(item.review_responses[0].created_at)}
            </Text>
          </View>
        )}

        {/* Reply Button / Input */}
        {!hasResponse && isOwner && (
          <>
            {replyingTo === item.id ? (
              <View style={styles.replySection}>
                <TextInput
                  style={styles.replyInput}
                  placeholder={
                    isSpanish
                      ? 'Escribe tu respuesta...'
                      : 'Write your response...'
                  }
                  placeholderTextColor="#666"
                  value={replyText}
                  onChangeText={setReplyText}
                  maxLength={500}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.charCount}>
                  {replyText.length}/500
                </Text>
                <View style={styles.replyActions}>
                  <Pressable
                    style={styles.cancelReplyBtn}
                    onPress={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}
                  >
                    <Text style={styles.cancelReplyText}>
                      {isSpanish ? 'Cancelar' : 'Cancel'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.submitReplyBtn,
                      submitting && styles.disabledBtn,
                    ]}
                    onPress={() => handleSubmitReply(item.id)}
                    disabled={submitting}
                  >
                    <Text style={styles.submitReplyText}>
                      {submitting
                        ? isSpanish
                          ? 'Enviando...'
                          : 'Sending...'
                        : isSpanish
                          ? 'Enviar'
                          : 'Submit'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.replyBtn}
                onPress={() => {
                  setReplyingTo(item.id);
                  setReplyText('');
                }}
              >
                <Text style={styles.replyBtnText}>
                  {isSpanish ? 'Responder' : 'Reply'}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isSpanish ? 'Reseñas' : 'Reviews'}
      </Text>

      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {isSpanish
              ? 'Aún no hay reseñas para esta tienda.'
              : 'No reviews for this shop yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReview}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 40,
  },
  reviewCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f5f5f5',
  },
  reviewDate: {
    fontSize: 12,
    color: '#a0a0a0',
  },
  stars: {
    fontSize: 18,
    color: '#e94560',
    marginBottom: 6,
    letterSpacing: 2,
  },
  cutName: {
    fontSize: 13,
    color: '#4ecca3',
    fontWeight: '600',
    marginBottom: 6,
  },
  comment: {
    fontSize: 14,
    color: '#f5f5f5',
    lineHeight: 20,
  },
  responseCard: {
    marginTop: 12,
    marginLeft: 16,
    backgroundColor: '#16162a',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4ecca3',
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4ecca3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#f5f5f5',
    lineHeight: 20,
  },
  responseDate: {
    fontSize: 11,
    color: '#a0a0a0',
    marginTop: 6,
  },
  replyBtn: {
    marginTop: 12,
    backgroundColor: '#2a2a3e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  replyBtnText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '600',
  },
  replySection: {
    marginTop: 12,
  },
  replyInput: {
    backgroundColor: '#16162a',
    borderRadius: 8,
    padding: 12,
    color: '#f5f5f5',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#2a2a3e',
  },
  charCount: {
    fontSize: 11,
    color: '#a0a0a0',
    textAlign: 'right',
    marginTop: 4,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelReplyBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelReplyText: {
    color: '#a0a0a0',
    fontSize: 14,
  },
  submitReplyBtn: {
    backgroundColor: '#e94560',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  submitReplyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a0a0',
    textAlign: 'center',
  },
});
