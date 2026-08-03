import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Share,
  ScrollView,
} from 'react-native';
import { X, Store, Building, Mail, Phone, ExternalLink, QrCode } from 'lucide-react-native';
import { VendorUser } from '../services/apiService';
import { getApiBaseUrl } from '../services/apiService';

interface StoreDigitalCardModalProps {
  visible: boolean;
  vendor: VendorUser;
  onClose: () => void;
}

export const StoreDigitalCardModal: React.FC<StoreDigitalCardModalProps> = ({
  visible,
  vendor,
  onClose,
}) => {
  const shopUrl = `${getApiBaseUrl().replace('/api', '')}/shop/${vendor.vendor_id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shopUrl)}&bgcolor=ffffff&color=18281F&margin=10`;

  const handleShareLink = () => {
    Share.share({
      message: `🛒 Shop at ${vendor.store_name} on DigiLocal!\n\n${shopUrl}`,
      title: `${vendor.store_name} — DigiLocal Store`,
    });
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
            <View>
              <Text style={styles.sheetTitle}>Digital Store Card</Text>
              <Text style={styles.sheetSubtitle}>Share your store QR with residents</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
              <X size={18} color="#18281F" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* QR Card */}
            <View style={styles.qrCard}>
              {/* Card Top Band */}
              <View style={styles.qrCardTopBand}>
                <View style={styles.qrCardLogoRow}>
                  <View style={styles.qrLogoBox}>
                    <Store size={20} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text style={styles.qrCardBrandLabel}>DIGILOCAL</Text>
                    <Text style={styles.qrCardBrandSub}>Vendor Store Card</Text>
                  </View>
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
                  <Building size={13} color="#6B7C70" style={{ marginRight: 6 }} />
                  <Text style={styles.qrDetailText}>{vendor.society_name || 'DigiLocal Society'}</Text>
                </View>
                {vendor.phone_number ? (
                  <View style={styles.qrDetailRow}>
                    <Phone size={13} color="#6B7C70" style={{ marginRight: 6 }} />
                    <Text style={styles.qrDetailText}>{vendor.phone_number}</Text>
                  </View>
                ) : null}
                <View style={styles.qrDetailRow}>
                  <Mail size={13} color="#6B7C70" style={{ marginRight: 6 }} />
                  <Text style={styles.qrDetailText}>{vendor.email}</Text>
                </View>
              </View>

              {/* Shop URL */}
              <View style={styles.urlBox}>
                <Text style={styles.urlText} numberOfLines={1}>{shopUrl}</Text>
              </View>

              {/* Decorative bottom accent */}
              <View style={styles.qrCardBottomBar} />
            </View>

            {/* Actions */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareLink} activeOpacity={0.88}>
              <ExternalLink size={16} color="#F8F5EE" style={{ marginRight: 8 }} />
              <Text style={styles.shareBtnText}>Share Digital Store Link</Text>
            </TouchableOpacity>

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
    borderColor: '#E4DCC9',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E4DCC9',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18281F',
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#6B7C70',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFE8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // QR Card
  qrCard: {
    backgroundColor: '#F8F5EE',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    marginBottom: 16,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrCardTopBand: {
    backgroundColor: '#18281F',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrCardBrandLabel: {
    color: '#F8F5EE',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  qrCardBrandSub: {
    color: '#C4A066',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  qrImageBox: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E4DCC9',
  },
  qrCardDetails: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  qrStoreName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#18281F',
    textAlign: 'center',
  },
  qrOwnerName: {
    fontSize: 12,
    color: '#6B7C70',
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
    color: '#6B7C70',
    fontWeight: '500',
  },
  urlBox: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#EFE8D8',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  urlText: {
    fontSize: 11,
    color: '#18281F',
    fontWeight: '600',
  },
  qrCardBottomBar: {
    height: 6,
    backgroundColor: '#C4A066',
    marginTop: 0,
  },
  shareBtn: {
    flexDirection: 'row',
    height: 50,
    borderRadius: 14,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  shareBtnText: {
    color: '#F8F5EE',
    fontSize: 14,
    fontWeight: '700',
  },
  closeSheetBtn: {
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EFE8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeSheetBtnText: {
    color: '#18281F',
    fontSize: 14,
    fontWeight: '700',
  },
});
