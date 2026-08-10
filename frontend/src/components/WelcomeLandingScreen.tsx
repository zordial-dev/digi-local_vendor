import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Platform,
  Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Building,
  Zap,
  Bell,
  QrCode,
  Package,
  ArrowRight,
  Users
} from 'lucide-react-native';

interface WelcomeLandingScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 720;

const FEATURES = [
  {
    id: 'verified_stores',
    title: 'Verified\nStores',
    icon: ShieldCheck,
  },
  {
    id: 'nearby_societies',
    title: 'Nearby\nSocieties',
    icon: Building,
  },
  {
    id: 'instant_orders',
    title: 'Instant\nOrders',
    icon: Zap,
  },
  {
    id: 'realtime_alerts',
    title: 'Real-time\nAlerts',
    icon: Bell,
  },
  {
    id: 'scan_connect',
    title: 'Scan &\nConnect',
    icon: QrCode,
  },
  {
    id: 'smart_delivery',
    title: 'Smart\nDelivery',
    icon: Package,
  },
];

const getFontFamily = (weight: 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold' = 'regular') => {
  if (Platform.OS === 'android') {
    switch (weight) {
      case 'extrabold':
      case 'bold':
        return 'Poppins_800Bold';
      case 'semibold':
        return 'Poppins_600SemiBold';
      case 'medium':
        return 'Poppins_500Medium';
      default:
        return 'Poppins_400Regular';
    }
  }
  return Platform.select({
    ios: 'Poppins',
    web: 'Poppins, sans-serif',
    default: 'Poppins',
  });
};

