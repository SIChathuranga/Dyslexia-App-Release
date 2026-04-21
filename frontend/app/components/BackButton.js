import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

const BackButton = ({ onPress, style, iconColor = '#1F2937', size = 22 }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.button, style]}
    accessibilityRole="button"
    accessibilityLabel="Back"
  >
    <ArrowLeft size={size} color={iconColor} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackButton;
