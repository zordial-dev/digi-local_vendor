import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { Colors } from '../constants/theme';

const { width } = Dimensions.get('window');
const DIAL_SIZE = Math.min(width * 0.75, 280);
const CENTER = DIAL_SIZE / 2;
const RADIUS = DIAL_SIZE * 0.4;

interface CustomTimePickerProps {
  visible: boolean;
  initialTime: string; // "hh:mm AM/PM" format
  onClose: () => void;
  onSave: (time: string) => void;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  visible,
  initialTime,
  onClose,
  onSave,
}) => {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>('AM');

  // Parse initial time on mount or visibility change
  useEffect(() => {
    if (visible && initialTime) {
      try {
        const timePart = initialTime.split(' ')[0];
        const ampmPart = initialTime.split(' ')[1] as 'AM' | 'PM';
        const [h, m] = timePart.split(':').map(Number);
        
        setSelectedHour(h || 12);
        setSelectedMinute(m || 0);
        setSelectedAmPm(ampmPart || 'AM');
        setMode('hours');
      } catch (err) {
        console.warn('Error parsing time:', err);
      }
    }
  }, [visible, initialTime]);

  const dialCenter = useRef({ x: 0, y: 0 });

  const handleTouch = (event: GestureResponderEvent, isGrant: boolean) => {
    const { pageX, pageY, locationX, locationY } = event.nativeEvent;
    
    if (isGrant) {
      // Calculate dial center screen coordinates
      dialCenter.current = {
        x: pageX - locationX + CENTER,
        y: pageY - locationY + CENTER,
      };
    }
    
    const dx = pageX - dialCenter.current.x;
    const dy = pageY - dialCenter.current.y;
    
    // Calculate angle in degrees (0 to 360, starting from top 12 o'clock)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;

    if (mode === 'hours') {
      // 12 hours = 30 degrees each
      let hour = Math.round(angle / 30);
      if (hour === 0) hour = 12;
      setSelectedHour(hour);
    } else {
      // 60 minutes = 6 degrees each
      let minute = Math.round(angle / 6);
      if (minute === 60) minute = 0;
      setSelectedMinute(minute);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => handleTouch(e, true),
    onPanResponderMove: (e) => handleTouch(e, false),
  });

  const handleSave = () => {
    const formattedHour = selectedHour.toString().padStart(2, '0');
    const formattedMinute = selectedMinute.toString().padStart(2, '0');
    const finalTime = `${formattedHour}:${formattedMinute} ${selectedAmPm}`;
    onSave(finalTime);
    onClose();
  };

  // Get coordinates for the selection indicator line and dot
  const getIndicatorCoords = () => {
    const value = mode === 'hours' 
      ? (selectedHour === 12 ? 0 : selectedHour) 
      : selectedMinute;
    const divisions = mode === 'hours' ? 12 : 60;
    const angle = ((value * (360 / divisions) - 90) * Math.PI) / 180;
    
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  };

  const indicator = getIndicatorCoords();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header / Digital Display */}
          <Text style={styles.title}>Select Time</Text>
          <View style={styles.digitalDisplay}>
            <TouchableOpacity onPress={() => setMode('hours')}>
              <Text style={[styles.timeText, mode === 'hours' && styles.timeTextActive]}>
                {selectedHour.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            <Text style={styles.colon}>:</Text>
            <TouchableOpacity onPress={() => setMode('minutes')}>
              <Text style={[styles.timeText, mode === 'minutes' && styles.timeTextActive]}>
                {selectedMinute.toString().padStart(2, '0')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.ampmContainer}>
              <TouchableOpacity
                style={[styles.ampmBtn, selectedAmPm === 'AM' && styles.ampmBtnActive]}
                onPress={() => setSelectedAmPm('AM')}
              >
                <Text style={[styles.ampmText, selectedAmPm === 'AM' && styles.ampmTextActive]}>AM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ampmBtn, selectedAmPm === 'PM' && styles.ampmBtnActive]}
                onPress={() => setSelectedAmPm('PM')}
              >
                <Text style={[styles.ampmText, selectedAmPm === 'PM' && styles.ampmTextActive]}>PM</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Clock Dial face */}
          <View style={styles.clockContainer}>
            <View
              style={styles.dial}
              {...panResponder.panHandlers}
            >
               {/* Hand Selector Line */}
              <View pointerEvents="none" style={[styles.handLine, {
                left: CENTER - RADIUS / 2,
                top: CENTER - 1,
                transform: [
                  { rotate: `${mode === 'hours' ? (selectedHour === 12 ? 0 : selectedHour) * 30 - 90 : selectedMinute * 6 - 90}deg` },
                  { translateX: RADIUS / 2 }
                ]
              }]} />

              {/* Hand Center Pivot */}
              <View pointerEvents="none" style={styles.pivot} />

              {/* Hand End Circle Selection */}
              <View pointerEvents="none" style={[styles.selectionCircle, { left: indicator.x - 14, top: indicator.y - 14 }]} />

              {/* Clock Face Numbers */}
              {mode === 'hours' ? (
                [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h, i) => {
                  const angle = ((i * 30 - 90) * Math.PI) / 180;
                  const x = CENTER + RADIUS * Math.cos(angle);
                  const y = CENTER + RADIUS * Math.sin(angle);
                  const isSelected = selectedHour === h;
                  return (
                    <Text
                      pointerEvents="none"
                      key={h}
                      style={[
                        styles.clockNumber,
                        { left: x - 12, top: y - 12 },
                        isSelected && styles.clockNumberSelected,
                      ]}
                    >
                      {h}
                    </Text>
                  );
                })
              ) : (
                [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m, i) => {
                  const angle = ((i * 30 - 90) * Math.PI) / 180;
                  const x = CENTER + RADIUS * Math.cos(angle);
                  const y = CENTER + RADIUS * Math.sin(angle);
                  const isSelected = selectedMinute === m;
                  return (
                    <Text
                      pointerEvents="none"
                      key={m}
                      style={[
                        styles.clockNumber,
                        { left: x - 12, top: y - 12 },
                        isSelected && styles.clockNumberSelected,
                      ]}
                    >
                      {m.toString().padStart(2, '0')}
                    </Text>
                  );
                })
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.saveBtn]} onPress={handleSave}>
              <Text style={styles.saveBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(40, 13, 18, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#FAF8F5',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E7DFD5',
    shadowColor: '#541D26',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  digitalDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: '#541D26',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8A878',
  },
  timeText: {
    fontSize: 36,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  timeTextActive: {
    color: '#FFFFFF',
  },
  colon: {
    fontSize: 32,
    fontWeight: '700',
    color: '#C8A878',
    marginHorizontal: 8,
  },
  ampmContainer: {
    marginLeft: 16,
    gap: 4,
  },
  ampmBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(200, 168, 120, 0.4)',
  },
  ampmBtnActive: {
    backgroundColor: '#C8A878',
    borderColor: '#C8A878',
  },
  ampmText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FAF8F5',
    opacity: 0.7,
  },
  ampmTextActive: {
    color: '#211A19',
    opacity: 1,
  },
  clockContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    backgroundColor: '#F8F6F0',
    borderRadius: DIAL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  dial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    position: 'relative',
  },
  pivot: {
    position: 'absolute',
    left: CENTER - 6,
    top: CENTER - 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#541D26',
  },
  handLine: {
    position: 'absolute',
    width: RADIUS,
    height: 2,
    backgroundColor: '#541D26',
  },
  selectionCircle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#541D26',
    opacity: 1,
  },
  clockNumber: {
    position: 'absolute',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '700',
    color: '#78716C',
  },
  clockNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEE5DA',
    borderWidth: 1,
    borderColor: '#E7DFD5',
  },
  saveBtn: {
    backgroundColor: '#541D26',
    borderColor: '#541D26',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#211A19',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