export const WelcomeLandingScreen: React.FC<WelcomeLandingScreenProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const rawInsets = useSafeAreaInsets();
  const insets = rawInsets || { top: 0, bottom: 0, left: 0, right: 0 };

  const handleLoginPress = () => {
    if (onLogin) {
      onLogin();
    } else {
      onGetStarted();
    }
  };

  return (
    <View style={[
      styles.container,
      {
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: Math.max(insets.bottom, 12),
      }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      {/* Top Header Logo Section */}
      <View style={styles.headerSection}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/images/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View style={styles.titleColumn}>
            <Text style={styles.brandTitleText}>
              Digi <Text style={styles.brandTitleGreen}>Local</Text>
            </Text>
            <Text style={styles.taglineText}>
              Your Society. Your Vendor. Your Doorstep.
            </Text>
          </View>
        </View>
      </View>

      {/* Main Heading Section */}
      <View style={styles.heroTextSection}>
        <Text style={styles.heroTitleText} numberOfLines={1} adjustsFontSizeToFit>
          Sell Smart.{' '}
          <Text style={styles.heroTitleGreen}>Deliver Local.</Text>{' '}
          Earn More.
        </Text>
      </View>

      {/* Hero Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/images/vendor_community_hero.png')}
          style={styles.heroIllustration}
          resizeMode="contain"
        />
      </View>

      {/* Floating White Features Card */}
      <View style={styles.featuresCard}>
        <View style={styles.featuresGrid}>
          {FEATURES.map((item) => {
            const IconComp = item.icon;
            return (
              <View key={item.id} style={styles.featureItem}>
                <View style={styles.iconCircle}>
                  <IconComp size={isSmallScreen ? 16 : 18} color="#055726" strokeWidth={2.2} />
                </View>
                <Text style={styles.featureTitleText}>{item.title}</Text>
              </View>
            );
          })}
        </View>

        {/* Action Buttons inside Card Container */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onGetStarted}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>Get Started as Vendor</Text>
            <ArrowRight size={isSmallScreen ? 16 : 18} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Trust Badges */}
      <View style={styles.trustBadgesRow}>
        <View style={styles.badgeItem}>
          <ShieldCheck size={12} color="#055726" strokeWidth={2.2} />
          <Text style={styles.badgeText}> Secure</Text>
        </View>

        <Text style={styles.badgeDot}>•</Text>

        <View style={styles.badgeItem}>
          <ShieldCheck size={12} color="#055726" strokeWidth={2.2} />
          <Text style={styles.badgeText}> Trusted</Text>
        </View>

        <Text style={styles.badgeDot}>•</Text>

        <View style={styles.badgeItem}>
          <Users size={12} color="#055726" strokeWidth={2.2} />
          <Text style={styles.badgeText}> Community First</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },

  // Header Logo Section
  headerSection: {
    alignItems: 'flex-start',
    marginTop: isSmallScreen ? -12 : -16,
    marginBottom: isSmallScreen ? 6 : 8,
    marginLeft: -20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoImage: {
    width: isSmallScreen ? 90 : 110,
    height: isSmallScreen ? 90 : 110,
    marginLeft: isSmallScreen ? -18 : -22,
    marginRight: 0,
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginLeft: isSmallScreen ? -20 : -24,
  },
  brandTitleText: {
    fontSize: isSmallScreen ? 20 : 24,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.5,
    fontFamily: getFontFamily('extrabold'),
    lineHeight: isSmallScreen ? 24 : 28,
  },
  brandTitleGreen: {
    color: '#055726',
  },
  taglineText: {
    fontSize: isSmallScreen ? 9.5 : 11,
    fontWeight: '500',
    color: '#475467',
    marginTop: isSmallScreen ? 2 : 4,
    letterSpacing: -0.1,
    fontFamily: getFontFamily('medium'),
  },

  // Main Heading Section
  heroTextSection: {
    marginTop: isSmallScreen ? 4 : 6,
    marginBottom: isSmallScreen ? 4 : 6,
    alignItems: 'center',
    width: '100%',
  },
  heroTitleText: {
    fontSize: isSmallScreen ? 17 : 20,
    fontWeight: '800',
    color: '#101828',
    letterSpacing: -0.4,
    fontFamily: getFontFamily('extrabold'),
    textAlign: 'center',
  },
  heroTitleGreen: {
    color: '#055726',
  },


  illustrationContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: isSmallScreen ? 4 : 10,
  },
  heroIllustration: {
    width: '110%',
    height: '100%',
    maxHeight: isSmallScreen ? 200 : 280,
  },

  // Floating White Features Card
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: isSmallScreen ? 12 : 19,
    paddingHorizontal: isSmallScreen ? 10 : 14,
    marginVertical: isSmallScreen ? 6 : 10,
    borderWidth: 1,
    borderColor: '#EAECF0',
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: isSmallScreen ? 8 : 16,
  },
  featureItem: {
    width: '32%',
    alignItems: 'center',
    marginVertical: isSmallScreen ? 6 : 8.5,
  },
  iconCircle: {
    width: isSmallScreen ? 38 : 44,
    height: isSmallScreen ? 38 : 44,
    borderRadius: isSmallScreen ? 19 : 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: isSmallScreen ? 4 : 7,
  },
  featureTitleText: {
    fontSize: isSmallScreen ? 9.5 : 10.5,
    fontWeight: '700',
    color: '#101828',
    textAlign: 'center',
    lineHeight: isSmallScreen ? 11.5 : 13,
    fontFamily: getFontFamily('semibold'),
  },

  // Buttons Section
  buttonSection: {
    width: '100%',
  },
  primaryBtn: {
    width: '100%',
    height: isSmallScreen ? 38 : 42,
    borderRadius: 12,
    backgroundColor: '#055726',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#055726',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: isSmallScreen ? 4 : 8,
  },
  primaryBtnText: {
    fontSize: isSmallScreen ? 13.5 : 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    fontFamily: getFontFamily('semibold'),
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnDarkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#344054',
    fontFamily: getFontFamily('medium'),
  },
  secondaryBtnGreenText: {
    fontWeight: '700',
    color: '#055726',
    fontFamily: getFontFamily('bold'),
  },

  // Footer Trust Badges
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475467',
    fontFamily: getFontFamily('semibold'),
  },
  badgeDot: {
    fontSize: 14,
    color: '#98A2B3',
    marginHorizontal: 8,
  },
});
