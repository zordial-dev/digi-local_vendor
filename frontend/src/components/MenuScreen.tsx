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
  Sparkles
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/theme';
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
  'Dairy & Milk',
  'Bakery & Cakes',
  'Fruits & Vegetables',
  'Beverages & Drinks',
  'Snacks & Munchies',
  'Personal Care',
  'Household Supplies',
  'Pharmacy & Health',
  'Pooja Essentials',
  '+ Custom Category'
];

const PRESET_UNITS = [
  'Kg',
  'Litre',
  'Dozen',
  'Gm',
  'Piece',
  'Ml',
  '+ Custom Unit'
];

const normalizeCategory = (cat?: string): string => {
  if (!cat || !cat.trim()) return 'Grocery';
  const trimmed = cat.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes('dairy') || lower.includes('milk')) return 'Dairy & Milk';
  if (lower.includes('bakery') || lower.includes('cake') || lower.includes('bread')) return 'Bakery & Cakes';
  if (lower.includes('fruit') || lower.includes('veg') || lower.includes('mango') || lower.includes('apple')) return 'Fruits & Vegetables';
  if (lower.includes('bev') || lower.includes('drink') || lower.includes('juice') || lower.includes('soda')) return 'Beverages & Drinks';
  if (lower.includes('snack') || lower.includes('namkeen') || lower.includes('chip') || lower.includes('munch')) return 'Snacks & Munchies';
  if (lower.includes('personal') || lower.includes('soap') || lower.includes('shampoo')) return 'Personal Care';
  if (lower.includes('house') || lower.includes('clean')) return 'Household Supplies';
  if (lower.includes('pharm') || lower.includes('health') || lower.includes('med')) return 'Pharmacy & Health';
  if (lower.includes('pooja') || lower.includes('puja')) return 'Pooja Essentials';

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

