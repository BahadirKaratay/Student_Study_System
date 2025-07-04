import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

// Basit Loading Spinner
export function LoadingSpinner({ size = 30, color = '#2196F3' }) {
  const [spinValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, []);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View 
      style={[
        styles.spinner, 
        { 
          width: size, 
          height: size, 
          borderColor: `${color}30`,
          borderTopColor: color,
          transform: [{ rotate }] 
        }
      ]} 
    />
  );
}

// Pulse Loading (Kalp atışı gibi)
export function PulseLoading({ color = '#2196F3', text = 'Yükleniyor...' }) {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  }, []);

  return (
    <View style={styles.pulseContainer}>
      <Animated.View 
        style={[
          styles.pulseCircle,
          { 
            backgroundColor: color,
            transform: [{ scale: pulseAnim }] 
          }
        ]}
      />
      <Text style={[styles.pulseText, { color }]}>{text}</Text>
    </View>
  );
}

// Dots Loading (3 nokta)
export function DotsLoading({ color = '#2196F3' }) {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => animateDots());
    };
    animateDots();
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View 
        style={[
          styles.dot, 
          { 
            backgroundColor: color,
            opacity: dot1,
            transform: [{ scale: dot1 }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.dot, 
          { 
            backgroundColor: color,
            opacity: dot2,
            transform: [{ scale: dot2 }]
          }
        ]} 
      />
      <Animated.View 
        style={[
          styles.dot, 
          { 
            backgroundColor: color,
            opacity: dot3,
            transform: [{ scale: dot3 }]
          }
        ]} 
      />
    </View>
  );
}

// Skeleton Loading (Çok modern!)
export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 4 }) {
  const [shimmerAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    const shimmer = () => {
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnim.setValue(0);
        shimmer();
      });
    };
    shimmer();
  }, []);

  return (
    <View 
      style={[
        styles.skeleton, 
        { width, height, borderRadius }
      ]}
    >
      <Animated.View 
        style={[
          styles.shimmer,
          {
            transform: [{
              translateX: shimmerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 200],
              }),
            }],
          }
        ]}
      />
    </View>
  );
}

// Animasyonlu Buton
export function AnimatedButton({ onPress, children, style, disabled = false }) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: scaleAnim }] },
        style
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.animatedButton,
          disabled && styles.disabledButton
        ]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Loading Spinner
  spinner: {
    borderWidth: 3,
    borderRadius: 50,
    borderTopWidth: 3,
  },

  // Pulse Loading
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  pulseCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  pulseText: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Dots Loading
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Skeleton
  skeleton: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    marginVertical: 4,
  },
  shimmer: {
    width: 50,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    position: 'absolute',
  },

  // Animated Button
  animatedButton: {
    // Button stilleri burada olacak
  },
  disabledButton: {
    opacity: 0.6,
  },
});