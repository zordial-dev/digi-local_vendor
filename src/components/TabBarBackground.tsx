import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface TabBarBackgroundProps {
  width: number;
  height: number;
}

export const TabBarBackground: React.FC<TabBarBackgroundProps> = ({ width, height }) => {
  const notchWidth = 76;
  const notchHeight = 28;
  const startX = (width - notchWidth) / 2;
  const endX = startX + notchWidth;
  const midX = width / 2;

  // SVG Path drawing a rounded top bar with a smooth U-shaped center cutout notch
  const d = `
    M 0,24
    Q 0,0 24,0
    L ${startX},0
    C ${startX + 14},0 ${startX + 8},${notchHeight} ${midX},${notchHeight}
    C ${endX - 8},${notchHeight} ${endX - 14},0 ${endX},0
    L ${width - 24},0
    Q ${width},0 ${width},24
    L ${width},${height}
    L 0,${height}
    Z
  `;

  return (
    <Svg width={width} height={height} style={styles.svg}>
      {/* Background shape with sand border color */}
      <Path d={d} fill="#F7F4EE" stroke="#E4DCC9" strokeWidth={1.5} />
    </Svg>
  );
};

const styles = {
  svg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
} as const;
