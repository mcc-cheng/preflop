import Constants from 'expo-constants';

// API Configuration
// For development: Use your computer's IP address or ngrok
// For production: Use your deployed backend URL

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:3000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/signin',
  REGISTER: '/api/auth/register',
  
  // User
  PROFILE: '/api/profile',
  USER: (username: string) => `/api/users/${username}`,
  
  // Rooms
  ROOMS: '/api/rooms',
  ROOM: (code: string) => `/api/rooms/${code}`,
  JOIN_ROOM: '/api/rooms/join',
  END_ROOM: (code: string) => `/api/rooms/${code}/end`,
  
  // Events
  ROOM_EVENTS: (code: string) => `/api/rooms/${code}/events`,
  SETTLEMENT: (code: string) => `/api/rooms/${code}/settlement`,
  
  // Friends
  FRIENDS: '/api/friends',
  FRIEND_SEARCH: '/api/friends/search',
  FRIEND_REQUESTS: '/api/friends/requests',
  FRIEND_REQUEST: (id: string) => `/api/friends/requests/${id}`,
  
  // Payment Methods
  PAYMENT_METHODS: '/api/payment-methods',
  PAYMENT_METHOD: (id: string) => `/api/payment-methods/${id}`,
};
