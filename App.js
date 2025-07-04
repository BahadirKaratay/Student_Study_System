import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform, StatusBar } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import StudyScreen from './screens/StudyScreen';
import ReportScreen from './screens/ReportScreen';
import WeakTopicsScreen from './screens/WeakTopicsScreen';
import ExamGoalsScreen from './screens/ExamGoalsScreen';
import SettingsScreen from './screens/SettingsScreen';
import SplashScreen from './screens/SplashScreen';

const Tab = createBottomTabNavigator();

// Enhanced Tab Icon Component
const TabIcon = ({ emoji, focused, label }) => {
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    }}>
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: focused ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
      }}>
        <Text style={{ 
          fontSize: focused ? 18 : 16,
          opacity: focused ? 1 : 0.7,
        }}>
          {emoji}
        </Text>
      </View>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '600' : '400',
        color: focused ? '#3b82f6' : '#64748b',
        textAlign: 'center',
      }}>
        {label}
      </Text>
    </View>
  );
};

// Main Tab Navigator with Enhanced Styling
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Anasayfa"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          const config = {
            'Anasayfa': { emoji: '🏠', label: 'Ana Sayfa' },
            'Çalışma': { emoji: '📚', label: 'Çalışma' },
            'Raporlar': { emoji: '📊', label: 'Raporlar' },
            'Zayıf Konular': { emoji: '⚠️', label: 'Zayıf Konular' },
            'Hedefler': { emoji: '🎯', label: 'Hedefler' },
            'Ayarlar': { emoji: '⚙️', label: 'Ayarlar' }
          };
          
          const { emoji, label } = config[route.name] || { emoji: '📱', label: route.name };
          
          return <TabIcon emoji={emoji} focused={focused} label={label} />;
        },
        tabBarLabel: () => null, // Hide default labels since we use custom ones
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 85 : 70,
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 25 : 8,
          paddingHorizontal: 8,
          elevation: 20,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
      })}
    >
      <Tab.Screen 
        name="Anasayfa" 
        component={HomeScreen}
        options={{
          tabBarAccessibilityLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen 
        name="Çalışma" 
        component={StudyScreen}
        options={{
          tabBarAccessibilityLabel: 'Çalışma Takibi',
        }}
      />
      <Tab.Screen 
        name="Raporlar" 
        component={ReportScreen}
        options={{
          tabBarAccessibilityLabel: 'Raporlar ve Analizler',
        }}
      />
      <Tab.Screen 
        name="Zayıf Konular" 
        component={WeakTopicsScreen}
        options={{
          tabBarAccessibilityLabel: 'Zayıf Konular Analizi',
        }}
      />
      <Tab.Screen 
        name="Hedefler" 
        component={ExamGoalsScreen}
        options={{
          tabBarAccessibilityLabel: 'Sınav Hedefleri',
        }}
      />
      <Tab.Screen 
        name="Ayarlar" 
        component={SettingsScreen}
        options={{
          tabBarAccessibilityLabel: 'Uygulama Ayarları',
        }}
      />
    </Tab.Navigator>
  );
}

// App Component with Enhanced Features
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    // Prepare app resources
    const prepareApp = async () => {
      try {
        // Simulate app initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        setAppReady(true);
      } catch (error) {
        console.warn('App initialization error:', error);
        setAppReady(true); // Continue anyway
      }
    };

    prepareApp();
  }, []);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen until app is ready
  if (showSplash || !appReady) {
    return (
      <>
        <StatusBar 
          barStyle="light-content" 
          backgroundColor="#1e3c72" 
          translucent={false}
        />
        <SplashScreen onFinish={handleSplashFinish} />
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8fafc" 
        translucent={false}
      />
      <NavigationContainer>
        <View style={{ flex: 1 }}>
          <MainTabNavigator />
        </View>
      </NavigationContainer>
    </>
  );
}