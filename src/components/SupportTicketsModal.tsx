import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  LifeBuoy,
  Send,
  Paperclip,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  Store,
  User,
  ChevronDown,
  Check,
  ArrowLeft,
  CreditCard,
  Wrench,
  Users,
  FileText,
  MessageSquare
} from 'lucide-react-native';
import {
  SupportTicketCategory,
  SupportTicket,
  VendorUser
} from '../services/api/types';
import {
  createSupportTicketApi,
  fetchVendorTicketsApi,
  uploadTicketAttachmentApi
} from '../services/api/supportApi';

interface SupportTicketsModalProps {
  visible: boolean;
  onClose: () => void;
  vendor?: VendorUser | null;
  initialCategory?: SupportTicketCategory;
  initialSubject?: string;
  initialDescription?: string;
}

const CATEGORY_OPTIONS: Array<{ key: SupportTicketCategory; label: string; icon: any }> = [
  { key: 'billing', label: 'Vendor Settlement & Payouts', icon: CreditCard },
  { key: 'technical', label: 'Technical & App Issue', icon: Wrench },
  { key: 'vendor_vs_user', label: 'Customer Dispute', icon: Users },
  { key: 'onboarding', label: 'Store Activation & KYC', icon: FileText },
  { key: 'general', label: 'General Store Inquiry', icon: MessageSquare },
];

