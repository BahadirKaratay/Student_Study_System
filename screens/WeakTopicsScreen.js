import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Dimensions 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const SUBJECTS_TOPICS = {
  'Matematik': { 
    topics: ['Sayılar', 'Çarpanlar Katlar', 'Kesirler', 'Ondalık Gösterim', 'Yüzdeler', 'Geometri', 'Cebir', 'İstatistik'],
    emoji: '🔢',
    color: '#3b82f6'
  },
  'Fen Bilimleri': { 
    topics: ['Madde ve Değişim', 'Kuvvet ve Hareket', 'Işık', 'Ses', 'Elektrik', 'Güneş Sistemi', 'Vücudumuz'],
    emoji: '🔬',
    color: '#10b981'
  },
  'Türkçe': { 
    topics: ['Okuma Anlama', 'Dilbilgisi', 'Yazım Kuralları', 'Noktalama', 'Sözcük Bilgisi', 'Anlatım Biçimleri'],
    emoji: '📝',
    color: '#f59e0b'
  },
  'İngilizce': { 
    topics: ['Grammar', 'Vocabulary', 'Reading', 'Listening', 'Tenses', 'Modal Verbs'],
    emoji: '🌍',
    color: '#8b5cf6'
  },
  'Din Kültürü': { 
    topics: ['İbadet', 'Ahlak', 'Siyer', 'Temel Bilgiler', 'Peygamberler', 'Kitaplar'],
    emoji: '☪️',
    color: '#06b6d4'
  },
  'İnkılap': { 
    topics: ['Osmanlı', 'Kurtuluş Savaşı', 'Atatürk İlkeleri', 'Cumhuriyet Dönemi', 'Devrimler'],
    emoji: '🏛️',
    color: '#dc2626'
  }
};

