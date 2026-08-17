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
  Linking,
} from 'react-native';
import {
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  MapPin,
  Search,
  Check,
  X,
  Sparkles,
  ChefHat,
  ShoppingBag,
} from 'lucide-react-native';
import { VendorOrder, VendorItem, updateOrderStatusApi } from '../services/apiService';
import { stopAlarmSound } from '../services/notificationService';
import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';

interface OrdersScreenProps {
  vendorId: number;
  orders: VendorOrder[];
  storeItems?: VendorItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  isDarkMode?: boolean;
}

type StatusFilter = 'ALL' | 'PLACED' | 'ACCEPTED' | 'DELIVERED' | 'CANCELLED';

export const matchOrderStatus = (orderStatus?: string, filter?: StatusFilter): boolean => {
  if (!filter || filter === 'ALL') return true;
  const s = (orderStatus || '').toUpperCase().trim();
  switch (filter) {
    case 'PLACED':
      return s === 'PLACED' || s === 'PENDING' || s === 'NEW';
    case 'ACCEPTED':
      return s === 'ACCEPTED' || s === 'CONFIRMED' || s === 'OUT_FOR_DELIVERY' || s === 'PREPARING' || s === 'PROCESSING';
    case 'DELIVERED':
      return s === 'DELIVERED' || s === 'COMPLETED' || s === 'DONE';
    case 'CANCELLED':
      return s === 'CANCELLED' || s === 'REJECTED' || s === 'DECLINED';
    default:
      return s === filter;
  }
};

const TAB_LABEL_MAP: Record<StatusFilter, string> = {
  ALL: 'All Orders',
  PLACED: 'New',
  ACCEPTED: 'In Prep',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/**
 * Format order timestamp matching screenshot "Aug 17, 2026, 04:10 PM"
 */
export const formatScreenshotDate = (timestamp?: string | number | null): string => {
  if (!timestamp) {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }
  try {
    let date: Date;
    if (typeof timestamp === 'number') {
      date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);
    } else if (typeof timestamp === 'string') {
      const trimmed = timestamp.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
        const now = new Date();
        return now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) + ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      if (/^\d+$/.test(trimmed)) {
        const num = parseInt(trimmed, 10);
        date = new Date(num < 1e12 ? num * 1000 : num);
      } else {
        const iso = trimmed.includes(' ') && !trimmed.includes('T') ? trimmed.replace(' ', 'T') : trimmed;
        date = new Date(iso);
      }
    } else {
      date = new Date(timestamp);
    }

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }

    const monthDay = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${monthDay}, ${timeStr}`;
  } catch {
    return 'Today';
  }
};

/**
 * Format Order raw ID to `#7473` and `#ORD-7473`
 */
export const extractOrderDigits = (rawId: string | number): string => {
  const s = String(rawId).trim();
  const digits = s.replace(/[^\d]/g, '');
  return digits || s;
};

export const formatOrderId = (rawId: string | number): string => {
  const digits = extractOrderDigits(rawId);
  return `#ORD-${digits}`;
};

/**
 * Intelligent unit inference for items
 */
export const inferDefaultUnit = (name: string): string => {
  if (!name) return '1kg';
  const lower = name.toLowerCase().trim();
  if (
    lower.includes('apple') ||
    lower.includes('potato') ||
    lower.includes('onion') ||
    lower.includes('tomato') ||
    lower.includes('mango') ||
    lower.includes('orange') ||
    lower.includes('carrot') ||
    lower.includes('cucumber') ||
    lower.includes('vegetable') ||
    lower.includes('fruit') ||
    lower.includes('rice') ||
    lower.includes('flour') ||
    lower.includes('atta') ||
    lower.includes('sugar') ||
    lower.includes('dal') ||
    lower.includes('paneer')
  ) {
    return '1kg';
  }
  if (
    lower.includes('milk') ||
    lower.includes('oil') ||
    lower.includes('juice') ||
    lower.includes('water') ||
    lower.includes('beverage') ||
    lower.includes('drink') ||
    lower.includes('ghee') ||
    lower.includes('curd')
  ) {
    return '1L';
  }
  if (lower.includes('banana') || lower.includes('egg')) {
    return '1 dozen';
  }
  if (
    lower.includes('bread') ||
    lower.includes('biscuit') ||
    lower.includes('chips') ||
    lower.includes('maggi') ||
    lower.includes('noodle') ||
    lower.includes('cookie') ||
    lower.includes('namkeen')
  ) {
    return '1 pack';
  }
  return '1kg';
};

