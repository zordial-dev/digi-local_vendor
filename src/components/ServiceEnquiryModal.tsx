import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Send,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';
import { VendorUser } from '../services/api/types';
import { submitServiceEnquiryApi } from '../services/api/vendorApi';
import { showToast } from './ToastNotification';

interface ServiceEnquiryModalProps {
  visible: boolean;
  provider: VendorUser;
  selectedServiceTitle?: string;
  onClose: () => void;
  onSubmitSuccess?: (leadData: any) => void;
}

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (9:00 AM – 12:00 PM)' },
  { id: 'afternoon', label: 'Afternoon (12:00 PM – 4:00 PM)' },
  { id: 'evening', label: 'Evening (4:00 PM – 8:00 PM)' },
];

export const ServiceEnquiryModal: React.FC<ServiceEnquiryModalProps> = ({
  visible,
  provider,
  selectedServiceTitle = '',
  onClose,
  onSubmitSuccess,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [serviceRequested, setServiceRequested] = useState(selectedServiceTitle);
  const [preferredSlot, setPreferredSlot] = useState('morning');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    if (selectedServiceTitle) {
      setServiceRequested(selectedServiceTitle);
    }
  }, [selectedServiceTitle, visible]);

  const handleCallDirectly = () => {
    const phone = provider.phone_number || '';
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        showToast('Unable to open dialer', 'error');
      });
    } else {
      showToast('Phone number not available', 'error');
    }
  };

  const handleWhatsAppDirectly = () => {
    const rawNumber = provider.whatsapp_number || provider.phone_number || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

    const message = encodeURIComponent(
      `Hi ${provider.vendor_name || provider.store_name},\nI found your profile on DigiLocal (${provider.profession_category || 'Service Provider'}).\n` +
      `Service: ${serviceRequested || 'General Enquiry'}\n` +
      (customerName ? `Name: ${customerName}\n` : '') +
      (flatNumber ? `Society/Flat: ${flatNumber}\n` : '') +
      (notes ? `Note: ${notes}\n` : '') +
      `Please let me know your availability.`
    );

    if (phoneWithCountry) {
      Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${message}`).catch(() => {
        showToast('WhatsApp not installed', 'error');
      });
    } else {
      showToast('WhatsApp number not available', 'error');
    }
  };

  const handleSubmitEnquiry = async () => {
    if (!customerName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const selectedSlotObj = TIME_SLOTS.find(s => s.id === preferredSlot);
      const leadPayload = {
        vendor_id: provider.vendor_id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_address: flatNumber.trim() ? `${flatNumber.trim()}, ${provider.society_name || ''}` : provider.society_name || '',
        delivery_address: flatNumber.trim() ? `${flatNumber.trim()}, ${provider.society_name || ''}` : provider.society_name || '',
        service_category: provider.profession_category || 'Service Request',
        service_requested: serviceRequested.trim() || 'General Consultation',
        description: notes.trim(),
        preferred_time_slot: selectedSlotObj?.label || preferredSlot,
        created_at: new Date().toISOString(),
      };

      await submitServiceEnquiryApi(leadPayload);

      setIsSubmitted(true);
      showToast('Service enquiry submitted successfully', 'success');
      if (onSubmitSuccess) onSubmitSuccess(leadPayload);

      setTimeout(() => {
        setIsSubmitted(false);
        onClose();
        resetForm();
      }, 1600);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit enquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerPhone('');
    setFlatNumber('');
    setServiceRequested('');
    setNotes('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalBackdrop} />
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Request Service / Enquiry</Text>
              <Text style={styles.modalSubtitle} numberOfLines={1}>
                {provider.store_name || provider.vendor_name} • {provider.profession_category || 'Service Provider'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={BrandTheme.forestGreen} />
            </TouchableOpacity>
          </View>

          {isSubmitted ? (
            <View style={styles.successContainer}>
              <CheckCircle2 size={56} color="#16A34A" />
              <Text style={styles.successTitle}>Enquiry Received!</Text>
              <Text style={styles.successText}>
                {provider.store_name || provider.vendor_name} has received your request and will contact you shortly.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Quick Direct Actions */}
              <View style={styles.quickContactRow}>
                <TouchableOpacity
                  style={styles.quickCallBtn}
                  onPress={handleCallDirectly}
                  activeOpacity={0.8}
                >
                  <Phone size={16} color="#FFFFFF" />
                  <Text style={styles.quickBtnText}>Call Directly</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickWaBtn}
                  onPress={handleWhatsAppDirectly}
                  activeOpacity={0.8}
                >
                  <MessageSquare size={16} color="#FFFFFF" />
                  <Text style={styles.quickBtnText}>WhatsApp Chat</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR SEND APPOINTMENT ENQUIRY</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Service Requested */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Service / Problem Required *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. AC Repair, Electrical Tripping, Leakage..."
                  placeholderTextColor={BrandTheme.mutedSageText}
                  value={serviceRequested}
                  onChangeText={setServiceRequested}
                />
              </View>

              {/* Customer Name & Phone */}
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Your Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your name"
                    placeholderTextColor={BrandTheme.mutedSageText}
                    value={customerName}
                    onChangeText={setCustomerName}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit mobile"
                    placeholderTextColor={BrandTheme.mutedSageText}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>
              </View>

              {/* Flat / Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Flat / Villa / Address in Society</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Tower B - 402 / Villa 12"
                  placeholderTextColor={BrandTheme.mutedSageText}
                  value={flatNumber}
                  onChangeText={setFlatNumber}
                />
              </View>

              {/* Preferred Time Slot */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Preferred Time Slot</Text>
                <View style={styles.slotRow}>
                  {TIME_SLOTS.map(slot => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        styles.slotChip,
                        preferredSlot === slot.id && styles.slotChipActive,
                      ]}
                      onPress={() => setPreferredSlot(slot.id)}
                      activeOpacity={0.8}
                    >
                      <Clock size={13} color={preferredSlot === slot.id ? '#FFFFFF' : BrandTheme.forestGreen} />
                      <Text
                        style={[
                          styles.slotChipText,
                          preferredSlot === slot.id && styles.slotChipTextActive,
                        ]}
                      >
                        {slot.id.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Additional Note */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Issue Details / Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your issue or preferred time in detail..."
                  placeholderTextColor={BrandTheme.mutedSageText}
                  multiline
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitEnquiry}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>REQUEST SERVICE NOW</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
  },
  modalCard: {
    backgroundColor: BrandTheme.creamCanvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 18,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    letterSpacing: 0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(52, 83, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingVertical: 14,
    gap: 12,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BrandTheme.forestGreen,
    paddingVertical: 11,
    borderRadius: 12,
  },
  quickWaBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: 12,
  },
  quickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BrandTheme.sandBorder,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandTheme.mutedSageText,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: BrandTheme.darkForestGreen,
    fontWeight: '500',
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  slotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    backgroundColor: '#FFFFFF',
  },
  slotChipActive: {
    backgroundColor: BrandTheme.forestGreen,
    borderColor: BrandTheme.forestGreen,
  },
  slotChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },
  slotChipTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandTheme.warmTanGold,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 6,
    shadowColor: BrandTheme.warmTanGold,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 12,
  },
  successTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  successText: {
    fontSize: 13.5,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    lineHeight: 19,
  },
});
