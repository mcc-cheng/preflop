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

interface RoomMember {
  userId: string;
  user: { id: string; name: string; username: string };
}

interface RoomEvent {
  id: string;
  type: 'BUY_IN' | 'REBUY' | 'CASH_OUT';
  amount: number; // cents
  userId: string;
  createdAt: string;
  user: { name: string };
}

interface BuyInRequest {
  id: string;
  userId: string;
  type: 'BUY_IN' | 'REBUY';
  amountCents: number;
  status: string;
}

interface CashOutRequest {
  id: string;
  userId: string;
  amountCents: number;
  status: string;
}

interface ChipType {
  color: string;
  denomination: number; // cents
}

interface Room {
  id: string;
  code: string;
  hostId: string;
  endedAt: string | null;
  settings: { name: string; blinds?: string; defaultBuyIn: number; maxPlayers?: number };
  host: { id: string; name: string };
  members: RoomMember[];
  events: RoomEvent[];
  buyInRequests: BuyInRequest[];
  cashOutRequests: CashOutRequest[];
  chipTypes: ChipType[];
}

interface PlayerStat {
  user: { id: string; name: string };
  totalBuyIn: number;
  totalCashOut: number;
  net: number;
}

type PlayerState = 'NEVER_BOUGHT_IN' | 'BUY_IN_PENDING' | 'ACTIVE' | 'REBUY_PENDING' | 'CASH_OUT_PENDING' | 'CASHED_OUT'

type ModalType = 'BUY_IN' | 'REBUY' | 'CASH_OUT' | null