export default function WeakTopicsScreen() {
  const [weakTopics, setWeakTopics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalWeakTopics: 0,
    neverStudied: 0,
    lowSuccess: 0,
    moreWrongThanRight: 0
  });

  const analyzeWeakTopics = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter((key) => key.startsWith('study-log-'));
      
      if (studyKeys.length === 0) {
        setWeakTopics([]);
        return;
      }

      const items = await AsyncStorage.multiGet(studyKeys);
      const logs = items.map(([_, value]) => {
        const log = JSON.parse(value);
        
        // Eski verileri düzelt
        if (log.netScore === undefined || log.successRate === undefined) {
          const correct = log.correct || 0;
          const wrong = log.wrong || 0;
          const total = log.total || 0;
          
          log.netScore = Math.max(0, correct - (wrong / 3));
          log.successRate = total > 0 ? (log.netScore / total) * 100 : 0;
        }
        
        return log;
      });

      // Konu bazında istatistikleri topla
      const topicStats = {};

      logs.forEach(log => {
        const key = `${log.subject}-${log.topic}`;
        
        if (!topicStats[key]) {
          topicStats[key] = {
            subject: log.subject,
            topic: log.topic,
            totalCorrect: 0,
            totalWrong: 0,
            totalBlank: 0,
            totalQuestions: 0,
            totalNet: 0,
            sessions: 0,
            lastStudied: log.date,
            averageSuccess: 0
          };
        }

        topicStats[key].totalCorrect += log.correct || 0;
        topicStats[key].totalWrong += log.wrong || 0;
        topicStats[key].totalBlank += log.blank || 0;
        topicStats[key].totalQuestions += log.total || 0;
        topicStats[key].totalNet += log.netScore || 0;
        topicStats[key].sessions += 1;
        
        // En son çalışma tarihini güncelle
        if (new Date(log.date) > new Date(topicStats[key].lastStudied)) {
          topicStats[key].lastStudied = log.date;
        }
      });

      // Ortalama başarı oranını hesapla
      Object.keys(topicStats).forEach(key => {
        const stat = topicStats[key];
        stat.averageSuccess = stat.totalQuestions > 0 ? 
          (stat.totalNet / stat.totalQuestions) * 100 : 0;
      });

      const weak = [];
      let neverStudiedCount = 0;
      let lowSuccessCount = 0;
      let moreWrongCount = 0;

      // Tüm konuları kontrol et
      Object.keys(SUBJECTS_TOPICS).forEach(subject => {
        SUBJECTS_TOPICS[subject].topics.forEach(topic => {
          const key = `${subject}-${topic}`;
          const stat = topicStats[key];

          if (!stat) {
            // Hiç çalışılmamış konu
            weak.push({
              subject,
              topic,
              reason: 'never_studied',
              reasonText: 'Hiç çalışılmamış',
              priority: 'high',
              sessions: 0,
              averageSuccess: 0,
              totalCorrect: 0,
              totalWrong: 0,
              lastStudied: null
            });
            neverStudiedCount++;
          } else {
            const reasons = [];
            let priority = 'low';

            // Yanlışlar doğrulardan fazla mı?
            if (stat.totalWrong > stat.totalCorrect && stat.totalQuestions >= 5) {
              reasons.push('more_wrong');
              priority = 'medium';
              moreWrongCount++;
            }

            // Başarı oranı %50'nin altında mı?
            if (stat.averageSuccess < 50 && stat.totalQuestions >= 3) {
              reasons.push('low_success');
              priority = 'medium';
              lowSuccessCount++;
            }

            // Çok düşük başarı (<%25)
            if (stat.averageSuccess < 25 && stat.totalQuestions >= 3) {
              priority = 'high';
            }

            if (reasons.length > 0) {
              const reasonTexts = reasons.map(r => {
                switch(r) {
                  case 'more_wrong': return 'Yanlış > Doğru';
                  case 'low_success': return `%${Math.round(stat.averageSuccess)} başarı`;
                  default: return '';
                }
              }).filter(t => t);

              weak.push({
                subject,
                topic,
                reason: reasons[0],
                reasonText: reasonTexts.join(', '),
                priority,
                sessions: stat.sessions,
                averageSuccess: stat.averageSuccess,
                totalCorrect: stat.totalCorrect,
                totalWrong: stat.totalWrong,
                lastStudied: stat.lastStudied
              });
            }
          }
        });
      });

      // Önceliğe göre sırala
      weak.sort((a, b) => {
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      setWeakTopics(weak);
      setStats({
        totalWeakTopics: weak.length,
        neverStudied: neverStudiedCount,
        lowSuccess: lowSuccessCount,
        moreWrongThanRight: moreWrongCount
      });

    } catch (error) {
      console.error('Analiz hatası:', error);
    }
  }, []);

  useEffect(() => {
    analyzeWeakTopics();
  }, [analyzeWeakTopics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await analyzeWeakTopics();
    setRefreshing(false);
  }, [analyzeWeakTopics]);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getPriorityBgColor = (priority) => {
    switch(priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      case 'low': return '#dcfce7';
      default: return '#f1f5f9';
    }
  };

  const getPriorityText = (priority) => {
    switch(priority) {
      case 'high': return 'Yüksek';
      case 'medium': return 'Orta';
      case 'low': return 'Düşük';
      default: return '';
    }
  };

  const getMotivationMessage = () => {
    const { totalWeakTopics, neverStudied } = stats;
    
    if (totalWeakTopics === 0) {
      return {
        emoji: '🎉',
        title: 'Mükemmel!',
        text: 'Tüm konularda harika performans gösteriyorsun!'
      };
    } else if (neverStudied > 10) {
      return {
        emoji: '📚',
        title: 'Başlangıç Zamanı',
        text: 'Çok fazla çalışılmamış konu var. Yavaş yavaş başla!'
      };
    } else if (totalWeakTopics <= 5) {
      return {
        emoji: '💪',
        title: 'Az Kaldı!',
        text: 'Az sayıda zayıf konu var. Üzerine odaklan!'
      };
    } else {
      return {
        emoji: '🎯',
        title: 'Plan Yap',
        text: 'Zayıf konular tespit edildi. Sistematik çalış!'
      };
    }
  };

  const getSubjectColor = (subject) => {
    return SUBJECTS_TOPICS[subject]?.color || '#64748b';
  };

  const getSubjectEmoji = (subject) => {
    return SUBJECTS_TOPICS[subject]?.emoji || '📖';
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
      <View style={styles.headerGradient}>
        <Text style={styles.headerTitle}>⚠️ Zayıf Konular</Text>
        <Text style={styles.headerSubtitle}>Gelişim fırsatların</Text>
      </View>

      {/* Motivation Card */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationEmoji}>{motivation.emoji}</Text>
        <Text style={styles.motivationTitle}>{motivation.title}</Text>
        <Text style={styles.motivationText}>{motivation.text}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.totalCard]}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statNumber}>{stats.totalWeakTopics}</Text>
          <Text style={styles.statLabel}>Toplam Zayıf</Text>
        </View>
        
        <View style={[styles.statCard, styles.neverCard]}>
          <Text style={styles.statEmoji}>❌</Text>
          <Text style={[styles.statNumber, { color: '#dc2626' }]}>{stats.neverStudied}</Text>
          <Text style={styles.statLabel}>Hiç Çalışılmamış</Text>
        </View>
        
        <View style={[styles.statCard, styles.lowCard]}>
          <Text style={styles.statEmoji}>📉</Text>
          <Text style={[styles.statNumber, { color: '#f59e0b' }]}>{stats.lowSuccess}</Text>
          <Text style={styles.statLabel}>Düşük Başarı</Text>
        </View>
        
        <View style={[styles.statCard, styles.wrongCard]}>
          <Text style={styles.statEmoji}>⚠️</Text>
          <Text style={[styles.statNumber, { color: '#06b6d4' }]}>{stats.moreWrongThanRight}</Text>
          <Text style={styles.statLabel}>Çok Yanlış</Text>
        </View>
      </View>

      {/* Topics List */}
      {weakTopics.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>Harika İş!</Text>
          <Text style={styles.emptyText}>
            Şu anda çalışılması gereken konu bulunamadı.{'\n'}
            Tüm konularda iyi performans gösteriyorsun!
          </Text>
          <View style={styles.emptyButton}>
            <Text style={styles.emptyButtonText}>✨ Böyle Devam Et</Text>
          </View>
        </View>
      ) : (
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>
            📋 Zayıf Konular ({weakTopics.length})
          </Text>
          
          {weakTopics.map((item, index) => (
            <View key={index} style={[
              styles.topicCard,
              { borderLeftColor: getSubjectColor(item.subject) }
            ]}>
              {/* Card Header */}
              <View style={styles.topicHeader}>
                <View style={styles.topicTitleSection}>
                  <Text style={styles.subjectEmoji}>
                    {getSubjectEmoji(item.subject)}
                  </Text>
                  <View style={styles.topicInfo}>
                    <Text style={styles.topicSubject}>{item.subject}</Text>
                    <Text style={styles.topicName}>{item.topic}</Text>
                  </View>
                </View>
                
                <View style={[
                  styles.priorityBadge,
                  { backgroundColor: getPriorityBgColor(item.priority) }
                ]}>
                  <Text style={[
                    styles.priorityText,
                    { color: getPriorityColor(item.priority) }
                  ]}>
                    {getPriorityText(item.priority)}
                  </Text>
                </View>
              </View>

              {/* Reason */}
              <View style={[
                styles.reasonContainer,
                { backgroundColor: getPriorityBgColor(item.priority) }
              ]}>
                <Text style={[
                  styles.reasonText,
                  { color: getPriorityColor(item.priority) }
                ]}>
                  📌 {item.reasonText}
                </Text>
              </View>

              {/* Statistics */}
              {item.sessions > 0 ? (
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{item.sessions}</Text>
                      <Text style={styles.statUnit}>oturum</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{item.totalCorrect}</Text>
                      <Text style={styles.statUnit}>doğru</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{item.totalWrong}</Text>
                      <Text style={styles.statUnit}>yanlış</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[
                        styles.statValue,
                        { color: item.averageSuccess >= 50 ? '#10b981' : '#dc2626' }
                      ]}>
                        %{Math.round(item.averageSuccess)}
                      </Text>
                      <Text style={styles.statUnit}>başarı</Text>
                    </View>
                  </View>
                  
                  {item.lastStudied && (
                    <Text style={styles.lastStudiedText}>
                      🗓️ Son çalışma: {item.lastStudied}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.neverStudiedContainer}>
                  <Text style={styles.neverStudiedText}>
                    ⚠️ Bu konuda hiç çalışma yapılmamış
                  </Text>
                  <Text style={styles.neverStudiedAdvice}>
                    💡 Bu konuya öncelik vermen önerilir
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity 
                style={[
                  styles.actionButton,
                  { backgroundColor: getSubjectColor(item.subject) }
                ]}
              >
                <Text style={styles.actionButtonText}>
                  📚 Şimdi Çalış
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Recommendations */}
      {weakTopics.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.sectionTitle}>💡 Çalışma Önerileri</Text>
          
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationEmoji}>🎯</Text>
              <Text style={styles.recommendationTitle}>Öncelik Sırası</Text>
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationPoint}>
                • Kırmızı (Yüksek) öncelikli konularla başla
              </Text>
              <Text style={styles.recommendationPoint}>
                • Her gün 2-3 zayıf konu üzerine odaklan
              </Text>
              <Text style={styles.recommendationPoint}>
                • Hiç çalışılmamış konulara zaman ayır
              </Text>
            </View>
          </View>

          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationEmoji}>📈</Text>
              <Text style={styles.recommendationTitle}>Gelişim Takibi</Text>
            </View>
            <View style={styles.recommendationContent}>
              <Text style={styles.recommendationPoint}>
                • Her konuda en az 10 soru çöz
              </Text>
              <Text style={styles.recommendationPoint}>
                • Başarı oranını %70'in üzerine çıkar
              </Text>
              <Text style={styles.recommendationPoint}>
                • Düzenli tekrar yapmayı unutma
              </Text>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: '#f59e0b',
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

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  totalCard: {
    borderTopWidth: 4,
    borderTopColor: '#64748b',
  },
  neverCard: {
    borderTopWidth: 4,
    borderTopColor: '#dc2626',
  },
  lowCard: {
    borderTopWidth: 4,
    borderTopColor: '#f59e0b',
  },
  wrongCard: {
    borderTopWidth: 4,
    borderTopColor: '#06b6d4',
  },
  statEmoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Topics Section
  topicsSection: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },

  // Topic Cards
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderLeftWidth: 4,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subjectEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicSubject: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  topicName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 2,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Reason
  reasonContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Statistics
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statUnit: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  lastStudiedText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },

  // Never Studied
  neverStudiedContainer: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  neverStudiedText: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: '600',
    marginBottom: 8,
  },
  neverStudiedAdvice: {
    fontSize: 13,
    color: '#92400e',
    fontStyle: 'italic',
  },

  // Action Button
  actionButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Recommendations
  recommendationsSection: {
    margin: 20,
    marginBottom: 100,
  },
  recommendationCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  recommendationContent: {
    gap: 8,
  },
  recommendationPoint: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});