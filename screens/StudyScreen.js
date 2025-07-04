import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingSpinner, DotsLoading } from './LoadingComponent';

const { width } = Dimensions.get('window');

const SUBJECTS = {
  'Matematik': { 
    topics: ['Sayılar', 'Çarpanlar Katlar', 'Kesirler', 'Ondalık Gösterim', 'Yüzdeler', 'Geometri'],
    emoji: '🔢',
    color: '#3b82f6'
  },
  'Fen Bilimleri': { 
    topics: ['Madde ve Değişim', 'Kuvvet ve Hareket', 'Işık', 'Ses', 'Elektrik'],
    emoji: '🔬',
    color: '#10b981'
  },
  'Türkçe': { 
    topics: ['Okuma Anlama', 'Dilbilgisi', 'Yazım Kuralları', 'Noktalama', 'Sözcük Bilgisi'],
    emoji: '📝',
    color: '#f59e0b'
  },
  'İngilizce': { 
    topics: ['Grammar', 'Vocabulary', 'Reading', 'Listening'],
    emoji: '🌍',
    color: '#8b5cf6'
  },
  'Din Kültürü': { 
    topics: ['İbadet', 'Ahlak', 'Siyer', 'Temel Bilgiler'],
    emoji: '☪️',
    color: '#06b6d4'
  },
  'İnkılap': { 
    topics: ['Osmanlı', 'Kurtuluş Savaşı', 'Atatürk İlkeleri', 'Cumhuriyet Dönemi'],
    emoji: '🏛️',
    color: '#dc2626'
  }
};

const SUBJECT_TARGETS = {
  'Matematik': 20,
  'Fen Bilimleri': 20,
  'Türkçe': 20,
  'İngilizce': 10,
  'Din Kültürü': 8,
  'İnkılap': 19
};

