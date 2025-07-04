import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const [logoAnim] = useState(new Animated.Value(0));
  const [textAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animasyon sırası
    const sequence = Animated.sequence([
      // Logo belirir
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Metin belirir
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      // Progress bar
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]);

    sequence.start(() => {
      // Animasyon bitince ana uygulamaya geç
      setTimeout(() => {
        onFinish();
      }, 500);
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Gradient Effect */}
      <View style={styles.gradientOverlay} />
      
      {/* Logo */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: logoAnim,
            transform: [{
              scale: logoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            }],
          }
        ]}
      >
        <Text style={styles.logoEmoji}>🎯</Text>
        <Text style={styles.logoText}>Başarı Takip</Text>
      </Animated.View>

      {/* Alt Metin */}
      <Animated.View 
        style={[
          styles.subtitleContainer,
          {
            opacity: textAnim,
            transform: [{
              translateY: textAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        <Text style={styles.subtitle}>LGS Hazırlık Asistanın</Text>
        <Text style={styles.version}>v1.0</Text>
      </Animated.View>

      {/* Progress Bar */}
      <Animated.View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              }
            ]}
          />
        </View>
        <Animated.Text 
          style={[
            styles.loadingText,
            { opacity: textAnim }
          ]}
        >
          Yükleniyor...
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3c72',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    // Gradient effect with overlays
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitleContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  subtitle: {
    fontSize: 18,
    color: '#e3f2fd',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  version: {
    fontSize: 14,
    color: '#bbdefb',
    fontWeight: '300',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 100,
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  loadingText: {
    color: '#e3f2fd',
    fontSize: 16,
    fontWeight: '500',
  },
});