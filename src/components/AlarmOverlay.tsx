import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Vibration,
  Platform
} from 'react-native';
import {
  Bell,
  CheckCircle2,
  VolumeX,
  User,
  MapPin,
  Phone,
  XCircle,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { VendorOrder } from '../services/apiService';
import { stopAlarmSound } from '../services/notificationService';
import { formatItemQuantity } from './OrdersScreen';

interface AlarmOverlayProps {
  order: VendorOrder | null;
  onAccept: (orderId: string | number) => void;
  onReject: (orderId: string | number) => void;
  onMute: () => void;
  isDarkMode?: boolean;
  businessType?: 'PRODUCT' | 'SERVICE';
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({
  order,
  onAccept,
  onReject,
  onMute,
  businessType = 'PRODUCT',
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const isService = businessType === 'SERVICE' || (order as any)?.business_type === 'SERVICE' || Boolean((order as any)?.service_requested);

  useEffect(() => {
    if (!order) return;

    setIsMuted(false);

    // Pulsing bell animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Flashing deep maroon/wine alert background
    const flashLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flashAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(flashAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ])
    );
    flashLoop.start();

    // Trigger phone vibration
    if (Platform.OS !== 'web') {
      Vibration.vibrate([500, 500, 500, 500, 500], true);
    }

    return () => {
      pulseLoop.stop();
      flashLoop.stop();
      if (Platform.OS !== 'web') {
        Vibration.cancel();
      }
      stopAlarmSound();
    };
  }, [order]);

  if (!order) return null;

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1C070B', '#340F16'],
  });

  const handleMuteClick = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    stopAlarmSound();
    setIsMuted(true);
    onMute();
  };

  const handleRejectClick = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    stopAlarmSound();
    onReject(order.order_id);
  };

  const handleDirectCall = () => {
    if (order?.phone_number) {
      handleMuteClick();
      Linking.openURL(`tel:${order.phone_number}`).catch(() => {});
    }
  };

  const handleDirectWhatsApp = () => {
    if (order?.phone_number) {
      handleMuteClick();
      const cleanNumber = order.phone_number.replace(/[^0-9]/g, '');
      const phoneWithCountry = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
      const serviceName = (order as any)?.service_requested || (order.items && order.items[0]?.item_name) || 'your enquiry';
      const msg = encodeURIComponent(`Hi ${order.customer_name || 'there'}, thank you for contacting us on DigiLocal regarding "${serviceName}". We have received your request.`);
      Linking.openURL(`https://wa.me/${phoneWithCountry}?text=${msg}`).catch(() => {});
    }
  };

  const handleAcceptClick = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    stopAlarmSound();
    onAccept(order.order_id);
  };

  return (
    <Modal visible={Boolean(order)} transparent animationType="fade">
      <Animated.View style={[styles.overlay, { backgroundColor }]}>
        <View style={styles.container}>

          {/* Pulsing Golden Bell Header */}
          <Animated.View style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Bell size={42} color="#C8A878" />
          </Animated.View>

          <Text style={styles.mainTitle}>
            {isService ? 'NEW SERVICE ENQUIRY!' : 'NEW ORDER RECEIVED!'}
          </Text>
          <Text style={styles.subTitle}>
            {isService ? `Action required immediately • Lead #${order.order_id}` : `Action required immediately • Order #${order.order_id}`}
          </Text>

          {/* Order / Lead Details Card (DigiLocal Forest & Gold Style) */}
          <View style={styles.card}>
            
            {/* Customer Box */}
            <View style={styles.customerBox}>
              <View style={styles.infoRow}>
                <User size={15} color="#C8A878" style={{ marginRight: 8 }} />
                <Text style={styles.custName}>{order.customer_name || 'Resident Customer'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Phone size={14} color="#78716C" style={{ marginRight: 8 }} />
                <Text style={styles.custText}>{order.phone_number || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={14} color="#78716C" style={{ marginRight: 8 }} />
                <Text style={styles.custText}>
                  {(() => {
                    const rawFlat = String(
                      (order as any).flat ||
                      (order as any).flat_no ||
                      (order as any).flat_number ||
                      (order as any).customer_flat ||
                      (order as any).customer_flat_no ||
                      (order as any).user_flat ||
                      (order as any).user_flat_no ||
                      (order as any).customer?.flat_no ||
                      (order as any).customer?.flat ||
                      (order as any).user?.flat_no ||
                      (order as any).user?.flat ||
                      (order as any).unit_no ||
                      (order as any).unit ||
                      ''
                    ).trim();
                    let rawAddr = String(order.delivery_address || order.address || (order as any).customer_address || '').trim();
                    if (rawFlat) {
                      if (/Flat\s*#?\s*[\w-]+/i.test(rawAddr)) {
                        rawAddr = rawAddr.replace(/Flat\s*#?\s*[\w-]+/gi, `Flat ${rawFlat}`);
                      } else if (!rawAddr.toLowerCase().includes(rawFlat.toLowerCase())) {
                        return rawAddr ? `Flat ${rawFlat}, ${rawAddr}` : `Flat ${rawFlat}`;
                      }
                    }
                    return rawAddr || 'Resident in Society';
                  })()}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {isService ? (
              /* Category 2 Service Lead Details */
              <View style={{ gap: 8, paddingVertical: 4 }}>
                <Text style={styles.itemsHeading}>SERVICE REQUESTED</Text>
                <View style={styles.serviceLeadBox}>
                  <Text style={styles.serviceLeadTitle}>
                    {(order as any)?.service_requested || (order.items && order.items[0]?.item_name) || 'Service Consultation / Repair'}
                  </Text>
                  {((order as any)?.message || (order as any)?.special_instructions) ? (
                    <Text style={styles.serviceLeadNote}>
                      Note: "{(order as any)?.message || (order as any)?.special_instructions}"
                    </Text>
                  ) : null}
                  {((order as any)?.preferred_time_slot || (order as any)?.preferred_date) ? (
                    <View style={styles.timeSlotBadge}>
                      <Clock size={12} color="#C8A878" style={{ marginRight: 4 }} />
                      <Text style={styles.timeSlotText}>
                        Slot: {(order as any)?.preferred_date ? `${(order as any).preferred_date} ` : ''}{(order as any)?.preferred_time_slot || 'Earliest'}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Quick 1-tap Contact Row */}
                <View style={styles.quickContactLeadRow}>
                  <TouchableOpacity style={styles.quickCallLeadBtn} onPress={handleDirectCall} activeOpacity={0.8}>
                    <Phone size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.quickLeadBtnText}>Call Resident</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickWaLeadBtn} onPress={handleDirectWhatsApp} activeOpacity={0.8}>
                    <MessageSquare size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.quickLeadBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Category 1 Product Order Items */
              <>
                <Text style={styles.itemsHeading}>ORDERED ITEMS</Text>
                <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
                  {(order.items || []).map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemQty}>{formatItemQuantity(it.quantity || 1, it.unit)}</Text>
                      <Text style={styles.itemName}>{it.item_name}</Text>
                      <Text style={styles.itemPrice}>₹{(it.item_total || (it.price ? Number(it.price) * it.quantity : 0))}</Text>
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.divider} />

                {/* Total Bill Row */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL BILL AMOUNT</Text>
                  <Text style={styles.totalValue}>₹{order.total_amount}</Text>
                </View>
              </>
            )}

          </View>

          {/* Action Button Controls */}
          <View style={styles.buttonContainer}>
            
            <View style={styles.buttonRow}>
              {/* Mute Button */}
              <TouchableOpacity
                style={[styles.btn, styles.muteBtn, isMuted && styles.muteBtnActive]}
                onPress={handleMuteClick}
                activeOpacity={0.8}
              >
                <VolumeX size={18} color="#78716C" />
                <Text style={[styles.muteBtnText, isMuted && styles.muteBtnTextActive]}>
                  {isMuted ? 'Muted' : 'Mute'}
                </Text>
              </TouchableOpacity>

              {/* Reject Button */}
              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={handleRejectClick}
                activeOpacity={0.8}
              >
                <XCircle size={18} color="#DC2626" />
                <Text style={styles.rejectBtnText}>{isService ? 'Decline' : 'Reject'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm & Accept Button */}
            <Animated.View style={{ width: '100%', marginTop: 12, transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.btn, styles.ackBtn]}
                onPress={handleAcceptClick}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={20} color="#211A19" />
                <Text style={styles.ackBtnText}>
                  {isService ? 'Accept & Schedule' : 'Accept & Confirm'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

          </View>

        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  bellContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(196, 160, 102, 0.18)',
    borderWidth: 2,
    borderColor: '#C8A878',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8F5EE',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: '#C8A878',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    width: '100%',
    backgroundColor: '#280D12',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C8A878',
    padding: 20,
    marginBottom: 20,
    maxHeight: 380,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  customerBox: {
    backgroundColor: '#3E141C',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#541D26',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFDF9',
  },
  custText: {
    fontSize: 13,
    color: '#D6B7A5',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#4A1821',
    marginVertical: 12,
  },
  itemsHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C8A878',
    letterSpacing: 1,
    marginBottom: 8,
  },
  itemsScroll: {
    maxHeight: 120,
  },
  itemsContent: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: 13,
    fontWeight: '800',
    color: '#C8A878',
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFDF9',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D6B7A5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D6B7A5',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#C8A878',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  btn: {
    height: 50,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  muteBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
  },
  muteBtnActive: {
    backgroundColor: '#3E141C',
    borderColor: '#541D26',
  },
  muteBtnText: {
    color: '#541D26',
    fontWeight: '700',
    fontSize: 13,
  },
  muteBtnTextActive: {
    color: '#D6B7A5',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
  ackBtn: {
    backgroundColor: '#C8A878',
  },
  ackBtnText: {
    color: '#2B0E14',
    fontWeight: '900',
    fontSize: 14,
  },
  serviceLeadBox: {
    backgroundColor: '#3E141C',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#541D26',
  },
  serviceLeadTitle: {
    color: '#FAF8F5',
    fontSize: 14.5,
    fontWeight: '800',
  },
  serviceLeadNote: {
    color: '#78716C',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(196, 160, 102, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  timeSlotText: {
    color: '#C8A878',
    fontSize: 11.5,
    fontWeight: '700',
  },
  quickContactLeadRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  quickCallLeadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#541D26',
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickWaLeadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickLeadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
