import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Linking
} from 'react-native';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  ShoppingBag,
  Search,
  Check,
  X,
  RotateCcw,
  Sparkles,
  TrendingUp,
  ChefHat,
  Bike,
  PackageCheck
} from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { VendorOrder, updateOrderStatusApi } from '../services/apiService';
import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';

interface OrdersScreenProps {
  vendorId: number;
  orders: VendorOrder[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  isDarkMode?: boolean;
}

type StatusFilter = 'ALL' | 'PLACED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

const formatElapsedTime = (timestamp: string) => {
  try {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHrs = Math.floor(diffMins / 60);
    return `${diffHrs} hrs ago`;
  } catch {
    return 'Recently';
  }
};

const isNonVegItem = (name: string) => {
  const text = name.toLowerCase();
  return text.includes('chicken') || text.includes('egg') || text.includes('mutton') || text.includes('fish') || text.includes('meat');
};

export const OrdersScreenComponent: React.FC<OrdersScreenProps> = ({
  vendorId,
  orders,
  isLoading,
  onRefresh,
  isDarkMode = false,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  // Custom Alert Popup State
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  const handleStatusUpdate = async (orderId: string | number, newStatus: any) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatusApi(vendorId, orderId, newStatus);
      await onRefresh();
      showAlert('Status Updated', `Order #${orderId} has been marked as ${newStatus}.`, 'success');
    } catch (err: any) {
      showAlert('Update Failed', err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCallCustomer = (phoneNum: string) => {
    if (!phoneNum) return;
    Linking.openURL(`tel:${phoneNum}`).catch(() => {
      showAlert('Call Failed', `Could not dial number: ${phoneNum}`, 'warning');
    });
  };

  // Filtered orders list
  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesQuery = searchQuery.trim() === '' ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.phone_number || o.phone || '').includes(searchQuery) ||
      String(o.order_id).includes(searchQuery);
    return matchesStatus && matchesQuery;
  });

