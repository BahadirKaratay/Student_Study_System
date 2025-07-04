import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const SUBJECTS = [
  { name: 'Matematik', emoji: '🔢', color: '#3b82f6' },
  { name: 'Fen Bilimleri', emoji: '🔬', color: '#10b981' },
  { name: 'Türkçe', emoji: '📝', color: '#f59e0b' },
  { name: 'İngilizce', emoji: '🌍', color: '#8b5cf6' },
  { name: 'Din Kültürü', emoji: '☪️', color: '#06b6d4' },
  { name: 'İnkılap', emoji: '🏛️', color: '#dc2626' }
];

export default function ReportScreen() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedView, setSelectedView] = useState('calendar');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [calendarData, setCalendarData] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchLogs = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const studyKeys = keys.filter((key) => key.startsWith('study-log-'));
      
      if (studyKeys.length === 0) {
        setLogs([]);
        setFilteredLogs([]);
        return;
      }

      const items = await AsyncStorage.multiGet(studyKeys);
      const parsed = items.map(([_, value]) => {
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

      // Tarihe göre sırala (en yeni en üstte)
      parsed.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setLogs(parsed);
      applyFilters(parsed, selectedSubject);
      generateCalendarData(parsed);
      
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    }
  }, [selectedSubject]);

  const applyFilters = (allLogs, subject) => {
    let filtered = [...allLogs];
    
    if (subject !== 'all') {
      filtered = filtered.filter(log => log.subject === subject);
    }
    
    setFilteredLogs(filtered);
  };

  const generateCalendarData = (allLogs) => {
    const calData = {};
    
    allLogs.forEach(log => {
      const date = log.date;
      if (!calData[date]) {
        calData[date] = {
          totalQuestions: 0,
          totalNet: 0,
          sessions: 0,
          subjects: new Set(),
          metAllTargets: true,
          logs: []
        };
      }
      
      calData[date].totalQuestions += log.total;
      calData[date].totalNet += log.netScore;
      calData[date].sessions += 1;
      calData[date].subjects.add(log.subject);
      calData[date].logs.push(log);
      
      if (!log.metTarget) {
        calData[date].metAllTargets = false;
      }
    });
    
    setCalendarData(calData);
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLogs();
    setRefreshing(false);
  }, [fetchLogs]);

  const handleSubjectFilter = (subject) => {
    setSelectedSubject(subject);
    applyFilters(logs, subject);
  };

  const getDayColor = (date) => {
    const dayData = calendarData[date];
    if (!dayData) return '#f8fafc'; // Açık gri - çalışma yok
    
    if (dayData.metAllTargets && dayData.totalQuestions >= 20) {
      return '#dcfce7'; // Açık yeşil - hedefler başarılı
    } else if (dayData.totalQuestions > 0) {
      return '#fef3c7'; // Açık sarı - kısmen çalışılmış
    } else {
      return '#fee2e2'; // Açık kırmızı - hedeflere ulaşılamamış
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Önceki ayın günleri (boş)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({ day, date });
    }
    
    return days;
  };

  const showDayDetails = (date) => {
    const dayData = calendarData[date];
    if (!dayData) {
      Alert.alert('Bilgi', 'Bu günde çalışma kaydı yok.');
      return;
    }

    const details = dayData.logs.map(log => 
      `${log.subject}: ${log.total} soru (${log.netScore.toFixed(1)} net)`
    ).join('\n');

    Alert.alert(
      `📅 ${date}`,
      `Toplam: ${dayData.totalQuestions} soru\n` +
      `Net: ${dayData.totalNet.toFixed(1)}\n` +
      `Oturum: ${dayData.sessions}\n\n` +
      `Detaylar:\n${details}`,
      [{ text: 'Tamam' }]
    );
  };

  const getSubjectSummary = () => {
    const summary = {};
    
    filteredLogs.forEach(log => {
      if (!summary[log.subject]) {
        summary[log.subject] = {
          totalQuestions: 0,
          totalNet: 0,
          sessions: 0,
          averageSuccess: 0
        };
      }
      
      summary[log.subject].totalQuestions += log.total;
      summary[log.subject].totalNet += log.netScore;
      summary[log.subject].sessions += 1;
    });

    // Ortalama hesapla
    Object.keys(summary).forEach(subject => {
      const subjectLogs = filteredLogs.filter(log => log.subject === subject);
      const avgSuccess = subjectLogs.reduce((sum, log) => sum + log.successRate, 0) / subjectLogs.length;
      summary[subject].averageSuccess = avgSuccess;
    });

    return summary;
  };

  if (logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Rapor Ekranı</Text>
          <Text style={styles.emptyText}>
            Henüz çalışma kaydın yok.{'\n'}
            Çalışma sekmesinden veri gir!
          </Text>
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
      <View style={styles.headerGradient}>
        <Text style={styles.headerTitle}>📊 Raporlar</Text>
        <Text style={styles.headerSubtitle}>Çalışma analizin</Text>
      </View>

      {/* View Toggle Card */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton, 
              selectedView === 'calendar' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedView('calendar')}
          >
            <Text style={[
              styles.toggleText, 
              selectedView === 'calendar' && styles.toggleTextActive
            ]}>
              📅 Takvim
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              selectedView === 'list' && styles.toggleButtonActive
            ]}
            onPress={() => setSelectedView('list')}
          >
            <Text style={[
              styles.toggleText,
              selectedView === 'list' && styles.toggleTextActive
            ]}>
              📋 Liste
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Subject Filter */}
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Ders Filtresi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedSubject === 'all' && styles.filterChipActive
              ]}
              onPress={() => handleSubjectFilter('all')}
            >
              <Text style={[
                styles.filterChipText,
                selectedSubject === 'all' && styles.filterChipTextActive
              ]}>
                🎯 Tümü
              </Text>
            </TouchableOpacity>
            
            {SUBJECTS.map(subject => (
              <TouchableOpacity
                key={subject.name}
                style={[
                  styles.filterChip,
                  selectedSubject === subject.name && styles.filterChipActive,
                  selectedSubject === subject.name && { backgroundColor: subject.color }
                ]}
                onPress={() => handleSubjectFilter(subject.name)}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedSubject === subject.name && styles.filterChipTextActive
                ]}>
                  {subject.emoji} {subject.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {selectedView === 'calendar' && (
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() - 1);
                setCurrentDate(newDate);
              }}
            >
              <Text style={styles.navButtonText}>◀</Text>
            </TouchableOpacity>
            
            <Text style={styles.monthYear}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => {
                const newDate = new Date(currentDate);
                newDate.setMonth(currentDate.getMonth() + 1);
                setCurrentDate(newDate);
              }}
            >
              <Text style={styles.navButtonText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {/* Day Headers */}
            {['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'].map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
            
            {/* Calendar Days */}
            {generateCalendarDays().map((dayObj, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  dayObj && { backgroundColor: getDayColor(dayObj.date) }
                ]}
                onPress={() => dayObj && showDayDetails(dayObj.date)}
                disabled={!dayObj}
              >
                {dayObj && (
                  <>
                    <Text style={styles.dayNumber}>{dayObj.day}</Text>
                    {calendarData[dayObj.date] && (
                      <View style={styles.dayBadge}>
                        <Text style={styles.dayQuestions}>
                          {calendarData[dayObj.date].totalQuestions}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Modern Legend */}
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>Renk Açıklaması</Text>
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#dcfce7' }]} />
                <Text style={styles.legendText}>Hedef Başarılı</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#fef3c7' }]} />
                <Text style={styles.legendText}>Kısmen Çalışılmış</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f8fafc' }]} />
                <Text style={styles.legendText}>Çalışma Yok</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {selectedView === 'list' && (
        <>
          {/* Subject Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>📈 Ders Özeti</Text>
            {Object.entries(getSubjectSummary()).map(([subject, data]) => {
              const subjectInfo = SUBJECTS.find(s => s.name === subject);
              return (
                <View key={subject} style={styles.summaryItem}>
                  <View style={styles.summaryHeader}>
                    <View style={styles.summarySubjectInfo}>
                      <Text style={styles.summaryEmoji}>
                        {subjectInfo?.emoji || '📖'}
                      </Text>
                      <Text style={styles.summarySubject}>{subject}</Text>
                    </View>
                    <View style={[
                      styles.successBadge,
                      { backgroundColor: data.averageSuccess >= 70 ? '#dcfce7' : 
                                        data.averageSuccess >= 50 ? '#fef3c7' : '#fee2e2' }
                    ]}>
                      <Text style={[
                        styles.successText,
                        { color: data.averageSuccess >= 70 ? '#16a34a' : 
                                 data.averageSuccess >= 50 ? '#d97706' : '#dc2626' }
                      ]}>
                        %{Math.round(data.averageSuccess)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryStats}>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>{data.totalQuestions}</Text>
                      <Text style={styles.summaryStatLabel}>soru</Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>{data.totalNet.toFixed(1)}</Text>
                      <Text style={styles.summaryStatLabel}>net</Text>
                    </View>
                    <View style={styles.summaryStatItem}>
                      <Text style={styles.summaryStatValue}>{data.sessions}</Text>
                      <Text style={styles.summaryStatLabel}>oturum</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Detailed List */}
          <View style={styles.listCard}>
            <Text style={styles.cardTitle}>📝 Detaylı Liste</Text>
            {filteredLogs.map((log, index) => {
              const subjectInfo = SUBJECTS.find(s => s.name === log.subject);
              return (
                <View key={index} style={styles.logItem}>
                  <View style={styles.logHeader}>
                    <View style={styles.logSubjectInfo}>
                      <Text style={styles.logEmoji}>
                        {subjectInfo?.emoji || '📖'}
                      </Text>
                      <View>
                        <Text style={styles.logSubject}>{log.subject}</Text>
                        <Text style={styles.logTopic}>{log.topic}</Text>
                      </View>
                    </View>
                    <View style={styles.logBadges}>
                      <View style={[
                        styles.targetBadge,
                        { backgroundColor: log.metTarget ? '#dcfce7' : '#fee2e2' }
                      ]}>
                        <Text style={[
                          styles.targetBadgeText,
                          { color: log.metTarget ? '#16a34a' : '#dc2626' }
                        ]}>
                          {log.metTarget ? '✓' : '!'}
                        </Text>
                      </View>
                      <Text style={styles.logDate}>{log.date}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.logStats}>
                    <View style={styles.logStatGroup}>
                      <Text style={styles.logStatLabel}>D: {log.correct}</Text>
                      <Text style={styles.logStatLabel}>Y: {log.wrong}</Text>
                      <Text style={styles.logStatLabel}>B: {log.blank}</Text>
                    </View>
                    <View style={styles.logResults}>
                      <Text style={styles.logNet}>
                        {log.netScore.toFixed(1)} net
                      </Text>
                      <Text style={styles.logSuccess}>
                        %{log.successRate.toFixed(0)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
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
  },

  // Header
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#3b82f6',
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

  // Cards
  toggleCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -16,
    borderRadius: 20,
    padding: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  toggleButtonActive: {
    backgroundColor: '#3b82f6',
    elevation: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#fff',
  },

  // Filter
  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#fff',
  },

  // Calendar
  calendarCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeader: {
    width: '14.28%',
    paddingVertical: 8,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 'bold',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 1,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 6,
    minWidth: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayQuestions: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },

  // Legend
  legendCard: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 10,
    color: '#64748b',
  },

  // Summary & List
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 100,
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 16,
  },

  // Summary Items
  summaryItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summarySubjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  summarySubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  successBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  successText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },

  // Log Items
  logItem: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  logSubjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  logSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  logTopic: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  logBadges: {
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
    fontSize: 12,
    fontWeight: 'bold',
  },
  logDate: {
    fontSize: 12,
    color: '#64748b',
  },
  logStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logStatGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  logStatLabel: {
    fontSize: 12,
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logResults: {
    alignItems: 'flex-end',
  },
  logNet: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  logSuccess: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
  },
});