// Animasyonlu Buton Bileşeni
function AnimatedButton({ onPress, children, style, disabled = false, loading = false }) {
  const [scaleAnim] = useState(new Animated.Value(1));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <Animated.View 
      style={[
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.saveButton,
          disabled && styles.disabledButton,
          loading && styles.loadingButton,
          style
        ]}
      >
        {loading ? (
          <View style={styles.loadingContent}>
            <LoadingSpinner size={20} color="#fff" />
            <Text style={[styles.saveButtonText, { marginLeft: 10 }]}>
              Kaydediliyor...
            </Text>
          </View>
        ) : (
          children
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StudyScreen() {
  const today = new Date().toISOString().split('T')[0];

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [blank, setBlank] = useState('');
  const [showSubjects, setShowSubjects] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const target = SUBJECT_TARGETS[selectedSubject] || 20;
  const total = Number(correct) + Number(wrong) + Number(blank);
  
  // Net hesaplama: Doğru - (Yanlış/3)
  const netScore = Math.max(0, Number(correct) - (Number(wrong) / 3));
  const successRate = total > 0 ? (netScore / total) * 100 : 0;

  const handleSave = async () => {
    if (!selectedSubject || !selectedTopic) {
      Alert.alert('Eksik bilgi', 'Lütfen ders ve konu seçiniz.');
      return;
    }

    if (!correct && !wrong && !blank) {
      Alert.alert('Eksik bilgi', 'Lütfen en az bir soru sayısı giriniz.');
      return;
    }

    setIsLoading(true);

    // Simulate saving delay for better UX
    await new Promise(resolve => setTimeout(resolve, 1500));

    const log = {
      date: today,
      subject: selectedSubject,
      topic: selectedTopic,
      correct: Number(correct) || 0,
      wrong: Number(wrong) || 0,
      blank: Number(blank) || 0,
      total,
      netScore: Math.round(netScore * 100) / 100,
      successRate: Math.round(successRate * 100) / 100,
      target,
      metTarget: total >= target,
      timestamp: Date.now()
    };

    try {
      const key = `study-log-${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(log));
      
      let message = 'Çalışma kaydı kaydedildi.\n';
      message += `Net: ${log.netScore}\n`;
      message += `Başarı Oranı: %${log.successRate}\n`;
      
      if (log.metTarget) {
        message += '🎉 Hedefini gerçekleştirdin!';
      } else {
        message += `⚠️ Hedef: ${target}, Çözdüğün: ${total}`;
      }

      Alert.alert('Başarılı! 🎉', message);
      
      // Form temizle
      setCorrect('');
      setWrong('');
      setBlank('');
      setSelectedSubject('');
      setSelectedTopic('');
    } catch (e) {
      Alert.alert('Hata', 'Veri kaydedilemedi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectSelect = async (subject) => {
    setLoadingSubjects(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setSelectedSubject(subject);
    setSelectedTopic(''); // Konu sıfırla
    setShowSubjects(false);
    setLoadingSubjects(false);
  };

  const getTotalColor = () => {
    if (total >= target) return '#10b981'; // Yeşil
    if (total === 0) return '#64748b'; // Gri
    return '#ef4444'; // Kırmızı
  };

  const getSuccessColor = () => {
    if (successRate >= 70) return '#10b981'; // Yeşil
    if (successRate >= 50) return '#f59e0b'; // Turuncu
    if (successRate === 0) return '#64748b'; // Gri
    return '#ef4444'; // Kırmızı
  };

  const getProgressPercentage = () => {
    return target > 0 ? Math.min((total / target) * 100, 100) : 0;
  };

  const getSubjectColor = () => {
    return SUBJECTS[selectedSubject]?.color || '#64748b';
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Gradient */}
      <View style={[styles.headerGradient, { backgroundColor: getSubjectColor() }]}>
        <Text style={styles.headerTitle}>📚 Çalışma Takibi</Text>
        <Text style={styles.headerDate}>{today}</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject Selection Card */}
        <View style={styles.selectionCard}>
          <Text style={styles.cardTitle}>📘 Ders Seçimi</Text>
          
          <TouchableOpacity 
            style={[
              styles.modernDropdown, 
              selectedSubject && styles.modernDropdownSelected,
              { borderColor: selectedSubject ? getSubjectColor() : '#e2e8f0' }
            ]}
            onPress={() => setShowSubjects(!showSubjects)}
            disabled={loadingSubjects}
          >
            {loadingSubjects ? (
              <View style={styles.loadingDropdown}>
                <DotsLoading color={getSubjectColor()} />
              </View>
            ) : (
              <View style={styles.dropdownContent}>
                {selectedSubject ? (
                  <View style={styles.selectedSubject}>
                    <Text style={styles.subjectEmoji}>
                      {SUBJECTS[selectedSubject]?.emoji}
                    </Text>
                    <Text style={styles.selectedSubjectText}>{selectedSubject}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Ders seçiniz...</Text>
                )}
                <Text style={styles.dropdownArrow}>
                  {showSubjects ? '▲' : '▼'}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {showSubjects && !loadingSubjects && (
            <View style={styles.modernDropdownList}>
              {Object.keys(SUBJECTS).map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.modernDropdownItem,
                    { borderLeftColor: SUBJECTS[subject].color }
                  ]}
                  onPress={() => handleSubjectSelect(subject)}
                >
                  <Text style={styles.subjectEmoji}>
                    {SUBJECTS[subject].emoji}
                  </Text>
                  <Text style={styles.dropdownItemText}>{subject}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Topic Selection Card */}
        {selectedSubject && !loadingSubjects && (
          <View style={styles.selectionCard}>
            <Text style={styles.cardTitle}>📚 Konu Seçimi</Text>
            
            <TouchableOpacity 
              style={[
                styles.modernDropdown,
                selectedTopic && styles.modernDropdownSelected,
                { borderColor: selectedTopic ? getSubjectColor() : '#e2e8f0' }
              ]}
              onPress={() => setShowTopics(!showTopics)}
            >
              <View style={styles.dropdownContent}>
                <Text style={styles.selectedTopicText}>
                  {selectedTopic || 'Konu seçiniz...'}
                </Text>
                <Text style={styles.dropdownArrow}>
                  {showTopics ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {showTopics && (
              <View style={styles.modernDropdownList}>
                {SUBJECTS[selectedSubject].topics.map((topic) => (
                  <TouchableOpacity
                    key={topic}
                    style={styles.topicDropdownItem}
                    onPress={() => {
                      setSelectedTopic(topic);
                      setShowTopics(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Score Input Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.cardTitle}>📊 Soru Sayıları</Text>
          
          <View style={styles.scoreInputsContainer}>
            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreLabel}>✅ Doğru</Text>
              <TextInput
                style={[styles.scoreInput, { borderColor: '#10b981' }]}
                value={correct}
                onChangeText={setCorrect}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                editable={!isLoading}
              />
            </View>

            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreLabel}>❌ Yanlış</Text>
              <TextInput
                style={[styles.scoreInput, { borderColor: '#ef4444' }]}
                value={wrong}
                onChangeText={setWrong}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                editable={!isLoading}
              />
            </View>

            <View style={styles.scoreInputGroup}>
              <Text style={styles.scoreLabel}>❓ Boş</Text>
              <TextInput
                style={[styles.scoreInput, { borderColor: '#f59e0b' }]}
                value={blank}
                onChangeText={setBlank}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                editable={!isLoading}
              />
            </View>
          </View>
        </View>

        {/* Results Card */}
        {(correct || wrong || blank) && (
          <View style={styles.resultsCard}>
            <Text style={styles.cardTitle}>📈 Sonuçlar</Text>
            
            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Hedef İlerlemesi</Text>
                <Text style={[styles.progressText, { color: getTotalColor() }]}>
                  {total} / {target}
                </Text>
              </View>
              
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${getProgressPercentage()}%`,
                      backgroundColor: getTotalColor()
                    }
                  ]}
                />
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Toplam Soru</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: '#3b82f6' }]}>
                  {netScore.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Net Puan</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: getSuccessColor() }]}>
                  %{successRate.toFixed(0)}
                </Text>
                <Text style={styles.statLabel}>Başarı Oranı</Text>
              </View>
            </View>

            {/* Target Status */}
            <View style={[
              styles.targetStatus,
              { backgroundColor: total >= target ? '#dcfce7' : '#fef2f2' }
            ]}>
              <Text style={[
                styles.targetStatusText,
                { color: total >= target ? '#16a34a' : '#dc2626' }
              ]}>
                {total >= target ? '🎉 Hedefine ulaştın!' : '💪 Hedefe devam et!'}
              </Text>
            </View>
          </View>
        )}

        {/* Save Button */}
        <AnimatedButton 
          onPress={handleSave}
          loading={isLoading}
          disabled={!selectedSubject || !selectedTopic}
          style={[
            styles.saveButton,
            { backgroundColor: getSubjectColor() }
          ]}
        >
          <Text style={styles.saveButtonText}>💾 Kaydet</Text>
        </AnimatedButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
  headerDate: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Container
  container: {
    padding: 20,
    paddingBottom: 100,
  },

  // Cards
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },

  // Modern Dropdown
  modernDropdown: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    minHeight: 56,
    justifyContent: 'center',
  },
  modernDropdownSelected: {
    backgroundColor: '#f0f9ff',
  },
  dropdownContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedSubject: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  selectedSubjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  selectedTopicText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  loadingDropdown: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown Lists
  modernDropdownList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  modernDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    borderLeftWidth: 4,
  },
  topicDropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },

  // Score Inputs
  scoreInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  scoreInputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  scoreInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    width: '100%',
    color: '#1e293b',
  },

  // Results
  progressSection: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  targetStatus: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  targetStatusText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Save Button
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    elevation: 0,
  },
  loadingButton: {
    backgroundColor: '#60a5fa',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});