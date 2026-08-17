import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Modal,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import {
  Plus,
  Edit2 as Edit,
  Trash2,
  Package,
  Search,
  Check,
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  Upload,
  Camera,
  ChevronDown,
  ChevronUp,
  Tag,
  Sparkles,
  ShoppingBag,
  Milk,
  Cookie,
  Apple,
  LeafyGreen,
  CupSoda,
  Leaf,
  SlidersHorizontal,
  Mic,
  Volume2,
  Languages
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Colors, BrandTheme } from '../constants/theme';
import { getHindiSubtitle, matchesBilingualQuery, getCategoryBilingualLabel } from '../utils/translations';

// Safe Native Speech Recognition loader (guarded against Expo Go missing native module)
let NativeSpeechModule: any = null;
try {
  const speechMod = require('expo-speech-recognition');
  if (speechMod && speechMod.ExpoSpeechRecognitionModule) {
    NativeSpeechModule = speechMod.ExpoSpeechRecognitionModule;
  }
} catch (_) {
  NativeSpeechModule = null;
}
import {
  VendorItem,
  addMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  toggleItemAvailabilityApi,
  uploadMediaApi
} from '../services/apiService';

import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';

interface MenuScreenProps {
  vendorId: number;
  items: VendorItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  isDarkMode?: boolean;
  openAddProductTrigger?: number;
}

const PRESET_CATEGORIES = [
  'Grocery',
  'Vegetables',
  'Fruits',
  'Dairy',
  'Bakery & Cakes',
  'Beverages & Drinks',
  'Snacks & Munchies',
  'Personal Care',
  'Household Supplies',
  'Pharmacy & Health',
  'Pooja Essentials',
  '+ Custom Category'
];

const PRESET_UNITS = [
  'Piece',
  'Set',
  'Packet',
  'Box',
  '1 kg',
  '500g',
  '250g',
  '1L',
  '500ml',
  'Dozen',
  'Bunch',
  'g',
  '+ Custom Unit'
];

const normalizeCategory = (cat?: string): string => {
  if (!cat || !cat.trim()) return 'Grocery';
  const trimmed = cat.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.includes('vegetable') ||
    lower.includes('sabzi') ||
    lower.includes('sabji') ||
    lower.includes('onion') ||
    lower.includes('potato') ||
    lower.includes('tomato') ||
    lower.includes('bhindi') ||
    lower.includes('palak') ||
    lower.includes('gobi') ||
    lower.includes('carrot') ||
    lower.includes('chilli') ||
    lower.includes('garlic') ||
    lower.includes('ginger') ||
    (lower.includes('veg') && !lower.includes('non-veg') && !lower.includes('non veg') && !lower.includes('beverage'))
  ) {
    return 'Vegetables';
  }
  if (lower.includes('fruit') || lower.includes('mango') || lower.includes('apple') || lower.includes('banana') || lower.includes('orange') || lower.includes('grape')) return 'Fruits';
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('paneer') || lower.includes('curd') || lower.includes('cheese') || lower.includes('butter')) return 'Dairy';
  if (lower.includes('bakery') || lower.includes('cake') || lower.includes('bread') || lower.includes('pastry')) return 'Bakery & Cakes';
  if (lower.includes('bev') || lower.includes('drink') || lower.includes('juice') || lower.includes('soda') || lower.includes('tea') || lower.includes('coffee')) return 'Beverages & Drinks';
  if (lower.includes('snack') || lower.includes('namkeen') || lower.includes('chip') || lower.includes('munch') || lower.includes('biscuit') || lower.includes('cookie')) return 'Snacks & Munchies';
  if (lower.includes('personal') || lower.includes('soap') || lower.includes('shampoo') || lower.includes('toothpaste') || lower.includes('lotion')) return 'Personal Care';
  if (lower.includes('house') || lower.includes('clean') || lower.includes('detergent') || lower.includes('dishwash')) return 'Household Supplies';
  if (lower.includes('pharm') || lower.includes('health') || lower.includes('med') || lower.includes('tablet')) return 'Pharmacy & Health';
  if (lower.includes('pooja') || lower.includes('puja') || lower.includes('agarbatti') || lower.includes('dhoop')) return 'Pooja Essentials';

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.endsWith('.webm') ||
    lower.includes('video') ||
    lower.startsWith('data:video')
  );
};

const isNonVegItem = (name: string, desc?: string) => {
  const text = `${name} ${desc || ''}`.toLowerCase();
  return text.includes('chicken') || text.includes('egg') || text.includes('mutton') || text.includes('fish') || text.includes('meat');
};

