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
import { BrandTheme } from '../constants/theme';

interface WelcomeLandingScreenProps {
  onGetStarted: () => void;
  onLogin?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 800;

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

  return (
    <View style={[
      styles.container,
      {
        paddingTop: Math.max(insets.top, 12),
        paddingBottom: Math.max(insets.bottom, 12),
      }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor={BrandTheme.warmOffWhite} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top Header Logo Section */}
        <View style={styles.headerSection}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/LOGO.png')}
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

        {/* Main Hero Heading */}
        <View style={styles.heroTextSection}>
          <Text
            style={styles.heroTitleText}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            Sell Smart. <Text style={styles.heroTitleGreen}>Deliver Local.</Text> Earn More.
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

        {/* White Features Card Container */}
        <View style={styles.featuresCard}>
          <View style={styles.featuresGrid}>
            {FEATURES.map((item) => {
              const IconComp = item.icon;
              return (
                <View key={item.id} style={styles.featureItem}>
                  <View style={styles.iconCircle}>
                    <IconComp size={22} color={BrandTheme.forestGreen} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.featureTitleText}>{item.title}</Text>
                </View>
              );
            })}
          </View>

          {/* Call to Action Button */}
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={onGetStarted}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>Get Started as Vendor</Text>
            <ArrowRight size={20} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>

        {/* Footer Trust Badges */}
        <View style={styles.trustBadgesRow}>
          <View style={styles.badgeItem}>
            <ShieldCheck size={14} color={BrandTheme.forestGreen} strokeWidth={2.2} />
            <Text style={styles.badgeText}> Secure</Text>
          </View>

          <Text style={styles.badgeDot}>•</Text>

          <View style={styles.badgeItem}>
            <ShieldCheck size={14} color={BrandTheme.forestGreen} strokeWidth={2.2} />
            <Text style={styles.badgeText}> Trusted</Text>
          </View>

          <Text style={styles.badgeDot}>•</Text>

          <View style={styles.badgeItem}>
            <Users size={14} color={BrandTheme.forestGreen} strokeWidth={2.2} />
            <Text style={styles.badgeText}> Community First</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandTheme.warmOffWhite,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Header Logo Section
  headerSection: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 105,
    height: 70,
    marginLeft: -15,
    marginRight: -10,
  },
  titleColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitleText: {
    fontSize: 26,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    letterSpacing: -0.5,
    fontFamily: getFontFamily('extrabold'),
    lineHeight: 30,
  },
  brandTitleGreen: {
    color: BrandTheme.forestGreen,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '500',
    color: BrandTheme.mutedSageText,
    marginTop: 2,
    letterSpacing: -0.1,
    fontFamily: getFontFamily('medium'),
  },

  // Main Heading Section
  heroTextSection: {
    width: '100%',
    marginVertical: 12,
    alignItems: 'center',
  },
  heroTitleText: {
    fontSize: isSmallScreen ? 16 : 19.5,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
    letterSpacing: -0.5,
    fontFamily: getFontFamily('extrabold'),
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : 26,
  },
  heroTitleGreen: {
    color: BrandTheme.forestGreen,
  },

  // Hero Illustration
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  heroIllustration: {
    width: screenWidth - 40,
    height: isSmallScreen ? 210 : 250,
  },

  // Features Card
  featuresCard: {
    width: '100%',
    backgroundColor: BrandTheme.creamCanvas,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  featureItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandTheme.warmOffWhite,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
  },
  featureTitleText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
    textAlign: 'center',
    lineHeight: 14,
    fontFamily: getFontFamily('semibold'),
  },

  // Primary Action Button
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: BrandTheme.forestGreen,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BrandTheme.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    fontFamily: getFontFamily('bold'),
  },

  // Footer Badges
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: BrandTheme.mutedSageText,
    fontFamily: getFontFamily('semibold'),
  },
  badgeDot: {
    fontSize: 14,
    color: BrandTheme.sandBorder,
    marginHorizontal: 10,
  },
});

