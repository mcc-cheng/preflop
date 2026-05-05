import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config/api';

export default function JoinRoomScreen({ navigation }: any) {
  const { token } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'enter' | 'scan'>('enter');

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: any) => {
    const scannedCode = data.trim().toUpperCase();
    if (scannedCode.length === 6) {
      setCode(scannedCode);
      setMode('enter');
      Alert.alert('QR Code Scanned', `Code: ${scannedCode}`);
    } else {
      Alert.alert('Invalid QR Code', 'The scanned code is not a valid 6-character room code.');
    }
  };

  const handleJoin = async () => {
    const roomCode = code.trim().toUpperCase();
    
    if (!roomCode) {
      Alert.alert('Error', 'Please enter a session code');
      return;
    }

    if (roomCode.length !== 6) {
      Alert.alert('Error', 'Session code must be 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code: roomCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join session');
      }

      const data = await response.json();
      
      Alert.alert(
        'Joined!',
        `You've joined ${data.room.name}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('RoomDetail', { code: roomCode }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error joining room:', error);
      Alert.alert('Error', error.message || 'Failed to join session. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Join Session</Text>
        <Text style={styles.subtitle}>
          {mode === 'enter' ? 'Enter the 6-character code to join a poker session' : 'Scan the QR code to join a poker session'}
        </Text>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'enter' && styles.modeButtonActive]}
          onPress={() => setMode('enter')}
        >
          <Text style={[styles.modeButtonText, mode === 'enter' && styles.modeButtonTextActive]}>
            Enter Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'scan' && styles.modeButtonActive]}
          onPress={() => setMode('scan')}
        >
          <Text style={[styles.modeButtonText, mode === 'scan' && styles.modeButtonTextActive]}>
            Scan QR
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'enter' ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Session Code</Text>
            <TextInput
              style={styles.input}
              placeholder="ABC123"
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
            />
            <Text style={styles.hint}>
              Ask the session host for the 6-character code
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.joinButton, loading && styles.buttonDisabled]}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Join Session</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.scanContainer}>
          {hasPermission === null ? (
            <Text style={styles.permissionText}>Requesting camera permission...</Text>
          ) : hasPermission === false ? (
            <Text style={styles.permissionText}>Camera permission denied. Please enable in settings.</Text>
          ) : (
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
          )}
          <TouchableOpacity
            style={styles.cancelScanButton}
            onPress={() => setMode('enter')}
          >
            <Text style={styles.cancelScanButtonText}>Back to Code</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Tip</Text>
        <Text style={styles.infoText}>
          The session host can show the QR code from their session screen. Make sure you're joining the correct session!
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  modeButtonTextActive: {
    color: '#111827',
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  hint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
    textAlign: 'center',
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  scanContainer: {
    height: 400,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 200,
  },
  infoBox: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 22,
  },
  camera: {
    flex: 1,
  },
  cancelScanButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -50 }],
  },
  cancelScanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
