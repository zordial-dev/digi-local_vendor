import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity
} from 'react-native';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react-native';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

export interface CustomAlertState {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomAlertModalProps {
  alertState: CustomAlertState;
  onClose: () => void;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({
  alertState,
  onClose,
}) => {
  if (!alertState.visible) return null;

  const {
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'NO',
    showCancel = false,
    onConfirm,
    onCancel
  } = alertState;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={36} color="#10B981" />;
      case 'error':
        return <XCircle size={36} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={36} color="#F59E0B" />;
      default:
        return <Info size={36} color="#C5A880" />;
    }
  };

  const getHeaderBg = () => {
    switch (type) {
      case 'success':
        return 'rgba(16, 185, 129, 0.12)';
      case 'error':
        return 'rgba(239, 68, 68, 0.12)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.12)';
      default:
        return 'rgba(197, 168, 128, 0.12)';
    }
  };

  const getBtnBg = () => {
    switch (type) {
      case 'success':
        return '#1E3A29';
      case 'error':
        return '#B91C1C';
      case 'warning':
        return '#B91C1C'; // Red for warning confirm actions like Delete
      default:
        return '#18281F';
    }
  };

  const handlePressConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const isTwoButtonMode = showCancel || Boolean(onCancel) || cancelText !== 'NO';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={alertState.visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          
          {/* Header Icon Badge */}
          <View style={[styles.iconWrapper, { backgroundColor: getHeaderBg() }]}>
            {getIcon()}
          </View>

          {/* Title & Message */}
          <Text style={styles.titleText}>{title}</Text>
          <Text style={styles.messageText}>{message}</Text>

          {/* Action Buttons */}
          {isTwoButtonMode ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  if (onCancel) onCancel();
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{cancelText.toUpperCase()}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtnHalf, { backgroundColor: getBtnBg() }]}
                onPress={handlePressConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmBtnText}>{confirmText.toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: getBtnBg() }]}
              onPress={handlePressConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmBtnText}>{confirmText.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    elevation: 10,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18281F',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7C70',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  btnRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFE8D8',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#18281F',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  confirmBtnHalf: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  confirmBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  confirmBtnText: {
    color: '#F8F5EE',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
