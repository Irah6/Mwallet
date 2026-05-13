import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../GlobalContext';

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'Food & Drinks': 'utensils',
    'Shopping': 'shopping-bag',
    'Transport': 'car',
    'Bills': 'file-invoice-dollar',
    'Entertainment': 'film',
    'Income': 'money-bill',
    'Uncategorized': 'tag',
  };
  return icons[category] || 'tag';
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Food & Drinks': '#FF6B6B',
    'Shopping': '#4ECDC4',
    'Transport': '#45B7D1',
    'Bills': '#F7B731',
    'Entertainment': '#A29BFE',
    'Income': '#6BCF7F',
    'Uncategorized': '#BDC3C7',
  };
  return colors[category] || '#BDC3C7';
};

export default function HistoryScreen() {
  const { transactions } = useGlobalContext();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'groups'>('all');

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchText.toLowerCase()) ||
    t.category.toLowerCase().includes(searchText.toLowerCase())
  );

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((acc, tx) => {
    const dateKey = new Date(tx.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(tx);
    return acc;
  }, {} as Record<string, any[]>);

  const transactionsByDate = Object.entries(groupedTransactions);

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
        <FontAwesome5 
          name={getCategoryIcon(item.category)} 
          size={14} 
          color={getCategoryColor(item.category)} 
        />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionName}>{item.description}</Text>
        <View style={styles.transactionMeta}>
          <Ionicons name="time" size={12} color="#999" />
          <Text style={styles.transactionTime}>
            {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={[styles.transactionBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Text style={[styles.transactionBadgeText, { color: getCategoryColor(item.category) }]}>
              {item.type === 'expense' ? item.category : 'INCOME'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.transactionAmount, item.type === 'income' ? { color: '#6BCF7F' } : { color: '#FF6B6B' }]}>
        {item.type === 'income' ? '+' : '-'}₹{item.amount.toFixed(2)}
      </Text>
    </View>
  );

  const renderDateGroup = ({ item: [date, txList] }: { item: [string, any[]] }) => (
    <View style={styles.dateGroup}>
      <View style={styles.dateHeader}>
        <Text style={styles.dateLabel}>{date}</Text>
        <Text style={styles.dateCount}>{txList.length} transactions</Text>
      </View>
      {txList.map((tx) => (
        <View key={tx.id}>
          {renderTransaction({ item: tx })}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="document-text" size={20} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="add-circle" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions"
          placeholderTextColor="#bbb"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="funnel" size={18} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'groups' && styles.tabActive]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.tabTextActive]}>Groups</Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoIcon}>
          <Ionicons name="tablet-portrait" size={24} color="#6BCF7F" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Ad space available</Text>
          <Text style={styles.infoText}>We may use this space to show ads. Fold Plus shows no ads.</Text>
        </View>
        <TouchableOpacity style={styles.learnMoreButton}>
          <Text style={styles.learnMoreText}>Learn more</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactionsByDate}
        renderItem={renderDateGroup}
        keyExtractor={(item) => item[0]}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FontAwesome5 name="inbox" size={48} color="#ddd" />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1a1a1a',
  },
  filterButton: {
    padding: 8,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  tab: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1a1a1a',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#999',
  },
  tabTextActive: {
    color: '#1a1a1a',
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f0f8f5',
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e8f7f3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  learnMoreButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1a5c45',
    borderRadius: 6,
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Transactions
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  dateCount: {
    fontSize: 12,
    color: '#999',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  transactionTime: {
    fontSize: 11,
    color: '#999',
  },
  transactionBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  transactionBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
  },
});