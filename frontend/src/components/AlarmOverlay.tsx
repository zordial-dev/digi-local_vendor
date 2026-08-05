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
  Phone
} from 'lucide-react-native';
import { VendorOrder } from '../services/apiService';

interface AlarmOverlayProps {
  order: VendorOrder | null;
  onAccept: (orderId: string | number) => void;
  onMute: () => void;
  isDarkMode?: boolean;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({
  order,
  onAccept,
  onMute,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

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

    // Flashing forest green/gold-red alert background
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
    };
  }, [order]);

  if (!order) return null;

  const backgroundColor = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#18281F', '#243A2D'],
  });

  const handleMuteClick = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    setIsMuted(true);
    onMute();
  };

  const handleAcceptClick = () => {
    if (Platform.OS !== 'web') {
      Vibration.cancel();
    }
    onAccept(order.order_id);
  };

  return (
    <Modal visible={Boolean(order)} transparent animationType="fade">
      <Animated.View style={[styles.overlay, { backgroundColor }]}>
        <View style={styles.container}>

          {/* Pulsing Golden Bell Header */}
          <Animated.View style={[styles.bellContainer, { transform: [{ scale: pulseAnim }] }]}>
            <Bell size={42} color="#C4A066" />
          </Animated.View>

          <Text style={styles.mainTitle}>NEW ORDER RECEIVED!</Text>
          <Text style={styles.subTitle}>Action required immediately • Order #{order.order_id}</Text>

          {/* Order Details Card (DigiLocal Forest & Gold Style) */}
          <View style={styles.card}>
            
            {/* Customer Box */}
            <View style={styles.customerBox}>
              <View style={styles.infoRow}>
                <User size={15} color="#C4A066" style={{ marginRight: 8 }} />
                <Text style={styles.custName}>{order.customer_name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Phone size={14} color="#94A69A" style={{ marginRight: 8 }} />
                <Text style={styles.custText}>{order.phone_number}</Text>
              </View>

              <View style={styles.infoRow}>
                <MapPin size={14} color="#94A69A" style={{ marginRight: 8 }} />
                <Text style={styles.custText}>{order.address}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Scrollable list of items */}
            <Text style={styles.itemsHeading}>ORDERED ITEMS</Text>
            <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
              {(order.items || []).map((it, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemQty}>{it.quantity}x</Text>
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

          </View>

          {/* Action Button Controls */}
          <View style={styles.buttonRow}>
            
            {/* Mute Button */}
            <TouchableOpacity
              style={[styles.btn, styles.muteBtn, isMuted && styles.muteBtnActive]}
              onPress={handleMuteClick}
              activeOpacity={0.8}
            >
              <VolumeX size={18} color={isMuted ? '#6B7C70' : '#F87171'} />
              <Text style={[styles.muteBtnText, isMuted && styles.muteBtnTextActive]}>
                {isMuted ? 'Alarm Muted' : 'Mute Sound'}
              </Text>
            </TouchableOpacity>

            {/* Confirm & Accept Button */}
            <Animated.View style={{ flex: 1.3, transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.btn, styles.ackBtn]}
                onPress={handleAcceptClick}
                activeOpacity={0.8}
              >
                <CheckCircle2 size={20} color="#18281F" />
                <Text style={styles.ackBtnText}>Accept & Confirm</Text>
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
    borderColor: '#C4A066',
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
    color: '#C4A066',
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    width: '100%',
    backgroundColor: '#18281F',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#C4A066',
    padding: 20,
    marginBottom: 20,
    maxHeight: 380,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  customerBox: {
    backgroundColor: '#243A2D',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#2E4738',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  custName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8F5EE',
  },
  custText: {
    fontSize: 13,
    color: '#94A69A',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#2E4738',
    marginVertical: 12,
  },
  itemsHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C4A066',
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
    color: '#C4A066',
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8F5EE',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A69A',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A69A',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#C4A066',
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
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },
  muteBtnActive: {
    backgroundColor: '#243A2D',
    borderColor: '#2E4738',
  },
  muteBtnText: {
    color: '#B91C1C',
    fontWeight: '700',
    fontSize: 13,
  },
  muteBtnTextActive: {
    color: '#94A69A',
  },
  ackBtn: {
    backgroundColor: '#C4A066',
  },
  ackBtnText: {
    color: '#18281F',
    fontWeight: '900',
    fontSize: 14,
  },
});