const getCategoryIcon = (categoryName: string, isSelected: boolean, size: number = 14) => {
  const name = categoryName.toUpperCase();
  const isVegetables = name.includes('VEGETABLE') || name.includes('SABZI') || name.includes('SABJI') || (name.includes('VEG') && !name.includes('NON-VEG') && !name.includes('NON VEG') && !name.includes('BEV'));
  const isFruits = name.includes('FRUIT');
  const isDairy = name.includes('DAIRY') || name.includes('MILK');
  const isBakery = name.includes('BAKERY') || name.includes('CAKE') || name.includes('BREAD');
  const isGrocery = name.includes('GROCERY') || name.includes('SHOPPING');
  const isBeverages = name.includes('BEV') || name.includes('DRINK') || name.includes('SODA');

  const color = isSelected ? '#FFFFFF' : (
    isVegetables ? BrandTheme.emeraldGreen :
      isFruits ? '#EA580C' :
        isGrocery ? BrandTheme.forestGreen :
          isDairy ? '#2E64A2' :
            isBakery ? BrandTheme.accentYellowGold :
              isBeverages ? '#0284C7' : BrandTheme.mutedSageText
  );

  if (isVegetables) {
    return <LeafyGreen size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (isFruits) {
    return <Apple size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (isGrocery) {
    return <ShoppingBag size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (isDairy) {
    return <Milk size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (isBakery) {
    return <Cookie size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (isBeverages) {
    return <CupSoda size={size} color={color} style={{ marginRight: 6 }} />;
  }
  if (name === 'ALL') {
    return null;
  }
  return <Leaf size={size} color={color} style={{ marginRight: 6 }} />;
};

const renderCategoryBadge = (category?: string) => {
  const normalizedName = normalizeCategory(category);
  const name = normalizedName.toUpperCase();
  const bLabel = getCategoryBilingualLabel(category || '');
  const isVegetables = name.includes('VEGETABLE') || name.includes('SABZI') || name.includes('SABJI') || (name.includes('VEG') && !name.includes('NON-VEG') && !name.includes('NON VEG') && !name.includes('BEV'));
  const isFruits = name.includes('FRUIT');
  const isDairy = name.includes('DAIRY') || name.includes('MILK');
  const isBakery = name.includes('BAKERY') || name.includes('CAKE') || name.includes('BREAD');
  const isGrocery = name.includes('GROCERY') || name.includes('SHOPPING');
  const isBeverages = name.includes('BEV') || name.includes('DRINK') || name.includes('SODA');

  const color = isVegetables ? BrandTheme.emeraldGreen :
    isFruits ? '#EA580C' :
      isGrocery ? BrandTheme.forestGreen :
        isDairy ? '#2E64A2' :
          isBakery ? BrandTheme.accentYellowGold :
            isBeverages ? '#0284C7' : BrandTheme.mutedSageText;

  const iconSize = 10;
  let icon: React.ReactNode = <Leaf size={iconSize} color={color} />;
  if (isVegetables) icon = <LeafyGreen size={iconSize} color={color} />;
  else if (isFruits) icon = <Apple size={iconSize} color={color} />;
  else if (isGrocery) icon = <ShoppingBag size={iconSize} color={color} />;
  else if (isDairy) icon = <Milk size={iconSize} color={color} />;
  else if (isBakery) icon = <Cookie size={iconSize} color={color} />;
  else if (isBeverages) icon = <CupSoda size={iconSize} color={color} />;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 2 }}>
      {icon}
      <Text style={{ color, fontWeight: '800', fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {bLabel.en} {bLabel.hi ? `• ${bLabel.hi}` : ''}
      </Text>
    </View>
  );
};

const PremiumToggle: React.FC<{
  value: boolean;
  onValueChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ value, onValueChange, disabled }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.premiumToggleTrack,
        { backgroundColor: value ? '#227C44' : BrandTheme.sandBorder }
      ]}
    >
      <View
        style={[
          styles.premiumToggleThumb,
          { alignSelf: value ? 'flex-end' : 'flex-start' }
        ]}
      />
    </TouchableOpacity>
  );
};

