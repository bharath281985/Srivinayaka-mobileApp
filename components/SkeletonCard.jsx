import React from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../app/theme';

// Simple shimmer skeleton — uses opacity animation
const useShimmer = () => {
  const anim = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
};

export const SkeletonBox = ({ width, height, style }) => {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        { width, height, backgroundColor: colors.skeleton, borderRadius: radius.md },
        { opacity },
        style,
      ]}
    />
  );
};

const SkeletonCard = () => (
  <View style={styles.card}>
    <SkeletonBox width="100%" height={200} style={{ borderRadius: radius.md }} />
    <SkeletonBox width="80%" height={12} style={{ marginTop: 10 }} />
    <SkeletonBox width="50%" height={12} style={{ marginTop: 6 }} />
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginRight: 12,
    padding: 10,
  },
});

export default SkeletonCard;