/**
 * Format unit badge matching screenshot:
 * e.g., "1L/unit (4L total)" when qty is 4, "1L" when qty is 1, "1kg" when qty is 1.
 */
export const formatItemUnitBadge = (qty: number, unit: string): string => {
  let cleanUnit = (unit || '').trim();
  if (!cleanUnit) return '';

  if (qty <= 1) return cleanUnit;

  if (cleanUnit.toLowerCase() === 'g' || cleanUnit.toLowerCase() === 'gm' || cleanUnit.toLowerCase() === 'gram') {
    return `g (${qty}g total)`;
  }

  const match = cleanUnit.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
  if (match) {
    const num = parseFloat(match[1]);
    const u = match[2];
    const uLower = u.toLowerCase();
    const totalNum = num * qty;

    if (uLower === 'g' || uLower === 'gm' || uLower === 'gram' || uLower === 'grams') {
      if (totalNum >= 1000) {
        const kgVal = totalNum / 1000;
        return `${cleanUnit}/unit (${kgVal % 1 === 0 ? kgVal : kgVal.toFixed(1)}kg total)`;
      }
      return `${cleanUnit}/unit (${totalNum}g total)`;
    }
    if (uLower === 'ml') {
      if (totalNum >= 1000) {
        const lVal = totalNum / 1000;
        return `${cleanUnit}/unit (${lVal % 1 === 0 ? lVal : lVal.toFixed(1)}L total)`;
      }
      return `${cleanUnit}/unit (${totalNum}ml total)`;
    }
    if (uLower === 'l' || uLower === 'litre' || uLower === 'liter' || uLower === 'litres' || uLower === 'kg') {
      const unitLabel = uLower === 'kg' ? 'kg' : 'L';
      return `${cleanUnit}/unit (${totalNum % 1 === 0 ? totalNum : totalNum.toFixed(1)}${unitLabel} total)`;
    }
    return `${cleanUnit}/unit (${totalNum} ${u} total)`;
  }

  const lower = cleanUnit.toLowerCase();
  if (lower === 'piece') return `${qty} Pieces`;
  if (lower === 'packet') return `${qty} Packets`;
  if (lower === 'box') return `${qty} Boxes`;
  if (lower === 'set') return `${qty} Sets`;
  if (lower === 'bunch') return `${qty} Bunches`;
  if (lower === 'dozen') return `${qty} Dozen`;

  return `${cleanUnit} (${qty} total)`;
};

export const formatItemQuantity = (qty: number, rawUnit?: string): string => {
  const cleanUnit = (rawUnit || '').trim();
  if (!cleanUnit) {
    return `${qty} ${qty === 1 ? 'Piece' : 'Pieces'}`;
  }
  return `${qty} ${cleanUnit}`;
};

export interface NormalizedOrderItem {
  itemName: string;
  qty: number;
  unit: string;
  unitBadge: string;
  unitPrice: number;
  itemPrice: string;
  imageUrl: string;
}