export default function RoomDetailScreen({ route, navigation }: any) {
  const { code } = route.params;
  const { token, user } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRoomData = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms/${code}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch room');
      const data: Room = await response.json();
      setRoom(data);
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
    const interval = setInterval(fetchRoomData, 10000);
    return () => clearInterval(interval);
  }, [fetchRoomData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoomData();
  };

  const openModal = (type: ModalType) => {
    const defaultBuyIn = room ? (room.settings.defaultBuyIn / 100).toFixed(2) : '';
    setAmount(type === 'BUY_IN' || type === 'REBUY' ? defaultBuyIn : '');
    setActiveModal(type);
  };

  const handleSubmitEvent = async (type: 'BUY_IN' | 'REBUY' | 'CASH_OUT') => {
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
        body: JSON.stringify({ type, amountCents: Math.round(amountNum * 100) }),
      });

      const data = await response.json();
      if (!response.ok && response.status !== 202) {
        Alert.alert('Error', data.error || `Failed to submit ${type.toLowerCase().replace('_', ' ')}`);
        return;
      }

      setActiveModal(null);
      setAmount('');
      fetchRoomData();

      if (response.status === 202) {
        Alert.alert('Sent', 'Your request is waiting for host approval.');
      } else {
        Alert.alert('Done', `${type === 'BUY_IN' ? 'Buy-in' : type === 'REBUY' ? 'Rebuy' : 'Cash-out'} recorded.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = () => {
    if (room?.endedAt) {
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
            } catch {
              Alert.alert('Error', 'Failed to end session');
            }
          },
        },
      ]
    );
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

  // Derived state
  const currentUserId = (user as any)?.id
  const isHost = room.hostId === currentUserId

  const playerStats: PlayerStat[] = room.members.map((member) => {
    const userEvents = room.events.filter((e) => e.userId === member.userId)
    const totalBuyIn = userEvents.filter((e) => e.type === 'BUY_IN' || e.type === 'REBUY').reduce((s, e) => s + e.amount, 0)
    const totalCashOut = userEvents.filter((e) => e.type === 'CASH_OUT').reduce((s, e) => s + e.amount, 0)
    return { user: member.user, totalBuyIn, totalCashOut, net: totalCashOut - totalBuyIn }
  })

  const pendingBuyInRequests = room.buyInRequests.filter((r) => r.status === 'PENDING')
  const pendingCashOutRequests = room.cashOutRequests.filter((r) => r.status === 'PENDING')

  const myEvents = room.events.filter((e) => e.userId === currentUserId)
  const myPendingBuyIn = pendingBuyInRequests.find((r) => r.userId === currentUserId && r.type === 'BUY_IN')
  const myPendingRebuy = pendingBuyInRequests.find((r) => r.userId === currentUserId && r.type === 'REBUY')
  const myPendingCashOut = pendingCashOutRequests.find((r) => r.userId === currentUserId)

  const lastApprovedEvent = myEvents[0] // events are desc-ordered
  const hasEverBoughtIn = myEvents.some((e) => e.type === 'BUY_IN' || e.type === 'REBUY')
  const playerState: PlayerState = (() => {
    if (!hasEverBoughtIn && !myPendingBuyIn) return 'NEVER_BOUGHT_IN'
    if (!hasEverBoughtIn) return 'BUY_IN_PENDING'
    if (lastApprovedEvent?.type === 'CASH_OUT') {
      return (myPendingBuyIn || myPendingRebuy) ? 'BUY_IN_PENDING' : 'CASHED_OUT'
    }
    if (myPendingRebuy) return 'REBUY_PENDING'
    if (myPendingCashOut) return 'CASH_OUT_PENDING'
    return 'ACTIVE'
  })()

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const getNetColor = (cents: number) => cents > 0 ? '#10b981' : cents < 0 ? '#ef4444' : '#6b7280'

  const modalTitle = activeModal === 'BUY_IN' ? 'Buy In' : activeModal === 'REBUY' ? 'Rebuy' : 'Cash Out'

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{room.settings.name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Session Code:</Text>
            <Text style={styles.code}>{room.code}</Text>
          </View>
          {room.endedAt && (
            <Text style={styles.endedLabel}>This session has ended.</Text>
          )}
        </View>

        {/* Pending banners */}
        {(myPendingBuyIn || myPendingRebuy) && !room.endedAt && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerText}>
              Your {myPendingBuyIn ? 'buy-in' : 'rebuy'} request for{' '}
              {formatCurrency((myPendingBuyIn ?? myPendingRebuy)!.amountCents)} is waiting for host approval.
            </Text>
          </View>
        )}
        {myPendingCashOut && !room.endedAt && (
          <View style={[styles.pendingBanner, styles.pendingBannerCashOut]}>
            <Text style={[styles.pendingBannerText, styles.pendingBannerTextCashOut]}>
              Your cash-out request for {formatCurrency(myPendingCashOut.amountCents)} is waiting for host approval.
            </Text>
          </View>
        )}

        {/* Player Standings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Standings</Text>
          {playerStats.map((stat) => {
            const isMe = stat.user.id === currentUserId
            const lastEvent = room.events.find((e) => e.userId === stat.user.id)
            const hasCashedOut = lastEvent?.type === 'CASH_OUT'
            return (
              <View key={stat.user.id} style={[styles.playerCard, isMe && styles.playerCardMe]}>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {stat.user.name}
                    {stat.user.id === room.hostId ? ' (host)' : ''}
                    {isMe ? ' (you)' : ''}
                  </Text>
                  <Text style={[styles.statusBadge, hasCashedOut ? styles.statusOut : styles.statusPlaying]}>
                    {hasCashedOut ? 'cashed out' : 'playing'}
                  </Text>
                </View>
                <Text style={[styles.playerNet, { color: getNetColor(stat.net) }]}>
                  {stat.net >= 0 ? '+' : ''}{formatCurrency(stat.net)}
                </Text>
              </View>
            )
          })}
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {room.events.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            room.events.map((event) => (
              <View key={event.id} style={styles.eventCard}>
                <View>
                  <Text style={styles.eventType}>
                    {event.type === 'BUY_IN' ? 'Buy-in' : event.type === 'REBUY' ? 'Rebuy' : 'Cash-out'}
                  </Text>
                  <Text style={styles.eventUser}>{event.user.name}</Text>
                  <Text style={styles.eventTime}>{new Date(event.createdAt).toLocaleString()}</Text>
                </View>
                <Text style={[styles.eventAmount, { color: event.type === 'CASH_OUT' ? '#10b981' : '#60a5fa' }]}>
                  {formatCurrency(event.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Bar */}
      {!room.endedAt && (
        <View style={styles.actionBar}>
          {playerState === 'NEVER_BOUGHT_IN' || playerState === 'BUY_IN_PENDING' || playerState === 'CASHED_OUT' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.buyInButton, playerState === 'BUY_IN_PENDING' && styles.disabledButton]}
              onPress={() => playerState !== 'BUY_IN_PENDING' && openModal('BUY_IN')}
              disabled={playerState === 'BUY_IN_PENDING'}
            >
              <Text style={styles.actionButtonText}>
                {playerState === 'BUY_IN_PENDING' ? 'Buy-in Pending…' : 'Buy In'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.rebuyButton, playerState === 'REBUY_PENDING' && styles.disabledButton]}
                onPress={() => playerState !== 'REBUY_PENDING' && openModal('REBUY')}
                disabled={playerState === 'REBUY_PENDING'}
              >
                <Text style={styles.actionButtonText}>
                  {playerState === 'REBUY_PENDING' ? 'Rebuy Pending…' : 'Rebuy'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.cashOutButton, playerState === 'CASH_OUT_PENDING' && styles.disabledButton]}
                onPress={() => playerState !== 'CASH_OUT_PENDING' && openModal('CASH_OUT')}
                disabled={playerState === 'CASH_OUT_PENDING'}
              >
                <Text style={styles.actionButtonText}>
                  {playerState === 'CASH_OUT_PENDING' ? 'Cash-out Pending…' : 'Cash Out'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {isHost && (
            <TouchableOpacity style={[styles.actionButton, styles.endButton]} onPress={handleEndSession}>
              <Text style={styles.actionButtonText}>End</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {room.endedAt && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={[styles.actionButton, styles.settlementButton]} onPress={handleEndSession}>
            <Text style={styles.actionButtonText}>View Settlement</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Event Modal (Buy In / Rebuy / Cash Out) */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            {activeModal === 'CASH_OUT' && (
              <Text style={styles.modalNote}>
                Your request will be sent to the host for approval.
              </Text>
            )}
            {/* Part 3: $ prefix on amount input */}
            <View style={styles.amountRow}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            {/* Part 2: quick-add chip denomination buttons (cash-out only) */}
            {activeModal === 'CASH_OUT' && room.chipTypes && room.chipTypes.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipButtonsScroll}
                contentContainerStyle={styles.chipButtonsContent}
              >
                {[...room.chipTypes]
                  .sort((a, b) => a.denomination - b.denomination)
                  .map((chip) => {
                    const dollars = chip.denomination / 100;
                    const label = Number.isInteger(dollars)
                      ? `+$${dollars}`
                      : `+$${dollars.toFixed(2)}`;
                    return (
                      <TouchableOpacity
                        key={chip.color}
                        style={styles.chipButton}
                        onPress={() => {
                          const current = Math.max(0, parseFloat(amount) || 0);
                          setAmount((current + dollars).toFixed(2));
                        }}
                      >
                        <Text style={styles.chipButtonText}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => activeModal && handleSubmitEvent(activeModal)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>{modalTitle}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => setActiveModal(null)}
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 18, color: '#6b7280' },
  scrollView: { flex: 1 },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 12 },
  codeContainer: { flexDirection: 'row', alignItems: 'center' },
  codeLabel: { fontSize: 14, color: '#6b7280', marginRight: 8 },
  code: { fontSize: 18, fontWeight: '600', fontFamily: 'monospace', color: '#3b82f6', letterSpacing: 2 },
  endedLabel: { marginTop: 8, fontSize: 14, color: '#f59e0b', fontWeight: '500' },
  pendingBanner: {
    margin: 12,
    padding: 14,
    backgroundColor: '#1e3a5f',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 12,
  },
  pendingBannerCashOut: { backgroundColor: '#451a03', borderColor: '#d97706' },
  pendingBannerText: { fontSize: 14, color: '#93c5fd' },
  pendingBannerTextCashOut: { color: '#fcd34d' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 },
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
  playerCardMe: { borderWidth: 1, borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  statusBadge: { fontSize: 12, fontWeight: '500' },
  statusPlaying: { color: '#10b981' },
  statusOut: { color: '#6b7280' },
  playerNet: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center', padding: 20 },
  eventCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventType: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  eventUser: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  eventTime: { fontSize: 11, color: '#9ca3af' },
  eventAmount: { fontSize: 16, fontWeight: '600' },
  actionBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  buyInButton: { backgroundColor: '#3b82f6' },
  rebuyButton: { backgroundColor: '#d97706' },
  cashOutButton: { backgroundColor: '#10b981' },
  endButton: { backgroundColor: '#ef4444' },
  settlementButton: { backgroundColor: '#8b5cf6' },
  actionButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 12, textAlign: 'center' },
  modalNote: { fontSize: 13, color: '#d97706', marginBottom: 12, textAlign: 'center' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    marginBottom: 10,
  },
  currencyPrefix: {
    paddingLeft: 16,
    fontSize: 18,
    color: '#9ca3af',
  },
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 18,
    color: '#111827',
  },
  chipButtonsScroll: {
    marginBottom: 16,
  },
  chipButtonsContent: {
    gap: 8,
    paddingHorizontal: 2,
  },
  chipButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  chipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  modalButton: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  modalButtonPrimary: { backgroundColor: '#3b82f6' },
  modalButtonSecondary: { backgroundColor: 'transparent' },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalButtonTextSecondary: { color: '#6b7280', fontSize: 16, fontWeight: '600' },
});