  const newOrdersCount = orders.filter(o => (o.status === 'PLACED' || o.status === 'PENDING')).length;
  const acceptedOrdersCount = orders.filter(o => o.status === 'ACCEPTED').length;
  const completedOrdersCount = orders.filter(o => (o.status === 'COMPLETED' || o.status === 'DELIVERED')).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return { bg: '#FEF3C7', text: '#D97706', label: '⚡ NEW ORDER', border: '#FCD34D' };
      case 'ACCEPTED':
        return { bg: '#E0E7FF', text: '#4338CA', label: '🍳 PREPARING', border: '#C7D2FE' };
      case 'COMPLETED':
        return { bg: '#D1FAE5', text: '#047857', label: '✅ DELIVERED', border: '#A7F3D0' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#B91C1C', label: '❌ CANCELLED', border: '#FCA5A5' };
      default:
        return { bg: '#EFE8D8', text: '#18281F', label: status, border: '#E4DCC9' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F5EE' }]}>

      {/* Top Mobile-Responsive Metrics Banner */}
      <View style={styles.metricsBanner}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Sparkles size={14} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: '#D97706' }]} numberOfLines={1}>{newOrdersCount}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>New</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#E0E7FF' }]}>
            <ChefHat size={14} color="#4338CA" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: '#4338CA' }]} numberOfLines={1}>{acceptedOrdersCount}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>In Prep</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#D1FAE5' }]}>
            <CheckCircle2 size={14} color="#047857" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: '#047857' }]} numberOfLines={1}>{completedOrdersCount}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Delivered</Text>
          </View>
        </View>
      </View>

      {/* Header & Search */}
      <View style={styles.topSection}>
        <View style={styles.searchBox}>
          <Search size={18} color="#6B7C70" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order #, name or phone..."
            placeholderTextColor="#6B7C70"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#6B7C70" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filter Pills Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {(['ALL', 'PLACED', 'ACCEPTED', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map(tab => {
            const count = tab === 'ALL' ? orders.length : orders.filter(o => o.status === tab).length;
            const isSelected = statusFilter === tab;
            const labelMap: Record<string, string> = {
              ALL: 'ALL',
              PLACED: 'NEW',
              ACCEPTED: 'ACCEPTED',
              COMPLETED: 'COMPLETED',
              CANCELLED: 'CANCELLED'
            };

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillUnselected
                ]}
                onPress={() => setStatusFilter(tab)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.filterPillText,
                  { color: isSelected ? '#ffffff' : '#18281F' }
                ]}>
                  {labelMap[tab]}
                </Text>
                <View style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? '#FFFFFF' : '#EFE8D8' }
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: isSelected ? '#18281F' : '#6B7C70' }
                  ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Orders FlatList */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => String(item.order_id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#C4A066" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingBag size={48} color="#6B7C70" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {statusFilter === 'ALL'
                ? 'No customer orders have been placed yet.'
                : `No orders matching status "${statusFilter}".`}
            </Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const badge = getStatusBadge(order.status);
          const isUpdating = updatingId === order.order_id;
          const timeAgo = formatElapsedTime(order.order_timestamp || '');

          return (
            <View style={styles.orderCard}>

              {/* Order Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.orderIdText}>Order #{order.order_id}</Text>
                    <View style={styles.timeTag}>
                      <Clock size={10} color="#6B7C70" style={{ marginRight: 3 }} />
                      <Text style={styles.timeTagText}>{timeAgo}</Text>
                    </View>
                  </View>

                  <Text style={styles.orderDateText} numberOfLines={1}>
                    {new Date(order.order_timestamp || Date.now()).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]} numberOfLines={1}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              {/* Customer & Address Details Card */}
              <View style={styles.customerSection}>
                <View style={styles.customerTopRow}>
                  <View style={styles.customerInfo}>
                    <View style={styles.avatarCircle}>
                      <User size={14} color="#18281F" />
                    </View>
                    <Text style={styles.customerName} numberOfLines={1}>{order.customer_name}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCallCustomer(order.phone_number || order.phone || '')}
                    activeOpacity={0.85}
                  >
                    <Phone size={12} color="#18281F" style={{ marginRight: 4 }} />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.addressRow}>
                  <MapPin size={14} color="#C4A066" style={{ marginRight: 6, marginTop: 2 }} />
                  <Text style={styles.addressText} numberOfLines={2}>{order.address}</Text>
                </View>
              </View>

              {/* Itemized Order List */}
              <View style={styles.itemsSection}>
                <Text style={styles.sectionHeading}>ORDERED ITEMS ({order.items?.length || 0})</Text>

                {(order.items || []).map((it, idx) => {
                  const nonVeg = isNonVegItem(it.item_name);

                  return (
                    <View key={idx} style={styles.itemRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingRight: 8 }}>
                        {nonVeg ? (
                          <View style={styles.nonVegEmblem}>
                            <View style={styles.nonVegDot} />
                          </View>
                        ) : (
                          <View style={styles.vegEmblem}>
                            <View style={styles.vegDot} />
                          </View>
                        )}
                        <Text style={styles.qtyMultiplier}>{it.quantity} ×</Text>
                        <Text style={styles.itemNameText} numberOfLines={1}>{it.item_name}</Text>
                      </View>

                      <Text style={styles.itemPriceText}>₹{parseFloat(String(it.item_total)).toFixed(2)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Total & Mobile-Responsive Full Width Action Bar */}
              <View style={styles.cardFooter}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>TOTAL BILL AMOUNT</Text>
                  <Text style={styles.totalValue}>₹{parseFloat(String(order.total_amount)).toFixed(2)}</Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#C4A066" />
                  ) : (
                    <>
                      {(order.status === 'PLACED' || order.status === 'PENDING') && (
                        <View style={styles.btnGroupRow}>
                          <TouchableOpacity
                            style={[styles.btn, styles.btnDecline]}
                            onPress={() => handleStatusUpdate(order.order_id, 'CANCELLED')}
                            activeOpacity={0.85}
                          >
                            <X size={14} color="#B91C1C" />
                            <Text style={styles.btnDeclineText}>Decline</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btn, styles.btnAccept]}
                            onPress={() => handleStatusUpdate(order.order_id, 'ACCEPTED')}
                            activeOpacity={0.88}
                          >
                            <Check size={16} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={styles.btnAcceptText}>ACCEPT ORDER</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <View style={styles.btnGroupRow}>
                          <TouchableOpacity
                            style={[styles.btn, styles.btnDecline]}
                            onPress={() => handleStatusUpdate(order.order_id, 'CANCELLED')}
                            activeOpacity={0.85}
                          >
                            <X size={14} color="#B91C1C" />
                            <Text style={styles.btnDeclineText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btn, styles.btnComplete]}
                            onPress={() => handleStatusUpdate(order.order_id, 'COMPLETED')}
                            activeOpacity={0.88}
                          >
                            <PackageCheck size={16} color="#ffffff" style={{ marginRight: 4 }} />
                            <Text style={styles.btnCompleteText}>MARK DELIVERED</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {((order.status === 'COMPLETED' || order.status === 'DELIVERED') || order.status === 'CANCELLED') && (
                        <View style={styles.finishedBadge}>
                          <Text style={styles.finishedBadgeText}>
                            {(order.status === 'COMPLETED' || order.status === 'DELIVERED') ? 'ORDER DELIVERED SUCCESSFULLY' : 'ORDER CANCELLED'}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>

            </View>
          );
        }}
      />

      {/* Custom Alert Modal */}
      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  metricsBanner: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    padding: 8,
    gap: 6,
  },
  statIconBox: {
    width: 26,
    height: 26,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7C70',
  },
  topSection: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#18281F',
  },
  filterBar: {
    gap: 6,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 4,
  },
  filterPillSelected: {
    backgroundColor: '#18281F',
    borderWidth: 1,
    borderColor: '#18281F',
  },
  filterPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countText: {
    fontSize: 9,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18281F',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7C70',
    marginTop: 4,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F3',
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#18281F',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE8D8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7C70',
  },
  orderDateText: {
    fontSize: 10,
    color: '#6B7C70',
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  customerSection: {
    backgroundColor: '#FAF8F3',
    borderRadius: 12,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  customerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 6,
  },
  avatarCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFE8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18281F',
    flex: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE8D8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  callBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18281F',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontSize: 11,
    color: '#6B7C70',
    fontWeight: '600',
    lineHeight: 15,
  },
  itemsSection: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7C70',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  vegEmblem: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#0F8A65',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0F8A65',
  },
  nonVegEmblem: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  nonVegDot: {
    width: 4,
    height: 4,
    backgroundColor: '#E53935',
  },
  qtyMultiplier: {
    fontSize: 11,
    fontWeight: '900',
    color: '#C4A066',
    marginRight: 6,
  },
  itemNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18281F',
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#18281F',
  },
  cardFooter: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F3',
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#6B7C70',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#C4A066',
  },
  actionButtonsRow: {
    width: '100%',
  },
  btnGroupRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  btn: {
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDecline: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
  },
  btnDeclineText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B91C1C',
  },
  btnAccept: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#0F8A65',
    shadowColor: '#0F8A65',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnAcceptText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  btnComplete: {
    flex: 2,
    flexDirection: 'row',
    backgroundColor: '#18281F',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnCompleteText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F8F5EE',
    letterSpacing: 0.4,
  },
  finishedBadge: {
    backgroundColor: '#EFE8D8',
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  finishedBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#18281F',
    letterSpacing: 0.4,
  },
});