export const normalizeOrderItem = (
  it: any,
  orderTotal: number = 0,
  storeItems: VendorItem[] = []
): NormalizedOrderItem => {
  if (!it) {
    return {
      itemName: 'Product Item',
      qty: 1,
      unit: '1kg',
      unitBadge: '1kg',
      unitPrice: orderTotal,
      itemPrice: orderTotal > 0 ? orderTotal.toFixed(2) : '0.00',
      imageUrl: '',
    };
  }

  // String item parsing
  if (typeof it === 'string') {
    let rawStr = it.trim();
    let parsedQty = 1;
    let unit = '';

    const qtyMatch = rawStr.match(/^(\d+)\s*(?:x|×)?\s+(.*)/i);
    if (qtyMatch) {
      parsedQty = parseInt(qtyMatch[1], 10) || 1;
      rawStr = qtyMatch[2].trim();
    }

    const unitMatch = rawStr.match(/(.+?)(?:\s*[-–(]\s*|\s+in\s+)(\d*\s*[a-zA-Z]+(?:\s+each|\s+pack)?)\)?$/i);
    let itemName = rawStr;
    if (unitMatch) {
      itemName = unitMatch[1].trim();
      unit = unitMatch[2].trim();
    }

    const matchedStoreItem = storeItems.find(si =>
      si.item_name?.toLowerCase() === itemName.toLowerCase() ||
      (si as any).name?.toLowerCase() === itemName.toLowerCase()
    );

    const unitPrice = matchedStoreItem?.price ? Number(matchedStoreItem.price) : orderTotal;
    const finalUnit = unit || matchedStoreItem?.unit || inferDefaultUnit(itemName);
    const totalPrice = (unitPrice * parsedQty).toFixed(2);
    const imageUrl = matchedStoreItem?.image_url || (matchedStoreItem as any)?.image || '';

    return {
      itemName: itemName || 'Product Item',
      qty: parsedQty,
      unit: finalUnit,
      unitBadge: formatItemUnitBadge(parsedQty, finalUnit),
      unitPrice,
      itemPrice: totalPrice,
      imageUrl,
    };
  }

  // Object item parsing
  let rawName = (
    it.item_name ||
    it.name ||
    it.product_name ||
    it.productName ||
    it.itemName ||
    it.title ||
    it.item ||
    it.product ||
    (typeof it.product_details === 'string' ? it.product_details : it.product_details?.name) ||
    ''
  );

  if (typeof rawName === 'object' && rawName !== null) {
    rawName = rawName.name || rawName.item_name || rawName.title || '';
  }

  let itemName = String(rawName || '').trim();

  // Match in store items catalog
  const itemId = it.item_id || it.id || it.itemId || it.product_id;
  const matchedStoreItem = storeItems.find(si =>
    (itemId && (si.item_id === itemId || (si as any).id === itemId)) ||
    (itemName && (si.item_name?.toLowerCase() === itemName.toLowerCase() || (si as any).name?.toLowerCase() === itemName.toLowerCase()))
  );

  if (!itemName || itemName.toLowerCase() === 'item' || itemName.toLowerCase() === 'product item') {
    if (matchedStoreItem?.item_name || (matchedStoreItem as any)?.name) {
      itemName = matchedStoreItem?.item_name || (matchedStoreItem as any)?.name || 'Product Item';
    } else {
      itemName = itemName || 'Fresh Grocery Item';
    }
  }

  // Quantity
  const rawQty = it.quantity ?? it.qty ?? it.count ?? it.item_quantity ?? it.item_qty ?? it.pieces ?? 1;
  const parsedQty = Number(rawQty);
  const qty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;

  // Unit Resolution
  let rawUnit = (
    it.unit ||
    it.quantity_unit ||
    it.unit_name ||
    it.unit_type ||
    it.weight ||
    it.size ||
    it.measure ||
    it.uom ||
    it.package_unit ||
    matchedStoreItem?.unit ||
    ''
  ).trim();

  if (!rawUnit || rawUnit.toLowerCase() === 'unit' || rawUnit.toLowerCase() === 'piece' || rawUnit.toLowerCase() === 'pcs') {
    if (matchedStoreItem?.unit && matchedStoreItem.unit.toLowerCase() !== 'unit') {
      rawUnit = matchedStoreItem.unit;
    } else {
      rawUnit = inferDefaultUnit(itemName);
    }
  }

  // Price Resolution
  let rawUnitPrice = it.unit_price !== undefined
    ? Number(it.unit_price)
    : (it.price !== undefined
      ? Number(it.price)
      : (it.rate !== undefined
        ? Number(it.rate)
        : (matchedStoreItem?.price !== undefined
          ? Number(matchedStoreItem.price)
          : 0)));

  let rawTotal = it.item_total !== undefined
    ? Number(it.item_total)
    : (it.total !== undefined
      ? Number(it.total)
      : (it.amount !== undefined
        ? Number(it.amount)
        : (rawUnitPrice > 0 ? rawUnitPrice * qty : 0)));

  if (rawTotal <= 0 && orderTotal > 0) {
    rawTotal = orderTotal;
  }
  if (rawUnitPrice <= 0 && rawTotal > 0 && qty > 0) {
    rawUnitPrice = rawTotal / qty;
  }

  const finalTotal = isNaN(rawTotal) ? 0 : rawTotal;
  const finalUnitPrice = isNaN(rawUnitPrice) ? 0 : rawUnitPrice;
  const imageUrl = it.image_url || it.image || it.img || it.photo || matchedStoreItem?.image_url || (matchedStoreItem as any)?.image || '';

  return {
    itemName,
    qty,
    unit: rawUnit,
    unitBadge: formatItemUnitBadge(qty, rawUnit),
    unitPrice: finalUnitPrice,
    itemPrice: finalTotal.toFixed(2),
    imageUrl,
  };
};

