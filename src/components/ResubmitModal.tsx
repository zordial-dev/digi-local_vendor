import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from 'react-native';
import { X, Upload, Send, CheckCircle2 } from 'lucide-react-native';
import { VendorUser } from '../services/api/types';
import { resubmitVendorApplicationApi } from '../services/api/authApi';
import { DigiLocalColors } from '../constants/theme';
import * as ImagePicker from 'expo-image-picker';


interface ResubmitModalProps {
  visible: boolean;
  onClose: () => void;
  vendor: VendorUser | null;
  onSuccess: () => void;
  showAlert: (title: string, msg: string, type: any) => void;
}

export const ResubmitModal: React.FC<ResubmitModalProps> = ({ visible, onClose, vendor, onSuccess, showAlert }) => {
  const [storeName, setStoreName] = useState('');
  const [shopNumber, setShopNumber] = useState('');
  const [address, setAddress] = useState('');
  const [taxIdType, setTaxIdType] = useState<'GSTIN' | 'PAN'>('GSTIN');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [message, setMessage] = useState('');
  const [shopImage, setShopImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && vendor) {
      setStoreName(vendor.store_name || '');
      setShopNumber(vendor.shop_number || vendor.shop_no || '');
      setAddress(vendor.address || '');
      const vendorGst = (vendor.gstin || vendor.gst_number || '').trim().toUpperCase();
      const vendorPan = (vendor.pan_number || '').trim().toUpperCase();
      if (vendorPan && vendorGst.length !== 15) {
        setTaxIdType('PAN');
        setPan(vendorPan);
      } else {
        setTaxIdType('GSTIN');
        setGstin(vendorGst);
      }
      setMessage('');
      setShopImage(vendor.shop_image || vendor.logo_url || '');
    }
  }, [visible, vendor]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setShopImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      }
    } catch (error) {
      showAlert('Error', 'Failed to pick image', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!vendor) return;
    
    if (taxIdType === 'GSTIN' && gstin.trim() && gstin.trim().length !== 15) {
      showAlert('Invalid GSTIN', 'GSTIN must be exactly 15 characters.', 'warning');
      return;
    }
    if (taxIdType === 'PAN' && pan.trim() && pan.trim().length !== 10) {
      showAlert('Invalid PAN', 'PAN must be exactly 10 characters.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanGstin = taxIdType === 'GSTIN' ? gstin.trim().toUpperCase() : "";
      const cleanPan = taxIdType === 'PAN' ? pan.trim().toUpperCase() : (taxIdType === 'GSTIN' && gstin.trim().length === 15 ? gstin.trim().substring(2, 12).toUpperCase() : "");

      const result = await resubmitVendorApplicationApi({
        vendor_id: vendor.vendor_id,
        store_name: storeName.trim() || undefined,
        shop_number: shopNumber.trim() || undefined,
        address: address.trim() || undefined,
        gstin: cleanGstin,
        pan_number: cleanPan,
        message: message.trim() || undefined,
        shop_image: shopImage || undefined,
      });

      if (result.success) {
        showAlert('Success', result.message || 'Application resubmitted successfully', 'success');
        onSuccess();
        onClose();
      } else {
        showAlert('Error', result.message || 'Failed to resubmit application', 'error');
      }
    } catch (err: any) {
      showAlert('Error', err.message || 'An error occurred during resubmission', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Resubmit Application</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={DigiLocalColors.textDark} size={20} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.description}>Update your details and resubmit for admin review.</Text>
            
            <Text style={styles.label}>Store Name</Text>
            <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="Enter Store Name" />

            <Text style={styles.label}>Shop Number</Text>
            <TextInput style={styles.input} value={shopNumber} onChangeText={setShopNumber} placeholder="Enter Shop Number" />

            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Enter Full Address" multiline />

            <Text style={styles.label}>Tax Identifier</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setTaxIdType('GSTIN')}>
                <View style={[styles.radioCircle, taxIdType === 'GSTIN' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>GSTIN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setTaxIdType('PAN')}>
                <View style={[styles.radioCircle, taxIdType === 'PAN' && styles.radioCircleActive]} />
                <Text style={styles.radioText}>PAN</Text>
              </TouchableOpacity>
            </View>

            {taxIdType === 'GSTIN' ? (
              <TextInput style={styles.input} value={gstin} onChangeText={setGstin} placeholder="Enter 15-digit GSTIN" autoCapitalize="characters" maxLength={15} />
            ) : (
              <TextInput style={styles.input} value={pan} onChangeText={setPan} placeholder="Enter 10-digit PAN" autoCapitalize="characters" maxLength={10} />
            )}

            <Text style={styles.label}>Message to Admin (Optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={message} onChangeText={setMessage} placeholder="Explain what you have updated" multiline />

            <Text style={styles.label}>Shop Image</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={handlePickImage}>
              <Upload size={16} color={DigiLocalColors.primary} />
              <Text style={styles.uploadBtnText}>{shopImage ? 'Done (Tap to change image)' : 'Upload Shop Image'}</Text>
            </TouchableOpacity>
            {shopImage ? (
              <View style={{ marginTop: 10, alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <Image source={{ uri: shopImage }} style={{ width: 120, height: 90, borderRadius: 8, marginBottom: 6 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={14} color="#166534" />
                  <Text style={{ color: '#166534', fontSize: 13, fontWeight: '700' }}>Done</Text>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={16} color="#fff" />
                  <Text style={styles.submitBtnText}>Resubmit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: DigiLocalColors.border },
  title: { fontSize: 18, fontWeight: '700', color: DigiLocalColors.textDark },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  description: { fontSize: 14, color: DigiLocalColors.textMuted, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: DigiLocalColors.textDark, marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: DigiLocalColors.border, borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: DigiLocalColors.surfaceIvory, textAlign: 'left', textAlignVertical: 'center' },
  textArea: { height: 80, textAlignVertical: 'top' },
  radioGroup: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: DigiLocalColors.border },
  radioCircleActive: { borderColor: DigiLocalColors.primary, backgroundColor: DigiLocalColors.primary },
  radioText: { fontSize: 14, color: DigiLocalColors.textDark },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: DigiLocalColors.primary, backgroundColor: DigiLocalColors.primaryLight, justifyContent: 'center' },
  uploadBtnText: { color: DigiLocalColors.primary, fontSize: 14, fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: DigiLocalColors.border },
  submitBtn: { backgroundColor: DigiLocalColors.primary, padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