export const SupportTicketsModal: React.FC<SupportTicketsModalProps> = ({
  visible,
  onClose,
  vendor,
  initialCategory,
  initialSubject = '',
  initialDescription = '',
}) => {
  const [filingRole, setFilingRole] = useState<'vendor' | 'customer'>('vendor');

  // Form Fields - Start empty so no auto-filled data appears
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory | ''>('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [reportedStoreName, setReportedStoreName] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; type?: string } | null>(null);

  // Submission & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<{
    ticket_number: string;
    sla_minutes_remaining?: number;
    created_at_readable?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const list = await fetchVendorTicketsApi();
      setTickets(list);
    } catch (_) {
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setFullName('');
      setEmail('');
      setOrderId('');
      setReportedStoreName('');
      setCategory(initialCategory ? initialCategory : '');
      setSubject(initialSubject || '');
      setDescription(initialDescription || '');
      setAttachment(null);
      setSubmitSuccess(null);
      setErrorMessage('');
      loadTickets();
    }
  }, [visible, initialCategory, initialSubject, initialDescription]);

  const handlePickAttachment = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || `proof_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg'
        });
      }
    } catch (e: any) {
      Alert.alert('Attachment Error', 'Failed to pick evidence image or document.');
    }
  };

  const handleSubmitTicket = async () => {
    setErrorMessage('');
    if (!fullName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address.');
      return;
    }
    if (!category) {
      setErrorMessage('Please select a category for your complaint.');
      return;
    }
    if (!subject.trim()) {
      setErrorMessage('Please enter a Subject for your complaint.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please provide a detailed description of your complaint.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSupportTicketApi({
        subject: subject.trim(),
        description: description.trim(),
        category: category as SupportTicketCategory,
        priority: category === 'billing' ? 'high' : 'medium',
        store_name: reportedStoreName.trim() || vendor?.store_name || '',
        reporter_name: fullName.trim(),
        reporter_email: email.trim(),
        reporter_role: filingRole,
        order_id: orderId.trim() || undefined,
      });

      // Upload evidence attachment if selected
      if (attachment && res.ticket_id) {
        try {
          await uploadTicketAttachmentApi(res.ticket_id, attachment);
        } catch (attErr) {
          console.warn('Attachment upload warning:', attErr);
        }
      }

      setSubmitSuccess({
        ticket_number: res.ticket_number,
        sla_minutes_remaining: res.sla_minutes_remaining || 45,
        created_at_readable: res.created_at_readable || 'Just now'
      });
      loadTickets();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit support complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubject('');
    setDescription('');
    setOrderId('');
    setCategory('');
    setAttachment(null);
    setSubmitSuccess(null);
    setErrorMessage('');
  };

  const selectedCategoryObj = category ? CATEGORY_OPTIONS.find(c => c.key === category) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* Dedicated Page Header */}
        <View style={styles.topNavbar}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#211A19" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              DigiLocal Support Desk & Intake
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Log complaints, queries & track resolution
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={18} color="#78716C" />
          </TouchableOpacity>
        </View>

        {/* Sub-Header Segment Control */}
        <View style={styles.segmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'create' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('create')}
            activeOpacity={0.85}
          >
            <LifeBuoy size={14} color={activeTab === 'create' ? '#FFFFFF' : '#78716C'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'create' && styles.segmentBtnTextActive]}>
              Log New Complaint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'history' && styles.segmentBtnActive]}
            onPress={() => {
              setActiveTab('history');
              loadTickets();
            }}
            activeOpacity={0.85}
          >
            <Clock size={14} color={activeTab === 'history' ? '#FFFFFF' : '#78716C'} style={{ marginRight: 6 }} />
            <Text style={[styles.segmentBtnText, activeTab === 'history' && styles.segmentBtnTextActive]}>
              My Submitted Tickets {tickets.length > 0 ? `(${tickets.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
          {activeTab === 'history' ? (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historySectionTitle}>PREVIOUSLY SUBMITTED TICKETS</Text>
                <TouchableOpacity onPress={loadTickets} disabled={loadingTickets} activeOpacity={0.7}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#541D26' }}>
                    {loadingTickets ? 'Refreshing...' : '🔄 Refresh'}
                  </Text>
                </TouchableOpacity>
              </View>

              {loadingTickets && tickets.length === 0 ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#541D26" />
                  <Text style={styles.loadingText}>Fetching ticket history...</Text>
                </View>
              ) : tickets.length === 0 ? (
                <View style={styles.emptyTicketsCard}>
                  <LifeBuoy size={36} color="#78716C" style={{ marginBottom: 10 }} />
                  <Text style={styles.emptyTicketsTitle}>No Tickets Submitted Yet</Text>
                  <Text style={styles.emptyTicketsSub}>
                    You haven't filed any support complaints or inquiries. If you face any issues with payouts, orders, or store activation, log a ticket below.
                  </Text>
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={() => setActiveTab('create')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.actionBtnPrimaryText}>Log New Ticket</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                tickets.map((t) => {
                  const catObj = CATEGORY_OPTIONS.find((c) => c.key === t.category);
                  const isResolved = t.status?.toLowerCase() === 'resolved' || t.status?.toLowerCase() === 'closed';
                  const isPending = t.status?.toLowerCase() === 'open' || t.status?.toLowerCase() === 'pending';

                  return (
                    <View key={t.ticket_id} style={styles.ticketCard}>
                      <View style={styles.ticketCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.ticketNumText}>ID: {t.ticket_number}</Text>
                          {catObj ? (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText}>{catObj.label.split('&')[0]}</Text>
                            </View>
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.statusPill,
                            isResolved
                              ? styles.statusPillResolved
                              : isPending
                              ? styles.statusPillPending
                              : styles.statusPillProgress,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              isResolved
                                ? styles.statusPillTextResolved
                                : isPending
                                ? styles.statusPillTextPending
                                : styles.statusPillTextProgress,
                            ]}
                          >
                            {(t.status || 'OPEN').toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.ticketSubject}>{t.subject}</Text>
                      {t.description ? (
                        <Text style={styles.ticketDesc} numberOfLines={2}>
                          {t.description}
                        </Text>
                      ) : null}

                      <View style={styles.ticketFooterRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="#78716C" />
                          <Text style={styles.ticketTimeText}>{t.created_at_readable || 'Recently'}</Text>
                        </View>
                        {t.sla_minutes_remaining ? (
                          <Text style={styles.ticketSlaText}>SLA: ~{t.sla_minutes_remaining} mins</Text>
                        ) : null}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          ) : submitSuccess ? (
            <View style={styles.successCard}>
              <View style={styles.successIconBadge}>
                <CheckCircle2 size={34} color="#16A34A" />
              </View>
              <Text style={styles.successTitle}>Inquiry Submitted Successfully</Text>
              <View style={styles.ticketBadgeRow}>
                <Text style={styles.ticketNumText}>Ticket ID: {submitSuccess.ticket_number}</Text>
              </View>
              <Text style={styles.successDesc}>
                Your complaint has been logged and assigned to the DigiLocal Priority Resolution Desk. Our team will review and respond within SLA.
              </Text>

              <View style={styles.slaBanner}>
                <Clock size={15} color="#92400E" />
                <Text style={styles.slaText}>
                  Target Resolution SLA: ~{submitSuccess.sla_minutes_remaining} Minutes
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18, width: '100%' }}>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => {
                    handleResetForm();
                    setActiveTab('history');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnOutlineText}>View My Tickets</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={onClose}
                  activeOpacity={0.88}
                >
                  <Text style={styles.actionBtnPrimaryText}>Done / Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formCard}>
              {/* Role Selection */}
              <Text style={styles.sectionHeader}>FILING COMPLAINT AS:</Text>
              <View style={styles.roleContainer}>
                {/* Option 1: Vendor Merchant Store */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    filingRole === 'vendor' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => setFilingRole('vendor')}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <Store size={14} color={filingRole === 'vendor' ? '#FFFFFF' : '#78716C'} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleCardTitle, filingRole === 'vendor' && styles.roleCardTitleActive]}>
                        Vendor Merchant
                      </Text>
                      <Text style={[styles.roleCardSub, filingRole === 'vendor' && styles.roleCardSubActive]}>
                        Payouts, Catalog & Listings
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Resident Customer */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    filingRole === 'customer' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => setFilingRole('customer')}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                    <User size={14} color={filingRole === 'customer' ? '#FFFFFF' : '#78716C'} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleCardTitle, filingRole === 'customer' && styles.roleCardTitleActive]}>
                        Resident Customer
                      </Text>
                      <Text style={[styles.roleCardSub, filingRole === 'customer' && styles.roleCardSubActive]}>
                        Orders, Delivery & Refunds
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Row 1: Full Name & Email */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Your Full Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Raj Gehlot"
                    placeholderTextColor="#78716C"
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="name@mail.com"
                    placeholderTextColor="#78716C"
                  />
                </View>
              </View>

              {/* Row 2: Category & Order ID */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Category *</Text>
                  <TouchableOpacity
                    style={styles.dropdownTrigger}
                    onPress={() => setShowCategoryPicker(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dropdownValue, !selectedCategoryObj && { color: '#78716C', fontWeight: '400' }]} numberOfLines={1}>
                      {selectedCategoryObj ? `${selectedCategoryObj.icon} ${selectedCategoryObj.label}` : 'Select category'}
                    </Text>
                    <ChevronDown size={14} color="#541D26" />
                  </TouchableOpacity>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Order ID (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={orderId}
                    onChangeText={setOrderId}
                    placeholder="ORD-9842"
                    placeholderTextColor="#78716C"
                  />
                </View>
              </View>

              {/* Row 3: Reported Store Name */}
              <View style={styles.singleRow}>
                <Text style={styles.fieldLabel}>Merchant / Store Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={reportedStoreName}
                  onChangeText={setReportedStoreName}
                  placeholder="e.g. Fresh Grocery Store"
                  placeholderTextColor="#78716C"
                />
              </View>

              {/* Row 4: Subject */}
              <View style={styles.singleRow}>
                <Text style={styles.fieldLabel}>Subject / Summary *</Text>
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g. Settlement issue for recent orders"
                  placeholderTextColor="#78716C"
                />
              </View>

              {/* Row 5: Detailed Description */}
              <View style={styles.singleRow}>
                <Text style={styles.fieldLabel}>Detailed Description of Complaint *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholder="Provide complete details including transaction info, timeline, or relevant dispute details..."
                  placeholderTextColor="#78716C"
                />
              </View>

              {/* Row 6: Attach Photo Evidence */}
              <View style={styles.singleRow}>
                <Text style={styles.fieldLabel}>Attach Photo Evidence / PDF (Optional)</Text>
                {attachment ? (
                  <View style={styles.attachmentPreview}>
                    <Paperclip size={14} color="#541D26" style={{ marginRight: 6 }} />
                    <Text style={styles.attachmentName} numberOfLines={1}>{attachment.name}</Text>
                    <TouchableOpacity onPress={() => setAttachment(null)} style={styles.removeAttBtn}>
                      <X size={13} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.evidenceBtn}
                    onPress={handlePickAttachment}
                    activeOpacity={0.85}
                  >
                    <Paperclip size={14} color="#541D26" style={{ marginRight: 6 }} />
                    <Text style={styles.evidenceBtnText}>Choose Photo / PDF Evidence</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Error Banner */}
              {errorMessage ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={15} color="#DC2626" style={{ marginRight: 6 }} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* Submit CTA Button */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmitTicket}
                disabled={isSubmitting}
                activeOpacity={0.88}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FAF8F5" />
                ) : (
                  <>
                    <Send size={15} color="#C8A878" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>SUBMIT SUPPORT INTAKE COMPLAINT</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Category Dropdown Picker Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)} style={styles.pickerCloseBtn}>
                <X size={16} color="#211A19" />
              </TouchableOpacity>
            </View>
            {CATEGORY_OPTIONS.map((opt) => {
              const isSelected = category === opt.key;
              const OptIcon = opt.icon;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.pickerOption, isSelected && styles.pickerOptionActive]}
                  onPress={() => {
                    setCategory(opt.key);
                    setShowCategoryPicker(false);
                  }}
                  activeOpacity={0.8}
                >
                  <OptIcon size={16} color={isSelected ? '#541D26' : '#78716C'} style={{ marginRight: 8 }} />
                  <Text style={[styles.pickerOptionText, isSelected && styles.pickerOptionTextActive]}>
                    {opt.label}
                  </Text>
                  {isSelected ? <Check size={15} color="#541D26" style={{ marginLeft: 'auto' }} /> : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F6F0',
  },
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD5',
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  segmentBtnActive: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  historyContainer: {
    gap: 12,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historySectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  emptyTicketsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  emptyTicketsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#211A19',
    marginBottom: 6,
  },
  emptyTicketsSub: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    padding: 14,
    gap: 8,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#F7EEF0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#541D26',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillProgress: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusPillResolved: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextPending: { color: '#B45309' },
  statusPillTextProgress: { color: '#1D4ED8' },
  statusPillTextResolved: { color: '#15803D' },
  ticketSubject: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211A19',
  },
  ticketDesc: {
    fontSize: 12,
    color: '#78716C',
    lineHeight: 17,
  },
  ticketFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F5',
  },
  ticketTimeText: {
    fontSize: 11,
    color: '#78716C',
  },
  ticketSlaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#541D26',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211A19',
  },
  headerSubtitle: {
    fontSize: 10.5,
    color: '#78716C',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 30,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  roleCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    minHeight: 64,
    justifyContent: 'center',
  },
  roleCardActive: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  roleCardInactive: {
    backgroundColor: '#FAF8F5',
    borderColor: '#E7DFD5',
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  roleCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#211A19',
    flexShrink: 1,
  },
  roleCardTitleActive: {
    color: '#FFFFFF',
  },
  roleCardSub: {
    fontSize: 10,
    color: '#78716C',
    lineHeight: 14,
  },
  roleCardSubActive: {
    color: '#EEE5DA',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  col: {
    flex: 1,
  },
  singleRow: {
    width: '100%',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#211A19',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: '#211A19',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  textArea: {
    height: 75,
    paddingTop: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  dropdownValue: {
    fontSize: 11.5,
    color: '#211A19',
    fontWeight: '600',
    flex: 1,
    paddingRight: 4,
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEE5DA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  evidenceBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#211A19',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  attachmentName: {
    fontSize: 11.5,
    color: '#211A19',
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  removeAttBtn: {
    padding: 3,
    backgroundColor: '#FEF2F2',
    borderRadius: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
  },
  errorText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#541D26',
    borderRadius: 12,
    height: 46,
    marginTop: 4,
  },
  submitButtonText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FAF8F5',
    letterSpacing: 0.5,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  successIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#211A19',
    textAlign: 'center',
  },
  ticketBadgeRow: {
    backgroundColor: '#541D26',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  ticketNumText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successDesc: {
    fontSize: 12,
    color: '#78716C',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  slaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  slaText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  actionBtnOutline: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#541D26',
  },
  actionBtnPrimary: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerSheet: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211A19',
  },
  pickerCloseBtn: {
    padding: 4,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionActive: {
    backgroundColor: '#F7EEF0',
  },
  pickerOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#211A19',
  },
  pickerOptionTextActive: {
    color: '#541D26',
    fontWeight: '700',
  },
});
