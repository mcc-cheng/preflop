import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

interface Settlement {
  fromUser: { name: string; email: string };
  toUser: { name: string; email: string };
  amountCents: number;
}

export default function SettlementScreen({ route, navigation }: any) {
  const { code } = route.params;
  const { token } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');

  useEffect(() => {
    fetchSettlement();
  }, []);

  const fetchSettlement = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${code}/settlement`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch settlement');

      const data = await response.json();
      setSettlements(data.settlements || []);
      setRoomName(data.roomName || 'Session');
    } catch (error) {
      console.error('Error fetching settlement:', error);
      Alert.alert('Error', 'Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💰 Settlement</Text>
        <Text style={styles.subtitle}>{roomName}</Text>
      </View>

      <View style={styles.content}>
        {settlements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>All Square! ✅</Text>
            <Text style={styles.emptyText}>
              No payments needed. Everyone broke even!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📱 Tap "Pay" to initiate payment through your preferred method
              </Text>
            </View>

            <View style={styles.settlementsContainer}>
              {settlements.map((settlement, index) => (
                <View key={index} style={styles.settlementCard}>
                  <View style={styles.settlementHeader}>
                    <Text style={styles.fromName}>{settlement.fromUser.name}</Text>
                    <Text style={styles.arrow}>→</Text>
                    <Text style={styles.toName}>{settlement.toUser.name}</Text>
                  </View>
                  
                  <Text style={styles.amount}>
                    {formatCurrency(settlement.amountCents)}
                  </Text>

                  <View style={styles.details}>
                    <Text style={styles.detailText}>
                      From: {settlement.fromUser.email}
                    </Text>
                    <Text style={styles.detailText}>
                      To: {settlement.toUser.email}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.payButton}
                    onPress={() => {
                      Alert.alert(
                        'Payment Options',
                        'Choose your payment method:',
                        [
                          { text: 'Venmo', onPress: () => {} },
                          { text: 'Apple Pay', onPress: () => {} },
                          { text: 'Zelle', onPress: () => {} },
                          { text: 'Cash', onPress: () => {} },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.navigate('Rooms')}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#8b5cf6',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#e9d5ff',
  },
  content: {
    padding: 16,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  settlementsContainer: {
    marginBottom: 20,
  },
  settlementCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settlementHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fromName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    flex: 1,
    textAlign: 'right',
  },
  arrow: {
    fontSize: 20,
    color: '#6b7280',
    marginHorizontal: 12,
  },
  toName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    flex: 1,
    textAlign: 'left',
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  details: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  payButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  doneButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
