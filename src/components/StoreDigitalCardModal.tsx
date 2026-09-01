import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Share,
  ScrollView,
  Linking,
} from 'react-native';
import { X, Store, Building, Mail, Phone, ExternalLink, QrCode, Heart, ShoppingBag } from 'lucide-react-native';
import { DigiLocalLogo } from './DigiLocalLogo';
import { VendorUser } from '../services/apiService';
import { getApiBaseUrl } from '../services/apiService';
import { isVendorFavorited, toggleFavoriteVendorId } from '../services/authStorage';

interface StoreDigitalCardModalProps {
  visible: boolean;
  vendor: VendorUser;
  onClose: () => void;
  onExploreVendors?: () => void;
}

export const StoreDigitalCardModal: React.FC<StoreDigitalCardModalProps> = ({
  visible,
  vendor,
  onClose,
  onExploreVendors,
}) => {
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (visible && vendor?.vendor_id) {
      isVendorFavorited(vendor.vendor_id).then(setIsFav);
    }
  }, [visible, vendor?.vendor_id]);

  const handleToggleFavorite = async () => {
    if (vendor?.vendor_id) {
      const nextState = await toggleFavoriteVendorId(vendor.vendor_id);
      setIsFav(nextState);
    }
  };

  const shopUrl = `${getApiBaseUrl().replace('/api', '')}/shop/${vendor.vendor_id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&bgcolor=ffffff&color=541D26&margin=10`;

  const handleShareLink = () => {
    Share.share({
      message: `🛒 Shop at ${vendor.store_name} on DigiLocal!\n\n${shopUrl}`,
      title: `${vendor.store_name} — DigiLocal Store`,
    });
  };

  const handleExplore = () => {
    onClose();
    if (onExploreVendors) {
      onExploreVendors();
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Digital Store Card</Text>
              <Text style={styles.sheetSubtitle}>Share or favorite this store</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Favorite Toggle Button */}
              <TouchableOpacity
                style={[styles.favHeaderBtn, isFav && styles.favHeaderBtnActive]}
                onPress={handleToggleFavorite}
                activeOpacity={0.75}
              >
                <Heart
                  size={18}
                  color={isFav ? '#EF4444' : '#78716C'}
                  fill={isFav ? '#EF4444' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <X size={18} color="#211A19" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* QR Card */}
            <View style={styles.qrCard}>
              {/* Card Top Band */}
              <View style={styles.qrCardTopBand}>
                <View style={styles.qrCardLogoRow}>
                  <View style={styles.qrLogoBox}>
                    <DigiLocalLogo size={65} primaryColor="#541D26" goldColor="#C8A878" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.qrCardBrandLabel}>DIGILOCAL</Text>
                    <Text style={styles.qrCardBrandSub}>Vendor Store Card</Text>
                  </View>
                  {/* Inline Favorite Tag */}
                  <TouchableOpacity
                    style={[styles.favTag, isFav && styles.favTagActive]}
                    onPress={handleToggleFavorite}
                    activeOpacity={0.8}
                  >
                    <Heart
                      size={13}
                      color={isFav ? '#FFFFFF' : '#C8A878'}
                      fill={isFav ? '#FFFFFF' : 'none'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.favTagText, isFav && styles.favTagTextActive]}>
                      {isFav ? 'Favorited' : 'Favorite'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* QR Code */}
              <View style={styles.qrImageBox}>
                <Image
                  source={{ uri: qrUrl }}
                  style={{ width: 200, height: 200 }}
                  resizeMode="contain"
                />
              </View>

              {/* Store Details */}
              <View style={styles.qrCardDetails}>
                <Text style={styles.qrStoreName}>{vendor.store_name}</Text>
                <Text style={styles.qrOwnerName}>by {vendor.vendor_name}</Text>

                <View style={styles.qrDetailRow}>
                  <Building size={13} color="#78716C" style={{ marginRight: 6 }} />
                  <Text style={styles.qrDetailText}>{vendor.society_name || 'DigiLocal Society'}</Text>
                </View>
                {(vendor.shop_number && vendor.shop_number !== 'N/A') || (vendor as any).shop_no ? (
                  <View style={styles.qrDetailRow}>
                    <Store size={13} color="#78716C" style={{ marginRight: 6 }} />
                    <Text style={styles.qrDetailText}>Shop No: {vendor.shop_number || (vendor as any).shop_no}</Text>
                  </View>
                ) : null}
                {vendor.phone_number ? (
                  <View style={styles.qrDetailRow}>
                    <Phone size={13} color="#78716C" style={{ marginRight: 6 }} />
                    <Text style={styles.qrDetailText}>{vendor.phone_number}</Text>
                  </View>
                ) : null}
                <View style={styles.qrDetailRow}>
                  <Mail size={13} color="#78716C" style={{ marginRight: 6 }} />
                  <Text style={styles.qrDetailText}>{vendor.email}</Text>
                </View>
              </View>

              {/* Decorative bottom accent */}
              <View style={styles.qrCardBottomBar} />
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.favoriteBtn, isFav && styles.favoriteBtnActive]}
              onPress={handleToggleFavorite}
              activeOpacity={0.88}
            >
              <Heart
                size={16}
                color={isFav ? '#EF4444' : '#211A19'}
                fill={isFav ? '#EF4444' : 'none'}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.favoriteBtnText, isFav && styles.favoriteBtnTextActive]}>
                {isFav ? 'Remove from Favorite Vendors' : 'Add to Favorite Vendors'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink} activeOpacity={0.88}>
              <ExternalLink size={16} color="#F8F5EE" style={{ marginRight: 8 }} />
              <Text style={styles.shareBtnText}>Share Digital Store Link</Text>
            </TouchableOpacity>

            {onExploreVendors ? (
              <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore} activeOpacity={0.88}>
                <ShoppingBag size={16} color="#541D26" style={{ marginRight: 8 }} />
                <Text style={styles.exploreBtnText}>Explore Products & Vendors</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.closeSheetBtn} onPress={onClose} activeOpacity={0.88}>
              <Text style={styles.closeSheetBtnText}>Close</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E7DFD5',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211A19',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favHeaderBtnActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  favTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 160, 102, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 102, 0.4)',
  },
  favTagActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  favTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C8A878',
  },
  favTagTextActive: {
    color: '#FFFFFF',
  },
  // QR Card
  qrCard: {
    backgroundColor: '#F8F5EE',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    marginBottom: 16,
    shadowColor: '#211A19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrCardTopBand: {
    backgroundColor: '#541D26',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  qrCardLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCardBrandLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  qrCardBrandSub: {
    color: '#C8A878',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  qrImageBox: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD5',
  },
  qrCardDetails: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  qrStoreName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#211A19',
    textAlign: 'center',
  },
  qrOwnerName: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
    marginBottom: 12,
    fontWeight: '500',
  },
  qrDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  qrDetailText: {
    fontSize: 12,
    color: '#78716C',
    fontWeight: '500',
  },
  qrCardBottomBar: {
    height: 6,
    backgroundColor: '#C8A878',
    marginTop: 0,
  },
  favoriteBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteBtnActive: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  favoriteBtnText: {
    color: '#211A19',
    fontSize: 13.5,
    fontWeight: '700',
  },
  favoriteBtnTextActive: {
    color: '#DC2626',
  },
  shareBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  exploreBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F7EEF0',
    borderWidth: 1,
    borderColor: '#F0D6DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  exploreBtnText: {
    color: '#541D26',
    fontSize: 13.5,
    fontWeight: '700',
  },
  closeSheetBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSheetBtnText: {
    color: '#211A19',
    fontSize: 14,
    fontWeight: '700',
  },
});
