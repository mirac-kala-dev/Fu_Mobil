import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function NewsCard({ title, date, imageUrl, onPress }) {
  const hasImage = typeof imageUrl === 'string' && imageUrl.length > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.75 }]}
    >
      <View style={styles.row}>
        {hasImage ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.iconWrap}>
            <MaterialIcons name="article" size={22} color="#8A1538" />
          </View>
        )}
        <View style={styles.textCol}>
          <Text style={styles.newsTitle} numberOfLines={3}>
            {title}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color="rgba(138,21,56,0.5)" style={styles.chevron} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: 'rgba(138, 21, 56, 0.08)',
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(138, 21, 56, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  newsTitle: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  date: {
    color: '#333333',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.75,
  },
  chevron: {
    alignSelf: 'center',
    marginLeft: 4,
  },
});
