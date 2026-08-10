import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  CreditCard,
  TrendingUp,
  Clock,
  ArrowUpRight,
  CheckCircle,
  AlertCircle
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';
import { VendorPayment } from '../services/apiService';

interface PayoutsScreenProps {
  payments: VendorPayment[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const PayoutsScreenComponent: React.FC<PayoutsScreenProps> = ({
  payments,
  isLoading,
  onRefresh,
}) => {
  // Filter out the 2,999 registration subscription fee from vendor payouts
  const payoutList = payments.filter(p => parseFloat(String(p.amount)) !== 2999);

  // Calculate total earnings from actual order payouts
  const totalEarnings = payoutList
    .filter(p => p.status?.toLowerCase() === 'success' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const renderPayoutItem = ({ item }: { item: VendorPayment }) => {
    const isSuccess = item.status?.toLowerCase() === 'success' || item.status?.toLowerCase() === 'completed';
    return (
      <View style={styles.payoutCard}>
        <View style={styles.payoutLeft}>
          <View style={[styles.iconWrapper, { backgroundColor: isSuccess ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)' }]}>
            {isSuccess ? (
              <CheckCircle size={18} color="#10B981" />
            ) : (
              <Clock size={18} color="#F59E0B" />
            )}
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.payoutId}>Payout Ref #{item.payment_id}</Text>
            <Text style={styles.payoutDate}>
              {item.paid_at ? new Date(item.paid_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }) : 'Processing'}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.payoutAmount}>₹{parseFloat(String(item.amount)).toFixed(2)}</Text>
          <Text style={[styles.payoutStatus, { color: isSuccess ? '#10B981' : '#F59E0B' }]}>
            {isSuccess ? 'Settled' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewLabel}>Total Disbursed Earnings</Text>
          <TrendingUp size={20} color={BrandTheme.accentYellowGold} />
        </View>
        <Text style={styles.earningsAmount}>₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
        
        <View style={styles.payoutDetailsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Settlement Cycle</Text>
            <Text style={styles.detailValue}>T+1 Settlement</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.detailLabel}>Next Transfer</Text>
            <Text style={styles.detailValue}>Midnight (Auto)</Text>
          </View>
        </View>
      </View>

      {/* History List */}
      <Text style={styles.sectionTitle}>Payout Settlements</Text>
      <FlatList
        data={payoutList}
        renderItem={renderPayoutItem}
        keyExtractor={(item) => String(item.payment_id)}
        contentContainerStyle={styles.listContainer}
        refreshing={isLoading}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={32} color={BrandTheme.mutedSageText} />
            <Text style={styles.emptyText}>No payouts settled yet.</Text>
            <Text style={styles.emptySubText}>Settlements will show here after completing orders.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.warmOffWhite,
    padding: 16,
  },
  overviewCard: {
    backgroundColor: BrandTheme.darkForestGreen,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewLabel: {
    color: BrandTheme.mutedSageText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  earningsAmount: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Poppins' : 'Poppins_700Bold',
    marginBottom: 12,
  },
  payoutDetailsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  detailLabel: {
    color: BrandTheme.mutedSageText,
    fontSize: 10.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    color: BrandTheme.creamCanvas,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  listContainer: {
    paddingBottom: 24,
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutId: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  payoutDate: {
    fontSize: 10.5,
    color: BrandTheme.mutedSageText,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: 12.5,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  payoutStatus: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
