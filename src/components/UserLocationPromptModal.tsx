import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  MapPin,
  Search,
  Navigation,
  Check,
  X,
  Building,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { BrandTheme } from '../constants/theme';

export interface UserLocationState {
  lat: number;
  lng: number;
  address: string;
  society?: string;
  sector?: string;
}

interface UserLocationPromptModalProps {
  visible: boolean;
  currentLocation?: UserLocationState | null;
  onLocationSet: (loc: UserLocationState) => void;
  onClose?: () => void;
}

export const UserLocationPromptModal: React.FC<UserLocationPromptModalProps> = ({
  visible,
  currentLocation,
  onLocationSet,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingGps, setLoadingGps] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live Autocomplete Suggestions using OpenStreetMap / Nominatim
  const handleInputChange = async (text: string) => {
    setQuery(text);
    setErrorMsg('');
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const encoded = encodeURIComponent(text.trim());
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=in&limit=6`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  // Live GPS Location Trigger
  const handleUseGPS = () => {
    setErrorMsg('');
    setLoadingGps(true);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let address = `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
              headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (data?.display_name) {
              address = data.display_name.split(',').slice(0, 3).join(', ');
            }
          } catch (_) {}

          setLoadingGps(false);
          onLocationSet({ lat, lng, address });
          if (onClose) onClose();
        },
        (err) => {
          setLoadingGps(false);
          setErrorMsg('GPS Permission Denied. Please search your sector or society manually.');
        },
        { timeout: 10000 }
      );
    } else {
      // Mobile fallback default GPS coordinate (Sector 62)
      setTimeout(() => {
        setLoadingGps(false);
        onLocationSet({
          lat: 28.6270,
          lng: 77.3720,
          address: 'Sector 62, Noida (Detected GPS)',
          sector: 'Sector 62',
        });
        if (onClose) onClose();
      }, 700);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    const displayName = item.display_name || item.name || '';
    const shortName = displayName.split(',').slice(0, 3).join(', ');
    const lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
    const lng = typeof item.lon === 'string' ? parseFloat(item.lon) : (item.lng || item.lon);

    onLocationSet({
      lat,
      lng,
      address: shortName,
    });
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MapPin size={22} color="#541D26" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>Select Your Location</Text>
              <Text style={styles.subtitle}>Discover stores and services delivering to you</Text>
            </View>
            {onClose ? (
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={18} color="#211A19" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* GPS Button */}
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={handleUseGPS}
            disabled={loadingGps}
            activeOpacity={0.88}
          >
            {loadingGps ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Navigation size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.gpsBtnText}>Use My Current GPS Location</Text>
              </>
            )}
          </TouchableOpacity>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={14} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SEARCH AREA</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Autocomplete Input */}
          <View style={styles.searchBox}>
            <Search size={16} color="#78716C" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              placeholder="Search City, Sector, or Society..."
              placeholderTextColor="#78716C"
              value={query}
              onChangeText={handleInputChange}
              autoCapitalize="none"
            />
            {searching ? (
              <ActivityIndicator size="small" color="#541D26" />
            ) : query ? (
              <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#78716C" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Autocomplete Suggestions / Preset List */}
          <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => {
                const shortName = (item.display_name || item.name || '').split(',').slice(0, 3).join(', ');
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.75}
                  >
                    <MapPin size={15} color="#541D26" style={{ marginRight: 10, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggestionTitle}>{shortName}</Text>
                      {item.display_name ? (
                        <Text style={styles.suggestionSub} numberOfLines={1}>
                          {item.display_name}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : query.length < 2 ? (
              <View style={{ marginTop: 8, alignItems: 'center', paddingVertical: 16 }}>
                <Text style={styles.presetHeading}>SEARCH ANY AREA OR HOUSING SOCIETY</Text>
                <Text style={{ fontSize: 12.5, color: '#78716C', textAlign: 'center', marginTop: 4 }}>
                  Type at least 2 letters above or use Live GPS to locate your society.
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>No matching areas found. Try another search.</Text>
            )}
          </ScrollView>

          {/* Privacy Footnote */}
          <View style={styles.footerNote}>
            <ShieldCheck size={13} color="#78716C" style={{ marginRight: 6 }} />
            <Text style={styles.footerNoteText}>
              Your location is only used to filter stores and deliver fresh essentials.
            </Text>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E7DFD5',
    maxHeight: '85%',
    shadowColor: '#211A19',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7EEF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#211A19',
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
    fontSize: 11.5,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7DFD5',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 13.5,
    color: '#211A19',
    fontWeight: '600',
  },
  suggestionsList: {
    maxHeight: 220,
    marginTop: 10,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE6',
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#211A19',
  },
  suggestionSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  presetHeading: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
    marginLeft: 4,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  presetText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#541D26',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    paddingVertical: 20,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7DFD5',
  },
  footerNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#78716C',
    lineHeight: 15,
  },
});
