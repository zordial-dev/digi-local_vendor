import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { CheckCircle2, Trash2, X, AlertTriangle, Info } from 'lucide-react-native';

export type ToastType = 'add' | 'delete' | 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

/**
 * Global helper to trigger a toast from anywhere in the app
 */
export const showToast = (
  message: string,
  type: ToastType = 'success',
  duration = 1000
) => {
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const toast: ToastItem = { id, message, type, duration };
  listeners.forEach(listener => listener(toast));
};

const ToastItemView: React.FC<{
  toast: ToastItem;
  onDismiss: (id: string) => void;
}> = React.memo(({ toast, onDismiss }) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Fast, crisp exit animation: slide back downward (0 -> 90) and fade out in 220ms
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onDismiss(toast.id);
    });
  }, [slideAnim, onDismiss, toast.id]);

  useEffect(() => {
    // Smooth entrance animation: slide upward from bottom (translateY 100% -> 0) in 260ms
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Auto-dismiss after 1.0s (1000ms)
    timerRef.current = setTimeout(() => {
      handleClose();
    }, toast.duration || 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [slideAnim, handleClose, toast.duration]);

  const isDelete = toast.type === 'delete' || toast.type === 'error';
  const isWarning = toast.type === 'warning';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.toastWrapper,
        {
          opacity: slideAnim.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [0, 0.85, 1],
          }),
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [90, 0], // translateY(100%) -> translateY(0)
              }),
            },
            {
              scale: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.93, 1],
              }),
            },
          ],
        },
      ]}
    >
      <View
        style={[
          styles.toastCard,
          isDelete && styles.toastCardDelete,
          isWarning && styles.toastCardWarning,
        ]}
      >
        <View
          style={[
            styles.toastIconBox,
            isDelete
              ? styles.toastIconBoxDelete
              : isWarning
              ? styles.toastIconBoxWarning
              : styles.toastIconBoxSuccess,
          ]}
        >
          {isDelete ? (
            <Trash2 size={13} color="#FFFFFF" strokeWidth={2.4} />
          ) : isWarning ? (
            <AlertTriangle size={13} color="#FFFFFF" strokeWidth={2.4} />
          ) : (
            <CheckCircle2 size={14} color="#FFFFFF" strokeWidth={2.4} />
          )}
        </View>
        <Text style={styles.toastText} numberOfLines={1} ellipsizeMode="tail">
          {toast.message}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.toastCloseBtn}
          activeOpacity={0.7}
        >
          <X size={13} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

/**
 * Viewport-level Toast Container component to place at the root of the screen.
 * Stacks toasts neatly above the bottom tab bar without blocking touches.
 */
export const ToastContainer: React.FC<{ bottomOffset?: number }> = ({ bottomOffset = 90 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleNewToast: ToastListener = (newToast) => {
      setToasts(prev => [...prev.slice(-2), newToast]); // keep max 3 toasts to prevent crowding
    };

    listeners.add(handleNewToast);
    return () => {
      listeners.delete(handleNewToast);
    };
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.toastContainer, { bottom: bottomOffset }]}
    >
      {toasts.map(t => (
        <ToastItemView key={t.id} toast={t} onDismiss={handleDismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'column',
    gap: 8,
    zIndex: 999999,
    elevation: 999999,
  },
  toastWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#211A19',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    maxWidth: '92%',
    gap: 10,
  },
  toastCardDelete: {
    backgroundColor: '#1E1113',
    borderColor: 'rgba(239, 68, 68, 0.48)',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 14,
    elevation: 14,
  },
  toastCardWarning: {
    backgroundColor: '#241A10',
    borderColor: 'rgba(245, 158, 11, 0.45)',
    shadowColor: '#D97706',
    shadowOpacity: 0.3,
  },
  toastIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  toastIconBoxSuccess: {
    backgroundColor: '#16A34A',
  },
  toastIconBoxDelete: {
    backgroundColor: '#EF4444',
  },
  toastIconBoxWarning: {
    backgroundColor: '#F59E0B',
  },
  toastText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    flexShrink: 1,
    letterSpacing: 0.25,
  },
  toastCloseBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
});
