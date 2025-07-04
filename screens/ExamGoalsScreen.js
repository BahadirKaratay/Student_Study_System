import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  Modal
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const LGS_SUBJECTS = {
  'Matematik': { maxQuestions: 20, coefficient: 3, emoji: '🔢', color: '#3b82f6' },
  'Fen Bilimleri': { maxQuestions: 20, coefficient: 3, emoji: '🔬', color: '#10b981' },
  'Türkçe': { maxQuestions: 20, coefficient: 3, emoji: '📝', color: '#f59e0b' },
  'İngilizce': { maxQuestions: 10, coefficient: 3, emoji: '🌍', color: '#8b5cf6' },
  'Din Kültürü': { maxQuestions: 8, coefficient: 2, emoji: '☪️', color: '#06b6d4' },
  'İnkılap': { maxQuestions: 19, coefficient: 2, emoji: '🏛️', color: '#dc2626' }
};

const DEFAULT_GOALS = {
  totalNetGoal: 200,
  subjectGoals: {
    'Matematik': 15,
    'Fen Bilimleri': 15,
    'Türkçe': 15,
    'İngilizce': 8,
    'Din Kültürü': 6,
    'İnkılap': 15
  },
  targetDate: '2025-06-15',
  dailyStudyGoal: 100
};

export default function ExamGoalsScreen() {
  const [goals, setGoals] = useState(DEFAULT_GOALS);
  const [currentStats, setCurrentStats] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState('2025-06-15');

  const loadGoals = useCallback(async () => {
    try {
      const savedGoals = await AsyncStorage.getItem('exam-goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
    } catch (error) {
      console.error('Hedefler yüklenemedi:', error);
    }
  }, []);

  const saveGoals = async () => {
    try {
      await AsyncStorage.setItem('exam-goals', JSON.stringify(goals));
      Alert.alert('Başarılı! 🎉', 'Hedefleriniz kaydedildi!');
      setEditMode(false);
    } catch (error) {
      Alert.alert('Hata', 'Hedefler kaydedilemedi.');
    }
  };

  const loadCurrentStats = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter((key) => key.startsWith('study-log-'));
      
      if (studyKeys.length === 0) {
        setCurrentStats({});
        return;
      }

      const items = await AsyncStorage.multiGet(studyKeys);
      const logs = items.map(([_, value]) => {
        const log = JSON.parse(value);
        
        if (log.netScore === undefined || log.successRate === undefined) {
          const correct = log.correct || 0;
          const wrong = log.wrong || 0;
          const total = log.total || 0;
          
          log.netScore = Math.max(0, correct - (wrong / 3));
          log.successRate = total > 0 ? (log.netScore / total) * 100 : 0;
        }
        
        return log;
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentLogs = logs.filter(log => 
        new Date(log.date) >= thirtyDaysAgo
      );

      const subjectStats = {};
      
      Object.keys(LGS_SUBJECTS).forEach(subject => {
        const subjectLogs = recentLogs.filter(log => log.subject === subject);
        
        if (subjectLogs.length > 0) {
          const totalNet = subjectLogs.reduce((sum, log) => sum + (log.netScore || 0), 0);
          const totalQuestions = subjectLogs.reduce((sum, log) => sum + (log.total || 0), 0);
          const averageNet = totalNet / subjectLogs.length;
          const successRate = totalQuestions > 0 ? (totalNet / totalQuestions) * 100 : 0;
          
          subjectStats[subject] = {
            averageNet,
            successRate,
            totalSessions: subjectLogs.length,
            totalQuestions
          };
        } else {
          subjectStats[subject] = {
            averageNet: 0,
            successRate: 0,
            totalSessions: 0,
            totalQuestions: 0
          };
        }
      });

      setCurrentStats(subjectStats);

    } catch (error) {
      console.error('İstatistik hesaplama hatası:', error);
    }
  }, []);

  useEffect(() => {
    loadGoals();
    loadCurrentStats();
  }, [loadGoals, loadCurrentStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCurrentStats();
    setRefreshing(false);
  }, [loadCurrentStats]);

  const calculateTotalCurrentNet = () => {
    return Object.keys(LGS_SUBJECTS).reduce((total, subject) => {
      const stat = currentStats[subject];
      if (stat) {
        return total + (stat.averageNet * LGS_SUBJECTS[subject].coefficient);
      }
      return total;
    }, 0);
  };

  const calculateProgress = () => {
    const currentTotal = calculateTotalCurrentNet();
    const progress = Math.min((currentTotal / goals.totalNetGoal) * 100, 100);
    return Math.round(progress);
  };

  const getDaysUntilExam = () => {
    const today = new Date();
    const examDate = new Date(goals.targetDate);
    const diffTime = examDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getRequiredDailyProgress = () => {
    const currentTotal = calculateTotalCurrentNet();
    const remaining = goals.totalNetGoal - currentTotal;
    const daysLeft = getDaysUntilExam();
    
    if (daysLeft <= 0) return 0;
    return Math.max(0, remaining / daysLeft);
  };

  const getSubjectAdvice = (subject) => {
    const goal = goals.subjectGoals[subject];
    const current = currentStats[subject]?.averageNet || 0;
    const progress = Math.min((current / goal) * 100, 100);
    
    if (progress >= 80) {
      return { text: 'Mükemmel! Hedefe çok yakınsın', color: '#10b981', bgColor: '#dcfce7' };
    } else if (progress >= 50) {
      return { text: 'İyi gidiyorsun, devam et!', color: '#f59e0b', bgColor: '#fef3c7' };
    } else if (progress >= 20) {
      return { text: 'Daha fazla çalışman gerekli', color: '#ef4444', bgColor: '#fee2e2' };
    } else {
      return { text: 'Bu derse odaklanmalısın!', color: '#dc2626', bgColor: '#fecaca' };
    }
  };

  const updateSubjectGoal = (subject, value) => {
    const numValue = parseInt(value) || 0;
    const maxNet = LGS_SUBJECTS[subject].maxQuestions;
    
    if (numValue > maxNet) {
      Alert.alert('Uyarı', `${subject} için maksimum net: ${maxNet}`);
      return;
    }
    
    setGoals(prev => ({
      ...prev,
      subjectGoals: {
        ...prev.subjectGoals,
        [subject]: numValue
      }
    }));
  };

  const updateTotalGoal = (value) => {
    const numValue = parseInt(value) || 0;
    const maxPossible = Object.keys(LGS_SUBJECTS).reduce((total, subject) => {
      return total + (LGS_SUBJECTS[subject].maxQuestions * LGS_SUBJECTS[subject].coefficient);
    }, 0);
    
    if (numValue > maxPossible) {
      Alert.alert('Uyarı', `Maksimum mümkün net: ${maxPossible}`);
      return;
    }
    
    setGoals(prev => ({ ...prev, totalNetGoal: numValue }));
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 80) return '#10b981';
    if (progress >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getMotivationMessage = () => {
    const progress = calculateProgress();
    const daysLeft = getDaysUntilExam();
    
    if (progress >= 80) {
      return {
        emoji: '🔥',
        title: 'Harika İlerleme!',
        text: 'Hedefine çok yaklaştın. Bu tempoda devam et!'
      };
    } else if (progress >= 50) {
      return {
        emoji: '💪',
        title: 'İyi Gidiyorsun!',
        text: 'Yarı yolu geçtin. Biraz daha gayret!'
      };
    } else if (daysLeft > 100) {
      return {
        emoji: '🎯',
        title: 'Zamanın Var!',
        text: 'Planlı çalışarak hedefe ulaşabilirsin.'
      };
    } else {
      return {
        emoji: '⚡',
        title: 'Hızlan!',
        text: 'Zamana karşı yarışıyorsun. Tempo artırmalısın!'
      };
    }
  };

  const motivation = getMotivationMessage();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Gradient Header */}
      <View style={[styles.headerGradient, { backgroundColor: getProgressColor() }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>🎯 Sınav Hedefleri</Text>
          <Text style={styles.headerSubtitle}>LGS yolculuğun</Text>
        </View>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => editMode ? saveGoals() : setEditMode(true)}
        >
          <Text style={styles.editButtonText}>
            {editMode ? '💾 Kaydet' : '✏️ Düzenle'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Motivation Card */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
        <Text style={styles.motivationTitle}>{motivation.title}</Text>
        <Text style={styles.motivationText}>{motivation.text}</Text>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>📊 Genel İlerleme</Text>
        
        <View style={styles.circularProgress}>
          <View style={[
            styles.progressCircle,
            { borderColor: getProgressColor() }
          ]}>
            <Text style={[styles.progressPercentage, { color: getProgressColor() }]}>
              {calculateProgress()}%
            </Text>
            <Text style={styles.progressLabel}>Tamamlandı</Text>
          </View>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {Math.round(calculateTotalCurrentNet())}
            </Text>
            <Text style={styles.progressStatLabel}>Mevcut Net</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>{goals.totalNetGoal}</Text>
            <Text style={styles.progressStatLabel}>Hedef Net</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatValue}>
              {Math.round(goals.totalNetGoal - calculateTotalCurrentNet())}
            </Text>
            <Text style={styles.progressStatLabel}>Kalan</Text>
          </View>
        </View>
      </View>

      {/* Time Cards */}
      <View style={styles.timeCardsContainer}>
        <View style={styles.timeCard}>
          <Text style={styles.timeEmoji}>📅</Text>
          <Text style={styles.timeNumber}>{getDaysUntilExam()}</Text>
          <Text style={styles.timeLabel}>Kalan Gün</Text>
        </View>
        
        <View style={styles.timeCard}>
          <Text style={styles.timeEmoji}>🎯</Text>
          <Text style={styles.timeNumber}>{Math.round(getRequiredDailyProgress())}</Text>
          <Text style={styles.timeLabel}>Günlük Hedef Net</Text>
        </View>
      </View>

      {/* Total Goal Edit */}
      {editMode && (
        <View style={styles.editCard}>
          <Text style={styles.cardTitle}>🎯 Toplam Hedef Net</Text>
          <TextInput
            style={styles.totalGoalInput}
            value={goals.totalNetGoal.toString()}
            onChangeText={updateTotalGoal}
            keyboardType="numeric"
            placeholder="Hedef net sayısı"
          />
        </View>
      )}

      {/* Subject Goals */}
      <View style={styles.subjectsCard}>
        <Text style={styles.cardTitle}>📚 Ders Bazında Hedefler</Text>
        
        {Object.keys(LGS_SUBJECTS).map(subject => {
          const subjectData = LGS_SUBJECTS[subject];
          const goal = goals.subjectGoals[subject];
          const current = currentStats[subject]?.averageNet || 0;
          const advice = getSubjectAdvice(subject);
          const progress = Math.min((current / goal) * 100, 100);
          
          return (
            <View 
              key={subject} 
              style={[
                styles.subjectCard,
                { borderLeftColor: subjectData.color }
              ]}
            >
              {/* Subject Header */}
              <View style={styles.subjectHeader}>
                <View style={styles.subjectInfo}>
                  <Text style={styles.subjectEmoji}>{subjectData.emoji}</Text>
                  <View>
                    <Text style={styles.subjectName}>{subject}</Text>
                    <Text style={styles.subjectMax}>
                      Max: {subjectData.maxQuestions} soru
                    </Text>
                  </View>
                </View>
                
                <View style={[styles.progressBadge, { backgroundColor: advice.bgColor }]}>
                  <Text style={[styles.progressBadgeText, { color: advice.color }]}>
                    %{Math.round(progress)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.subjectProgressContainer}>
                <View style={styles.subjectProgressBar}>
                  <View 
                    style={[
                      styles.subjectProgressFill,
                      { 
                        width: `${progress}%`,
                        backgroundColor: subjectData.color
                      }
                    ]}
                  />
                </View>
              </View>

              {/* Current vs Goal */}
              <View style={styles.subjectStats}>
                <View style={styles.subjectStat}>
                  <Text style={styles.subjectStatValue}>{current.toFixed(1)}</Text>
                  <Text style={styles.subjectStatLabel}>Mevcut Net</Text>
                </View>
                
                {editMode ? (
                  <TextInput
                    style={[styles.goalInput, { borderColor: subjectData.color }]}
                    value={goal.toString()}
                    onChangeText={(value) => updateSubjectGoal(subject, value)}
                    keyboardType="numeric"
                    placeholder="Hedef"
                  />
                ) : (
                  <View style={styles.subjectStat}>
                    <Text style={[styles.subjectStatValue, { color: subjectData.color }]}>
                      {goal}
                    </Text>
                    <Text style={styles.subjectStatLabel}>Hedef Net</Text>
                  </View>
                )}
              </View>

              {/* Advice */}
              <View style={[styles.adviceContainer, { backgroundColor: advice.bgColor }]}>
                <Text style={[styles.adviceText, { color: advice.color }]}>
                  💡 {advice.text}
                </Text>
              </View>

              {/* Additional Stats */}
              {currentStats[subject] && (
                <View style={styles.additionalStats}>
                  <View style={styles.additionalStat}>
                    <Text style={styles.additionalStatValue}>
                      {currentStats[subject].totalSessions}
                    </Text>
                    <Text style={styles.additionalStatLabel}>oturum</Text>
                  </View>
                  <View style={styles.additionalStat}>
                    <Text style={styles.additionalStatValue}>
                      {currentStats[subject].totalQuestions}
                    </Text>
                    <Text style={styles.additionalStatLabel}>soru</Text>
                  </View>
                  <View style={styles.additionalStat}>
                    <Text style={styles.additionalStatValue}>
                      %{Math.round(currentStats[subject].successRate)}
                    </Text>
                    <Text style={styles.additionalStatLabel}>başarı</Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Study Plan */}
      <View style={styles.studyPlanCard}>
        <Text style={styles.cardTitle}>📋 Çalışma Planı</Text>
        
        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.planEmoji}>🎯</Text>
            <Text style={styles.planTitle}>Günlük Hedefler</Text>
          </View>
          <Text style={styles.planText}>
            • Günde {Math.round(getRequiredDailyProgress())} net artış hedefle{'\n'}
            • Her dersten en az 10 soru çöz{'\n'}
            • Zayıf konulara öncelik ver{'\n'}
            • Haftada 1 deneme sınavı yap
          </Text>
        </View>

        <View style={styles.planSection}>
          <View style={styles.planHeader}>
            <Text style={styles.planEmoji}>⏰</Text>
            <Text style={styles.planTitle}>Zaman Yönetimi</Text>
          </View>
          <Text style={styles.planText}>
            • {getDaysUntilExam()} gün kaldı - her gün sayılıyor{'\n'}
            • Haftada 6 gün aktif çalışma{'\n'}
            • Günde 3-4 saat odaklanmış çalışma{'\n'}
            • Hafta sonları tekrar ve dinlenme
          </Text>
        </View>
      </View>

      {/* Date Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📅 Sınav Tarihi</Text>
            
            <TextInput
              style={styles.dateInput}
              value={tempDate}
              onChangeText={setTempDate}
              placeholder="YYYY-MM-DD"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalSaveButton}
                onPress={() => {
                  setGoals(prev => ({ ...prev, targetDate: tempDate }));
                  setShowDateModal(false);
                }}
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

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Motivation Card
  motivationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  motivationEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  progressStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  // Time Cards
  timeCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  timeCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timeEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  timeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },

  // Edit Card
  editCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  totalGoalInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },

  // Subjects Card
  subjectsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  // Subject Cards
  subjectCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subjectMax: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Progress Bar
  subjectProgressContainer: {
    marginBottom: 12,
  },
  subjectProgressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  subjectProgressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Subject Stats
  subjectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectStat: {
    alignItems: 'center',
  },
  subjectStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subjectStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  goalInput: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    backgroundColor: '#fff',
  },

  // Advice
  adviceContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  adviceText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Additional Stats
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  additionalStat: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  additionalStatLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  // Study Plan
  studyPlanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 100,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  planSection: {
    marginBottom: 20,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  planText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    paddingLeft: 28,
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
    width: '80%',
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
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f8fafc',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
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