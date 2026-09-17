import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Star,
  MessageSquare,
  ChevronDown,
  X,
  Send,
  CornerDownRight,
  ShieldCheck,
  ShoppingBag,
  Clock,
  Sparkles,
  Award,
  RefreshCw,
} from 'lucide-react-native';
import {
  VendorUser,
  VendorReviewItem,
  VendorReviewMetrics,
  VendorReviewsPagination,
  fetchVendorReviewsApi,
  submitVendorReviewReplyApi
} from '../services/apiService';

interface ReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  vendor: VendorUser;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  visible,
  onClose,
  vendor,
}) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reviews, setReviews] = useState<VendorReviewItem[]>([]);
  const [metrics, setMetrics] = useState<VendorReviewMetrics>({
    avg_rating: 0,
    rating_count: 0,
    total_reviews: 0,
    breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }
  });
  const [pagination, setPagination] = useState<VendorReviewsPagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  });
  const [selectedStar, setSelectedStar] = useState<number | null>(null); // null = All
  const [errorMessage, setErrorMessage] = useState('');

  // Reply Sheet States
  const [replyTargetReview, setReplyTargetReview] = useState<VendorReviewItem | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState('');

  const loadReviews = useCallback(async (starFilter: number | null = selectedStar, pageNum: number = 1, isRefresh: boolean = false) => {
    if (!vendor?.vendor_id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    }
    setErrorMessage('');

    try {
      const data = await fetchVendorReviewsApi(
        {
          vendor_id: vendor.vendor_id,
          page: pageNum,
          limit: 20,
          star: starFilter || undefined
        },
        vendor.vendor_id
      );

      if (pageNum === 1) {
        setReviews(data.reviews || []);
      } else {
        setReviews(prev => [...prev, ...(data.reviews || [])]);
      }

      setMetrics(data.metrics);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('❌ [LOAD REVIEWS FAILED]:', err);
      setErrorMessage(err.message || 'Unable to load reviews. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [vendor?.vendor_id, selectedStar]);

  useEffect(() => {
    if (visible && vendor?.vendor_id) {
      loadReviews(selectedStar, 1);
    }
  }, [visible, vendor?.vendor_id, selectedStar]);

  const handleStarFilterChange = (star: number | null) => {
    setSelectedStar(star);
    loadReviews(star, 1);
  };

  const handleOpenReplySheet = (review: VendorReviewItem) => {
    setReplyTargetReview(review);
    setReplyInputText(review.reply_text || '');
    setReplySuccessMsg('');
  };

  const handleCloseReplySheet = () => {
    if (isSubmittingReply) return;
    setReplyTargetReview(null);
    setReplyInputText('');
    setReplySuccessMsg('');
  };

  const handleSendReply = async () => {
    if (!replyTargetReview) return;
    const cleanText = replyInputText.trim();
    if (!cleanText) {
      Alert.alert('Empty Reply', 'Please enter a reply message before sending.');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await submitVendorReviewReplyApi(
        replyTargetReview.rating_id,
        cleanText,
        vendor.vendor_id
      );

      // Optimistically update review in local list
      setReviews(prev =>
        prev.map(r => {
          if (r.rating_id === replyTargetReview.rating_id) {
            return {
              ...r,
              reply_text: res.reply_text,
              replied_at: res.replied_at
            };
          }
          return r;
        })
      );

      setReplySuccessMsg('Your reply has been published successfully!');
      setTimeout(() => {
        handleCloseReplySheet();
      }, 1000);
    } catch (err: any) {
      Alert.alert('Reply Failed', err.message || 'Could not post reply. Please try again.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (_) {
      return dateStr;
    }
  };

  const renderStars = (rating: number, size: number = 14) => {
    const stars = [];
    const normalized = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          color={i <= normalized ? '#F59E0B' : '#D1D5DB'}
          fill={i <= normalized ? '#F59E0B' : 'transparent'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>;
  };

  const totalReviewsCount = metrics.total_reviews || metrics.rating_count || reviews.length;
  const avgScore = Number(metrics.avg_rating || 0).toFixed(2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconBox}>
                <Award size={20} color="#541D26" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Customer Reviews & Ratings</Text>
                <Text style={styles.modalSubtitle}>
                  {vendor.store_name || 'Vendor Store'} • Live Feedback
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#78716C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadReviews(selectedStar, 1, true)}
                colors={['#541D26']}
                tintColor="#541D26"
              />
            }
          >
            {/* 1. Rating Summary Header Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryTopRow}>
                {/* Left: Big Score Display */}
                <View style={styles.scoreContainer}>
                  <Text style={styles.bigScoreText}>{avgScore}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
                    {renderStars(Number(avgScore), 18)}
                  </View>
                  <Text style={styles.reviewCountText}>
                    Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                  </Text>
                </View>

                {/* Vertical Divider */}
                <View style={styles.summaryDivider} />

                {/* Right: Star Breakdown Progress Bars */}
                <View style={styles.breakdownContainer}>
                  {[5, 4, 3, 2, 1].map(starNum => {
                    const count = metrics.breakdown[String(starNum) as keyof typeof metrics.breakdown] || 0;
                    const pct = totalReviewsCount > 0 ? Math.min(100, (count / totalReviewsCount) * 100) : 0;
                    return (
                      <TouchableOpacity
                        key={starNum}
                        style={styles.breakdownRow}
                        onPress={() => handleStarFilterChange(selectedStar === starNum ? null : starNum)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.starRowNum}>{starNum}★</Text>
                        <View style={styles.progressBarTrack}>
                          <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.starRowCount}>{count}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 2. Star Filter Pills */}
            <View style={styles.filterPillsWrapper}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsContainer}>
                <TouchableOpacity
                  style={[styles.filterPill, selectedStar === null && styles.filterPillActive]}
                  onPress={() => handleStarFilterChange(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterPillText, selectedStar === null && styles.filterPillTextActive]}>
                    All ({totalReviewsCount})
                  </Text>
                </TouchableOpacity>

                {[5, 4, 3, 2, 1].map(starNum => {
                  const count = metrics.breakdown[String(starNum) as keyof typeof metrics.breakdown] || 0;
                  const isActive = selectedStar === starNum;
                  return (
                    <TouchableOpacity
                      key={starNum}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => handleStarFilterChange(isActive ? null : starNum)}
                      activeOpacity={0.8}
                    >
                      <Star
                        size={12}
                        color={isActive ? '#FFFFFF' : '#F59E0B'}
                        fill={isActive ? '#FFFFFF' : '#F59E0B'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {starNum} Star ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. Error Banner if any */}
            {errorMessage ? (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>{errorMessage}</Text>
                <TouchableOpacity onPress={() => loadReviews(selectedStar, 1)} style={styles.retryBtn}>
                  <RefreshCw size={13} color="#541D26" style={{ marginRight: 4 }} />
                  <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {/* 4. Review Items List */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#541D26" />
                <Text style={styles.loadingText}>Fetching customer feedback...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <MessageSquare size={32} color="#541D26" />
                </View>
                <Text style={styles.emptyTitle}>
                  {selectedStar ? `No ${selectedStar}-star reviews found` : 'No reviews yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {selectedStar
                    ? `There are currently no ${selectedStar}-star reviews submitted for your store.`
                    : 'Customer ratings and reviews will appear here once orders are delivered.'}
                </Text>
                {selectedStar !== null ? (
                  <TouchableOpacity
                    style={styles.viewAllBtn}
                    onPress={() => handleStarFilterChange(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewAllBtnText}>View All Reviews</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((item, index) => {
                  const hasReply = Boolean(item.reply_text && item.reply_text.trim().length > 0);
                  return (
                    <View key={item.rating_id || index} style={styles.reviewCard}>
                      {/* Top User Info & Rating */}
                      <View style={styles.reviewCardHeader}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.userAvatarText}>
                            {(item.user_name || 'Customer').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.userName}>{item.user_name || 'Verified Customer'}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                            {renderStars(item.rating || 5, 13)}
                            {item.order_id ? (
                              <View style={styles.orderBadge}>
                                <ShoppingBag size={10} color="#541D26" style={{ marginRight: 3 }} />
                                <Text style={styles.orderBadgeText}>{item.order_id}</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
                      </View>

                      {/* Review Text */}
                      {item.review_text ? (
                        <Text style={styles.reviewBodyText}>{item.review_text}</Text>
                      ) : (
                        <Text style={[styles.reviewBodyText, { fontStyle: 'italic', color: '#9CA3AF' }]}>
                          Rating given without written review.
                        </Text>
                      )}

                      {/* Highlighted Merchant Reply Container */}
                      {hasReply ? (
                        <View style={styles.merchantReplyBox}>
                          <View style={styles.merchantReplyHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <CornerDownRight size={14} color="#541D26" />
                              <Text style={styles.merchantReplyTitle}>Store Response</Text>
                            </View>
                            {item.replied_at ? (
                              <Text style={styles.merchantReplyDate}>{formatDate(item.replied_at)}</Text>
                            ) : null}
                          </View>
                          <Text style={styles.merchantReplyContent}>{item.reply_text}</Text>
                          <TouchableOpacity
                            onPress={() => handleOpenReplySheet(item)}
                            style={styles.editReplyLink}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.editReplyLinkText}>Edit Reply</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        /* [ 💬 Reply to Customer ] Button */
                        <TouchableOpacity
                          style={styles.replyButton}
                          onPress={() => handleOpenReplySheet(item)}
                          activeOpacity={0.8}
                        >
                          <MessageSquare size={14} color="#541D26" style={{ marginRight: 6 }} />
                          <Text style={styles.replyButtonText}>Reply to Customer</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {/* Pagination Load More if applicable */}
                {pagination.page < pagination.pages ? (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => loadReviews(selectedStar, pagination.page + 1)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loadMoreBtnText}>Load More Reviews</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </ScrollView>

          {/* 5. Reply Bottom Sheet / Modal */}
          {replyTargetReview ? (
            <Modal
              visible={Boolean(replyTargetReview)}
              transparent
              animationType="fade"
              onRequestClose={handleCloseReplySheet}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.replyModalOverlay}
              >
                <View style={styles.replyModalCard}>
                  <View style={styles.replyModalHeader}>
                    <View>
                      <Text style={styles.replyModalTitle}>
                        Reply to {replyTargetReview.user_name || 'Customer'}
                      </Text>
                      <Text style={styles.replyModalSub}>
                        {replyTargetReview.review_text
                          ? `"${replyTargetReview.review_text.substring(0, 50)}${replyTargetReview.review_text.length > 50 ? '...' : ''}"`
                          : `${replyTargetReview.rating}★ Rating`}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={handleCloseReplySheet} style={styles.closeBtn} activeOpacity={0.7}>
                      <X size={18} color="#78716C" />
                    </TouchableOpacity>
                  </View>

                  {replySuccessMsg ? (
                    <View style={styles.successBanner}>
                      <ShieldCheck size={16} color="#15803D" style={{ marginRight: 6 }} />
                      <Text style={styles.successBannerText}>{replySuccessMsg}</Text>
                    </View>
                  ) : null}

                  <TextInput
                    style={styles.replyTextInput}
                    placeholder="Write a professional and polite reply to your customer..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={replyInputText}
                    onChangeText={setReplyInputText}
                    maxLength={500}
                    autoFocus
                  />

                  <View style={styles.replyModalFooter}>
                    <Text style={styles.charCountText}>{replyInputText.length}/500</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={styles.replyCancelBtn}
                        onPress={handleCloseReplySheet}
                        disabled={isSubmittingReply}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.replyCancelText}>Cancel</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.replySendBtn,
                          (!replyInputText.trim() || isSubmittingReply) && { opacity: 0.6 }
                        ]}
                        onPress={handleSendReply}
                        disabled={!replyInputText.trim() || isSubmittingReply}
                        activeOpacity={0.85}
                      >
                        {isSubmittingReply ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Send size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.replySendText}>Publish Reply</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    minHeight: '65%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: '#E7DFD5',
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F7EEF0',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#211A19',
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3EFEA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10,
  },
  bigScoreText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#541D26',
    letterSpacing: -0.5,
  },
  reviewCountText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1.5,
    height: '80%',
    backgroundColor: '#E7DFD5',
    marginHorizontal: 8,
  },
  breakdownContainer: {
    flex: 1.4,
    paddingLeft: 6,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  starRowNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716C',
    width: 22,
  },
  progressBarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F3EFEA',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  starRowCount: {
    fontSize: 10.5,
    color: '#78716C',
    fontWeight: '600',
    width: 22,
    textAlign: 'right',
  },
  filterPillsWrapper: {
    marginBottom: 14,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#541D26',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    marginLeft: 8,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#541D26',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F7EEF0',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#211A19',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
  },
  viewAllBtn: {
    marginTop: 14,
    backgroundColor: '#541D26',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  viewAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#541D26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  userName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#211A19',
  },
  orderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7EEF0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  orderBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#541D26',
  },
  reviewDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  reviewBodyText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 19,
    marginBottom: 10,
  },
  merchantReplyBox: {
    backgroundColor: '#FAF5EE',
    borderLeftWidth: 3,
    borderLeftColor: '#541D26',
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
  },
  merchantReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  merchantReplyTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#541D26',
  },
  merchantReplyDate: {
    fontSize: 9.5,
    color: '#9CA3AF',
  },
  merchantReplyContent: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
  },
  editReplyLink: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  editReplyLinkText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#541D26',
    textDecorationLine: 'underline',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F7EEF0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    marginTop: 2,
  },
  replyButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#541D26',
  },
  loadMoreBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  loadMoreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#541D26',
  },
  replyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  replyModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  replyModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  replyModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#211A19',
  },
  replyModalSub: {
    fontSize: 11.5,
    color: '#78716C',
    marginTop: 2,
    fontStyle: 'italic',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  replyTextInput: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 14,
    padding: 12,
    fontSize: 13,
    color: '#211A19',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  replyModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charCountText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  replyCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3EFEA',
  },
  replyCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
  },
  replySendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#541D26',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  replySendText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
