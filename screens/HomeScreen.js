import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Progress from 'react-native-progress';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalCorrect: 0,
    totalNet: 0,
    averageSuccess: 0,
    todayQuestions: 0,
    weeklyQuestions: 0,
    totalSessions: 0
  });
  
  const [recentLogs, setRecentLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [subjectStats, setSubjectStats] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter((key) => key.startsWith('study-log-'));
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
          log.metTarget = total >= (log.target || 20);
        }
        
        return log;
      });

      if (logs.length === 0) {
        return;
      }

      // Tarihe göre sırala (en yeni en üstte)
      logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Genel istatistikler - güvenli hesaplama
      const totalQuestions = logs.reduce((sum, log) => sum + (log.total || 0), 0);
      const totalCorrect = logs.reduce((sum, log) => sum + (log.correct || 0), 0);
      const totalNet = logs.reduce((sum, log) => sum + (log.netScore || 0), 0);
      const averageSuccess = logs.length > 0 ? 
        logs.reduce((sum, log) => sum + (log.successRate || 0), 0) / logs.length : 0;

      // Bugünkü çalışmalar
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(log => log.date === today);
      const todayQuestions = todayLogs.reduce((sum, log) => sum + (log.total || 0), 0);

      // Haftalık çalışmalar (son 7 gün)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weeklyLogs = logs.filter(log => {
        try {
          return new Date(log.date) >= weekAgo;
        } catch (e) {
          return false;
        }
      });
      const weeklyQuestions = weeklyLogs.reduce((sum, log) => sum + (log.total || 0), 0);

      // Ders bazında istatistikler
      const subjectData = {};
      logs.forEach(log => {
        const subject = log.subject || 'Bilinmeyen';
        if (!subjectData[subject]) {
          subjectData[subject] = {
            totalQuestions: 0,
            totalNet: 0,
            sessions: 0,
            lastStudied: log.date || 'Bilinmiyor'
          };
        }
        subjectData[subject].totalQuestions += (log.total || 0);
        subjectData[subject].totalNet += (log.netScore || 0);
        subjectData[subject].sessions += 1;
      });

      setStats({
        totalQuestions,
        totalCorrect,
        totalNet: Math.round((totalNet || 0) * 10) / 10,
        averageSuccess: Math.round((averageSuccess || 0) * 10) / 10,
        todayQuestions,
        weeklyQuestions,
        totalSessions: logs.length
      });

      // Son 5 çalışma - güvenli şekilde
      const safeLogs = logs.slice(0, 5).map(log => ({
        ...log,
        netScore: log.netScore || 0,
        successRate: log.successRate || 0,
        total: log.total || 0,
        subject: log.subject || 'Bilinmeyen',
        topic: log.topic || 'Bilinmeyen',
        date: log.date || 'Bilinmiyor',
        metTarget: log.metTarget || false
      }));

      setRecentLogs(safeLogs);
      setSubjectStats(subjectData);

    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getMotivationMessage = () => {
    const { todayQuestions = 0, averageSuccess = 0 } = stats;
    
    if (todayQuestions === 0) {
      return "🌅 Günaydın! Bugün çalışmaya başlayalım!";
    } else if (todayQuestions >= 50) {
      return "🔥 Harika! Bugün çok verimli geçiyor!";
    } else if (averageSuccess >= 70) {
      return "⭐ Başarı oranın çok iyi! Böyle devam!";
    } else if (averageSuccess >= 50) {
      return "📈 İyi gidiyorsun! Biraz daha çalışalım!";
    } else {
      return "💪 Çalışmaya devam! Başarı yakında!";
    }
  };

  const getProgressColor = () => {
    const success = stats.averageSuccess || 0;
    if (success >= 70) return '#4CAF50';
    if (success >= 50) return '#FF9800';
    return '#F44336';
  };

  const getProgressGradient = () => {
    const success = stats.averageSuccess || 0;
    if (success >= 70) return ['#4CAF50', '#66BB6A'];
    if (success >= 50) return ['#FF9800', '#FFB74D'];
    return ['#F44336', '#EF5350'];
  };

  if (stats.totalSessions === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🎯</Text>
          <Text style={styles.emptyTitle}>Başarı Takip</Text>
          <Text style={styles.emptyText}>
            Henüz çalışma kaydın yok.{'\n'}
            Çalışma sekmesinden başlayabilirsin!
          </Text>
          <View style={styles.emptyGradientButton}>
            <Text style={styles.emptyButtonText}>🚀 Hemen Başla</Text>
          </View>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>🎯 Başarı Çizelgesi</Text>
          <Text style={styles.headerSubtitle}>{getMotivationMessage()}</Text>
        </View>
      </View>

      {/* Ana Progress Card */}
      <View style={styles.mainProgressCard}>
        <View style={styles.progressContainer}>
          <Progress.Circle
            progress={Math.max(0, Math.min(1, (stats.averageSuccess || 0) / 100))}
            size={120}
            showsText={true}
            formatText={() => `${Math.round(stats.averageSuccess || 0)}%`}
            color={getProgressColor()}
            thickness={8}
            strokeCap="round"
            borderWidth={0}
            unfilledColor="#f0f0f0"
          />
          <Text style={styles.progressLabel}>Ortalama Başarı</Text>
        </View>
        
        <View style={styles.progressStats}>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{stats.totalNet}</Text>
            <Text style={styles.progressStatLabel}>Toplam Net</Text>
          </View>
          <View style={styles.progressStat}>
            <Text style={styles.progressStatNumber}>{stats.totalSessions}</Text>
            <Text style={styles.progressStatLabel}>Çalışma Oturumu</Text>
          </View>
        </View>
      </View>

      {/* Quick Stats Grid */}
      <View style={styles.quickStatsGrid}>
        <View style={[styles.statCard, styles.todayCard]}>
          <Text style={styles.statEmoji}>📅</Text>
          <Text style={styles.statNumber}>{stats.todayQuestions}</Text>
          <Text style={styles.statLabel}>Bugün</Text>
        </View>
        
        <View style={[styles.statCard, styles.weekCard]}>
          <Text style={styles.statEmoji}>📊</Text>
          <Text style={styles.statNumber}>{stats.weeklyQuestions}</Text>
          <Text style={styles.statLabel}>Bu Hafta</Text>
        </View>
        
        <View style={[styles.statCard, styles.totalCard]}>
          <Text style={styles.statEmoji}>🎯</Text>
          <Text style={styles.statNumber}>{stats.totalQuestions}</Text>
          <Text style={styles.statLabel}>Toplam Soru</Text>
        </View>
      </View>

      {/* Subject Performance */}
      <View style={styles.subjectSection}>
        <Text style={styles.sectionTitle}>📚 Ders Performansı</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.subjectCardsContainer}>
            {Object.entries(subjectStats).map(([subject, data]) => (
              <View key={subject} style={styles.subjectCard}>
                <View style={styles.subjectCardHeader}>
                  <Text style={styles.subjectEmoji}>
                    {subject === 'Matematik' ? '🔢' :
                     subject === 'Fen Bilimleri' ? '🔬' :
                     subject === 'Türkçe' ? '📝' :
                     subject === 'İngilizce' ? '🌍' :
                     subject === 'Din Kültürü' ? '☪️' :
                     subject === 'İnkılap' ? '🏛️' : '📖'}
                  </Text>
                  <Text style={styles.subjectName}>{subject}</Text>
                </View>
                
                <View style={styles.subjectStats}>
                  <Text style={styles.subjectNet}>
                    {Math.round((data.totalNet || 0) * 10) / 10} net
                  </Text>
                  <Text style={styles.subjectSessions}>
                    {data.sessions} oturum
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>📝 Son Çalışmalar</Text>
        {recentLogs.map((log, index) => (
          <View key={index} style={styles.recentCard}>
            <View style={styles.recentHeader}>
              <View>
                <Text style={styles.recentSubject}>{log.subject}</Text>
                <Text style={styles.recentTopic}>{log.topic}</Text>
              </View>
              <View style={styles.recentBadges}>
                <View style={[
                  styles.targetBadge,
                  { backgroundColor: log.metTarget ? '#4CAF50' : '#F44336' }
                ]}>
                  <Text style={styles.targetBadgeText}>
                    {log.metTarget ? '✓' : '!'}
                  </Text>
                </View>
                <Text style={styles.recentDate}>{log.date}</Text>
              </View>
            </View>
            
            <View style={styles.recentStats}>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatValue}>{log.total}</Text>
                <Text style={styles.recentStatLabel}>Soru</Text>
              </View>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatValue}>{log.netScore.toFixed(1)}</Text>
                <Text style={styles.recentStatLabel}>Net</Text>
              </View>
              <View style={styles.recentStatItem}>
                <Text style={styles.recentStatValue}>%{log.successRate.toFixed(0)}</Text>
                <Text style={styles.recentStatLabel}>Başarı</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: '100%',
    maxWidth: 300,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyGradientButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    textAlign: 'center',
    fontWeight: '500',
  },

  // Main Progress Card
  mainProgressCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressLabel: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  progressStatLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  // Quick Stats Grid
  quickStatsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  todayCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  weekCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  totalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },

  // Subject Section
  subjectSection: {
    marginTop: 24,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  subjectCardsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
    gap: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  subjectCardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  subjectStats: {
    alignItems: 'center',
  },
  subjectNet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  subjectSessions: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  // Recent Section
  recentSection: {
    margin: 20,
    marginBottom: 100,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recentSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  recentTopic: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  recentBadges: {
    alignItems: 'flex-end',
  },
  targetBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  targetBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  recentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  recentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  recentStatItem: {
    alignItems: 'center',
  },
  recentStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  recentStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});