export const OrdersScreenComponent: React.FC<OrdersScreenProps> = React.memo(({
  vendorId,
  orders,
  storeItems = [],
  isLoading,
  onRefresh,
}) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [localOverrides, setLocalOverrides] = useState<Record<string | number, string>>({});

  // Merge orders with instant local optimistic overrides
  const effectiveOrders = React.useMemo(() => {
    return orders.map(o => {
      const override = localOverrides[o.order_id];
      if (override) {
        return { ...o, status: override as any };
      }
      return o;
    });
  }, [orders, localOverrides]);

  // Custom Alert Modal
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  const handleStatusUpdate = async (orderId: string | number, newStatus: any) => {
    stopAlarmSound();
    // 1. INSTANT OPTIMISTIC UI FLIP (0ms response)
    setLocalOverrides(prev => ({ ...prev, [orderId]: newStatus }));
    setUpdatingId(orderId);

    try {
      await updateOrderStatusApi(vendorId, orderId, newStatus);
      // Background sync without blocking user interaction
      onRefresh();
    } catch (err: any) {
      // Revert optimistic state if network call fails
      setLocalOverrides(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
      showAlert('Update Failed', err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCallCustomer = (phoneNum?: string) => {
    if (!phoneNum) return;
    const cleanNum = phoneNum.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanNum}`).catch(() => {
      showAlert('Call Failed', `Could not dial number: ${phoneNum}`, 'warning');
    });
  };

  const filteredOrders = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return effectiveOrders.filter((o) => {
      const matchesStatus = matchOrderStatus(o.status, statusFilter);
      if (!matchesStatus) return false;
      if (!query) return true;
      const orderIdStr = String(o.order_id);
      const customerName = (o.customer_name || '').toLowerCase();
      const phone = (o.phone_number || (o as any).phone || '').toLowerCase();
      return orderIdStr.includes(query) || customerName.includes(query) || phone.includes(query);
    });
  }, [effectiveOrders, statusFilter, searchQuery]);

  const tabCounts = React.useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      ALL: effectiveOrders.length,
      PLACED: 0,
      ACCEPTED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    effectiveOrders.forEach(o => {
      if (matchOrderStatus(o.status, 'PLACED')) counts.PLACED++;
      else if (matchOrderStatus(o.status, 'ACCEPTED')) counts.ACCEPTED++;
      else if (matchOrderStatus(o.status, 'DELIVERED')) counts.DELIVERED++;
      else if (matchOrderStatus(o.status, 'CANCELLED')) counts.CANCELLED++;
    });
    return counts;
  }, [effectiveOrders]);

  const newOrdersCount = tabCounts.PLACED;
  const acceptedOrdersCount = tabCounts.ACCEPTED;
  const completedOrdersCount = tabCounts.DELIVERED;

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase().trim();
    if (s === 'DELIVERED' || s === 'COMPLETED' || s === 'DONE') {
      return {
        bg: '#E6F7F0',
        text: '#15803D',
        dot: '#15803D',
        label: 'DELIVERED',
        isDelivered: true,
      };
    }
    if (s === 'ACCEPTED' || s === 'CONFIRMED' || s === 'OUT_FOR_DELIVERY' || s === 'PREPARING' || s === 'PROCESSING') {
      return {
        bg: '#E6F7F0',
        text: '#15803D',
        dot: '#15803D',
        label: 'ACCEPTED',
        isDelivered: false,
      };
    }
    if (s === 'PLACED' || s === 'PENDING' || s === 'NEW') {
      return {
        bg: '#FEF3C7',
        text: '#D97706',
        dot: '#D97706',
        label: 'NEW ORDER',
        isDelivered: false,
      };
    }
    if (s === 'CANCELLED' || s === 'REJECTED' || s === 'DECLINED') {
      return {
        bg: '#FEE2E2',
        text: '#DC2626',
        dot: '#DC2626',
        label: 'CANCELLED',
        isDelivered: false,
      };
    }
    return {
      bg: '#F3F4F6',
      text: '#4B5563',
      dot: '#4B5563',
      label: s || 'ORDER',
      isDelivered: false,
    };
  };

  return (
    <View style={styles.container}>
      {/* ─── 1. Top Metrics Summary Banner ─── */}
      <View style={styles.metricsBanner}>
        {/* New Orders */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#FEF9C3' }]}>
            <Sparkles size={14} color="#D97706" />
          </View>
          <View style={styles.statTextCol}>
            <Text style={styles.statValue}>{newOrdersCount}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
          </View>
        </View>

        {/* In Prep */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#F3F4F6' }]}>
            <ChefHat size={14} color="#4B5563" />
          </View>
          <View style={styles.statTextCol}>
            <Text style={styles.statValue}>{acceptedOrdersCount}</Text>
            <Text style={styles.statLabel}>In Prep</Text>
          </View>
        </View>

        {/* Delivered */}
        <View style={styles.statCard}>
          <View style={[styles.statIconBox, { backgroundColor: '#DCFCE7' }]}>
            <CheckCircle2 size={14} color="#16A34A" />
          </View>
          <View style={styles.statTextCol}>
            <Text style={styles.statValue}>{completedOrdersCount}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      {/* ─── 2. Search & Status Filter Pills ─── */}
      <View style={styles.topSection}>
        {/* Search Box */}
        <View style={styles.searchBox}>
          <Search size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order #, customer or phone..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterBar}
        >
          {(['ALL', 'PLACED', 'ACCEPTED', 'DELIVERED', 'CANCELLED'] as StatusFilter[]).map((tab) => {
            const count = tabCounts[tab] || 0;
            const isSelected = statusFilter === tab;

            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillUnselected,
                ]}
                onPress={() => setStatusFilter(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : '#18281F' },
                  ]}
                >
                  {TAB_LABEL_MAP[tab]}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isSelected ? '#C4A066' : '#F3F4F6' },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? '#18281F' : '#6B7C70' },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── 3. Orders List (Exact Screenshot Format) ─── */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => String(item.order_id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={['#34533C']}
            tintColor="#34533C"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <ShoppingBag size={28} color="#6B7C70" />
            </View>
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : statusFilter === 'ALL'
                ? 'No customer orders placed yet.'
                : `No orders in ${TAB_LABEL_MAP[statusFilter]} state.`}
            </Text>
          </View>
        }
        renderItem={({ item: order }) => {
          const badge = getStatusBadge(order.status);
          const isUpdating = updatingId === order.order_id;
          const digits = extractOrderDigits(order.order_id);
          const dateString = formatScreenshotDate(
            (order as any).created_at || (order as any).order_date || (order as any).timestamp
          );

          const rawItems = order.items || (order as any).order_items || [];
          let rawList: any[] = typeof rawItems === 'string'
            ? (() => {
              try {
                const parsed = JSON.parse(rawItems);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                const str = String(rawItems).trim();
                if (str) {
                  return str.split(',').map((s: string) => s.trim()).filter(Boolean);
                }
                return [];
              }
            })()
            : (Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []));

          if (rawList.length === 0) {
            const fallbackName = (order as any).item_name || (order as any).product_name || (order as any).product || (order as any).description || (order as any).items_summary;
            if (fallbackName) {
              rawList = [{
                item_name: fallbackName,
                quantity: (order as any).quantity || (order as any).qty || 1,
                price: order.total_amount || 0,
                unit: (order as any).unit || '',
              }];
            }
          }

          const orderTotal = Number(order.total_amount || (order as any).total || (order as any).amount || 0);
          const normalizedItems: NormalizedOrderItem[] = (rawList.length > 0 ? rawList : [{ item_name: 'Fresh Grocery Item' }]).map(it =>
            normalizeOrderItem(it, orderTotal, storeItems)
          );

          const itemCount = normalizedItems.length;
          const displayTotal = orderTotal > 0
            ? orderTotal.toFixed(2)
            : normalizedItems.reduce((acc, it) => acc + parseFloat(it.itemPrice || '0'), 0).toFixed(2);

          const phoneNum = String(order.phone_number || (order as any).phone || '').trim();
          const customerName = order.customer_name || 'Resident Customer';
          const fullAddress = order.address || (order as any).delivery_address || 'Tower A-402, Omaxe Greenwood Residency';

          return (
            <View style={styles.orderCard}>
              {/* ─── A. Card Top Header: Badge, Order #, Status Dot, Timestamp ─── */}
              <View style={styles.cardHeaderRow}>
                {/* Left: Title */}
                <View style={styles.orderTitleGroup}>
                  <Text style={styles.orderTitleText}>
                    Order <Text style={styles.orderIdBold}>#ORD-{digits}</Text>
                  </Text>
                </View>

                {/* Right: Status Pill + Date Pill */}
                <View style={styles.headerRightBadges}>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: badge.dot }]} />
                    <Text style={[styles.statusPillText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>

                  <View style={styles.datePill}>
                    <Clock size={11} color="#6B7C70" style={{ marginRight: 4 }} />
                    <Text style={styles.datePillText}>{dateString}</Text>
                  </View>
                </View>
              </View>

              {/* ─── B. Customer Card Box (Screenshot Exact Sand Tint) ─── */}
              <View style={styles.customerBox}>
                <View style={styles.customerTopRow}>
                  <View style={styles.customerNameGroup}>
                    <User size={15} color="#18281F" style={{ marginRight: 6 }} />
                    <Text style={styles.customerName}>{customerName}</Text>
                  </View>

                  {phoneNum ? (
                    <TouchableOpacity
                      style={styles.phonePillBtn}
                      onPress={() => handleCallCustomer(phoneNum)}
                      activeOpacity={0.75}
                    >
                      <Phone size={12} color="#187346" style={{ marginRight: 4 }} />
                      <Text style={styles.phonePillBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Address Row */}
                <View style={styles.addressRow}>
                  <MapPin size={13} color="#C4A066" style={{ marginRight: 6 }} />
                  <Text style={styles.addressText} numberOfLines={2}>
                    {(order as any).flat || (order as any).flat_no || (order as any).flat_number
                      ? `Flat ${(order as any).flat || (order as any).flat_no || (order as any).flat_number}, `
                      : ''}
                    {fullAddress}
                  </Text>
                </View>
              </View>

              {/* ─── C. Order Items Table / List ─── */}
              <View style={styles.itemsTableSection}>
                {/* Column Headers */}
                <View style={styles.itemsTableHeaderRow}>
                  <Text style={styles.itemsTableHeadingLeft}>
                    ORDER ITEMS ({itemCount})
                  </Text>
                  <Text style={styles.itemsTableHeadingRight}>
                    ITEM SUB-TOTAL
                  </Text>
                </View>

                {/* Item List Container */}
                <View style={styles.itemsListContainer}>
                  {normalizedItems.map((it, idx) => {
                    return (
                      <View key={idx} style={[styles.itemRow, idx > 0 && styles.itemRowBorder]}>
                        {/* Left: Quantity Badge + Name + Unit Badge */}
                        <View style={styles.itemLeftGroup}>
                          <View style={styles.qtyBadge}>
                            <Text style={styles.qtyBadgeText}>x{it.qty}</Text>
                          </View>

                          <Text style={styles.itemTitle}>{it.itemName}</Text>

                          {it.unitBadge ? (
                            <View style={styles.unitPill}>
                              <Text style={styles.unitPillText}>{it.unitBadge}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Right: Sub-total Price */}
                        <View style={styles.itemRightGroup}>
                          <Text style={styles.itemSubTotalText}>₹{it.itemPrice}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ─── D. Bottom Section: Action Buttons ─── */}
              <View style={styles.cardFooterArea}>
                {/* Action Buttons Area */}
                <View style={styles.actionButtonsCol}>
                  {isUpdating ? (
                    <View style={styles.updatingLoader}>
                      <ActivityIndicator size="small" color="#34533C" />
                      <Text style={styles.updatingText}>Updating...</Text>
                    </View>
                  ) : (
                    <>
                      {/* State 1: DELIVERED ➔ Completed Banner */}
                      {matchOrderStatus(order.status, 'DELIVERED') && (
                        <View style={styles.deliveredBanner}>
                          <CheckCircle2 size={16} color="#059669" style={{ marginRight: 6 }} />
                          <Text style={styles.deliveredBannerText}>
                            Order Completed & Delivered
                          </Text>
                        </View>
                      )}

                      {/* State 2: PLACED (New) ➔ Accept & Decline */}
                      {matchOrderStatus(order.status, 'PLACED') && (
                        <View style={styles.buttonsStack}>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnPrimaryGreen]}
                            onPress={() => handleStatusUpdate(order.order_id, 'ACCEPTED')}
                            activeOpacity={0.85}
                          >
                            <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.btnPrimaryGreenText}>ACCEPT ORDER</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnSecondaryRose]}
                            onPress={() => handleStatusUpdate(order.order_id, 'CANCELLED')}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnSecondaryRoseText}>DECLINE ORDER</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* State 3: ACCEPTED (In Prep) ➔ Mark Completed & Cancel Order */}
                      {matchOrderStatus(order.status, 'ACCEPTED') && (
                        <View style={styles.buttonsStack}>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnPrimaryGreen]}
                            onPress={() => handleStatusUpdate(order.order_id, 'DELIVERED')}
                            activeOpacity={0.85}
                          >
                            <CheckCircle2 size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.btnPrimaryGreenText}>MARK COMPLETED</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnSecondaryRose]}
                            onPress={() => handleStatusUpdate(order.order_id, 'CANCELLED')}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.btnSecondaryRoseText}>CANCEL ORDER</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* State 4: CANCELLED */}
                      {matchOrderStatus(order.status, 'CANCELLED') && (
                        <View style={styles.cancelledBanner}>
                          <XCircle size={15} color="#DC2626" style={{ marginRight: 6 }} />
                          <Text style={styles.cancelledBannerText}>Order Cancelled</Text>
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
        onClose={() => setAlertState((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDE4', // Warm Off-White Canvas
  },

  // ── 1. Metrics Banner ──
  metricsBanner: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statTextCol: {
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18281F',
    lineHeight: 18,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7C70',
    marginTop: 1,
  },

  // ── 2. Top Search & Filters ──
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#18281F',
    padding: 0,
  },
  filterBar: {
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  filterPillSelected: {
    backgroundColor: '#34533C',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // ── 3. Orders List ──
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 70,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18281F',
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#6B7C70',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },

  // ── 4. Main Order Card (Screenshot Exact Format) ──
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // A. Top Header Row (Single Line Layout)
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    marginRight: 6,
  },
  orderTitleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18281F',
  },
  orderIdBold: {
    fontWeight: '800',
    color: '#18281F',
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    justifyContent: 'flex-end',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F6F1',
    paddingHorizontal: 6.5,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEAE2',
  },
  datePillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#6B7C70',
  },

  // B. Customer Box (Screenshot Exact Sand Tint)
  customerBox: {
    backgroundColor: '#FAF8F3', // Cream / Sand Box
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    padding: 12,
    marginBottom: 14,
  },
  customerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  customerNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#18281F',
  },
  customerActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phonePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#BEE8D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  phonePillBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#187346',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },

  // C. Order Items Table Section
  itemsTableSection: {
    marginBottom: 14,
  },
  itemsTableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemsTableHeadingLeft: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.4,
  },
  itemsTableHeadingRight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.4,
  },
  itemsListContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEAE2',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F2EB',
  },
  itemLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    flexWrap: 'wrap',
  },
  qtyBadge: {
    backgroundColor: '#EFEFEA',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  qtyBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#374151',
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#18281F',
  },
  unitPill: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E6B3D',
  },
  itemRightGroup: {
    paddingLeft: 8,
  },
  itemSubTotalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#18281F',
  },

  // D. Bottom Section: Action Buttons
  cardFooterArea: {
    flexDirection: 'column',
    marginTop: 4,
  },
  actionButtonsCol: {},
  buttonsStack: {
    flexDirection: 'row',
    gap: 10,
  },
  btnAction: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  btnPrimaryGreen: {
    backgroundColor: '#0E6B3D', // Dark Forest Green
    shadowColor: '#0E6B3D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPrimaryGreenText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  btnSecondaryRose: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  btnSecondaryRoseText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.3,
  },

  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F8F0',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 12,
    height: 44,
    width: '100%',
  },
  deliveredBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    height: 44,
    width: '100%',
  },
  cancelledBannerText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },

  updatingLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  updatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34533C',
  },
});
