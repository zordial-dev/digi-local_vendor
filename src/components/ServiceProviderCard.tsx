import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  Award,
  ChevronRight,
  ShieldCheck,
  Star,
  Send,
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';
import { VendorUser } from '../services/api/types';
import { showToast } from './ToastNotification';

interface ServiceProviderCardProps {
  provider: VendorUser;
  onPressProfile?: (provider: VendorUser) => void;
  onPressEnquiry?: (provider: VendorUser) => void;
}

export const ServiceProviderCard: React.FC<ServiceProviderCardProps> = React.memo(({
  provider,
  onPressProfile,
  onPressEnquiry,
}) => {
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
      `Hi ${provider.vendor_name || provider.store_name},\nI found your profile on DigiLocal (${provider.profession_category || 'Services'}). I would like to enquire about your services.`
    );

    if (phoneWithCountry) {
      Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${message}`).catch(() => {
        showToast('WhatsApp not installed', 'error');
      });
    } else {
      showToast('WhatsApp number not available', 'error');
    }
  };

  const logoSource = provider.logo_url || provider.logo || provider.image_url || provider.store_logo;
  const displayName = provider.vendor_name || provider.store_name || 'Service Provider';
  const categoryLabel = provider.profession_category || provider.description || 'Local Professional';

  // Determine coverage badge
  const isSocietyMatch = !!provider.society_name;
  const coverageBadgeText = isSocietyMatch
    ? 'In Your Society'
    : (provider.area || provider.location || 'Local Coverage');

  return (
    <View style={styles.cardContainer}>
      {/* Top Main Info Block */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onPressProfile && onPressProfile(provider)}
        activeOpacity={0.8}
      >
        {/* Photo / Avatar */}
        <View style={styles.avatarContainer}>
          {logoSource ? (
            <Image source={{ uri: logoSource }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.onlineBadge} />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.providerName} numberOfLines={1}>
              {displayName}
            </Text>
            <ShieldCheck size={16} color={BrandTheme.emeraldGreen} />
          </View>

          <Text style={styles.categoryText} numberOfLines={1}>
            {categoryLabel}
          </Text>

          {/* Badges Row */}
          <View style={styles.badgeRow}>
            {/* Coverage Badge */}
            <View style={[styles.badge, styles.coverageBadge]}>
              <MapPin size={10} color={BrandTheme.warmTanGold} />
              <Text style={styles.coverageBadgeText}>{coverageBadgeText}</Text>
            </View>

            {provider.experience_years ? (
              <View style={styles.badge}>
                <Award size={11} color={BrandTheme.forestGreen} />
                <Text style={styles.badgeText}>{provider.experience_years}+ Yrs Exp</Text>
              </View>
            ) : null}

            {provider.qualifications ? (
              <View style={[styles.badge, styles.qualBadge]}>
                <Text style={styles.qualBadgeText} numberOfLines={1}>
                  {provider.qualifications}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <ChevronRight size={18} color={BrandTheme.mutedSageText} />
      </TouchableOpacity>

      {/* Short Bio / About snippet */}
      {provider.about || provider.description ? (
        <Text style={styles.bioText} numberOfLines={2}>
          "{provider.about || provider.description}"
        </Text>
      ) : null}

      {/* Timing & Price Bar */}
      <View style={styles.metaBar}>
        <View style={styles.metaItem}>
          <Clock size={12} color={BrandTheme.mutedSageText} />
          <Text style={styles.metaText}>
            {provider.working_days || 'Mon – Sat'}: {provider.opening_time || '9:00 AM'} – {provider.closing_time || '8:00 PM'}
          </Text>
        </View>

        {provider.starting_price ? (
          <View style={styles.priceTag}>
            <Text style={styles.priceLabel}>Starts from </Text>
            <Text style={styles.priceValue}>₹{provider.starting_price}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.callBtn}
          onPress={handleCall}
          activeOpacity={0.8}
        >
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.btnText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.waBtn}
          onPress={handleWhatsApp}
          activeOpacity={0.8}
        >
          <MessageSquare size={14} color="#FFFFFF" />
          <Text style={styles.btnText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.enquiryBtn}
          onPress={() => onPressEnquiry && onPressEnquiry(provider)}
          activeOpacity={0.8}
        >
          <Send size={13} color={BrandTheme.forestGreen} />
          <Text style={styles.enquiryBtnText}>Enquire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: BrandTheme.creamCanvas,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandTheme.sandBorder,
  },
  avatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BrandTheme.forestGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: BrandTheme.creamCanvas,
  },
  infoCol: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  providerName: {
    fontSize: 15.5,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52, 83, 60, 0.09)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  coverageBadge: {
    backgroundColor: 'rgba(196, 160, 102, 0.2)',
  },
  coverageBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },
  qualBadge: {
    backgroundColor: 'rgba(196, 160, 102, 0.15)',
  },
  qualBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  bioText: {
    fontSize: 12.5,
    color: BrandTheme.darkForestGreen,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  metaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(228, 220, 201, 0.6)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: BrandTheme.forestGreen,
    paddingVertical: 9,
    borderRadius: 10,
  },
  waBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingVertical: 9,
    borderRadius: 10,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  enquiryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: BrandTheme.forestGreen,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  enquiryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: BrandTheme.forestGreen,
  },
});