export const MenuScreenComponent: React.FC<MenuScreenProps> = React.memo(({
  vendorId,
  items,
  isLoading,
  onRefresh,
  openAddProductTrigger,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (openAddProductTrigger && openAddProductTrigger > 0) {
      resetForm();
      setIsModalOpen(true);
    }
  }, [openAddProductTrigger]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VendorItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [optimisticAvailability, setOptimisticAvailability] = useState<Record<number, boolean>>({});

  // Synchronize optimistic availability with incoming props
  useEffect(() => {
    setOptimisticAvailability(prev => {
      const next = { ...prev };
      let changed = false;
      items.forEach(item => {
        if (next[item.item_id] !== undefined && Boolean(item.is_available) === next[item.item_id]) {
          delete next[item.item_id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items]);

  // Custom Alert State
  const [alertState, setAlertState] = useState<CustomAlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info'
  });

  const showAlert = (title: string, message: string, type: AlertType = 'info', onConfirm?: () => void) => {
    setAlertState({ visible: true, title, message, type, onConfirm });
  };

  // Form Fields
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [unit, setUnit] = useState('Piece');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [stock, setStock] = useState('50');

  // Unit Dropdown States
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');

  const resetForm = () => {
    setItemName('');
    setDescription('');
    setPrice('');
    setUnit('Piece');
    setCustomUnitInput('');
    setShowUnitDropdown(false);
    setImageUrl('');
    setIsAvailable(true);
    setStock('50');
    setEditingItem(null);
  };

  // ── Voice Search State & Multi-Engine Speech Recognition ──
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [voiceStatus, setVoiceStatus] = useState('Listening... Speak now!');
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const recognitionRef = React.useRef<any>(null);
  const recordingRef = React.useRef<Audio.Recording | null>(null);

  // Safe Native Speech Event Subscriptions (when native module is present)
  useEffect(() => {
    if (!NativeSpeechModule) return;

    let subStart: any, subEnd: any, subResult: any, subError: any, subVolume: any;
    try {
      if (NativeSpeechModule.addListener) {
        subStart = NativeSpeechModule.addListener('start', () => {
          setIsListening(true);
          setVoiceStatus(voiceLang === 'hi-IN' ? 'सुन रहे हैं... बोलिए!' : 'Listening... Speak now!');
        });
        subEnd = NativeSpeechModule.addListener('end', () => {
          setIsListening(false);
        });
        subResult = NativeSpeechModule.addListener('result', (event: any) => {
          const transcript = event.results?.[0]?.transcript || '';
          if (transcript) {
            setVoiceTranscript(transcript);
            setSearchQuery(transcript);
            setVoiceStatus(`Recognized: "${transcript}"`);
            if (event.isFinal) {
              setTimeout(() => setIsVoiceModalOpen(false), 700);
            }
          }
        });
        subError = NativeSpeechModule.addListener('error', (event: any) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            setVoiceStatus('Microphone or Speech permission denied.');
          } else if (event.error === 'no-speech' || event.error === 'speech-timeout') {
            setVoiceStatus(voiceLang === 'hi-IN' ? 'आवाज़ नहीं आई। फिर से बोलें' : 'No speech heard. Tap mic to retry.');
          } else {
            setVoiceStatus(event.message || 'Speech recognition error');
          }
          setIsListening(false);
        });
        subVolume = NativeSpeechModule.addListener('volumechange', (event: any) => {
          if (typeof event.value === 'number') {
            const scale = Math.min(1.45, Math.max(1, 1 + event.value / 12));
            pulseAnim.setValue(scale);
          }
        });
      }
    } catch (_) {}

    return () => {
      try {
        subStart?.remove?.();
        subEnd?.remove?.();
        subResult?.remove?.();
        subError?.remove?.();
        subVolume?.remove?.();
      } catch (_) {}
    };
  }, [voiceLang]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.28,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const startVoiceSearch = async (langOverride?: 'en-IN' | 'hi-IN') => {
    const selectedLang = langOverride || voiceLang;
    if (langOverride) {
      setVoiceLang(langOverride);
    }
    setVoiceTranscript('');
    setVoiceStatus(selectedLang === 'hi-IN' ? 'सुन रहे हैं... प्रोडक्ट का नाम बोलें' : 'Listening... Speak product name');
    setIsVoiceModalOpen(true);
    setIsListening(true);

    // 1. Try Native Speech Recognition Module (Dev Client / Standalone Build)
    if (NativeSpeechModule) {
      try {
        const result = await NativeSpeechModule.requestPermissionsAsync();
        if (result && result.granted) {
          NativeSpeechModule.start({
            lang: selectedLang,
            interimResults: true,
            continuous: false,
            volumeChangeEventOptions: {
              enabled: true,
              intervalMillis: 80,
            },
          });
          return;
        }
      } catch (err) {
        console.log('Native speech start error, falling back:', err);
      }
    }

    // 2. Web Speech Recognition (Browser / Chrome / Safari)
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (_) {}
          }
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = selectedLang;

          recognition.onstart = () => {
            setIsListening(true);
            setVoiceStatus(selectedLang === 'hi-IN' ? 'सुन रहे हैं... बोलिए!' : 'Listening... Speak now!');
          };

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            transcript = transcript.trim();
            if (transcript) {
              setVoiceTranscript(transcript);
              setSearchQuery(transcript);
              setVoiceStatus(`Recognized: "${transcript}"`);
            }
          };

          recognition.onerror = () => {
            setVoiceStatus(selectedLang === 'hi-IN' ? 'आवाज़ नहीं आई। फिर से बोलें' : 'No speech detected. Tap mic to retry.');
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          recognitionRef.current = recognition;
          return;
        } catch (_) {}
      }
    }

    // 3. Fallback Native Audio Stream with Voice Volume Metering (Expo Go)
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        showAlert(
          'Microphone Permission',
          'Please enable microphone permissions in settings for voice search.',
          'warning'
        );
        setVoiceStatus('Microphone permission denied.');
        setIsListening(false);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });

      recording.setOnRecordingStatusUpdate((status) => {
        if (status.metering !== undefined) {
          const norm = Math.min(1.45, Math.max(1, 1 + (status.metering + 100) / 100));
          pulseAnim.setValue(norm);
        }
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setVoiceStatus(selectedLang === 'hi-IN' ? 'सुन रहे हैं... बोलें और स्टॉप दबाएं' : 'Listening... Speak now and tap Stop');
    } catch (err) {
      console.log('Audio metering start error:', err);
    }
  };

  const stopVoiceSearch = async () => {
    if (NativeSpeechModule) {
      try { NativeSpeechModule.stop(); } catch (_) {}
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (_) {}
      recordingRef.current = null;
    }
    setIsListening(false);
    setTimeout(() => {
      setIsVoiceModalOpen(false);
    }, 300);
  };

  const handleSelectQuickVoiceItem = (text: string) => {
    setVoiceTranscript(text);
    setSearchQuery(text);
    setVoiceStatus(`Recognized: "${text}"`);
    stopVoiceSearch();
  };

  // Top 8 item names from store for quick voice suggestions with Hindi translation
  const quickVoiceSuggestions = React.useMemo(() => {
    const fromItems = items.map(i => i.item_name).filter(Boolean).slice(0, 8);
    if (fromItems.length >= 4) return fromItems;
    return ['Bhindi', 'Aaloo', 'Apple', 'Milk', 'Bread', 'Tomato', 'Eggs', 'Paneer'];
  }, [items]);

  // Unique normalized categories list with counts (memoized for instant tab switching)
  const filterCategories = React.useMemo(() => {
    const itemNormCategories = items.map(i => normalizeCategory(i.category));
    return [
      'ALL',
      ...Array.from(new Set([...PRESET_CATEGORIES.filter(c => c !== '+ Custom Category'), ...itemNormCategories]))
    ];
  }, [items]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: items.length };
    items.forEach(i => {
      const cat = normalizeCategory(i.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const getCategoryCount = (catName: string) => {
    return categoryCounts[catName] || 0;
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: VendorItem) => {
    setEditingItem(item);
    setItemName(item.item_name);
    setDescription(item.description || '');
    setPrice(String(item.price));
    setStock(item.stock !== undefined ? String(item.stock) : '50');

    const itemCat = normalizeCategory(item.category);
    if (PRESET_CATEGORIES.includes(itemCat)) {
      setCategory(itemCat);
      setCustomCategoryInput('');
    } else {
      setCategory('+ Custom Category');
      setCustomCategoryInput(item.category || 'General');
    }

    const itemUnit = item.unit || 'Piece';
    const foundPreset = PRESET_UNITS.find(u => u.toLowerCase() === itemUnit.toLowerCase() && u !== '+ Custom Unit');
    if (foundPreset) {
      setUnit(foundPreset);
      setCustomUnitInput('');
    } else {
      setUnit('+ Custom Unit');
      setCustomUnitInput(itemUnit);
    }
    setShowUnitDropdown(false);

    setImageUrl(item.image_url || '');
    setIsAvailable(Boolean(item.is_available));
    setIsModalOpen(true);
  };

  // Upload image from device gallery
  const handlePickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Please grant photo gallery access to upload product photo.', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setUploadingMedia(true);
          try {
            const uploaded = await uploadMediaApi(
              asset.base64,
              asset.fileName || `media_${Date.now()}.jpg`,
              asset.mimeType || 'image/jpeg'
            );
            setImageUrl(uploaded.url);
            showAlert('Media Uploaded', 'Product photo saved permanently to server!', 'success');
          } catch (uploadErr: any) {
            setImageUrl(asset.uri);
          } finally {
            setUploadingMedia(false);
          }
        } else {
          setImageUrl(asset.uri);
        }
      }
    } catch (err: any) {
      showAlert('Selection Error', err.message || 'Failed to pick media file.', 'error');
    }
  };

  // Capture photo directly using phone camera
  const handleTakeMedia = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Please grant camera access to capture product photo.', 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          setUploadingMedia(true);
          try {
            const uploaded = await uploadMediaApi(
              asset.base64,
              asset.fileName || `media_${Date.now()}.jpg`,
              asset.mimeType || 'image/jpeg'
            );
            setImageUrl(uploaded.url);
            showAlert('Captured & Uploaded', 'Product photo saved permanently to server!', 'success');
          } catch (uploadErr: any) {
            setImageUrl(asset.uri);
          } finally {
            setUploadingMedia(false);
          }
        } else {
          setImageUrl(asset.uri);
        }
      }
    } catch (err: any) {
      showAlert('Camera Error', err.message || 'Failed to record/capture media.', 'error');
    }
  };

  const incrementPrice = () => {
    const p = parseFloat(price) || 0;
    setPrice((p + 1).toFixed(2).replace(/\.00$/, ''));
  };

  const decrementPrice = () => {
    const p = parseFloat(price) || 0;
    if (p > 0) {
      setPrice(Math.max(0, p - 1).toFixed(2).replace(/\.00$/, ''));
    }
  };

  const incrementStock = () => {
    const s = parseInt(stock, 10) || 0;
    setStock(String(s + 1));
  };

  const decrementStock = () => {
    const s = parseInt(stock, 10) || 0;
    if (s > 0) {
      setStock(String(Math.max(0, s - 1)));
    }
  };

  const handleSaveItem = async () => {
    if (!itemName.trim() || !price.trim()) {
      showAlert('Required Fields Missing', 'Please enter both item name and price.', 'warning');
      return;
    }

    const finalCategory = category === '+ Custom Category'
      ? (customCategoryInput.trim() || 'General')
      : category;

    const finalUnit = unit === '+ Custom Unit'
      ? (customUnitInput.trim() || 'piece')
      : unit;

    setSubmitting(true);
    try {
      const payload = {
        item_name: itemName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        stock: parseInt(stock, 10) || 0,
        category: finalCategory,
        unit: finalUnit.trim(),
        is_available: isAvailable,
        image_url: imageUrl.trim()
      };

      if (editingItem) {
        await updateMenuItemApi(vendorId, editingItem.item_id, payload);
        showAlert('Item Updated', `"${itemName.trim()}" has been updated successfully!`, 'success');
      } else {
        await addMenuItemApi(vendorId, payload);
        showAlert('Item Created', `"${itemName.trim()}" has been added to your store menu!`, 'success');
      }

      setIsModalOpen(false);
      await onRefresh();
    } catch (err: any) {
      showAlert('Save Failed', err.message || 'Failed to save item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: VendorItem) => {
    const currentAvail = optimisticAvailability[item.item_id] !== undefined
      ? optimisticAvailability[item.item_id]
      : Boolean(item.is_available);
    const nextState = !currentAvail;

    // Apply optimistic toggle state immediately
    setOptimisticAvailability(prev => ({
      ...prev,
      [item.item_id]: nextState
    }));

    try {
      await toggleItemAvailabilityApi(vendorId, item.item_id, nextState);
      // Refresh database in background
      (async () => {
        try {
          await onRefresh();
        } catch (err) {
          console.warn('Background refresh error:', err);
        }
      })();
    } catch (err: any) {
      // Revert toggle state on API failure
      setOptimisticAvailability(prev => ({
        ...prev,
        [item.item_id]: currentAvail
      }));
      showAlert('Update Failed', err.message || 'Failed to update item availability', 'error');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setAlertState({
      visible: true,
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this item from your catalog?',
      type: 'warning',
      confirmText: 'YES, DELETE',
      cancelText: 'NO, CANCEL',
      showCancel: true,
      onConfirm: async () => {
        try {
          await deleteMenuItemApi(vendorId, itemId);
          await onRefresh();
          setAlertState({
            visible: true,
            title: 'Item Deleted',
            message: 'The menu item has been removed from your store.',
            type: 'success',
            confirmText: 'OK',
            showCancel: false
          });
        } catch (err: any) {
          setAlertState({
            visible: true,
            title: 'Delete Failed',
            message: err.message || 'Failed to delete item',
            type: 'error',
            confirmText: 'OK',
            showCancel: false
          });
        }
      }
    });
  };

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.trim();
    const normSelCat = normalizeCategory(selectedCategory);
    return items.filter(i => {
      const normItemCat = normalizeCategory(i.category);
      const matchesCat = selectedCategory === 'ALL' || normItemCat === normSelCat;
      if (!matchesCat) return false;
      if (!query) return true;
      return matchesBilingualQuery(i.item_name, i.category, query);
    });
  }, [items, selectedCategory, searchQuery]);

  return (
    <View style={styles.container}>

      {/* Zomato Tier Top Search & Add Product Row */}
      <View style={styles.topSection}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <View style={styles.searchBox}>
            <Search size={18} color={BrandTheme.mutedSageText} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in English / हिंदी (e.g. Aloo, दूध, Milk)..."
              placeholderTextColor={BrandTheme.mutedSageText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 6 }}>
                <X size={16} color={BrandTheme.mutedSageText} />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => startVoiceSearch()}
              style={[
                styles.voiceSearchBtn,
                isListening && styles.voiceSearchBtnActive
              ]}
              activeOpacity={0.75}
            >
              <Mic size={17} color={isListening ? '#0E6B3D' : BrandTheme.darkForestGreen} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Pills Bar with Bilingual English & Hindi */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {filterCategories.map(cat => {
            const isSelected = selectedCategory === cat;
            const bLabel = getCategoryBilingualLabel(cat);
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillUnselected
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                {getCategoryIcon(cat, isSelected)}
                <Text style={[
                  styles.filterPillText,
                  { color: isSelected ? '#FFFFFF' : BrandTheme.darkForestGreen }
                ]}>
                  {bLabel.en} {bLabel.hi ? `/ ${bLabel.hi}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products Catalog FlatList */}
      <FlatList
        data={filteredItems}
        keyExtractor={item => String(item.item_id)}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={48} color={BrandTheme.mutedSageText} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Item" in the navigation bar to list items in your store menu.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const avail = optimisticAvailability[item.item_id] !== undefined
            ? optimisticAvailability[item.item_id]
            : Boolean(item.is_available);
          const isToggling = togglingId === item.item_id;
          const isVid = isVideoUrl(item.image_url);
          const nonVeg = isNonVegItem(item.item_name, item.description);

          return (
            <View style={styles.itemCard}>
              <View style={styles.cardMain}>
                {/* Media Thumbnail Box */}
                <View style={styles.thumbWrapper}>
                  <Image
                    source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&auto=format&fit=crop&q=80' }}
                    style={styles.itemThumb}
                    resizeMode="cover"
                  />
                  {isVid ? (
                    <View style={styles.videoBadgeTag}>
                      <Film size={10} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.videoBadgeText}>VIDEO</Text>
                    </View>
                  ) : null}
                </View>

                {/* Info Column (Category Badge, Name, Price & Unit, Status) */}
                <View style={styles.itemInfo}>
                  {/* Category Badge row */}
                  <View style={styles.nameRow}>
                    {renderCategoryBadge(item.category)}
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>
                  {getHindiSubtitle(item.item_name) ? (
                    <View style={styles.hindiBadgeRow}>
                      <Text style={styles.itemHindiText}>{getHindiSubtitle(item.item_name)}</Text>
                    </View>
                  ) : null}

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{parseFloat(String(item.price)).toFixed(2)}</Text>
                    {item.unit ? <Text style={styles.unitText}>/ {item.unit}</Text> : null}
                  </View>

                  {/* Stock Status Pill (inside info column) */}
                  <View style={[
                    styles.statusPillRow,
                    { backgroundColor: avail ? '#EAF5EE' : '#FEE2E2' }
                  ]}>
                    <View style={[styles.statusDot, { backgroundColor: avail ? BrandTheme.emeraldGreen : '#EF4444' }]} />
                    <Text style={[styles.availText, { color: avail ? BrandTheme.forestGreen : '#B91C1C' }]}>
                      {avail ? 'In Stock (Live in Store)' : 'Out of Stock (Hidden)'}
                    </Text>
                  </View>
                </View>

                {/* Actions Column: Edit, Delete, Toggle — stacked vertically on right */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={[styles.iconBtn, { borderColor: BrandTheme.sandBorder, backgroundColor: '#FAF8F3' }]}
                    onPress={() => handleOpenEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <Edit size={13} color={BrandTheme.darkForestGreen} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                    onPress={() => handleDeleteItem(item.item_id)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={13} color="#B91C1C" />
                  </TouchableOpacity>

                  <PremiumToggle
                    value={avail}
                    onValueChange={() => handleToggleAvailability(item)}
                    disabled={isToggling}
                  />
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Product Item Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>

            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color="#C4A066" />
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Item' : 'Add New Product'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFE8D8', justifyContent: 'center', alignItems: 'center' }}
              >
                <X size={16} color="#6B7C70" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>

              {/* ── PRODUCT PHOTO UPLOAD ── */}
              <Text style={styles.label}>Product Photo Upload</Text>
              <View style={styles.mediaPreviewBox}>
                {uploadingMedia ? (
                  <View style={{ alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#C4A066" />
                    <Text style={{ fontSize: 11, color: '#6B7C70', fontWeight: '700', marginTop: 8 }}>
                      Uploading...
                    </Text>
                  </View>
                ) : imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.placeholderBox}>
                    <ImageIcon size={32} color="#C4A066" style={{ marginBottom: 6 }} />
                    <Text style={styles.placeholderText}>No photo attached</Text>
                  </View>
                )}
              </View>

              {/* Upload Buttons */}
              <View style={styles.mediaBtnRow}>
                <TouchableOpacity style={styles.uploadBtn} onPress={handlePickMedia} activeOpacity={0.85}>
                  <Upload size={14} color="#18281F" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Upload Media</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#EFE8D8' }]} onPress={handleTakeMedia} activeOpacity={0.85}>
                  <Camera size={14} color="#18281F" style={{ marginRight: 6 }} />
                  <Text style={styles.uploadBtnText}>Camera</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.urlLabel}>Or paste direct image URL</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="https://... (image URL)"
                placeholderTextColor="#A0AFA5"
                value={imageUrl}
                onChangeText={setImageUrl}
              />

              {/* ── PRODUCT NAME ── */}
              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Amul Gold Fresh Milk 1L"
                placeholderTextColor="#A0AFA5"
                value={itemName}
                onChangeText={setItemName}
              />

              {/* ── CATEGORY SELECTION ── */}
              <View style={{ zIndex: 20, position: 'relative' }}>
                <Text style={styles.label}>Category Selection *</Text>
                <TouchableOpacity
                  style={styles.categoryDropdownTrigger}
                  onPress={() => {
                    setShowCategoryDropdown(s => !s);
                    setShowUnitDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Tag size={14} color="#C4A066" style={{ marginRight: 8 }} />
                  <Text style={styles.categoryDropdownTriggerText} numberOfLines={1}>
                    {category}
                  </Text>
                  {showCategoryDropdown ? (
                    <ChevronUp size={16} color="#6B7C70" />
                  ) : (
                    <ChevronDown size={16} color="#6B7C70" />
                  )}
                </TouchableOpacity>
                {showCategoryDropdown && (
                  <View style={[styles.categoryDropdownList, { position: 'absolute', top: 72, left: 0, right: 0, zIndex: 999 }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                      {PRESET_CATEGORIES.map(catItem => (
                        <TouchableOpacity
                          key={catItem}
                          style={[
                            styles.categoryDropdownItem,
                            category === catItem && styles.categoryDropdownItemActive
                          ]}
                          onPress={() => {
                            setCategory(catItem);
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.categoryDropdownItemText,
                            category === catItem && { color: '#18281F', fontWeight: '800' }
                          ]}>
                            {catItem}
                          </Text>
                          {category === catItem ? <Check size={14} color="#18281F" /> : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {category === '+ Custom Category' && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.urlLabel}>Type custom category name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Organic Spices"
                    placeholderTextColor="#A0AFA5"
                    value={customCategoryInput}
                    onChangeText={setCustomCategoryInput}
                  />
                </View>
              )}

              {/* ── PRICE (₹) ── */}
              <Text style={styles.label}>Price (₹) *</Text>
              <View style={styles.spinnerInputWrapper}>
                <TextInput
                  style={styles.spinnerTextInput}
                  placeholder="100.00"
                  placeholderTextColor="#A0AFA5"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
                <View style={styles.spinnerButtons}>
                  <TouchableOpacity onPress={incrementPrice} style={styles.spinnerArrow}>
                    <ChevronUp size={12} color="#18281F" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={decrementPrice} style={styles.spinnerArrow}>
                    <ChevronDown size={12} color="#18281F" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── UNIT ── */}
              <View style={{ zIndex: 10, position: 'relative' }}>
                <Text style={styles.label}>Unit</Text>
                <TouchableOpacity
                  style={styles.categoryDropdownTrigger}
                  onPress={() => {
                    setShowUnitDropdown(!showUnitDropdown);
                    setShowCategoryDropdown(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.categoryDropdownTriggerText} numberOfLines={1}>{unit}</Text>
                  {showUnitDropdown ? (
                    <ChevronUp size={16} color="#6B7C70" />
                  ) : (
                    <ChevronDown size={16} color="#6B7C70" />
                  )}
                </TouchableOpacity>
                {showUnitDropdown && (
                  <View style={[styles.categoryDropdownList, { position: 'absolute', top: 72, left: 0, right: 0, zIndex: 999 }]}>
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                      {PRESET_UNITS.map(unitItem => (
                        <TouchableOpacity
                          key={unitItem}
                          style={[
                            styles.categoryDropdownItem,
                            unit === unitItem && styles.categoryDropdownItemActive
                          ]}
                          onPress={() => {
                            setUnit(unitItem);
                            setShowUnitDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.categoryDropdownItemText,
                            unit === unitItem && { color: '#18281F', fontWeight: '800' }
                          ]}>
                            {unitItem}
                          </Text>
                          {unit === unitItem ? <Check size={14} color="#18281F" /> : null}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {unit === '+ Custom Unit' && (
                <View style={{ marginTop: 6 }}>
                  <Text style={styles.urlLabel}>Type custom unit name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. packet of 4"
                    placeholderTextColor="#A0AFA5"
                    value={customUnitInput}
                    onChangeText={setCustomUnitInput}
                  />
                </View>
              )}

              {/* ── AVAILABLE STOCK ── */}
              <Text style={styles.label}>Available Stock *</Text>
              <View style={styles.spinnerInputWrapper}>
                <TextInput
                  style={styles.spinnerTextInput}
                  placeholder="50"
                  placeholderTextColor="#A0AFA5"
                  keyboardType="numeric"
                  value={stock}
                  onChangeText={setStock}
                />
                <View style={styles.spinnerButtons}>
                  <TouchableOpacity onPress={incrementStock} style={styles.spinnerArrow}>
                    <ChevronUp size={12} color="#18281F" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={decrementStock} style={styles.spinnerArrow}>
                    <ChevronDown size={12} color="#18281F" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── ITEM AVAILABILITY ── */}
              <View style={styles.inputWrapperBox}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.label, { marginTop: 0 }]}>Item Availability</Text>
                  <Text style={{ fontSize: 11, color: '#6B7C70', marginTop: 3 }}>
                    {isAvailable ? 'Item is live and orderable' : 'Item is hidden from cart'}
                  </Text>
                </View>
                <PremiumToggle
                  value={isAvailable}
                  onValueChange={setIsAvailable}
                />
              </View>

              {/* ── DESCRIPTION ── */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Item specifications or details..."
                placeholderTextColor="#A0AFA5"
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveItem}
                disabled={submitting}
                activeOpacity={0.9}
              >
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>SAVE ITEM</Text>}
              </TouchableOpacity>
            </ScrollView>

          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Voice Search Interactive Modal ── */}
      <Modal
        visible={isVoiceModalOpen}
        transparent
        animationType="fade"
        onRequestClose={stopVoiceSearch}
      >
        <View style={styles.voiceModalBackdrop}>
          <View style={styles.voiceModalCard}>
            {/* Header */}
            <View style={styles.voiceModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Volume2 size={16} color={BrandTheme.forestGreen} />
                <Text style={styles.voiceModalTitle}>Voice Product Search</Text>
              </View>
              <TouchableOpacity onPress={stopVoiceSearch} style={styles.voiceCloseBtn}>
                <X size={18} color="#6B7C70" />
              </TouchableOpacity>
            </View>

            {/* Language Switcher in Voice Modal */}
            <View style={styles.voiceLangSwitchRow}>
              <TouchableOpacity
                style={[
                  styles.voiceLangBtn,
                  voiceLang === 'en-IN' && styles.voiceLangBtnActive
                ]}
                onPress={() => {
                  setVoiceLang('en-IN');
                  if (isListening) startVoiceSearch('en-IN');
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.voiceLangBtnText,
                  voiceLang === 'en-IN' && styles.voiceLangBtnTextActive
                ]}>
                  🇬🇧 English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voiceLangBtn,
                  voiceLang === 'hi-IN' && styles.voiceLangBtnActive
                ]}
                onPress={() => {
                  setVoiceLang('hi-IN');
                  if (isListening) startVoiceSearch('hi-IN');
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.voiceLangBtnText,
                  voiceLang === 'hi-IN' && styles.voiceLangBtnTextActive
                ]}>
                  🇮🇳 हिंदी
                </Text>
              </TouchableOpacity>
            </View>

            {/* Pulsing Mic Ring Visualization */}
            <View style={styles.voicePulseContainer}>
              <Animated.View
                style={[
                  styles.voicePulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: isListening ? 0.35 : 0.08,
                  }
                ]}
              />
              <TouchableOpacity
                style={[
                  styles.voiceMicBigCircle,
                  isListening ? styles.voiceMicBigCircleActive : styles.voiceMicBigCircleIdle
                ]}
                onPress={isListening ? stopVoiceSearch : () => startVoiceSearch()}
                activeOpacity={0.85}
              >
                <Mic size={32} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Transcript / Instructions */}
            <Text style={styles.voiceStatusText}>
              {voiceTranscript ? `"${voiceTranscript}"` : voiceStatus}
            </Text>

            {/* Quick Voice Suggestions with Bilingual Subtitles */}
            <Text style={styles.voiceSuggestionsLabel}>
              {voiceLang === 'hi-IN' ? 'या स्टोर आइटम पर टैप करें:' : 'Or tap store item to search:'}
            </Text>
            <View style={styles.voiceSuggestionsGrid}>
              {quickVoiceSuggestions.map((item) => {
                const hindi = getHindiSubtitle(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={styles.voiceSuggestionChip}
                    onPress={() => handleSelectQuickVoiceItem(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.voiceSuggestionText}>
                      {item} {hindi ? `(${hindi})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Done / Close Button */}
            <TouchableOpacity
              style={[
                styles.voiceDoneBtn,
                isListening && { backgroundColor: '#0E6B3D' }
              ]}
              onPress={stopVoiceSearch}
              activeOpacity={0.8}
            >
              <Text style={styles.voiceDoneBtnText}>
                {isListening ? 'TAP TO STOP & SEARCH' : (voiceTranscript ? 'SEARCH' : 'CLOSE')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    backgroundColor: BrandTheme.warmTanGold,
    shadowColor: BrandTheme.warmTanGold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    height: 44,
    backgroundColor: BrandTheme.creamCanvas,
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BrandTheme.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: BrandTheme.darkForestGreen,
  },
  voiceSearchBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F2EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  voiceSearchBtnActive: {
    backgroundColor: '#E8F8F0',
  },
  voiceModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  voiceModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FAF8F3',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE8DD',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  voiceModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  voiceLangSwitchRow: {
    flexDirection: 'row',
    backgroundColor: '#EBE7DD',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
    gap: 4,
  },
  voiceLangBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  voiceLangBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceLangBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B7C70',
  },
  voiceLangBtnTextActive: {
    color: '#18281F',
    fontWeight: '800',
  },
  voiceModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#18281F',
  },
  voiceCloseBtn: {
    padding: 4,
  },
  voicePulseContainer: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  voicePulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0E6B3D',
  },
  voiceMicBigCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceMicBigCircleActive: {
    backgroundColor: '#0E6B3D',
  },
  voiceMicBigCircleIdle: {
    backgroundColor: '#4B5563',
  },
  voiceStatusText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#18281F',
    textAlign: 'center',
    marginHorizontal: 12,
    minHeight: 38,
  },
  voiceSuggestionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7C70',
    marginTop: 10,
    marginBottom: 8,
    textAlign: 'center',
  },
  voiceSuggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  voiceSuggestionChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2DEC8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  voiceSuggestionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#18281F',
  },
  voiceDoneBtn: {
    width: '100%',
    height: 42,
    backgroundColor: '#18281F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceDoneBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  filterBar: {
    gap: 6,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 4,
  },
  filterPillSelected: {
    backgroundColor: BrandTheme.forestGreen,
  },
  filterPillUnselected: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  emptySubtitle: {
    fontSize: 13,
    color: BrandTheme.mutedSageText,
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: BrandTheme.creamCanvas,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbWrapper: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 14,
    marginTop: 12,
    backgroundColor: BrandTheme.warmOffWhite,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
  },
  itemThumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  videoBadgeTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 22, 16, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  videoBadgeText: {
    color: BrandTheme.creamCanvas,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  itemInfo: {
    flex: 1,
    paddingLeft: 2,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 5,
  },
  vegEmblem: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#0F8A65',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0F8A65',
  },
  nonVegEmblem: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nonVegDot: {
    width: 6,
    height: 6,
    backgroundColor: '#E53935',
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandTheme.mutedSageText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
    lineHeight: 22,
    marginBottom: 4,
  },
  hindiBadgeRow: {
    backgroundColor: '#E8F8F0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  itemHindiText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0E6B3D',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  priceText: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandTheme.emeraldGreen,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '400',
    color: BrandTheme.mutedSageText,
  },
  actionCol: {
    flexDirection: 'column',
    gap: 8,
    alignItems: 'center',
    marginLeft: 8,
    paddingTop: 2,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: BrandTheme.warmOffWhite,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 22, 16, 0.72)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: BrandTheme.warmOffWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    maxHeight: '94%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BrandTheme.darkForestGreen,
  },
  modalForm: {
    gap: 8,
    paddingBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: BrandTheme.mutedSageText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
  },
  urlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BrandTheme.mutedSageText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    fontWeight: '500',
    color: BrandTheme.darkForestGreen,
    backgroundColor: BrandTheme.creamCanvas,
  },
  rowTwo: {
    flexDirection: 'row',
  },
  inputWrapperBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  mediaPickerCard: {
    backgroundColor: BrandTheme.creamCanvas,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  mediaPreviewBox: {
    height: 150,
    borderRadius: 14,
    backgroundColor: BrandTheme.warmOffWhite,
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlayBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(11, 22, 16, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoOverlayText: {
    color: BrandTheme.creamCanvas,
    fontSize: 11,
    fontWeight: '700',
  },
  placeholderBox: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: BrandTheme.mutedSageText,
    fontWeight: '600',
  },
  mediaBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandTheme.sandBorder,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: BrandTheme.darkForestGreen,
  },
  categoryDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: BrandTheme.creamCanvas,
  },
  categoryDropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: BrandTheme.darkForestGreen,
  },
  categoryDropdownList: {
    backgroundColor: BrandTheme.warmOffWhite,
    borderWidth: 1,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 100,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: BrandTheme.sandBorder,
  },
  categoryDropdownItemActive: {
    backgroundColor: BrandTheme.warmOffWhite,
  },
  categoryDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: BrandTheme.darkForestGreen,
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: BrandTheme.forestGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: BrandTheme.darkForestGreen,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: BrandTheme.creamCanvas,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  spinnerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 12,
    backgroundColor: BrandTheme.creamCanvas,
    height: 46,
    paddingHorizontal: 14,
  },
  spinnerTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BrandTheme.darkForestGreen,
    paddingVertical: 0,
  },
  spinnerButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
    width: 22,
    borderWidth: 1.2,
    borderColor: BrandTheme.sandBorder,
    borderRadius: 6,
    backgroundColor: BrandTheme.creamCanvas,
  },
  spinnerArrow: {
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumToggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2.5,
    justifyContent: 'center',
  },
  premiumToggleThumb: {
    width: 19,
    height: 19,
    borderRadius: 9.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0B1610',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
});
