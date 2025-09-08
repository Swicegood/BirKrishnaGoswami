import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomHeaderMain from '../components/CustomHeaderMain';
import logger, { LogEntry } from '../utils/logger';

const DebugLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<LogEntry | null>(null);

  const levels = [
    { key: 'all', label: 'All', color: '#666' },
    { key: 'info', label: 'Info', color: '#007AFF' },
    { key: 'warn', label: 'Warn', color: '#FF9500' },
    { key: 'error', label: 'Error', color: '#FF3B30' },
    { key: 'debug', label: 'Debug', color: '#34C759' },
  ];

  const loadLogs = useCallback(() => {
    const currentLogs = logger.getLogs();
    setLogs(currentLogs);
    filterLogs(currentLogs, searchText, selectedLevel);
  }, [searchText, selectedLevel]);

  const filterLogs = useCallback((logList: LogEntry[], search: string, level: string) => {
    let filtered = logList;

    // Filter by level
    if (level !== 'all') {
      filtered = filtered.filter(log => log.level === level);
    }

    // Filter by search text
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchLower) ||
        log.source?.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.data).toLowerCase().includes(searchLower)
      );
    }

    setFilteredLogs(filtered);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
    setRefreshing(false);
  }, [loadLogs]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    filterLogs(logs, text, selectedLevel);
  }, [logs, selectedLevel, filterLogs]);

  const handleLevelChange = useCallback((level: string) => {
    setSelectedLevel(level);
    filterLogs(logs, searchText, level);
  }, [logs, searchText, filterLogs]);

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            logger.clearLogs();
            loadLogs();
          },
        },
      ]
    );
  };

  const exportLogs = () => {
    const logText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}${log.source ? ` (${log.source})` : ''}${log.data ? `\nData: ${JSON.stringify(log.data, null, 2)}` : ''}`
    ).join('\n\n');

    // For now, just show an alert with the logs
    // In a real app, you might want to save to file or share
    Alert.alert('Logs Export', logText.substring(0, 1000) + (logText.length > 1000 ? '...' : ''));
  };

  const getLevelColor = (level: LogEntry['level']): string => {
    const levelConfig = levels.find(l => l.key === level);
    return levelConfig?.color || '#666';
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString();
  };

  const renderLogItem = (log: LogEntry) => (
    <TouchableOpacity
      key={log.id}
      style={[styles.logItem, { borderLeftColor: getLevelColor(log.level) }]}
      onPress={() => setShowDetails(log)}
    >
      <View style={styles.logHeader}>
        <Text style={[styles.logLevel, { color: getLevelColor(log.level) }]}>
          {log.level.toUpperCase()}
        </Text>
        <Text style={styles.logTime}>{formatTimestamp(log.timestamp)}</Text>
      </View>
      <Text style={styles.logMessage} numberOfLines={2}>
        {log.message}
      </Text>
      {log.source && (
        <Text style={styles.logSource}>Source: {log.source}</Text>
      )}
    </TouchableOpacity>
  );

  const renderLogDetails = () => (
    <Modal
      visible={showDetails !== null}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Log Details</Text>
          <TouchableOpacity onPress={() => setShowDetails(null)}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        {showDetails && (
          <ScrollView style={styles.modalContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Level:</Text>
              <Text style={[styles.detailValue, { color: getLevelColor(showDetails.level) }]}>
                {showDetails.level.toUpperCase()}
              </Text>
            </View>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>{showDetails.timestamp.toISOString()}</Text>
            </View>
            {showDetails.source && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Source:</Text>
                <Text style={styles.detailValue}>{showDetails.source}</Text>
              </View>
            )}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Message:</Text>
              <Text style={styles.detailValue}>{showDetails.message}</Text>
            </View>
            {showDetails.data && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Data:</Text>
                <Text style={styles.detailValue}>
                  {JSON.stringify(showDetails.data, null, 2)}
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );

  if (!logger.isDebugEnabled()) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeaderMain title="Debug Logs" />
        <View style={styles.disabledContainer}>
          <Ionicons name="lock-closed" size={64} color="#999" />
          <Text style={styles.disabledText}>Debug logging is disabled</Text>
          <Text style={styles.disabledSubtext}>
            This feature is only available in debug-preview mode
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeaderMain title="Debug Logs" />
      
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {logs.length} | Filtered: {filteredLogs.length}
          </Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={exportLogs}>
            <Ionicons name="download" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Export</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={clearLogs}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search logs..."
          value={searchText}
          onChangeText={handleSearchChange}
          placeholderTextColor="#999"
        />
      </View>

      <ScrollView
        horizontal
        style={styles.levelFilter}
        showsHorizontalScrollIndicator={false}
      >
        {levels.map(level => (
          <TouchableOpacity
            key={level.key}
            style={[
              styles.levelButton,
              selectedLevel === level.key && styles.levelButtonActive,
              { borderColor: level.color }
            ]}
            onPress={() => handleLevelChange(level.key)}
          >
            <Text
              style={[
                styles.levelButtonText,
                selectedLevel === level.key && { color: level.color }
              ]}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={48} color="#999" />
            <Text style={styles.emptyText}>No logs found</Text>
            <Text style={styles.emptySubtext}>
              {searchText || selectedLevel !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Logs will appear here as the app runs'
              }
            </Text>
          </View>
        ) : (
          filteredLogs.map(renderLogItem)
        )}
      </ScrollView>

      {renderLogDetails()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disabledText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  disabledSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsContainer: {
    flex: 1,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  levelFilter: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  levelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    backgroundColor: '#f9f9f9',
  },
  levelButtonActive: {
    backgroundColor: '#f0f8ff',
  },
  levelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  logsContainer: {
    flex: 1,
    padding: 16,
  },
  logItem: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '600',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  logSource: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
});

export default DebugLogsScreen;
