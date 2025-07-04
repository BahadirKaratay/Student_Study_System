import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
  Share,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner } from './LoadingComponent';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    notifications: true,
    dailyReminder: true,
    reminderTime: '20:00',
    weeklyReport: true,
    soundEnabled: true,
    vibrationEnabled: true,
    motivationMessages: true,
    dataBackup: true
  });
  
  const [loading, setLoading] = useState(true);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempTime, setTempTime] = useState('20:00');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('app-settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('app-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      Alert.alert('Hata', 'Ayarlar kaydedilemedi.');
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const updateReminderTime = () => {
    const newSettings = { ...settings, reminderTime: tempTime };
    saveSettings(newSettings);
    setShowTimeModal(false);
    Alert.alert('Başarılı! ⏰', `Hatırlatma saati ${tempTime} olarak ayarlandı.`);
  };

  const exportData = async () => {
    try {
      setExporting(true);
      
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter(key => key.startsWith('study-log-'));
      const goalKeys = keys.filter(key => key.startsWith('exam-goals'));
      
      const studyData = await AsyncStorage.multiGet(studyKeys);
      const goalData = await AsyncStorage.multiGet(goalKeys);
      
      const exportData = {
        studyLogs: studyData.map(([key, value]) => ({ key, data: JSON.parse(value) })),
        examGoals: goalData.map(([key, value]) => ({ key, data: JSON.parse(value) })),
        settings: settings,
        exportDate: new Date().toISOString(),
        appVersion: '1.0.0'
      };
      
      const dataString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: dataString,
        title: 'Başarı Takip Verileri',
      });
      
      Alert.alert('Başarılı! 📤', 'Verileriniz başarıyla dışa aktarıldı.');
      
    } catch (error) {
      Alert.alert('Hata', 'Veriler dışa aktarılamadı.');
    } finally {
      setExporting(false);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Tehlikeli İşlem! ⚠️',
      'Bu işlem tüm çalışma kayıtlarınızı, hedeflerinizi ve ayarlarınızı silecek. Bu işlem geri alınamaz!',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              const keys = await AsyncStorage.getAllKeys();
              const dataKeys = keys.filter(key => 
                key.startsWith('study-log-') || 
                key.startsWith('exam-goals') ||
                key.startsWith('app-settings')
              );
              
              await AsyncStorage.multiRemove(dataKeys);
              Alert.alert('Tamamlandı! 🗑️', 'Tüm veriler başarıyla silindi.');
              
              // Reset settings to default
              setSettings({
                notifications: true,
                dailyReminder: true,
                reminderTime: '20:00',
                weeklyReport: true,
                soundEnabled: true,
                vibrationEnabled: true,
                motivationMessages: true,
                dataBackup: true
              });
            } catch (error) {
              Alert.alert('Hata', 'Veriler silinemedi.');
            }
          }
        }
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'Başarı Takip v1.0 📱',
      'LGS hazırlık sürecini takip etmek için geliştirilmiş mobil uygulama.\n\n' +
      '✨ Özellikler:\n' +
      '• Günlük çalışma takibi\n' +
      '• Akıllı net hesaplama\n' +
      '• Zayıf konular analizi\n' +
      '• Sınav hedefleri takibi\n' +
      '• Detaylı raporlama\n' +
      '• Takvim görünümü\n\n' +
      '👨‍💻 Geliştirici: Bahadır\n' +
      '📅 Sürüm: 1.0.0\n' +
      '🚀 React Native ile geliştirilmiştir',
      [{ text: 'Harika! 👍' }]
    );
  };

  const testNotification = () => {
    if (settings.notifications && settings.dailyReminder) {
      Alert.alert(
        '🔔 Bildirim Test Edildi!',
        `✅ Bildirimler aktif\n⏰ Hatırlatma saati: ${settings.reminderTime}\n🔊 Ses: ${settings.soundEnabled ? 'Açık' : 'Kapalı'}\n📳 Titreşim: ${settings.vibrationEnabled ? 'Açık' : 'Kapalı'}\n\nGerçek uygulamada bu saatte günlük hatırlatma alacaksın!`,
        [{ text: 'Anladım! 👌' }]
      );
    } else {
      Alert.alert(
        '⚠️ Bildirimler Kapalı',
        'Bildirim testi için önce bildirimleri ve günlük hatırlatmayı açmalısın.',
        [{ text: 'Tamam' }]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={40} color="#3b82f6" />
        <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <View style={styles.headerGradient}>
        <Text style={styles.headerTitle}>⚙️ Ayarlar</Text>
        <Text style={styles.headerSubtitle}>Uygulamayı kişiselleştir</Text>
      </View>

      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>🎓</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>LGS Öğrencisi</Text>
          <Text style={styles.profileStatus}>Aktif Çalışan</Text>
        </View>
        <View style={styles.profileStats}>
          <Text style={styles.profileStatsText}>v1.0</Text>
        </View>
      </View>

      {/* Notifications Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🔔</Text>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
        </View>
        
        <View style={styles.settingCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Bildirimleri Aç</Text>
              <Text style={styles.settingDescription}>
                Genel bildirim ayarları
              </Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={settings.notifications ? '#3b82f6' : '#94a3b8'}
            />
          </View>

          <View style={[
            styles.settingItem,
            !settings.notifications && styles.disabledSetting
          ]}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Günlük Hatırlatma</Text>
              <Text style={styles.settingDescription}>
                Her gün çalışma hatırlatması
              </Text>
            </View>
            <Switch
              value={settings.dailyReminder}
              onValueChange={() => toggleSetting('dailyReminder')}
              disabled={!settings.notifications}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={settings.dailyReminder ? '#3b82f6' : '#94a3b8'}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.settingItem,
              !settings.notifications && styles.disabledSetting
            ]}
            onPress={() => {
              if (settings.notifications) {
                setTempTime(settings.reminderTime);
                setShowTimeModal(true);
              }
            }}
            disabled={!settings.notifications}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Hatırlatma Saati</Text>
              <Text style={styles.settingDescription}>
                Günlük hatırlatma zamanı: {settings.reminderTime}
              </Text>
            </View>
            <Text style={styles.settingArrow}>⏰</Text>
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Motivasyon Mesajları</Text>
              <Text style={styles.settingDescription}>
                Başarı ve motivasyon mesajları
              </Text>
            </View>
            <Switch
              value={settings.motivationMessages}
              onValueChange={() => toggleSetting('motivationMessages')}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={settings.motivationMessages ? '#3b82f6' : '#94a3b8'}
            />
          </View>
        </View>
      </View>

      {/* Sound & Vibration Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>🔊</Text>
          <Text style={styles.sectionTitle}>Ses ve Titreşim</Text>
        </View>
        
        <View style={styles.settingCard}>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Ses Efektleri</Text>
              <Text style={styles.settingDescription}>
                Buton sesleri ve uyarılar
              </Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => toggleSetting('soundEnabled')}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={settings.soundEnabled ? '#3b82f6' : '#94a3b8'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Titreşim</Text>
              <Text style={styles.settingDescription}>
                Bildirim titreşimi
              </Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={() => toggleSetting('vibrationEnabled')}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={settings.vibrationEnabled ? '#3b82f6' : '#94a3b8'}
            />
          </View>
        </View>
      </View>

      {/* Data Management Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>💾</Text>
          <Text style={styles.sectionTitle}>Veri Yönetimi</Text>
        </View>
        
        <View style={styles.actionCard}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={exportData}
            disabled={exporting}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonEmoji}>📤</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>
                  {exporting ? 'Dışa Aktarılıyor...' : 'Verileri Dışa Aktar'}
                </Text>
                <Text style={styles.actionButtonDescription}>
                  Tüm verilerini yedekle ve paylaş
                </Text>
              </View>
              {exporting && <LoadingSpinner size={20} color="#3b82f6" />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.testButton]} 
            onPress={testNotification}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonEmoji}>🔔</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Bildirimi Test Et</Text>
                <Text style={styles.actionButtonDescription}>
                  Hatırlatma ayarlarını test et
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]} 
            onPress={clearAllData}
          >
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonEmoji}>🗑️</Text>
              <View style={styles.actionButtonText}>
                <Text style={[styles.actionButtonTitle, styles.dangerText]}>
                  Tüm Verileri Sil
                </Text>
                <Text style={styles.actionButtonDescription}>
                  Bu işlem geri alınamaz!
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEmoji}>ℹ️</Text>
          <Text style={styles.sectionTitle}>Uygulama Bilgileri</Text>
        </View>
        
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.actionButton} onPress={showAbout}>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonEmoji}>📱</Text>
              <View style={styles.actionButtonText}>
                <Text style={styles.actionButtonTitle}>Hakkında</Text>
                <Text style={styles.actionButtonDescription}>
                  Sürüm bilgileri ve geliştirici
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⏰ Hatırlatma Saati</Text>
            <Text style={styles.modalDescription}>
              Günlük çalışma hatırlatması için saat belirleyin
            </Text>
            
            <TextInput
              style={styles.timeInput}
              value={tempTime}
              onChangeText={setTempTime}
              placeholder="HH:MM"
              keyboardType="numeric"
              maxLength={5}
            />
            
            <Text style={styles.timeExample}>
              Örnek: 20:00 (akşam 8:00)
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={updateReminderTime}
              >
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#64748b',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 28,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  profileStatus: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 2,
    fontWeight: '500',
  },
  profileStats: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileStatsText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },

  // Setting Cards
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  disabledSetting: {
    opacity: 0.5,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  settingArrow: {
    fontSize: 16,
    color: '#64748b',
  },

  // Action Cards
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  testButton: {
    backgroundColor: '#f0f9ff',
  },
  dangerButton: {
    backgroundColor: '#fef2f2',
    borderBottomWidth: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  actionButtonText: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  dangerText: {
    color: '#dc2626',
  },
  actionButtonDescription: {
    fontSize: 14,
    color: '#64748b',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    width: '60%',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  timeExample: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  modalCancelText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 16,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});