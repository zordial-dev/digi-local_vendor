import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Share,
  Platform,
} from 'react-native';
import {
  X,
  Phone,
  MessageSquare,
  Share2,
  MapPin,
  Clock,
  Award,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Send,
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';
import { VendorUser, VendorItem } from '../services/api/types';
import { ServiceEnquiryModal } from './ServiceEnquiryModal';
import { showToast } from './ToastNotification';

interface ServiceProviderProfileModalProps {
  visible: boolean;
  provider: VendorUser | null;
  services?: VendorItem[];
  onClose: () => void;
}

export const ServiceProviderProfileModal: React.FC<ServiceProviderProfileModalProps> = ({
  visible,
  provider,
  services = [],
  onClose,
}) => {
  const [selectedServiceTitle, setSelectedServiceTitle] = useState('');
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);

  if (!provider) return null;

  const displayName = provider.vendor_name || provider.store_name || 'Service Provider';
  const logoSource = provider.logo_url || provider.logo || provider.image_url || provider.store_logo;
  const profession = provider.profession_category || 'Local Professional';

  const handleCall = () => {
    const phone = provider.phone_number || '';
    if (phone) {
      Linking.openURL(`tel:${phone}`).catch(() => {
        showToast('Unable to open dialer', 'error');
      });
    } else {
      showToast('Phone number not available', 'error');
    }
  };

  const handleWhatsApp = () => {
    const rawNumber = provider.whatsapp_number || provider.phone_number || '';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;

    const message = encodeURIComponent(
      `Hi ${displayName},\nI found your profile on DigiLocal (${profession}). I would like to enquire about your services.`
    );

    if (phoneWithCountry) {
      Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${message}`).catch(() => {
        showToast('WhatsApp not installed', 'error');
      });
    } else {
      showToast('WhatsApp number not available', 'error');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: `${displayName} on DigiLocal`,
        message: `Connect with ${displayName} (${profession}) on DigiLocal: Call ${provider.phone_number || ''}`,
      });
    } catch (_) {}
  };

  const handleRequestService = (serviceName?: string) => {
    setSelectedServiceTitle(serviceName || '');
    setShowEnquiryModal(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color={BrandTheme.forestGreen} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.7}>
              <Share2 size={18} color={BrandTheme.forestGreen} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Profile Hero Block */}
            <View style={styles.heroBlock}>
              <View style={styles.avatarWrapper}>
                {logoSource ? (
                  <Image source={{ uri: logoSource }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroProfession}>{profession}</Text>

              {provider.society_name ? (
                <View style={styles.locationRow}>
                  <MapPin size={13} color={BrandTheme.mutedSageText} />
                  <Text style={styles.locationText}>{provider.society_name}</Text>
                </View>
              ) : null}

              {/* Stat Chips */}
              <View style={styles.statChipsRow}>
                {provider.experience_years ? (
                  <View style={styles.statChip}>
                    <Award size={14} color={BrandTheme.forestGreen} />
                    <Text style={styles.statChipTitle}>{provider.experience_years}+ Years</Text>
                    <Text style={styles.statChipSub}>Experience</Text>
                  </View>
                ) : null}

                {provider.qualifications ? (
                  <View style={styles.statChip}>
                    <GraduationCap size={14} color={BrandTheme.warmTanGold} />
                    <Text style={styles.statChipTitle} numberOfLines={1}>
                      {provider.qualifications}
                    </Text>
                    <Text style={styles.statChipSub}>Certified</Text>
                  </View>
                ) : null}

                {provider.starting_price ? (
                  <View style={styles.statChip}>
                    <Sparkles size={14} color={BrandTheme.forestGreen} />
                    <Text style={styles.statChipTitle}>₹{provider.starting_price}</Text>
                    <Text style={styles.statChipSub}>Starts From</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Quick Actions (Call / WhatsApp / Request) */}
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionBtnCall}
                onPress={handleCall}
                activeOpacity={0.8}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Call Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnWa}
                onPress={handleWhatsApp}
                activeOpacity={0.8}
              >
                <MessageSquare size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnEnquire}
                onPress={() => handleRequestService()}
                activeOpacity={0.8}
              >
                <Send size={15} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Request Service</Text>
              </TouchableOpacity>
            </View>

            {/* About / Bio Section */}
            {provider.about || provider.description ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>About {displayName}</Text>
                <Text style={styles.sectionContent}>
                  {provider.about || provider.description}
                </Text>
              </View>
            ) : null}

            {/* Working Hours & Availability */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Availability & Schedule</Text>
              <View style={styles.infoRow}>
                <Calendar size={15} color={BrandTheme.forestGreen} />
                <Text style={styles.infoRowText}>
                  Working Days: <Text style={styles.infoRowBold}>{provider.working_days || 'Monday – Saturday'}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Clock size={15} color={BrandTheme.forestGreen} />
                <Text style={styles.infoRowText}>
                  Hours: <Text style={styles.infoRowBold}>{provider.opening_time || '9:00 AM'} – {provider.closing_time || '8:00 PM'}</Text>
                </Text>
              </View>
            </View>

            {/* Services Offered List (if any) */}
            {services.length > 0 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Services & Treatments</Text>
                <View style={styles.servicesList}>
                  {services.map(item => (
                    <View key={item.item_id} style={styles.serviceItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.serviceItemTitle}>{item.item_name}</Text>
                        {item.description ? (
                          <Text style={styles.serviceItemDesc} numberOfLines={2}>
                            {item.description}
                          </Text>
                        ) : null}
                        <View style={styles.servicePriceRow}>
                          <Text style={styles.servicePrice}>₹{item.price}</Text>
                          {item.unit ? <Text style={styles.serviceUnit}> / {item.unit}</Text> : null}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.bookServiceBtn}
                        onPress={() => handleRequestService(item.item_name)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.bookServiceBtnText}>Enquire</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Enquiry Modal for this Provider */}
          <ServiceEnquiryModal
            visible={showEnquiryModal}
            provider={provider}
            selectedServiceTitle={selectedServiceTitle}
            onClose={() => setShowEnquiryModal(false)}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
  },
  sheetContainer: {
    backgroundColor: BrandTheme.creamCanvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 83, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(52, 83, 60, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  heroBlock: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandTheme.sandBorder,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BrandTheme.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandTheme.emeraldGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BrandTheme.creamCanvas,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    textAlign: 'center',
  },
  heroProfession: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandTheme.warmTanGold,
    marginTop: 2,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12.5,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
  },
  statChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  statChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  statChipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginTop: 2,
  },
  statChipSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BrandTheme.forestGreen,
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionBtnWa: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionBtnEnquire: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BrandTheme.warmTanGold,
    paddingVertical: 11,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    letterSpacing: 0.2,
  },
  sectionContent: {
    fontSize: 13,
    color: BrandTheme.forestGreen,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  infoRowText: {
    fontSize: 13,
    color: BrandTheme.forestGreen,
  },
  infoRowBold: {
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  servicesList: {
    gap: 8,
    marginTop: 4,
  },
  serviceItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(228, 220, 201, 0.6)',
    gap: 10,
  },
  serviceItemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  serviceItemDesc: {
    fontSize: 11.5,
    color: BrandTheme.mutedSageText,
    marginTop: 1,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.forestGreen,
  },
  serviceUnit: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
  },
  bookServiceBtn: {
    backgroundColor: 'rgba(52, 83, 60, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bookServiceBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },
});
