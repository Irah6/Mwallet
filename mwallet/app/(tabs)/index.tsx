import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ScrollView,
  Dimensions,
  ListRenderItemInfo,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  Modal,
  Button,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import SmsAndroid from 'react-native-get-sms-android';
import { Picker } from '@react-native-picker/picker';
import { parseSms, ParsedTransaction } from './smsParser';
import { useGlobalContext, Transaction, Account } from '../GlobalContext';

// --- Constants and Types ---

const formatCompact = (num: number) => {
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toFixed(0);
};

const CATEGORIES = ['Uncategorized', 'Food & Drinks', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Income'];

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

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;

// --- Sub-components ---

const BalanceCard = ({
  totalBalance,
  onMenu
}: {
  totalBalance: number;
  onMenu: () => void;
}) => (
  <View style={styles.balanceCard}>
    <View style={styles.balanceHeader}>
      <View>
        <Text style={styles.balanceLabel}>Total Balance</Text>
      </View>
      <TouchableOpacity onPress={onMenu}>
        <Ionicons name="ellipsis-vertical" size={20} color="#333" />
      </TouchableOpacity>
    </View>
    <Text style={styles.balanceAmount}>₹{totalBalance.toFixed(2)}</Text>
    <View style={styles.balanceChart}>
      <View style={[styles.chartBar, { height: '40%', backgroundColor: '#6BCF7F' }]} />
      <View style={[styles.chartBar, { height: '70%', backgroundColor: '#6BCF7F' }]} />
      <View style={[styles.chartBar, { height: '50%', backgroundColor: '#6BCF7F' }]} />
      <View style={[styles.chartBar, { height: '85%', backgroundColor: '#6BCF7F' }]} />
    </View>
  </View>
);

const SpendingCategoriesCard = ({
  categoryTotals,
}: {
  categoryTotals: Record<string, number>;
}) => (
  <View style={styles.categoryCard}>
    <View style={styles.categoryCardHeader}>
      <Text style={styles.categoryCardTitle}>Spending Summary</Text>
      <TouchableOpacity>
        <Ionicons name="ellipsis-vertical" size={18} color="#666" />
      </TouchableOpacity>
    </View>
    
    <Text style={styles.monthLabel}>MAY 2026</Text>
    
    <View style={styles.categoryIconsRow}>
      {Object.keys(categoryTotals).slice(0, 4).map((cat) => (
        <View key={cat} style={styles.categoryIcon}>
          <View style={[styles.iconBg, { backgroundColor: getCategoryColor(cat) + '20' }]}>
            <FontAwesome5 
              name={getCategoryIcon(cat)} 
              size={16} 
              color={getCategoryColor(cat)} 
            />
          </View>
          <Text style={styles.categoryIconLabel}>{categoryTotals[cat] > 0 ? '2' : '0'}</Text>
        </View>
      ))}
    </View>

    <View style={styles.categoryListDivider} />

    {Object.entries(categoryTotals).slice(0, 5).map(([cat, amount]) => (
      <View key={cat} style={styles.categoryListItem}>
        <Text style={styles.categoryListName}>{cat}</Text>
        <Text style={styles.categoryListAmount}>-₹{amount.toFixed(2)}</Text>
      </View>
    ))}
  </View>
);

const TransactionDetailModal = ({ 
  transaction, 
  visible, 
  onClose,
  onCategoryChange 
}: { 
  transaction: Transaction | null; 
  visible: boolean; 
  onClose: () => void;
  onCategoryChange: (category: string, id: string) => void;
}) => {
  if (!transaction) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Transaction Details</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.amountBox}>
              <Text style={[styles.amount, transaction.type === 'expense' ? { color: '#FF6B6B' } : { color: '#6BCF7F' }]}>
                {transaction.type === 'income' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
              </Text>
              <Text style={styles.amountLabel}>{transaction.type === 'expense' ? 'EXPENSE' : 'INCOME'}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Received in</Text>
              <View style={styles.detailValueBox}>
                <FontAwesome5 name={getCategoryIcon(transaction.category)} size={14} color={getCategoryColor(transaction.category)} />
                <Text style={styles.detailValue}>{transaction.account || transaction.category}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>On</Text>
              <Text style={styles.detailValue}>{new Date(transaction.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{transaction.category}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={transaction.category}
                  onValueChange={(itemValue) => onCategoryChange(itemValue, transaction.id)}
                  style={styles.picker}
                >
                  {CATEGORIES.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.notesSection}>
              <Ionicons name="document-text" size={20} color="#666" />
              <Text style={styles.notesLabel}>Add notes to remember this transaction</Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- Main Screen Component ---

export default function DashboardScreen() {
  const { transactions, setTransactions, accounts, setAccounts } = useGlobalContext();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAccountEditVisible, setAccountEditVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountBalance, setEditAccountBalance] = useState('');
  const [editAccountLimit, setEditAccountLimit] = useState('');

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const now = new Date();
  const currentMonthTx = transactions.filter(t => t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear());
  const categoryTotals = currentMonthTx.filter(t => t.type === 'expense').reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const handleSyncSms = useCallback(async () => {
    if (Platform.OS !== 'android') { return; }

    try {
      const hasPermission = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS);
      if (hasPermission !== PermissionsAndroid.RESULTS.GRANTED) {
        alert("SMS permission is required to read transactions.");
        return;
      }

      setLoading(true);
      const filter = {
        box: 'inbox',
        maxCount: 100,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: any) => {
          console.log('Failed to read SMS', fail);
          alert('Failed to read SMS.');
          setLoading(false);
        },
        (count: number, smsList: string) => {
          const parsedSmsList: Transaction[] = [];
          const smsArray = JSON.parse(smsList);
          const newAccountsMap = new Map<string, Account>();

          for (const sms of smsArray) {
            const parsed = parseSms(sms);
            if (parsed) {
              parsedSmsList.push({ ...parsed, category: 'Uncategorized' });
              if (parsed.account && !newAccountsMap.has(parsed.account)) {
                newAccountsMap.set(parsed.account, {
                  id: Math.random().toString(),
                  name: parsed.account,
                  balance: 0,
                  color: '#' + (Math.random() * 0xFFFFFF << 0).toString(16).padStart(6, '0'),
                  type: parsed.account.toLowerCase().includes('card') ? 'credit' : 'bank'
                });
              }
            }
          }

          setAccounts(prev => {
            const existingNames = new Set(prev.map(a => a.name));
            const accountsToAdd = Array.from(newAccountsMap.values()).filter(a => !existingNames.has(a.name));
            return [...prev, ...accountsToAdd];
          });

          setTransactions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newUniqueTxs = parsedSmsList.filter(t => !existingIds.has(t.id));
            return [...newUniqueTxs, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime());
          });
          setLoading(false);
        },
      );
    } catch (err) {
      console.warn(err);
      setLoading(false);
    }
  }, []);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalVisible(true);
  };

  const handleCategoryChange = (categoryId: string, transactionId: string) => {
    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId ? { ...t, category: categoryId } : t
      )
    );
  };

  const openAccountEdit = (account: Account) => {
    setEditingAccount(account);
    setEditAccountName(account.name);
    setEditAccountBalance(account.balance.toString());
    setEditAccountLimit(account.limit ? account.limit.toString() : '');
    setAccountEditVisible(true);
  };

  const saveAccountEdit = () => {
    if (!editingAccount) return;
    const newBalance = parseFloat(editAccountBalance);
    const newLimit = parseFloat(editAccountLimit);
    setAccounts(prev => prev.map(acc => 
      acc.id === editingAccount.id 
        ? { 
            ...acc, 
            name: editAccountName || acc.name,
            balance: isNaN(newBalance) ? acc.balance : newBalance, 
            limit: acc.type === 'credit' && !isNaN(newLimit) ? newLimit : acc.limit 
          } 
        : acc
    ));
    setAccountEditVisible(false);
  };

  const renderTransaction = ({ item }: ListRenderItemInfo<Transaction>) => (
    <TouchableOpacity 
      onPress={() => handleTransactionPress(item)}
      style={styles.transactionItem}
      activeOpacity={0.7}
    >
      <View style={styles.transactionLeft}>
        <View style={[styles.transactionIcon, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <FontAwesome5 
            name={getCategoryIcon(item.category)} 
            size={16} 
            color={getCategoryColor(item.category)} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionName}>{item.description}</Text>
          <Text style={styles.transactionTime}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, item.type === 'expense' ? { color: '#FF6B6B' } : { color: '#6BCF7F' }]}>
          {item.type === 'income' ? '+' : '-'}₹{item.amount.toFixed(2)}
        </Text>
        <View style={[styles.transactionBadge, { backgroundColor: getCategoryColor(item.category) + '15' }]}>
          <Text style={[styles.transactionBadgeText, { color: getCategoryColor(item.category) }]}>
            {item.category}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <TransactionDetailModal
        transaction={selectedTransaction}
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onCategoryChange={handleCategoryChange}
      />

      {/* Account Edit Modal */}
      <Modal visible={isAccountEditVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>Edit Account</Text>
            
            <Text style={styles.editLabel}>Account Name:</Text>
            <TextInput style={styles.editInput} value={editAccountName} onChangeText={setEditAccountName} placeholder="Enter name" placeholderTextColor="#bbb" />

            <Text style={styles.editLabel}>Balance:</Text>
            <TextInput style={styles.editInput} keyboardType="numeric" value={editAccountBalance} onChangeText={setEditAccountBalance} placeholder="Enter balance" placeholderTextColor="#bbb" />
            
            {editingAccount?.type === 'credit' && (
              <>
                <Text style={styles.editLabel}>Credit Limit:</Text>
                <TextInput style={styles.editInput} keyboardType="numeric" value={editAccountLimit} onChangeText={setEditAccountLimit} placeholder="Enter limit" placeholderTextColor="#bbb" />
              </>
            )}
            
            <View style={styles.editButtonContainer}>
              <TouchableOpacity 
                onPress={() => setAccountEditVisible(false)} 
                style={[styles.editButton, { backgroundColor: '#f5f5f5' }]}
              >
                <Text style={[styles.editButtonText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={saveAccountEdit} 
                style={[styles.editButton, { backgroundColor: '#6BCF7F' }]}
              >
                <Text style={[styles.editButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity onPress={handleSyncSms} disabled={loading} style={styles.syncButton}>
          {loading ? <ActivityIndicator color="#6BCF7F" /> : <Ionicons name="sync" size={20} color="#6BCF7F" />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentMonthTx}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <>
            <BalanceCard totalBalance={totalBalance} onMenu={() => {}} />
            <SpendingCategoriesCard categoryTotals={categoryTotals} />
            <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          </>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
}

// --- Styles ---

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
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  syncButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  balanceChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 40,
    gap: 6,
  },
  chartBar: {
    flex: 1,
    backgroundColor: '#6BCF7F',
    borderRadius: 4,
  },

  // Category Card
  categoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  categoryIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryIcon: {
    alignItems: 'center',
    gap: 6,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoryListDivider: {
    height: 1,
    backgroundColor: '#e8e8e8',
    marginBottom: 12,
  },
  categoryListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  categoryListName: {
    fontSize: 14,
    color: '#333',
  },
  categoryListAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Transaction Item
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  transactionBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  amountBox: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 20,
  },
  amount: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginTop: 4,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notesLabel: {
    fontSize: 14,
    color: '#666',
  },
  closeButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#6BCF7F',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Edit Modal
  editModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 'auto',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  editButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
