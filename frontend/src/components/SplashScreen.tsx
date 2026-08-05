import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { DigiLocalLogo } from './DigiLocalLogo';
import { Colors } from '../theme/colors';

interface SplashScreenProps {
  onFinish?: () => void;
}

export const SplashScreenComponent: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    // Smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EDEDE4" />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        {/* 3D Rounded Neumorphic Logo Dish matching screenshot */}
        <View style={styles.logoDish}>
          <DigiLocalLogo size={114} />
        </View>

        {/* Brand Subtitle Title */}
        <Text style={styles.brandTitle}>DigiLocal Vendor Terminal</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDE4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoDish: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#18281F',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
});
