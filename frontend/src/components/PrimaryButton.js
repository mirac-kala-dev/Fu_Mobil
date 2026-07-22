import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function PrimaryButton({ title, subtitle, onPress, large = false, icon }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        large && styles.buttonLarge,
        pressed && { opacity: 0.88 },
      ]}
    >
      <View style={styles.buttonInner}>
        {icon ? <View style={styles.iconSlot}>{icon}</View> : null}
        <View style={styles.textCol}>
          <Text style={[styles.buttonText, large && styles.buttonTextLarge]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#8A1538',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  buttonLarge: {
    paddingVertical: 18,
    minHeight: 64,
    borderRadius: 14,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingHorizontal: 6,
  },
  iconSlot: {
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonTextLarge: {
    fontSize: 17,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 16,
  },
});
