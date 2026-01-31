import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

interface Player {
  user: {
    id: string;
    name: string;
    email: string;
  };
  net: number;
}

interface Event {
  id: string;
  type: string;
  amountCents: number;
  createdAt: string;
  user: {
    name: string;
  };
}

interface Room {
  id: string;
  code: string;
  name: string;
  status: string;
  defaultBuyInCents: number;
}

export default function RoomDetailScreen({ route, navigation }: any) {
  const { code } = route.params;
  const { token, user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals
  const [buyInModalVisible, setBuyInModalVisible] = useState(false);
  const [cashOutModalVisible, setCashOutModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRoomData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch room');

      const data = await response.json();
      setRoom(data.room);
      setPlayers(data.players || []);
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error fetching room:', error);
      Alert.alert('Error', 'Failed to load session data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code, token]);

  useEffect(() => {
    fetchRoomData();
    // Auto-refresh every 10 seconds when active
    const interval = setInterval(fetchRoomData, 10000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoomData();
  };

  const handleBuyIn = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/${code}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'BUY_IN',
          amountCents: Math.round(amountNum * 100),
        }),
      });

      if (!response.ok) throw new Error('Failed to record buy-in');

      setBuyInModalVisible(false);
      setAmount('');
      fetchRoomData();
      Alert.alert('Success', 'Buy-in recorded!');
    } catch (error) {
      console.error('Error recording buy-in:', error);
      Alert.alert('Error', 'Failed to record buy-in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCashOut = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/rooms/${code}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'CASH_OUT',
          amountCents: Math.round(amountNum * 100),
        }),
      });

      if (!response.ok) throw new Error('Failed to record cash-out');

      setCashOutModalVisible(false);
      setAmount('');
      fetchRoomData();
      Alert.alert('Success', 'Cash-out recorded!');
    } catch (error) {
      console.error('Error recording cash-out:', error);
      Alert.alert('Error', 'Failed to record cash-out');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = () => {
    if (room?.status === 'ENDED') {
      navigation.navigate('Settlement', { code });
      return;
    }

    Alert.alert(
      'End Session?',
      'This will calculate final settlements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/api/rooms/${code}/end`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (!response.ok) throw new Error('Failed to end session');

              navigation.navigate('Settlement', { code });
            } catch (error) {
              console.error('Error ending session:', error);
              Alert.alert('Error', 'Failed to end session');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getNetColor = (cents: number) => {
    if (cents > 0) return '#10b981';
    if (cents < 0) return '#ef4444';
    return '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!room) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{room.name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Session Code:</Text>
            <Text style={styles.code}>{room.code}</Text>
          </View>
        </View>

        {/* Player Standings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Standings</Text>
          {players.map((player) => (
            <View key={player.user.id} style={styles.playerCard}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.user.name}</Text>
                <Text style={styles.playerEmail}>{player.user.email}</Text>
              </View>
              <Text style={[styles.playerNet, { color: getNetColor(player.net) }]}>
                {player.net >= 0 ? '+' : ''}{formatCurrency(player.net)}
              </Text>
            </View>
          ))}
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {events.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View>
                  <Text style={styles.eventType}>
                    {event.type === 'BUY_IN' ? '💵 Buy-in' : '💰 Cash-out'}
                  </Text>
                  <Text style={styles.eventUser}>{event.user.name}</Text>
                  <Text style={styles.eventTime}>
                    {new Date(event.createdAt).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.eventAmount}>
                  {formatCurrency(event.amountCents)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {room.status === 'ACTIVE' && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.buyInButton]}
            onPress={() => {
              setAmount((room.defaultBuyInCents / 100).toString());
              setBuyInModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Buy-In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.cashOutButton]}
            onPress={() => {
              setAmount('');
              setCashOutModalVisible(true);
            }}
          >
            <Text style={styles.actionButtonText}>Cash-Out</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.endButton]}
            onPress={handleEndSession}
          >
            <Text style={styles.actionButtonText}>End</Text>
          </TouchableOpacity>
        </View>
      )}

      {room.status === 'ENDED' && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, styles.settlementButton]}
            onPress={handleEndSession}
          >
            <Text style={styles.actionButtonText}>View Settlement</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Buy-In Modal */}
      <Modal
        visible={buyInModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBuyInModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Buy-In</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount ($)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleBuyIn}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Record Buy-In</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setBuyInModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cash-Out Modal */}
      <Modal
        visible={cashOutModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCashOutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Cash-Out</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Amount ($)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleCashOut}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Record Cash-Out</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setCashOutModalVisible(false)}
            >
              <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  code: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#3b82f6',
    letterSpacing: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  playerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  playerEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  playerNet: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
  },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  eventUser: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 11,
    color: '#9ca3af',
  },
  eventAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyInButton: {
    backgroundColor: '#3b82f6',
  },
  cashOutButton: {
    backgroundColor: '#10b981',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  settlementButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#111827',
    marginBottom: 16,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#3b82f6',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
