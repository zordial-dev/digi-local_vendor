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
  RefreshControl,
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
  Home,
  Building2,
  Calendar,
  Globe,
  Bold,
  Italic,
  List,
  Type,
  Code,
  Link,
  RotateCcw,
  RotateCw,
  Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { pickImageFromDevice, captureImageFromDevice } from '../utils/imagePickerHelper';
import { Colors, BrandTheme } from '../constants/theme';
import { getHindiSubtitle, matchesBilingualQuery, getCategoryBilingualLabel } from '../utils/translations';

import {
  VendorItem,
  addMenuItemApi,
  updateMenuItemApi,
  deleteMenuItemApi,
  toggleItemAvailabilityApi,
  uploadMediaApi
} from '../services/apiService';

import { CustomAlertModal, CustomAlertState, AlertType } from './CustomAlertModal';
import { showToast } from './ToastNotification';

interface MenuScreenProps {
  vendorId: number;
  items: VendorItem[];
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  isDarkMode?: boolean;
  openAddProductTrigger?: number;
  businessType?: 'PRODUCT' | 'SERVICE';
  isPendingApproval?: boolean;
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

const PRESET_SERVICE_CATEGORIES = [
  'Appliance Repair',
  'AC Service & Repair',
  'Home Cleaning',
  'Electrician',
  'Plumber',
  'Carpentry',
  'Painting',
  'Pest Control',
  'Beauty & Salon',
  'Tuition & Coaching',
  'Doctor & Care',
  'Consultations',
  'Repairs & Tech',
  'Legal & Tax',
  'Driver & Events',
  '+ Custom Category'
];

const PRESET_DURATIONS = [
  '30 mins',
  '45 mins',
  '1 hour',
  '1.5 hours',
  '2 hours',
  '3 hours',
  '4 hours',
  'Half Day',
  'Full Day',
  'Custom'
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

const PRESET_SERVICE_UNITS = [
  'Per Session (45m)',
  'Per Hour',
  'Per Visit',
  'Per Month',
  '1 Service',
  'Inspection Fee',
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
  businessType = 'PRODUCT',
  isPendingApproval = false,
}) => {
  const isService = businessType === 'SERVICE';
  const categoryPresets = isService ? PRESET_SERVICE_CATEGORIES : PRESET_CATEGORIES;
  const unitPresets = isService ? PRESET_SERVICE_UNITS : [
    'Piece', 'Set', 'Packet', 'Box', '1 kg', '500g', '250g', '1L', '500ml', 'Dozen', 'Bunch', 'g', '+ Custom Unit'
  ];
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
  const [deletedItemIds, setDeletedItemIds] = useState<Set<number>>(new Set());
  const [optimisticAddedItems, setOptimisticAddedItems] = useState<VendorItem[]>([]);
  const [optimisticUpdatedItems, setOptimisticUpdatedItems] = useState<Record<number, VendorItem>>({});

  // Synchronize optimistic states with incoming server props
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

    setDeletedItemIds(prev => {
      if (prev.size === 0) return prev;
      const currentItemIds = new Set(items.map(i => i.item_id));
      const next = new Set<number>();
      prev.forEach(id => {
        if (currentItemIds.has(id)) {
          next.add(id);
        }
      });
      return next.size === prev.size ? prev : next;
    });

    setOptimisticAddedItems(prev => {
      if (prev.length === 0) return prev;
      const currentItemIds = new Set(items.map(i => i.item_id));
      const currentItemNames = new Set(items.map(i => `${i.item_name.toLowerCase()}_${i.category}`));
      const next = prev.filter(i => !currentItemIds.has(i.item_id) && !currentItemNames.has(`${i.item_name.toLowerCase()}_${i.category}`));
      return next.length === prev.length ? prev : next;
    });

    setOptimisticUpdatedItems(prev => {
      if (Object.keys(prev).length === 0) return prev;
      return {};
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
  const [category, setCategory] = useState(isService ? 'Appliance Repair' : 'Grocery');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [unit, setUnit] = useState(isService ? '1 hour' : 'Piece');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [stock, setStock] = useState('');

  // Service Provider Specific States
  const [pricingModel, setPricingModel] = useState<'FIXED' | 'STARTING_FROM'>('FIXED');
  const [estimatedDuration, setEstimatedDuration] = useState('1 hour');
  const [serviceLocation, setServiceLocation] = useState<'DOORSTEP' | 'SHOP' | 'ONLINE'>('DOORSTEP');
  const [showDurationDropdown, setShowDurationDropdown] = useState(false);

  // Unit Dropdown States
  const [showUnitDropdown, setShowUnitDropdown] = useState(false);
  const [customUnitInput, setCustomUnitInput] = useState('');

  const resetForm = () => {
    setItemName('');
    setDescription('');
    setPrice('');
    setCategory(isService ? 'Appliance Repair' : 'Grocery');
    setUnit(isService ? '1 hour' : 'Piece');
    setPricingModel('FIXED');
    setEstimatedDuration('1 hour');
    setServiceLocation('DOORSTEP');
    setShowDurationDropdown(false);
    setCustomCategoryInput('');
    setCustomUnitInput('');
    setShowCategoryDropdown(false);
    setShowUnitDropdown(false);
    setImageUrl('');
    setIsAvailable(true);
    setStock('');
    setEditingItem(null);
  };



  // Active items merging prop items + optimistic additions/updates minus deletions
  const activeItems = React.useMemo(() => {
    // 1. Base items with optimistic updates & availability applied, minus deleted items
    const baseList = items
      .filter(i => !deletedItemIds.has(i.item_id))
      .map(i => {
        let item = optimisticUpdatedItems[i.item_id] || i;
        if (optimisticAvailability[item.item_id] !== undefined) {
          item = { ...item, is_available: optimisticAvailability[item.item_id] };
        }
        return item;
      });

    // 2. Newly added optimistic items not yet present in base items
    const existingIds = new Set(baseList.map(i => i.item_id));
    const addedList = optimisticAddedItems.filter(
      i => !existingIds.has(i.item_id) && !deletedItemIds.has(i.item_id)
    );

    return [...addedList, ...baseList];
  }, [items, deletedItemIds, optimisticAddedItems, optimisticUpdatedItems, optimisticAvailability]);

  // Unique normalized categories list with counts (memoized for instant tab switching)
  const filterCategories = React.useMemo(() => {
    const itemNormCategories = activeItems.map(i => normalizeCategory(i.category));
    return [
      'ALL',
      ...Array.from(new Set([...PRESET_CATEGORIES.filter(c => c !== '+ Custom Category'), ...itemNormCategories]))
    ];
  }, [activeItems]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { ALL: activeItems.length };
    activeItems.forEach(i => {
      const cat = normalizeCategory(i.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [activeItems]);

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

    const presets = isService ? PRESET_SERVICE_CATEGORIES : PRESET_CATEGORIES;
    const defaultCat = isService ? 'Appliance Repair' : 'Grocery';
    const itemCat = item.category || defaultCat;
    if (presets.includes(itemCat)) {
      setCategory(itemCat);
      setCustomCategoryInput('');
    } else {
      setCategory('+ Custom Category');
      setCustomCategoryInput(item.category || 'General');
    }

    if (isService) {
      setEstimatedDuration(item.unit || '1 hour');
      setPricingModel(item.unit && item.unit.toLowerCase().includes('start') ? 'STARTING_FROM' : 'FIXED');
    } else {
      const itemUnit = item.unit || 'Piece';
      const foundPreset = PRESET_UNITS.find(u => u.toLowerCase() === itemUnit.toLowerCase() && u !== '+ Custom Unit');
      if (foundPreset) {
        setUnit(foundPreset);
        setCustomUnitInput('');
      } else {
        setUnit('+ Custom Unit');
        setCustomUnitInput(itemUnit);
      }
    }
    setShowCategoryDropdown(false);
    setShowUnitDropdown(false);
    setShowDurationDropdown(false);

    setImageUrl(item.image_url || '');
    setIsAvailable(Boolean(item.is_available));
    setIsModalOpen(true);
  };

  // Upload image from device / Mac gallery
  const handlePickMedia = async () => {
    try {
      const picked = await pickImageFromDevice({
        allowsEditing: false,
        quality: 0.8,
      });

      if (picked && picked.uri) {
        if (picked.base64) {
          setUploadingMedia(true);
          try {
            const uploaded = await uploadMediaApi(
              picked.base64,
              picked.fileName || `media_${Date.now()}.jpg`,
              picked.mimeType || 'image/jpeg'
            );
            setImageUrl(uploaded.url || picked.uri);
            showAlert('Media Uploaded', 'Product photo saved successfully!', 'success');
          } catch (uploadErr: any) {
            setImageUrl(picked.uri);
          } finally {
            setUploadingMedia(false);
          }
        } else {
          setImageUrl(picked.uri);
        }
      }
    } catch (err: any) {
      showAlert('Selection Error', err.message || 'Failed to pick media file.', 'error');
    }
  };

  // Capture photo directly using camera or file picker on Mac
  const handleTakeMedia = async () => {
    try {
      const captured = await captureImageFromDevice({
        allowsEditing: false,
        quality: 0.8,
      });

      if (captured && captured.uri) {
        if (captured.base64) {
          setUploadingMedia(true);
          try {
            const uploaded = await uploadMediaApi(
              captured.base64,
              captured.fileName || `media_${Date.now()}.jpg`,
              captured.mimeType || 'image/jpeg'
            );
            setImageUrl(uploaded.url || captured.uri);
            showAlert('Captured & Uploaded', 'Product photo saved successfully!', 'success');
          } catch (uploadErr: any) {
            setImageUrl(captured.uri);
          } finally {
            setUploadingMedia(false);
          }
        } else {
          setImageUrl(captured.uri);
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
      showAlert('Required Fields Missing', `Please enter both ${isService ? 'service name' : 'item name'} and price.`, 'warning');
      return;
    }

    const finalCategory = category === '+ Custom Category'
      ? (customCategoryInput.trim() || 'General')
      : category;

    const finalUnit = isService
      ? (pricingModel === 'STARTING_FROM' ? `Starting from / ${estimatedDuration}` : estimatedDuration)
      : (unit === '+ Custom Unit' ? (customUnitInput.trim() || 'piece') : unit);

    const isEditing = Boolean(editingItem);
    const payload = {
      item_name: itemName.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      stock: isService ? 999 : (parseInt(stock, 10) || 50),
      category: finalCategory,
      unit: finalUnit.trim(),
      is_available: isAvailable,
      image_url: imageUrl.trim()
    };

    if (isEditing && editingItem) {
      const updatedItem: VendorItem = {
        ...editingItem,
        ...payload,
      };

      // 1. Optimistically update UI immediately (0ms)
      setOptimisticUpdatedItems(prev => ({
        ...prev,
        [editingItem.item_id]: updatedItem
      }));

      setIsModalOpen(false);
      resetForm();
      showToast('Item updated successfully', 'success');

      // 2. Perform background sync
      (async () => {
        try {
          await updateMenuItemApi(vendorId, editingItem.item_id, payload);
          await onRefresh();
        } catch (err: any) {
          setOptimisticUpdatedItems(prev => {
            const next = { ...prev };
            delete next[editingItem.item_id];
            return next;
          });
          showToast(err.message || 'Failed to update item', 'error');
        }
      })();
    } else {
      const tempId = -Date.now();
      const newItem: VendorItem = {
        item_id: tempId,
        vendor_id: vendorId,
        item_name: itemName.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 50,
        category: finalCategory,
        unit: finalUnit.trim(),
        is_available: isAvailable,
        image_url: imageUrl.trim()
      };

      // 1. Optimistically add new item to UI immediately (0ms)
      setOptimisticAddedItems(prev => [newItem, ...prev]);

      setIsModalOpen(false);
      resetForm();
      showToast('Item added successfully', 'add');

      // 2. Perform background creation and sync
      (async () => {
        try {
          const res = await addMenuItemApi(vendorId, payload);
          if (res?.item_id) {
            setOptimisticAddedItems(prev =>
              prev.map(i => i.item_id === tempId ? { ...i, item_id: res.item_id! } : i)
            );
          }
          await onRefresh();
        } catch (err: any) {
          setOptimisticAddedItems(prev => prev.filter(i => i.item_id !== tempId));
          showToast(err.message || 'Failed to add item', 'error');
        }
      })();
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

  const handleDeleteItem = (itemId: number) => {
    const targetItem = items.find(i => i.item_id === itemId);
    const itemLabel = targetItem ? targetItem.item_name : 'Item';

    setAlertState({
      visible: true,
      title: 'Delete Menu Item',
      message: `Are you sure you want to delete "${itemLabel}" from your catalog?`,
      type: 'warning',
      confirmText: 'YES, DELETE',
      cancelText: 'NO, CANCEL',
      showCancel: true,
      onConfirm: () => {
        // 1. Optimistically remove item from UI immediately (0ms instant response)
        setDeletedItemIds(prev => {
          const next = new Set(prev);
          next.add(itemId);
          return next;
        });
        setOptimisticAddedItems(prev => prev.filter(i => i.item_id !== itemId));

        // 2. Show bottom-up toast notification
        showToast('Item deleted successfully', 'delete');

        // 3. Perform API delete and sync in background without blocking the UI
        (async () => {
          try {
            await deleteMenuItemApi(vendorId, itemId);
            try {
              await onRefresh();
            } catch (_) { }
          } catch (err: any) {
            // Revert optimistic delete on failure and notify user
            setDeletedItemIds(prev => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
            showToast('Failed to delete item', 'error');
          }
        })();
      }
    });
  };

  const filteredItems = React.useMemo(() => {
    const query = searchQuery.trim();
    const normSelCat = normalizeCategory(selectedCategory);
    return activeItems.filter(i => {
      const normItemCat = normalizeCategory(i.category);
      const matchesCat = selectedCategory === 'ALL' || normItemCat === normSelCat;
      if (!matchesCat) return false;
      if (!query) return true;
      return matchesBilingualQuery(i.item_name, i.category, query);
    });
  }, [activeItems, selectedCategory, searchQuery]);

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
              <TouchableOpacity onPress={() => setSearchQuery('')} style={{ marginRight: 4 }}>
                <X size={16} color={BrandTheme.mutedSageText} />
              </TouchableOpacity>
            ) : null}
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            colors={['#541D26']}
            tintColor="#541D26"
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color="#541D26" />
              <Text style={{ marginTop: 14, fontSize: 13, fontWeight: '700', color: '#541D26' }}>
                Loading menu items...
              </Text>
            </View>
          ) : isPendingApproval ? (
            <View style={styles.emptyState}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#F7EEF0',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 14,
                borderWidth: 4,
                borderColor: '#FAF8F5'
              }}>
                <Sparkles size={28} color="#541D26" />
              </View>
              <Text style={styles.emptyTitle}>
                {isService ? 'List Your Services' : 'Build Your Store Catalog'}
              </Text>
              <Text style={styles.emptySubtitle}>
                Add your {isService ? 'services, packages, and consultation fees' : 'products, photos, and prices'} now so your menu is ready the moment your merchant account is approved.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#541D26',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
                onPress={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
                  {isService ? 'Add First Service' : 'Add First Product'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Package size={48} color={BrandTheme.mutedSageText} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Items Found</Text>
              <Text style={styles.emptySubtitle}>
                Tap "{isService ? 'Add Service' : 'Add Item'}" in the navigation bar to list items in your store menu.
              </Text>
            </View>
          )
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
                    <Text style={[styles.availText, { color: avail ? BrandTheme.forestGreen : '#DC2626' }]}>
                      {avail ? 'In Stock (Live in Store)' : 'Out of Stock (Hidden)'}
                    </Text>
                  </View>
                </View>

                {/* Actions Column: Edit, Delete, Toggle — stacked vertically on right */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={[styles.iconBtn, { borderColor: BrandTheme.sandBorder, backgroundColor: '#FAF8F5' }]}
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
                    <Trash2 size={13} color="#DC2626" />
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

      {/* Add / Edit Product or Service Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, isService && styles.serviceModalCard]}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#C8A878" />
                <Text style={styles.modalTitle}>
                  {isService
                    ? (editingItem ? 'Edit Service' : 'Add New Service')
                    : (editingItem ? 'Edit Item' : 'Add New Product')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.modalCloseCircle}
              >
                <X size={16} color="#78716C" />
              </TouchableOpacity>
            </View>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* ─── OPTION A: DEDICATED SERVICE PROVIDER MODAL FORM ─── */}
            {/* ════════════════════════════════════════════════════════════ */}
            {isService ? (
              <ScrollView contentContainerStyle={styles.serviceModalForm} showsVerticalScrollIndicator={false}>

                {/* 1. SERVICE PHOTO */}
                <Text style={styles.serviceSectionLabel}>SERVICE PHOTO</Text>
                <View style={styles.serviceDashedBox}>
                  {uploadingMedia ? (
                    <View style={{ alignItems: 'center', padding: 18 }}>
                      <ActivityIndicator size="small" color="#C8A878" />
                      <Text style={{ fontSize: 11, color: '#78716C', fontWeight: '700', marginTop: 6 }}>
                        Uploading...
                      </Text>
                    </View>
                  ) : imageUrl ? (
                    <View style={{ width: '100%', height: 130, position: 'relative' }}>
                      <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 12 }} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => setImageUrl('')}
                        style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                      >
                        <X size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 22 }}>
                      <ImageIcon size={32} color="#C8A878" strokeWidth={1.5} style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 12, color: '#78716C', fontWeight: '600' }}>No photo attached</Text>
                    </View>
                  )}
                </View>

                {/* Upload & Camera Buttons */}
                <View style={styles.serviceMediaBtnRow}>
                  <TouchableOpacity
                    style={styles.serviceMediaBtn}
                    onPress={handlePickMedia}
                    activeOpacity={0.85}
                  >
                    <Upload size={14} color="#211A19" strokeWidth={2} style={{ marginRight: 6 }} />
                    <Text style={styles.serviceMediaBtnText}>Upload Media</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.serviceMediaBtn}
                    onPress={handleTakeMedia}
                    activeOpacity={0.85}
                  >
                    <Camera size={14} color="#211A19" strokeWidth={2} style={{ marginRight: 6 }} />
                    <Text style={styles.serviceMediaBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>

                {/* 2. SERVICE NAME */}
                <Text style={styles.serviceSectionLabel}>SERVICE NAME</Text>
                <TextInput
                  style={styles.serviceInput}
                  placeholder="e.g. Split AC Deep Cleaning & Servicing"
                  placeholderTextColor="#78716C"
                  value={itemName}
                  onChangeText={setItemName}
                />

                {/* 3. CATEGORY */}
                <View style={{ marginTop: 14, zIndex: 30, position: 'relative' }}>
                  <Text style={styles.serviceSectionLabel}>CATEGORY</Text>
                  <TouchableOpacity
                    style={styles.serviceDropdownTrigger}
                    onPress={() => {
                      setShowCategoryDropdown(s => !s);
                      setShowDurationDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.serviceDropdownTriggerText} numberOfLines={1}>
                      {category}
                    </Text>
                    {showCategoryDropdown ? (
                      <ChevronUp size={18} color="#78716C" />
                    ) : (
                      <ChevronDown size={18} color="#78716C" />
                    )}
                  </TouchableOpacity>

                  {showCategoryDropdown && (
                    <View style={styles.serviceDropdownMenu}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                        {PRESET_SERVICE_CATEGORIES.map(catItem => (
                          <TouchableOpacity
                            key={catItem}
                            style={[
                              styles.serviceDropdownItem,
                              category === catItem && styles.serviceDropdownItemActive
                            ]}
                            onPress={() => {
                              setCategory(catItem);
                              setShowCategoryDropdown(false);
                            }}
                          >
                            <Text style={[
                              styles.serviceDropdownItemText,
                              category === catItem && { color: '#211A19', fontWeight: '800' }
                            ]}>
                              {catItem}
                            </Text>
                            {category === catItem ? <Check size={14} color="#211A19" /> : null}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                {category === '+ Custom Category' && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 11, color: '#78716C', marginBottom: 4 }}>Type custom service category *</Text>
                    <TextInput
                      style={styles.serviceInput}
                      placeholder="e.g. Solar Panel Installation"
                      placeholderTextColor="#78716C"
                      value={customCategoryInput}
                      onChangeText={setCustomCategoryInput}
                    />
                  </View>
                )}

                {/* 4. PRICING MODEL */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.serviceSectionLabel}>PRICING MODEL</Text>
                  <View style={{ flexDirection: 'row', gap: 24, marginTop: 4 }}>
                    <TouchableOpacity
                      style={styles.serviceRadioOption}
                      onPress={() => setPricingModel('FIXED')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.serviceRadioCircle}>
                        {pricingModel === 'FIXED' ? <View style={styles.serviceRadioDot} /> : null}
                      </View>
                      <Text style={styles.serviceRadioText}>Fixed Price</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.serviceRadioOption}
                      onPress={() => setPricingModel('STARTING_FROM')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.serviceRadioCircle}>
                        {pricingModel === 'STARTING_FROM' ? <View style={styles.serviceRadioDot} /> : null}
                      </View>
                      <Text style={styles.serviceRadioText}>Starting From</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 5. PRICE (₹) & ESTIMATED DURATION (Side-by-side row) */}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16, zIndex: 20 }}>
                  {/* Price */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceSectionLabel}>PRICE (₹)</Text>
                    <View style={styles.serviceSpinnerWrapper}>
                      <TextInput
                        style={styles.serviceSpinnerTextInput}
                        placeholder="499.00"
                        placeholderTextColor="#78716C"
                        keyboardType="numeric"
                        value={price}
                        onChangeText={setPrice}
                      />
                      <View style={styles.serviceSpinnerArrows}>
                        <TouchableOpacity onPress={incrementPrice} style={styles.serviceSpinnerBtn}>
                          <ChevronUp size={12} color="#211A19" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={decrementPrice} style={styles.serviceSpinnerBtn}>
                          <ChevronDown size={12} color="#211A19" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Estimated Duration */}
                  <View style={{ flex: 1.1, position: 'relative' }}>
                    <Text style={styles.serviceSectionLabel}>ESTIMATED DURATION</Text>
                    <TouchableOpacity
                      style={styles.serviceDropdownTrigger}
                      onPress={() => {
                        setShowDurationDropdown(s => !s);
                        setShowCategoryDropdown(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.serviceDropdownTriggerText} numberOfLines={1}>
                        {estimatedDuration}
                      </Text>
                      {showDurationDropdown ? (
                        <ChevronUp size={16} color="#78716C" />
                      ) : (
                        <ChevronDown size={16} color="#78716C" />
                      )}
                    </TouchableOpacity>

                    {showDurationDropdown && (
                      <View style={styles.serviceDropdownMenu}>
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                          {PRESET_DURATIONS.map(dur => (
                            <TouchableOpacity
                              key={dur}
                              style={[
                                styles.serviceDropdownItem,
                                estimatedDuration === dur && styles.serviceDropdownItemActive
                              ]}
                              onPress={() => {
                                setEstimatedDuration(dur);
                                setShowDurationDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.serviceDropdownItemText,
                                estimatedDuration === dur && { color: '#211A19', fontWeight: '800' }
                              ]}>
                                {dur}
                              </Text>
                              {estimatedDuration === dur ? <Check size={14} color="#211A19" /> : null}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </View>

                {/* 6. SERVICE LOCATION */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.serviceSectionLabel}>SERVICE LOCATION</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <TouchableOpacity
                      style={[
                        styles.serviceLocationPill,
                        serviceLocation === 'DOORSTEP' && styles.serviceLocationPillActive
                      ]}
                      onPress={() => setServiceLocation('DOORSTEP')}
                      activeOpacity={0.85}
                    >
                      <Home size={15} color={serviceLocation === 'DOORSTEP' ? '#211A19' : '#78716C'} />
                      <Text style={[
                        styles.serviceLocationText,
                        serviceLocation === 'DOORSTEP' && styles.serviceLocationTextActive
                      ]}>
                        At Customer's Doorstep
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.serviceLocationPill,
                        serviceLocation === 'SHOP' && styles.serviceLocationPillActive
                      ]}
                      onPress={() => setServiceLocation('SHOP')}
                      activeOpacity={0.85}
                    >
                      <Building2 size={15} color={serviceLocation === 'SHOP' ? '#211A19' : '#78716C'} />
                      <Text style={[
                        styles.serviceLocationText,
                        serviceLocation === 'SHOP' && styles.serviceLocationTextActive
                      ]}>
                        At Shop / Clinic
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.serviceLocationPill,
                        serviceLocation === 'ONLINE' && styles.serviceLocationPillActive
                      ]}
                      onPress={() => setServiceLocation('ONLINE')}
                      activeOpacity={0.85}
                    >
                      <Globe size={15} color={serviceLocation === 'ONLINE' ? '#211A19' : '#78716C'} />
                      <Text style={[
                        styles.serviceLocationText,
                        serviceLocation === 'ONLINE' && styles.serviceLocationTextActive
                      ]}>
                        Online / Remote
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 7. SERVICE DESCRIPTION */}
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.serviceSectionLabel}>SERVICE DESCRIPTION</Text>
                  <TextInput
                    style={styles.serviceTextArea}
                    placeholder="Service details, what's included..."
                    placeholderTextColor="#78716C"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                  />
                </View>

                {/* 8. Submit Service Button */}
                <TouchableOpacity
                  style={[styles.saveBtn, { marginTop: 16 }]}
                  onPress={handleSaveItem}
                  disabled={submitting}
                  activeOpacity={0.9}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.saveBtnText}>
                      {editingItem ? 'UPDATE SERVICE' : 'ADD SERVICE'}
                    </Text>
                  )}
                </TouchableOpacity>

              </ScrollView>
            ) : (
              /* ════════════════════════════════════════════════════════════ */
              /* ─── OPTION B: STANDARD PRODUCT MERCHANT MODAL FORM ─── */
              /* ════════════════════════════════════════════════════════════ */
              <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>

                {/* ── PRODUCT PHOTO UPLOAD ── */}
                <Text style={styles.label}>Product Photo Upload</Text>
                <View style={styles.mediaPreviewBox}>
                  {uploadingMedia ? (
                    <View style={{ alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#C8A878" />
                      <Text style={{ fontSize: 11, color: '#78716C', fontWeight: '700', marginTop: 8 }}>
                        Uploading...
                      </Text>
                    </View>
                  ) : imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.placeholderBox}>
                      <ImageIcon size={32} color="#C8A878" style={{ marginBottom: 6 }} />
                      <Text style={styles.placeholderText}>No photo attached</Text>
                    </View>
                  )}
                </View>

                {/* Upload Buttons */}
                <View style={styles.mediaBtnRow}>
                  <TouchableOpacity style={styles.uploadBtn} onPress={handlePickMedia} activeOpacity={0.85}>
                    <Upload size={14} color="#211A19" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadBtnText}>Upload Media</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: '#EEE5DA' }]} onPress={handleTakeMedia} activeOpacity={0.85}>
                    <Camera size={14} color="#211A19" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadBtnText}>Camera</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.urlLabel}>Or paste direct image URL</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://... (image URL)"
                  placeholderTextColor="#78716C"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />

                {/* ── PRODUCT NAME ── */}
                <Text style={styles.label}>Product Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Amul Gold Fresh Milk 1L"
                  placeholderTextColor="#78716C"
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
                    <Tag size={14} color="#C8A878" style={{ marginRight: 8 }} />
                    <Text style={styles.categoryDropdownTriggerText} numberOfLines={1}>
                      {category}
                    </Text>
                    {showCategoryDropdown ? (
                      <ChevronUp size={16} color="#78716C" />
                    ) : (
                      <ChevronDown size={16} color="#78716C" />
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
                              category === catItem && { color: '#211A19', fontWeight: '800' }
                            ]}>
                              {catItem}
                            </Text>
                            {category === catItem ? <Check size={14} color="#211A19" /> : null}
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
                      placeholderTextColor="#78716C"
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
                    placeholderTextColor="#78716C"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                  <View style={styles.spinnerButtons}>
                    <TouchableOpacity onPress={incrementPrice} style={styles.spinnerArrow}>
                      <ChevronUp size={12} color="#211A19" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={decrementPrice} style={styles.spinnerArrow}>
                      <ChevronDown size={12} color="#211A19" />
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
                      <ChevronUp size={16} color="#78716C" />
                    ) : (
                      <ChevronDown size={16} color="#78716C" />
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
                              unit === unitItem && { color: '#211A19', fontWeight: '800' }
                            ]}>
                              {unitItem}
                            </Text>
                            {unit === unitItem ? <Check size={14} color="#211A19" /> : null}
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
                      placeholderTextColor="#78716C"
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
                    placeholderTextColor="#78716C"
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                  />
                  <View style={styles.spinnerButtons}>
                    <TouchableOpacity onPress={incrementStock} style={styles.spinnerArrow}>
                      <ChevronUp size={12} color="#211A19" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={decrementStock} style={styles.spinnerArrow}>
                      <ChevronDown size={12} color="#211A19" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* ── ITEM AVAILABILITY ── */}
                <View style={styles.inputWrapperBox}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
