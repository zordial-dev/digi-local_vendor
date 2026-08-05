import React from 'react';
import { Image, View, StyleSheet } from 'react-native';

interface DigiLocalLogoProps {
  size?: number;
  primaryColor?: string;
  goldColor?: string;
}

export const DigiLocalLogo: React.FC<DigiLocalLogoProps> = ({
  size = 96,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      <Image
        source={require('../../assets/images/splash-icon.png')}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale: 1.25 }]
        }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