export const MenuScreenComponent: React.FC<MenuScreenProps> = ({
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

  // Unique normalized categories list with counts
  const itemNormCategories = items.map(i => normalizeCategory(i.category));
  const filterCategories = [
    'ALL',
    ...Array.from(new Set([...PRESET_CATEGORIES.filter(c => c !== '+ Custom Category'), ...itemNormCategories]))
  ];

  const getCategoryCount = (catName: string) => {
    if (catName === 'ALL') return items.length;
    return items.filter(i => normalizeCategory(i.category) === catName).length;
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
    const nextState = !Boolean(item.is_available);
    setTogglingId(item.item_id);
    try {
      await toggleItemAvailabilityApi(vendorId, item.item_id, nextState);
      await onRefresh();
    } catch (err: any) {
      showAlert('Update Failed', err.message || 'Failed to update item availability', 'error');
    } finally {
      setTogglingId(null);
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

  const filteredItems = items.filter(i => {
    const normItemCat = normalizeCategory(i.category);
    const normSelCat = normalizeCategory(selectedCategory);
    const matchesCat = selectedCategory === 'ALL' || normItemCat === normSelCat;
    const matchesSearch = searchQuery.trim() === '' ||
      i.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.category && i.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      normItemCat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F8F5EE' }]}>

      {/* Zomato Tier Top Search & Add Product Row */}
      <View style={styles.topSection}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, alignItems: 'center' }}>
          <View style={styles.searchBox}>
            <Search size={18} color="#6B7C70" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search in store menu..."
              placeholderTextColor="#6B7C70"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#6B7C70" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Category Pills Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {filterCategories.map(cat => {
            const isSelected = selectedCategory === cat;
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
                <Text style={[
                  styles.filterPillText,
                  { color: isSelected ? '#FFFFFF' : '#18281F' }
                ]}>
                  {cat.split(' ')[0]}
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
            <Package size={48} color="#6B7C70" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Items Found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Item" in the navigation bar to list items in your store menu.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const avail = Boolean(item.is_available);
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

                {/* Info Column (Category Badge, Name, Price & Unit) */}
                <View style={styles.itemInfo}>
                  <View style={styles.nameRow}>
                    {/* Veg / Non-Veg Emblem */}
                    {nonVeg ? (
                      <View style={styles.nonVegEmblem}>
                        <View style={styles.nonVegDot} />
                      </View>
                    ) : (
                      <View style={styles.vegEmblem}>
                        <View style={styles.vegDot} />
                      </View>
                    )}
                    <Text style={styles.catBadgeText}>{normalizeCategory(item.category).split(' ')[0].toUpperCase()}</Text>
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{parseFloat(String(item.price)).toFixed(2)}</Text>
                    {item.unit ? <Text style={styles.unitText}>/ {item.unit}</Text> : null}
                  </View>
                </View>

                {/* Actions (Edit / Delete) - Stacked Vertically on Right */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <Edit size={13} color="#18281F" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                    onPress={() => handleDeleteItem(item.item_id)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={13} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Stock Availability Row */}
              <View style={styles.cardFooter}>
                <View style={styles.statusPillRow}>
                  <View style={[styles.statusDot, { backgroundColor: avail ? '#10B981' : '#EF4444' }]} />
                  <Text style={styles.availText}>
                    {avail ? 'In Stock (Live in Store)' : 'Out of Stock (Hidden)'}
                  </Text>
                </View>
                {isToggling ? (
                  <ActivityIndicator size="small" color="#18281F" />
                ) : (
                  <Switch
                    value={avail}
                    onValueChange={() => handleToggleAvailability(item)}
                    trackColor={{ false: '#E4DCC9', true: '#18281F' }}
                    thumbColor={avail ? '#C4A066' : '#ffffff'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginRight: -6, marginTop: -4, marginBottom: -4 }}
                  />
                )}
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
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
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
                    <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
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
                <Switch
                  value={isAvailable}
                  onValueChange={setIsAvailable}
                  trackColor={{ false: '#E4DCC9', true: '#18281F' }}
                  thumbColor={isAvailable ? '#C4A066' : '#ffffff'}
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

      {/* Custom Alert Modal */}
      <CustomAlertModal
        alertState={alertState}
        onClose={() => setAlertState(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

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
    backgroundColor: '#C4A066',
    shadowColor: '#C4A066',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#18281F',
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
    borderRadius: 16,
    marginRight: 4,
  },
  filterPillSelected: {
    backgroundColor: '#34533C',
  },
  filterPillUnselected: {
    backgroundColor: '#FAF8F3',
    borderWidth: 1,
    borderColor: '#E4DCC9',
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
    color: '#18281F',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6B7C70',
    marginTop: 4,
    textAlign: 'center',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    paddingTop: 6,
    paddingBottom: 2,
    paddingHorizontal: 10,
    marginBottom: 8,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 46,
    height: 46,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 10,
    backgroundColor: '#EFE8D8',
  },
  itemThumb: {
    width: 46,
    height: 46,
    borderRadius: 6,
  },
  videoBadgeTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(24, 40, 31, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  videoBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  itemInfo: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    color: '#6B7C70',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#18281F', // Dark Forest Green
    lineHeight: 17,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#C4A066', // Warm Tan Gold
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7C70', // Muted Sage Text
  },
  actionCol: {
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
    marginLeft: 'auto',
  },
  iconBtn: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#FAF8F3',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E4DCC9',
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#18281F',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(24, 40, 31, 0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#F0EBE1',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#18281F',
  },
  modalForm: {
    gap: 8,
    paddingBottom: 20,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7C70',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 4,
  },
  urlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A0AFA5',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#EAE3D4',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 13,
    fontWeight: '500',
    color: '#18281F',
    backgroundColor: '#FAF8F3',
  },
  rowTwo: {
    flexDirection: 'row',
  },
  inputWrapperBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F3',
    borderWidth: 1.5,
    borderColor: '#EAE3D4',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
  },
  mediaPickerCard: {
    backgroundColor: '#FAF8F3',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 4,
  },
  mediaPreviewBox: {
    height: 150,
    borderRadius: 14,
    backgroundColor: '#FAF8F3',
    borderWidth: 1.5,
    borderColor: '#DDD3BB',
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
    backgroundColor: 'rgba(24, 40, 31, 0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  videoOverlayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  placeholderBox: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#6B7C70',
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
    backgroundColor: '#EAE3D4',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#18281F',
  },
  categoryDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EAE3D4',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor: '#FAF8F3',
  },
  categoryDropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#18281F',
  },
  categoryDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    borderRadius: 14,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#18281F',
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
    borderBottomColor: '#F5F0E8',
  },
  categoryDropdownItemActive: {
    backgroundColor: '#F5F0E8',
  },
  categoryDropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18281F',
  },
  saveBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtnText: {
    color: '#F8F5EE',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  spinnerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EAE3D4',
    borderRadius: 12,
    backgroundColor: '#FAF8F3',
    height: 46,
    paddingHorizontal: 14,
  },
  spinnerTextInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#18281F',
    paddingVertical: 0,
  },
  spinnerButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 28,
    width: 22,
    borderWidth: 1.2,
    borderColor: '#E4DCC9',
    borderRadius: 6,
    backgroundColor: '#FAF8F3',
  },
  spinnerArrow: {
    paddingVertical: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
