import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Building2,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Filter,
  Check,
  X,
  CreditCard,
  Send,
  Info,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';
import { VendorPayment, VendorUser } from '../services/api/types';

interface PayoutsScreenProps {
  payments?: VendorPayment[];
  vendor?: VendorUser;
  isLoading?: boolean;
  onRefresh?: () => void;
}

interface BankAccountInfo {
  holderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  accountType: string;
  upiId: string;
  panNumber: string;
  gstin: string;
  isVerified: boolean;
}

interface PayoutTransaction {
  id: string;
  amount: number;
  date: string;
  time: string;
  accountMask: string;
  status: 'PAID' | 'PROCESSING' | 'FAILED' | 'CANCELLED';
  txnId?: string;
  failureReason?: string;
  grossSales?: number;
  commission?: number;
  tax?: number;
}

export const PayoutsScreenComponent: React.FC<PayoutsScreenProps> = React.memo(({
  payments = [],
  vendor,
  isLoading = false,
  onRefresh,
}) => {
  // Navigation / Tabs state: 'overview' | 'account' | 'history'
  const [activeTab, setActiveTab] = useState<'overview' | 'account' | 'history'>('overview');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'PAID' | 'PROCESSING' | 'FAILED' | 'CANCELLED'>('ALL');

  // Modals state
  const [showRequestPayoutModal, setShowRequestPayoutModal] = useState(false);
  const [showEditBankModal, setShowEditBankModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<PayoutTransaction | null>(null);

  // Request payout form state
  const [payoutAmountInput, setPayoutAmountInput] = useState('0');
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Bank Account State (Vendor's verified account)
  const [bankInfo, setBankInfo] = useState<BankAccountInfo>({
    holderName: vendor?.vendor_name || 'Vendor Partner',
    bankName: 'HDFC Bank',
    accountNumber: '•••• •••• •••• 4582',
    ifscCode: 'HDFC0001234',
    branchName: 'Main Branch',
    accountType: 'Savings',
    upiId: vendor?.phone_number ? `${vendor.phone_number}@upi` : 'vendor@upi',
    panNumber: 'ABCDE1234F',
    gstin: vendor?.gst_number || '07ABCDE1234F1Z5',
    isVerified: true,
  });

  // Edit bank form temporary state
  const [editHolderName, setEditHolderName] = useState(bankInfo.holderName);
  const [editBankName, setEditBankName] = useState(bankInfo.bankName);
  const [editAccountNum, setEditAccountNum] = useState('9876543210124582');
  const [editConfirmAccountNum, setEditConfirmAccountNum] = useState('9876543210124582');
  const [editIfsc, setEditIfsc] = useState(bankInfo.ifscCode);
  const [editBranch, setEditBranch] = useState(bankInfo.branchName);
  const [editAccountType, setEditAccountType] = useState(bankInfo.accountType);
  const [editUpiId, setEditUpiId] = useState(bankInfo.upiId);
  const [editPan, setEditPan] = useState(bankInfo.panNumber);
  const [editGstin, setEditGstin] = useState(bankInfo.gstin);
  const [bankFormError, setBankFormError] = useState('');
  const [bankSaveSuccess, setBankSaveSuccess] = useState(false);

  // Filter out subscription fee if present
  const actualPayments = payments.filter(p => parseFloat(String(p.amount)) !== 2999);

  // Dynamic calculations for new / active vendors
  const totalPaidOut = actualPayments
    .filter(p => p.status?.toLowerCase() === 'success' || p.status?.toLowerCase() === 'completed')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const pendingPayout = actualPayments
    .filter(p => p.status?.toLowerCase() === 'pending' || p.status?.toLowerCase() === 'processing')
    .reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0);

  const availableBalance = 0.00; // New vendor: 0.00 until orders are placed
  const totalEarnings = totalPaidOut + pendingPayout + availableBalance;
  const nextPayoutDate = pendingPayout > 0 ? 'Tomorrow' : 'T+1 on Orders';
  const daysLeft = pendingPayout > 0 ? 'In Next Batch' : 'Settles Daily';

  // Earnings Breakdown
  const grossSales = 0.00;
  const platformCommission = 0.00;
  const taxes = 0.00;
  const refunds = 0.00;
  const netEarnings = 0.00;

  // Real or mock mapped transactions (empty for new vendor unless payments exist)
  const [transactions, setTransactions] = useState<PayoutTransaction[]>(
    actualPayments.map(p => ({
      id: `PAY${p.payment_id}`,
      amount: parseFloat(String(p.amount)) || 0,
      date: p.paid_at ? new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today',
      time: p.paid_at ? new Date(p.paid_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '12:00 PM',
      accountMask: 'Bank Account •••• 4582',
      status: (p.status?.toUpperCase() === 'SUCCESS' || p.status?.toUpperCase() === 'COMPLETED') ? 'PAID' : 'PROCESSING',
      txnId: `TXN${p.payment_id}88`,
      grossSales: (parseFloat(String(p.amount)) || 0) * 1.1,
      commission: (parseFloat(String(p.amount)) || 0) * 0.08,
      tax: (parseFloat(String(p.amount)) || 0) * 0.02,
    }))
  );

  // Filtered transactions for History Tab
  const filteredTransactions = transactions.filter(t => {
    if (historyFilter === 'ALL') return true;
    return t.status === historyFilter;
  });

  const handleRequestPayout = () => {
    const amt = parseFloat(payoutAmountInput);
    if (isNaN(amt) || amt <= 0 || amt > availableBalance) {
      return;
    }
    setSubmittingPayout(true);
    setTimeout(() => {
      setSubmittingPayout(false);
      setRequestSuccess(true);
      const newTxn: PayoutTransaction = {
        id: `PAY${Math.floor(10000 + Math.random() * 90000)}`,
        amount: amt,
        date: 'Today',
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        accountMask: 'Bank Account •••• 4582',
        status: 'PROCESSING',
        txnId: '-',
        grossSales: amt * 1.1,
        commission: amt * 0.08,
        tax: amt * 0.02,
      };
      setTransactions(prev => [newTxn, ...prev]);
    }, 900);
  };

  const handleSaveBankInfo = () => {
    setBankFormError('');
    if (!editHolderName.trim()) {
      setBankFormError('Please enter Account Holder Name');
      return;
    }
    if (!editBankName.trim()) {
      setBankFormError('Please enter Bank Name');
      return;
    }
    if (editAccountNum.trim().length < 9) {
      setBankFormError('Please enter a valid Account Number (min 9 digits)');
      return;
    }
    if (editAccountNum.trim() !== editConfirmAccountNum.trim()) {
      setBankFormError('Account Numbers do not match');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(editIfsc.toUpperCase().trim())) {
      setBankFormError('Please enter a valid 11-digit IFSC code (e.g. HDFC0001234)');
      return;
    }

    const last4 = editAccountNum.trim().slice(-4);
    setBankInfo({
      holderName: editHolderName.trim(),
      bankName: editBankName.trim(),
      accountNumber: `•••• •••• •••• ${last4}`,
      ifscCode: editIfsc.toUpperCase().trim(),
      branchName: editBranch.trim() || 'Main Branch',
      accountType: editAccountType,
      upiId: editUpiId.trim(),
      panNumber: editPan.toUpperCase().trim(),
      gstin: editGstin.toUpperCase().trim(),
      isVerified: true,
    });

    setBankSaveSuccess(true);
    setTimeout(() => {
      setBankSaveSuccess(false);
      setShowEditBankModal(false);
    }, 1000);
  };

  const getStatusBadge = (status: PayoutTransaction['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <View style={[styles.statusPill, { backgroundColor: '#EAF7EE' }]}>
            <Text style={[styles.statusPillText, { color: BrandTheme.emeraldGreen }]}>Paid</Text>
          </View>
        );
      case 'PROCESSING':
        return (
          <View style={[styles.statusPill, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statusPillText, { color: '#B45309' }]}>Processing</Text>
          </View>
        );
      case 'FAILED':
        return (
          <View style={[styles.statusPill, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.statusPillText, { color: '#B91C1C' }]}>Failed</Text>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.statusPill, { backgroundColor: '#EFEFEA' }]}>
            <Text style={[styles.statusPillText, { color: BrandTheme.mutedSageText }]}>Cancelled</Text>
          </View>
        );
    }
  };

  const getStatusIcon = (status: PayoutTransaction['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <View style={[styles.txnIconWrap, { backgroundColor: '#EAF7EE' }]}>
            <CheckCircle2 size={18} color={BrandTheme.emeraldGreen} />
          </View>
        );
      case 'PROCESSING':
        return (
          <View style={[styles.txnIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={18} color="#B45309" />
          </View>
        );
      case 'FAILED':
        return (
          <View style={[styles.txnIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <XCircle size={18} color="#B91C1C" />
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={[styles.txnIconWrap, { backgroundColor: '#EFEFEA' }]}>
            <AlertCircle size={18} color={BrandTheme.mutedSageText} />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* ─── TOP HEADER ─── */}
      <View style={styles.headerBar}>
        {activeTab !== 'overview' ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={BrandTheme.darkForestGreen} />
            <Text style={styles.headerTitle}>
              {activeTab === 'account' ? 'Payout Account' : 'Payout History'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>Payouts</Text>
        )}

        <View style={styles.headerRightRow}>
          {activeTab === 'history' ? (
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => { }}
              activeOpacity={0.7}
            >
              <Filter size={18} color={BrandTheme.darkForestGreen} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.helpBtn}
              onPress={() => setShowHelpModal(true)}
              activeOpacity={0.7}
            >
              <HelpCircle size={20} color={BrandTheme.darkForestGreen} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── SEGMENTED CONTROL TABS (Visible on Overview) ─── */}
      {activeTab === 'overview' ? (
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, styles.segmentBtnActive]}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, styles.segmentTextActive]}>
              Overview
            </Text>
            <View style={styles.segmentIndicator} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setActiveTab('account')}
            activeOpacity={0.8}
          >
            <Text style={styles.segmentText}>
              Payout Account
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.segmentBtn}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text style={styles.segmentText}>
              Payout History
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* ═══════════════════════════════════════════════
          SCREEN 1: OVERVIEW TAB CONTENT
         ═══════════════════════════════════════════════ */}
      {activeTab === 'overview' ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Hero Available Balance Card ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroSub}>Available Balance</Text>
              <Text style={styles.heroAmount}>
                ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <TouchableOpacity
                style={[
                  styles.requestBtn,
                  availableBalance <= 0 && { opacity: 0.85 }
                ]}
                onPress={() => {
                  setRequestSuccess(false);
                  setPayoutAmountInput(String(availableBalance));
                  setShowRequestPayoutModal(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.requestBtnText}>Request Payout</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroRight}>
              {/* Stylized 3D-feel Wallet Illustration */}
              <View style={styles.walletIllustrationWrap}>
                <View style={styles.walletCardBack} />
                <View style={styles.walletBody}>
                  <Wallet size={32} color={BrandTheme.creamCanvas} />
                  <View style={styles.walletCoin}>
                    <Text style={styles.walletCoinText}>₹</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── 2. 2x2 Bento Stat Grid ── */}
          <View style={styles.bentoGrid}>
            {/* Bento 1: Total Earnings */}
            <View style={styles.bentoCard}>
              <View style={[styles.bentoIconBox, { backgroundColor: '#EAF7EE' }]}>
                <Wallet size={18} color={BrandTheme.emeraldGreen} />
              </View>
              <Text style={styles.bentoLabel}>Total Earnings</Text>
              <Text style={styles.bentoValue}>
                ₹{totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.bentoSub}>All Time</Text>
            </View>

            {/* Bento 2: Pending Payout */}
            <View style={styles.bentoCard}>
              <View style={[styles.bentoIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={18} color="#B45309" />
              </View>
              <Text style={styles.bentoLabel}>Pending Payout</Text>
              <Text style={styles.bentoValue}>
                ₹{pendingPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <View style={[styles.statusPillMini, { backgroundColor: '#EFEFEA' }]}>
                <Text style={[styles.statusPillMiniText, { color: BrandTheme.mutedSageText }]}>
                  {pendingPayout > 0 ? 'Processing' : 'None'}
                </Text>
              </View>
            </View>

            {/* Bento 3: Total Paid Out */}
            <View style={styles.bentoCard}>
              <View style={[styles.bentoIconBox, { backgroundColor: '#EAF7EE' }]}>
                <ArrowUpRight size={18} color={BrandTheme.forestGreen} />
              </View>
              <Text style={styles.bentoLabel}>Total Paid Out</Text>
              <Text style={styles.bentoValue}>
                ₹{totalPaidOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
              <Text style={styles.bentoSub}>All Time</Text>
            </View>

            {/* Bento 4: Next Payout Date */}
            <View style={styles.bentoCard}>
              <View style={[styles.bentoIconBox, { backgroundColor: BrandTheme.warmOffWhite }]}>
                <Calendar size={18} color={BrandTheme.darkForestGreen} />
              </View>
              <Text style={styles.bentoLabel}>Next Payout Date</Text>
              <Text style={styles.bentoValue}>{nextPayoutDate}</Text>
              <Text style={styles.bentoSub}>{daysLeft}</Text>
            </View>
          </View>

          {/* ── 3. Earnings Breakdown Card ── */}
          <View style={styles.whiteCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Earnings Breakdown</Text>
              <ChevronRight size={16} color={BrandTheme.mutedSageText} />
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Gross Sales</Text>
              <Text style={styles.breakdownValue}>₹{grossSales.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Platform Commission</Text>
              <Text style={[styles.breakdownValue, { color: BrandTheme.mutedSageText }]}>₹{platformCommission.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Taxes / Adjustments</Text>
              <Text style={[styles.breakdownValue, { color: BrandTheme.mutedSageText }]}>₹{taxes.toFixed(2)}</Text>
            </View>

            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Refunds</Text>
              <Text style={[styles.breakdownValue, { color: BrandTheme.mutedSageText }]}>₹{refunds.toFixed(2)}</Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.breakdownRow}>
              <Text style={styles.netEarningsLabel}>Net Earnings</Text>
              <Text style={styles.netEarningsValue}>₹{netEarnings.toFixed(2)}</Text>
            </View>
          </View>

          {/* ── 4. Payout Account Overview Card ── */}
          <View style={styles.whiteCard}>
            <View style={styles.payoutAccountRow}>
              <View style={styles.bankIconCircle}>
                <Building2 size={20} color={BrandTheme.forestGreen} />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.payoutAccSmallHeader}>Payout Account</Text>
                <Text style={styles.payoutBankTitle}>{bankInfo.bankName}</Text>
                <Text style={styles.payoutAccNumText}>{bankInfo.accountNumber}</Text>
                <Text style={styles.payoutIfscText}>IFSC: {bankInfo.ifscCode}</Text>

                <View style={styles.verifiedTag}>
                  <Check size={10} color={BrandTheme.emeraldGreen} style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.manageAccBtn}
              onPress={() => setActiveTab('account')}
              activeOpacity={0.8}
            >
              <Text style={styles.manageAccBtnText}>Manage Account</Text>
            </TouchableOpacity>
          </View>

          {/* ── 5. Info Note Box ── */}
          <View style={styles.infoNoticeBox}>
            <Info size={18} color={BrandTheme.forestGreen} style={{ marginRight: 10, marginTop: 1 }} />
            <Text style={styles.infoNoticeText}>
              Payout will be transferred to your bank account within 1-2 working days of order completion.
            </Text>
          </View>

          {/* ── 6. Recent Payouts Section ── */}
          <View style={styles.recentSectionHeader}>
            <Text style={styles.recentTitle}>Recent Payouts</Text>
            <TouchableOpacity onPress={() => setActiveTab('history')} activeOpacity={0.7}>
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length > 0 ? (
            transactions.slice(0, 3).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentPayoutCard}
                onPress={() => setSelectedTxn(item)}
                activeOpacity={0.7}
              >
                <View style={styles.recentLeft}>
                  {getStatusIcon(item.status)}
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.recentPayoutId}>{item.id}</Text>
                    <Text style={styles.recentPayoutDate}>{item.date}</Text>
                  </View>
                </View>

                <View style={styles.recentRight}>
                  <Text style={styles.recentPayoutAmount}>
                    ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={{ marginTop: 2 }}>{getStatusBadge(item.status)}</View>
                </View>
                <ChevronRight size={14} color={BrandTheme.mutedSageText} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyRecentBox}>
              <Sparkles size={24} color={BrandTheme.warmTanGold} style={{ marginBottom: 6 }} />
              <Text style={styles.emptyRecentTitle}>No Payouts Yet</Text>
              <Text style={styles.emptyRecentSub}>
                Your store settlements will automatically appear here as customers place and receive orders.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {/* ═══════════════════════════════════════════════
          SCREEN 2: PAYOUT ACCOUNT TAB CONTENT
         ═══════════════════════════════════════════════ */}
      {activeTab === 'account' ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Verified Status Banner */}
          <View style={styles.verifiedBanner}>
            <ShieldCheck size={22} color={BrandTheme.emeraldGreen} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verifiedBannerTitle}>Your payout account is verified</Text>
              <Text style={styles.verifiedBannerSubtitle}>
                Payouts will be sent to this account.
              </Text>
            </View>
          </View>

          {/* Bank Account Details Card */}
          <View style={styles.whiteCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardSectionTitle}>Bank Account Details</Text>
              <TouchableOpacity
                onPress={() => {
                  setEditHolderName(bankInfo.holderName);
                  setEditBankName(bankInfo.bankName);
                  setEditIfsc(bankInfo.ifscCode);
                  setEditBranch(bankInfo.branchName);
                  setEditAccountType(bankInfo.accountType);
                  setEditUpiId(bankInfo.upiId);
                  setEditPan(bankInfo.panNumber);
                  setEditGstin(bankInfo.gstin);
                  setBankFormError('');
                  setShowEditBankModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.editLinkText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Account Holder Name</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.holderName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Bank Name</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.bankName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Account Number</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.accountNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Confirm Account Number</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.accountNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>IFSC Code</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.ifscCode}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Branch Name</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.branchName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>Account Type</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.accountType}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>UPI ID (Optional)</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.upiId}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>PAN Number</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.panNumber}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailFieldLabel}>GSTIN (If applicable)</Text>
              <Text style={styles.detailFieldValue}>{bankInfo.gstin}</Text>
            </View>
          </View>

          {/* Security Notice Box */}
          <View style={styles.securityBox}>
            <Lock size={18} color={BrandTheme.forestGreen} style={{ marginRight: 10, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.securityTitle}>Your bank details are secure with us.</Text>
              <Text style={styles.securitySub}>We never share your information with anyone.</Text>
            </View>
          </View>
        </ScrollView>
      ) : null}

      {/* ═══════════════════════════════════════════════
          SCREEN 3: PAYOUT HISTORY TAB CONTENT
         ═══════════════════════════════════════════════ */}
      {activeTab === 'history' ? (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Pills Header */}
          <View style={styles.historyFilterBar}>
            {(['ALL', 'PAID', 'PROCESSING', 'FAILED', 'CANCELLED'] as const).map((filterKey) => {
              const label =
                filterKey === 'ALL'
                  ? 'All'
                  : filterKey.charAt(0) + filterKey.slice(1).toLowerCase();
              const isSelected = historyFilter === filterKey;
              return (
                <TouchableOpacity
                  key={filterKey}
                  style={[
                    styles.historyFilterBtn,
                    isSelected && styles.historyFilterBtnActive,
                  ]}
                  onPress={() => setHistoryFilter(filterKey)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.historyFilterBtnText,
                      isSelected && styles.historyFilterBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payout Transactions List or Empty State */}
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyCard}
                onPress={() => setSelectedTxn(item)}
                activeOpacity={0.8}
              >
                <View style={styles.historyCardTopRow}>
                  <View style={styles.historyLeft}>
                    {getStatusIcon(item.status)}
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.historyId}>{item.id}</Text>
                      <Text style={styles.historyDateTime}>
                        {item.date} • {item.time}
                      </Text>
                      <Text style={styles.historyAccountDest}>{item.accountMask}</Text>
                    </View>
                  </View>

                  <View style={styles.historyRight}>
                    <Text style={styles.historyAmount}>
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={{ marginTop: 2 }}>{getStatusBadge(item.status)}</View>
                    <Text style={styles.historyTxnRef}>{item.txnId || '-'}</Text>
                  </View>
                  <ChevronRight size={16} color={BrandTheme.mutedSageText} style={{ marginLeft: 6 }} />
                </View>

                {/* Error explanation for failed transactions */}
                {item.status === 'FAILED' && item.failureReason ? (
                  <View style={styles.failureReasonRow}>
                    <Text style={styles.failureReasonText}>{item.failureReason}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyHistoryState}>
              <AlertCircle size={38} color={BrandTheme.mutedSageText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyHistoryTitle}>No Payout Settlements Yet</Text>
              <Text style={styles.emptyHistorySub}>
                When customers place orders and complete deliveries through your store, daily settlements will automatically show here.
              </Text>
            </View>
          )}
        </ScrollView>
      ) : null}

      {/* ─── MODAL 1: REQUEST PAYOUT MODAL ─── */}
      <Modal visible={showRequestPayoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Instant Payout</Text>
              <TouchableOpacity onPress={() => setShowRequestPayoutModal(false)}>
                <X size={20} color={BrandTheme.darkForestGreen} />
              </TouchableOpacity>
            </View>

            {requestSuccess ? (
              <View style={styles.successStateBox}>
                <CheckCircle2 size={48} color={BrandTheme.emeraldGreen} />
                <Text style={styles.successStateTitle}>Payout Requested!</Text>
                <Text style={styles.successStateMsg}>
                  ₹{parseFloat(payoutAmountInput).toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be credited to {bankInfo.bankName} ({bankInfo.accountNumber}) within 1-2 business days.
                </Text>
                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => {
                    setShowRequestPayoutModal(false);
                    setActiveTab('history');
                  }}
                >
                  <Text style={styles.modalDoneBtnText}>View in Payout History</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalSub}>
                  Enter the amount you wish to withdraw to your verified bank account.
                </Text>

                <View style={styles.modalInputBox}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    style={styles.modalAmountInput}
                    keyboardType="numeric"
                    value={payoutAmountInput}
                    onChangeText={setPayoutAmountInput}
                    placeholder="0.00"
                  />
                </View>

                <View style={styles.modalBalanceHintRow}>
                  <Text style={styles.modalBalanceHint}>
                    Max Available: ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <TouchableOpacity onPress={() => setPayoutAmountInput(String(availableBalance))}>
                    <Text style={styles.useMaxLink}>Withdraw Max</Text>
                  </TouchableOpacity>
                </View>

                {availableBalance <= 0 ? (
                  <View style={styles.zeroBalanceNotice}>
                    <Info size={14} color={BrandTheme.mutedSageText} style={{ marginRight: 6 }} />
                    <Text style={styles.zeroBalanceNoticeText}>
                      You currently have ₹0.00 available. Balance accumulates as store orders are completed.
                    </Text>
                  </View>
                ) : null}

                <View style={styles.destAccountBox}>
                  <Building2 size={18} color={BrandTheme.forestGreen} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.destBankName}>{bankInfo.bankName}</Text>
                    <Text style={styles.destAccNum}>{bankInfo.accountNumber}</Text>
                  </View>
                  <View style={styles.verifiedTagMini}>
                    <Text style={styles.verifiedTagMiniText}>Verified</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.modalActionBtn,
                    (submittingPayout || availableBalance <= 0 || parseFloat(payoutAmountInput) <= 0) && { opacity: 0.6 }
                  ]}
                  onPress={handleRequestPayout}
                  disabled={submittingPayout || availableBalance <= 0 || parseFloat(payoutAmountInput) <= 0}
                >
                  {submittingPayout ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.modalActionBtnText}>Confirm & Transfer</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 2: EDIT BANK ACCOUNT MODAL ─── */}
      <Modal visible={showEditBankModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bank Account</Text>
              <TouchableOpacity onPress={() => setShowEditBankModal(false)}>
                <X size={20} color={BrandTheme.darkForestGreen} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {bankFormError ? (
                <View style={styles.formErrorBox}>
                  <AlertCircle size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                  <Text style={styles.formErrorText}>{bankFormError}</Text>
                </View>
              ) : null}

              {bankSaveSuccess ? (
                <View style={styles.formSuccessBox}>
                  <Check size={16} color={BrandTheme.emeraldGreen} style={{ marginRight: 6 }} />
                  <Text style={styles.formSuccessText}>Bank details updated successfully!</Text>
                </View>
              ) : null}

              <Text style={styles.formLabel}>Account Holder Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editHolderName}
                onChangeText={setEditHolderName}
                placeholder="e.g. Rahul Sharma"
              />

              <Text style={styles.formLabel}>Bank Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editBankName}
                onChangeText={setEditBankName}
                placeholder="e.g. HDFC Bank"
              />

              <Text style={styles.formLabel}>Account Number *</Text>
              <TextInput
                style={styles.formInput}
                value={editAccountNum}
                onChangeText={setEditAccountNum}
                keyboardType="numeric"
                placeholder="Enter bank account number"
              />

              <Text style={styles.formLabel}>Confirm Account Number *</Text>
              <TextInput
                style={styles.formInput}
                value={editConfirmAccountNum}
                onChangeText={setEditConfirmAccountNum}
                keyboardType="numeric"
                placeholder="Re-enter bank account number"
              />

              <Text style={styles.formLabel}>IFSC Code *</Text>
              <TextInput
                style={styles.formInput}
                value={editIfsc}
                onChangeText={setEditIfsc}
                autoCapitalize="characters"
                placeholder="e.g. HDFC0001234"
              />

              <Text style={styles.formLabel}>Branch Name</Text>
              <TextInput
                style={styles.formInput}
                value={editBranch}
                onChangeText={setEditBranch}
                placeholder="e.g. Connaught Place, New Delhi"
              />

              <Text style={styles.formLabel}>UPI ID (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={editUpiId}
                onChangeText={setEditUpiId}
                autoCapitalize="none"
                placeholder="e.g. rahulsharma@okhdfcbank"
              />

              <Text style={styles.formLabel}>PAN Number</Text>
              <TextInput
                style={styles.formInput}
                value={editPan}
                onChangeText={setEditPan}
                autoCapitalize="characters"
                placeholder="e.g. ABCDE1234F"
              />

              <Text style={styles.formLabel}>GSTIN (If applicable)</Text>
              <TextInput
                style={styles.formInput}
                value={editGstin}
                onChangeText={setEditGstin}
                autoCapitalize="characters"
                placeholder="e.g. 07ABCDE1234F1Z5"
              />

              <TouchableOpacity
                style={[styles.modalActionBtn, { marginTop: 16, marginBottom: 24 }]}
                onPress={handleSaveBankInfo}
              >
                <Text style={styles.modalActionBtnText}>Save Account Details</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 3: TRANSACTION DETAILS RECEIPT ─── */}
      <Modal visible={Boolean(selectedTxn)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Receipt</Text>
              <TouchableOpacity onPress={() => setSelectedTxn(null)}>
                <X size={20} color={BrandTheme.darkForestGreen} />
              </TouchableOpacity>
            </View>

            {selectedTxn ? (
              <View>
                <View style={styles.receiptAmountHeader}>
                  <Text style={styles.receiptAmountText}>
                    ₹{selectedTxn.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                  <View style={{ marginTop: 4 }}>{getStatusBadge(selectedTxn.status)}</View>
                </View>

                <View style={styles.receiptDetailsBox}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Payout Ref ID</Text>
                    <Text style={styles.receiptValue}>{selectedTxn.id}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Transaction Date</Text>
                    <Text style={styles.receiptValue}>{selectedTxn.date} • {selectedTxn.time}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Destination</Text>
                    <Text style={styles.receiptValue}>{selectedTxn.accountMask}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Bank Txn Ref</Text>
                    <Text style={styles.receiptValue}>{selectedTxn.txnId || 'Pending Bank Confirmation'}</Text>
                  </View>

                  {selectedTxn.failureReason ? (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, { color: '#B91C1C' }]}>Failure Reason</Text>
                      <Text style={[styles.receiptValue, { color: '#B91C1C' }]}>{selectedTxn.failureReason}</Text>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={styles.modalDoneBtn}
                  onPress={() => setSelectedTxn(null)}
                >
                  <Text style={styles.modalDoneBtnText}>Close Receipt</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ─── MODAL 4: HELP & FAQ MODAL ─── */}
      <Modal visible={showHelpModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payout Help & Support</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                <X size={20} color={BrandTheme.darkForestGreen} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.faqQ}>When are payouts settled?</Text>
              <Text style={styles.faqA}>
                Orders completed by 11:59 PM are automatically settled on a T+1 cycle directly into your verified bank account.
              </Text>

              <Text style={styles.faqQ}>What is the minimum payout amount?</Text>
              <Text style={styles.faqA}>
                There is no minimum payout limit. All settled balances are disbursed directly on schedule.
              </Text>

              <Text style={styles.faqQ}>How do I change my bank account?</Text>
              <Text style={styles.faqA}>
                Navigate to the "Payout Account" tab and tap "Edit" to update your bank account number and IFSC code.
              </Text>

              <TouchableOpacity
                style={[styles.modalDoneBtn, { marginTop: 20 }]}
                onPress={() => setShowHelpModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Got It</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.warmOffWhite,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: BrandTheme.warmOffWhite,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    letterSpacing: -0.2,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: BrandTheme.warmOffWhite,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
    paddingHorizontal: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  segmentBtnActive: {},
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
  },
  segmentTextActive: {
    color: BrandTheme.darkForestGreen,
    fontWeight: '800',
  },
  segmentIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2.5,
    width: '60%',
    backgroundColor: BrandTheme.forestGreen,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Hero Available Balance Card ──
  heroCard: {
    backgroundColor: BrandTheme.forestGreen,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    shadowColor: BrandTheme.obsidianDarkGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  heroLeft: {
    flex: 1,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandTheme.sandBorder,
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  requestBtn: {
    backgroundColor: BrandTheme.warmTanGold,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: BrandTheme.obsidianDarkGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  requestBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroRight: {
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIllustrationWrap: {
    position: 'relative',
    width: 68,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletCardBack: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 36,
    height: 22,
    borderRadius: 4,
    backgroundColor: BrandTheme.accentYellowGold,
    transform: [{ rotate: '-12deg' }],
  },
  walletBody: {
    width: 60,
    height: 44,
    backgroundColor: BrandTheme.darkForestGreen,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
  },
  walletCoin: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: BrandTheme.accentYellowGold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  walletCoinText: {
    fontSize: 10,
    fontWeight: '900',
    color: BrandTheme.obsidianDarkGreen,
  },

  // ── Bento Grid ──
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  bentoCard: {
    width: '48%',
    backgroundColor: BrandTheme.creamCanvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    padding: 14,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bentoIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  bentoLabel: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    fontWeight: '600',
    marginBottom: 2,
  },
  bentoValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginBottom: 2,
  },
  bentoSub: {
    fontSize: 10.5,
    color: BrandTheme.mutedSageText,
    fontWeight: '600',
  },
  statusPillMini: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusPillMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // ── White Cards ──
  whiteCard: {
    backgroundColor: BrandTheme.creamCanvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    padding: 16,
    marginBottom: 16,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 12.5,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 12.5,
    color: BrandTheme.darkForestGreen,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: BrandTheme.sandBorder,
    marginVertical: 8,
  },
  netEarningsLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.emeraldGreen,
  },
  netEarningsValue: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandTheme.emeraldGreen,
  },

  // Payout Account Row inside Overview
  payoutAccountRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bankIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BrandTheme.warmOffWhite,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payoutAccSmallHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandTheme.mutedSageText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  payoutBankTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginTop: 1,
  },
  payoutAccNumText: {
    fontSize: 12,
    color: BrandTheme.darkForestGreen,
    fontWeight: '600',
    marginTop: 2,
  },
  payoutIfscText: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandTheme.emeraldGreen,
  },
  manageAccBtn: {
    borderWidth: 1.2,
    borderColor: BrandTheme.forestGreen,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandTheme.warmOffWhite,
  },
  manageAccBtnText: {
    color: BrandTheme.forestGreen,
    fontSize: 13,
    fontWeight: '700',
  },

  // Info Notice Box
  infoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },
  infoNoticeText: {
    flex: 1,
    fontSize: 12,
    color: BrandTheme.forestGreen,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Recent Section Header
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },
  recentPayoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentPayoutId: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  recentPayoutDate: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
  },
  recentRight: {
    alignItems: 'flex-end',
  },
  recentPayoutAmount: {
    fontSize: 13.5,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  txnIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyRecentBox: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyRecentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginBottom: 4,
  },
  emptyRecentSub: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  // ── SCREEN 2: Payout Account Styles ──
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  verifiedBannerSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  editLinkText: {
    color: BrandTheme.forestGreen,
    fontSize: 13,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  detailFieldLabel: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
    flex: 1,
  },
  detailFieldValue: {
    fontSize: 12.5,
    color: BrandTheme.darkForestGreen,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1.2,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 14,
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  securitySub: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    marginTop: 2,
  },

  // ── SCREEN 3: Payout History Styles ──
  historyFilterBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  historyFilterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
  },
  historyFilterBtnActive: {
    backgroundColor: BrandTheme.forestGreen,
    borderColor: BrandTheme.forestGreen,
  },
  historyFilterBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
  },
  historyFilterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyCard: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyId: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  historyDateTime: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
    marginTop: 2,
  },
  historyAccountDest: {
    fontSize: 10.5,
    color: BrandTheme.mutedSageText,
    marginTop: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  historyTxnRef: {
    fontSize: 10,
    color: BrandTheme.mutedSageText,
    marginTop: 2,
  },
  failureReasonRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  failureReasonText: {
    color: '#B91C1C',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyHistoryState: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginBottom: 6,
  },
  emptyHistorySub: {
    fontSize: 12.5,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  historyFooter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  historyCountText: {
    fontSize: 11.5,
    color: BrandTheme.mutedSageText,
    marginBottom: 8,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },

  // ── Modals General ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 22, 16, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BrandTheme.warmOffWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  modalSub: {
    fontSize: 12.5,
    color: BrandTheme.mutedSageText,
    marginBottom: 16,
  },
  modalInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 6,
    backgroundColor: BrandTheme.creamCanvas,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginRight: 6,
  },
  modalAmountInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  modalBalanceHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalBalanceHint: {
    fontSize: 11.5,
    color: BrandTheme.mutedSageText,
  },
  useMaxLink: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BrandTheme.forestGreen,
  },
  zeroBalanceNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  zeroBalanceNoticeText: {
    fontSize: 11.5,
    color: BrandTheme.mutedSageText,
    flex: 1,
    lineHeight: 16,
  },
  destAccountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  destBankName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  destAccNum: {
    fontSize: 11,
    color: BrandTheme.mutedSageText,
  },
  verifiedTagMini: {
    backgroundColor: '#EAF7EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagMiniText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: BrandTheme.emeraldGreen,
  },
  modalActionBtn: {
    backgroundColor: BrandTheme.forestGreen,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  modalActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  modalDoneBtn: {
    backgroundColor: BrandTheme.obsidianDarkGreen,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  successStateBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successStateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: BrandTheme.emeraldGreen,
    marginTop: 12,
    marginBottom: 6,
  },
  successStateMsg: {
    fontSize: 12.5,
    color: BrandTheme.mutedSageText,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },

  // Bank edit form
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BrandTheme.mutedSageText,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  formInput: {
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: BrandTheme.darkForestGreen,
    backgroundColor: BrandTheme.creamCanvas,
  },
  formErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  formErrorText: {
    color: '#B91C1C',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  formSuccessText: {
    color: BrandTheme.emeraldGreen,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  // Receipt Modal
  receiptAmountHeader: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  receiptAmountText: {
    fontSize: 24,
    fontWeight: '900',
    color: BrandTheme.darkForestGreen,
  },
  receiptDetailsBox: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 14,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  receiptLabel: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    fontWeight: '500',
  },
  receiptValue: {
    fontSize: 12.5,
    color: BrandTheme.darkForestGreen,
    fontWeight: '700',
  },

  // FAQ
  faqQ: {
    fontSize: 13,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    marginTop: 12,
    marginBottom: 4,
  },
  faqA: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    lineHeight: 18,
  },
});
