import React, { useState } from 'react';
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
  Image
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
  isDarkMode = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
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
  const [unit, setUnit] = useState('piece');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  const resetForm = () => {
    setItemName('');
    setDescription('');
    setPrice('');
    setCategory('Grocery');
    setCustomCategoryInput('');
    setShowCategoryDropdown(false);
    setUnit('piece');
    setImageUrl('');
    setIsAvailable(true);
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

    const itemCat = normalizeCategory(item.category);
    if (PRESET_CATEGORIES.includes(itemCat)) {
      setCategory(itemCat);
      setCustomCategoryInput('');
    } else {
      setCategory('+ Custom Category');
      setCustomCategoryInput(item.category || 'General');
    }

    setUnit(item.unit || 'piece');
    setImageUrl(item.image_url || '');
    setIsAvailable(Boolean(item.is_available));
    setIsModalOpen(true);
  };

  // Upload image or video from device gallery
  const handlePickMedia = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Please grant photo/video gallery access to upload product media.', 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
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
              asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
              asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')
            );
            setImageUrl(uploaded.url);
            showAlert('Media Uploaded', `Product ${asset.type === 'video' ? 'video' : 'photo'} saved permanently to server!`, 'success');
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

  // Capture photo or video directly using phone camera
  const handleTakeMedia = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Please grant camera access to capture product photo/video.', 'warning');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
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
              asset.fileName || `media_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
              asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg')
            );
            setImageUrl(uploaded.url);
            showAlert('Captured & Uploaded', `Product ${asset.type === 'video' ? 'video' : 'photo'} saved permanently to server!`, 'success');
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

  const handleSaveItem = async () => {
    if (!itemName.trim() || !price.trim()) {
      showAlert('Required Fields Missing', 'Please enter both item name and price.', 'warning');
      return;
    }

    const finalCategory = category === '+ Custom Category'
      ? (customCategoryInput.trim() || 'General')
      : category;

    setSubmitting(true);
    try {
      const payload = {
        item_name: itemName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        category: finalCategory,
        unit: unit.trim(),
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

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleOpenAddModal}
            activeOpacity={0.88}
          >
            <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.addBtnText}>Add Product</Text>
          </TouchableOpacity>
        </View>

        {/* Zomato Tier Category Pills Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {filterCategories.map(cat => {
            const isSelected = selectedCategory === cat;
            const count = getCategoryCount(cat);
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
                  { color: isSelected ? '#ffffff' : '#18281F' }
                ]}>
                  {cat}
                </Text>
                <View style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? '#FFFFFF' : '#EFE8D8' }
                ]}>
                  <Text style={[
                    styles.countText,
                    { color: isSelected ? '#18281F' : '#6B7C70' }
                  ]}>
                    {count}
                  </Text>
                </View>
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
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              Tap "Add Product" above to list items in your store menu.
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

                {/* Zomato Media Thumbnail Box */}
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

                <View style={styles.itemInfo}>
                  <View style={styles.nameRow}>
                    {/* Zomato Veg / Non-Veg Emblem */}
                    {nonVeg ? (
                      <View style={styles.nonVegEmblem}>
                        <View style={styles.nonVegDot} />
                      </View>
                    ) : (
                      <View style={styles.vegEmblem}>
                        <View style={styles.vegDot} />
                      </View>
                    )}

                    <Text style={styles.catBadgeText}>{normalizeCategory(item.category)}</Text>
                  </View>

                  <Text style={styles.itemName} numberOfLines={2}>{item.item_name}</Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceText}>₹{parseFloat(String(item.price)).toFixed(2)}</Text>
                    {item.unit ? <Text style={styles.unitText}>/ {item.unit}</Text> : null}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionCol}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleOpenEditModal(item)}
                    activeOpacity={0.8}
                  >
                    <Edit size={16} color="#18281F" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: '#FEE2E2' }]}
                    onPress={() => handleDeleteItem(item.item_id)}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={16} color="#B91C1C" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Bottom Stock Availability Row */}
              <View style={styles.cardFooter}>
                <View style={styles.statusPillRow}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: avail ? '#10B981' : '#EF4444' }
                  ]} />
                  <Text style={[
                    styles.availText,
                    { color: avail ? '#1E3A29' : '#B91C1C' }
                  ]}>
                    {avail ? 'In Stock (Live in Store)' : 'Out of Stock (Hidden)'}
                  </Text>
                </View>

                {isToggling ? (
                  <ActivityIndicator size="small" color="#C4A066" />
                ) : (
                  <Switch
                    value={avail}
                    onValueChange={() => handleToggleAvailability(item)}
                    trackColor={{ false: '#E4DCC9', true: '#18281F' }}
                    thumbColor={avail ? '#C4A066' : '#ffffff'}
                  />
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Add / Edit Product Item Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#C4A066" />
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Product Item' : 'Add New Product'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <X size={20} color="#6B7C70" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>

              {/* Media Picker Section */}
              <Text style={styles.label}>Product Photo / Video Upload</Text>

              <View style={styles.mediaPickerCard}>
                <View style={styles.mediaPreviewBox}>
                  {uploadingMedia ? (
                    <View style={{ alignItems: 'center' }}>
                      <ActivityIndicator size="large" color="#18281F" />
                      <Text style={{ fontSize: 11, color: '#18281F', fontWeight: '700', marginTop: 6 }}>
                        Uploading to Server...
                      </Text>
                    </View>
                  ) : imageUrl ? (
                    <>
                      <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
                      {isVideoUrl(imageUrl) ? (
                        <View style={styles.videoOverlayBadge}>
                          <VideoIcon size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.videoOverlayText}>Video Selected</Text>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    <View style={styles.placeholderBox}>
                      <ImageIcon size={28} color="#6B7C70" style={{ marginBottom: 4 }} />
                      <Text style={styles.placeholderText}>No photo/video attached</Text>
                    </View>
                  )}
                </View>

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

                <Text style={[styles.label, { marginTop: 10, fontSize: 10 }]}>OR PASTE DIRECT MEDIA URL</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="https://... (image or video URL)"
                  placeholderTextColor="#6B7C70"
                  value={imageUrl}
                  onChangeText={setImageUrl}
                />
              </View>

              <Text style={styles.label}>Product Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Amul Gold Fresh Milk 1L"
                placeholderTextColor="#6B7C70"
                value={itemName}
                onChangeText={setItemName}
              />

              {/* Category Dropdown Picker */}
              <Text style={styles.label}>Category Selection *</Text>
              <View style={{ position: 'relative', zIndex: 10 }}>
                <TouchableOpacity
                  style={styles.categoryDropdownTrigger}
                  onPress={() => setShowCategoryDropdown(s => !s)}
                  activeOpacity={0.85}
                >
                  <Tag size={16} color="#18281F" style={{ marginRight: 8 }} />
                  <Text style={styles.categoryDropdownTriggerText}>
                    {category}
                  </Text>
                  {showCategoryDropdown ? (
                    <ChevronUp size={18} color="#18281F" />
                  ) : (
                    <ChevronDown size={18} color="#18281F" />
                  )}
                </TouchableOpacity>

                {showCategoryDropdown ? (
                  <View style={styles.categoryDropdownList}>
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
                ) : null}
              </View>

              {category === '+ Custom Category' ? (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.label, { fontSize: 10 }]}>TYPE CUSTOM CATEGORY NAME *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Organic Spices"
                    placeholderTextColor="#6B7C70"
                    value={customCategoryInput}
                    onChangeText={setCustomCategoryInput}
                  />
                </View>
              ) : null}

              <View style={styles.rowTwo}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Price (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="64.00"
                    placeholderTextColor="#6B7C70"
                    keyboardType="numeric"
                    value={price}
                    onChangeText={setPrice}
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="liter / kg / piece"
                    placeholderTextColor="#6B7C70"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>

              <View style={styles.inputWrapperBox}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.label, { marginTop: 0 }]}>Item Availability</Text>
                  <Text style={{ fontSize: 11, color: '#6B7C70', marginTop: 2 }}>
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

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 70 }]}
                placeholder="Item specifications or details..."
                placeholderTextColor="#6B7C70"
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
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>SAVE PRODUCT ITEM</Text>}
              </TouchableOpacity>
            </ScrollView>

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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#C4A066',
    shadowColor: '#C4A066',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#18281F',
  },
  filterBar: {
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  filterPillSelected: {
    backgroundColor: '#18281F',
    borderWidth: 1,
    borderColor: '#18281F',
  },
  filterPillUnselected: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
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
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrapper: {
    width: 74,
    height: 74,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
    backgroundColor: '#EFE8D8',
  },
  itemThumb: {
    width: 74,
    height: 74,
    borderRadius: 14,
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
    paddingRight: 8,
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
    fontSize: 14,
    fontWeight: '800',
    color: '#18281F',
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#C4A066',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7C70',
  },
  actionCol: {
    flexDirection: 'column',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFE8D8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FAF8F3',
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availText: {
    fontSize: 11,
    fontWeight: '700',
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
    padding: 20,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#E4DCC9',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#18281F',
  },
  modalForm: {
    gap: 10,
    paddingBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#18281F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 13,
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
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
    height: 130,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
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
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E4DCC9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#18281F',
  },
  categoryDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#FAF8F3',
  },
  categoryDropdownTriggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#18281F',
  },
  categoryDropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCC9',
    borderRadius: 12,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  categoryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF8F3',
  },
  categoryDropdownItemActive: {
    backgroundColor: '#E8F2EA',
  },
  categoryDropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7C70',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#18281F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    shadowColor: '#18281F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#F8F5EE',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
