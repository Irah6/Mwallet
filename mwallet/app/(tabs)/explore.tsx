import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useGlobalContext } from '../GlobalContext';

export default function ExploreScreen() {
  const { transactions, accounts } = useGlobalContext();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Calculate stats
  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const categoryTotals = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Insights</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Overview Cards */}
        <View style={styles.overviewGrid}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewIconBox}>
              <FontAwesome5 name="plus-circle" size={24} color="#6BCF7F" />
            </View>
            <Text style={styles.overviewLabel}>Total Income</Text>
            <Text style={styles.overviewAmount}>₹{totalIncome.toFixed(2)}</Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIconBox}>
              <FontAwesome5 name="minus-circle" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.overviewLabel}>Total Spent</Text>
            <Text style={styles.overviewAmount}>₹{totalSpent.toFixed(2)}</Text>
          </View>

          <View style={styles.overviewCard}>
            <View style={styles.overviewIconBox}>
              <FontAwesome5 name="wallet" size={24} color="#45B7D1" />
            </View>
            <Text style={styles.overviewLabel}>Total Balance</Text>
            <Text style={styles.overviewAmount}>₹{totalBalance.toFixed(2)}</Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {Object.entries(categoryTotals).length === 0 ? (
            <Text style={styles.emptyText}>No expenses to analyze</Text>
          ) : (
            Object.entries(categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount], index) => {
                const percentage = totalSpent > 0 ? (amount / totalSpent * 100) : 0;
                const isExpanded = expandedCategory === category;

                return (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryItem}
                    onPress={() => setExpandedCategory(isExpanded ? null : category)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.categoryItemLeft}>
                      <View style={[styles.categoryItemIcon, { backgroundColor: getCategoryColor(category) + '20' }]}>
                        <FontAwesome5 
                          name={getCategoryIcon(category)} 
                          size={16} 
                          color={getCategoryColor(category)} 
                        />
                      </View>
                      <View style={styles.categoryItemInfo}>
                        <Text style={styles.categoryItemName}>{category}</Text>
                        <View style={styles.categoryProgressBar}>
                          <View 
                            style={[
                              styles.categoryProgressFill,
                              { 
                                width: `${percentage}%`,
                                backgroundColor: getCategoryColor(category)
                              }
                            ]}
                          />
                        </View>
                      </View>
                    </View>
                    <View style={styles.categoryItemRight}>
                      <Text style={styles.categoryItemAmount}>₹{amount.toFixed(2)}</Text>
                      <Text style={styles.categoryItemPercent}>{percentage.toFixed(0)}%</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </View>

        {/* Accounts Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Accounts</Text>
          {accounts.map(account => (
            <View key={account.id} style={styles.accountItem}>
              <View style={[styles.accountIcon, { backgroundColor: account.color + '20' }]}>
                <Ionicons 
                  name={account.type === 'credit' ? 'card' : 'home'} 
                  size={20} 
                  color={account.color} 
                />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>
                  {account.type === 'credit' ? 'Credit Card' : 'Bank Account'}
                </Text>
              </View>
              <Text style={[styles.accountBalance, account.balance < 0 ? { color: '#FF6B6B' } : { color: '#6BCF7F' }]}>
                {account.balance < 0 ? '-' : ''}₹{Math.abs(account.balance).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconBox}>
                <FontAwesome5 name="download" size={20} color="#6BCF7F" />
              </View>
              <Text style={styles.actionLabel}>Export Data</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconBox}>
                <FontAwesome5 name="chart-pie" size={20} color="#45B7D1" />
              </View>
              <Text style={styles.actionLabel}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconBox}>
                <FontAwesome5 name="bell" size={20} color="#A29BFE" />
              </View>
              <Text style={styles.actionLabel}>Alerts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.actionIconBox}>
                <FontAwesome5 name="cog" size={20} color="#F7B731" />
              </View>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <FontAwesome5 name="lightbulb" size={24} color="#F7B731" />
          <Text style={styles.infoTitle}>Money Tip</Text>
          <Text style={styles.infoText}>
            Try to keep your spending below 80% of your income to build a healthy savings habit.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa'
  },
  scrollContent: {
    paddingBottom: 30,
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
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  overviewIconBox: {
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#999',
    marginBottom: 6,
    textAlign: 'center',
  },
  overviewAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // Section
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Category Item
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItemInfo: {
    flex: 1,
  },
  categoryItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  categoryProgressBar: {
    height: 4,
    backgroundColor: '#e8e8e8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryProgressFill: {
    height: '100%',
  },
  categoryItemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  categoryItemAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  categoryItemPercent: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },

  // Account Item
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  accountType: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Action Grid
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIconBox: {
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
  },

  // Info Card
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