<Text style={[styles.label, { marginTop: 0 }]}>Item Availability</Text>
                    <Text style={{ fontSize: 11, color: '#78716C', marginTop: 3 }}>
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
                  placeholderTextColor="#78716C"
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
            )}

          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#541D26',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
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
    borderColor: '#E7DFD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
  },
  filterBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#211A19',
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
    backgroundColor: '#541D26',
  },
  filterPillUnselected: {
    backgroundColor: '#EEE5DA',
    borderWidth: 1,
    borderColor: '#E7DFD5',
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
    borderColor: '#541D26',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#541D26',
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
    color: '#541D26',
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
  serviceModalCard: {
    backgroundColor: '#FAF8F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE5DA',
    justifyContent: 'center',
    alignItems: 'center',
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
    textAlign: 'left',
    textAlignVertical: 'center',
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
    textAlign: 'left',
    textAlignVertical: 'center',
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
    shadowColor: '#6B2732',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },

  /* ══════════════════════════════════════════════════════════════ */
  /* ─── DEDICATED SERVICE PROVIDER STYLES (MATCHING SCREENSHOT) ─── */
  /* ══════════════════════════════════════════════════════════════ */
  serviceModalForm: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  serviceSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4A584F',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  serviceDashedBox: {
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 115,
    overflow: 'hidden',
  },
  serviceMediaBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 16,
  },
  serviceMediaBtn: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEE5DA',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceMediaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#211A19',
  },
  serviceInput: {
    borderWidth: 1.2,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#211A19',
    backgroundColor: '#FAF8F5',
  },
  serviceDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.2,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: '#FAF8F5',
  },
  serviceDropdownTriggerText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#211A19',
  },
  serviceDropdownMenu: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#211A19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  serviceDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E7DFD5',
  },
  serviceDropdownItemActive: {
    backgroundColor: '#EEE5DA',
  },
  serviceDropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#211A19',
  },
  serviceRadioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  serviceRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#C8A878',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#C8A878',
  },
  serviceRadioText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#211A19',
  },
  serviceSpinnerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    height: 46,
    paddingHorizontal: 12,
  },
  serviceSpinnerTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#211A19',
    paddingVertical: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
  },
  serviceSpinnerArrows: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: 20,
  },
  serviceSpinnerBtn: {
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEE5DA',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  serviceLocationPillActive: {
    backgroundColor: '#EEE5DA',
    borderColor: '#C8A878',
    borderWidth: 1.5,
  },
  serviceLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#78716C',
  },
  serviceLocationTextActive: {
    color: '#211A19',
    fontWeight: '800',
  },
  serviceTextArea: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1.2,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 13,
    color: '#211A19',
    textAlignVertical: 'top',
  },
  serviceNoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5EFE1',
    borderWidth: 1,
    borderColor: '#E7DFD5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginTop: 14,
  },
  serviceNoteText: {
    flex: 1,
    fontSize: 11.5,
    color: '#78350F',
    fontWeight: '600',
    lineHeight: 16,
  },
});
