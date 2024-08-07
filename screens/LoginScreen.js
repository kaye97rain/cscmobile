import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.1.11/api'; // Ensure this is correct for your setup

const handleLogin = async (username, password, navigation) => {
  try {
    const response = await axios.post(`${API_URL}/login.php`, {
      username,
      password,
    });

    console.log('Login response:', response.data);

    if (response.data.success) {
      const { token, refreshToken } = response.data;

      // Save tokens and username to AsyncStorage
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('username', username); // Save username

      // Navigate to HomeScreen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });

      Alert.alert('Success', 'Login successful!');
    } else {
      Alert.alert('Error', response.data.message || 'Invalid credentials');
    }
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'An error occurred while trying to login');
  }
};


const makeAuthenticatedRequest = async (endpoint, method = 'GET', data = {}) => {
  let token = await AsyncStorage.getItem('userToken');

  try {
    const response = await axios({
      url: `${API_URL}${endpoint}`,
      method,
      data,
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      token = await refreshToken();
      if (token) {
        const response = await axios({
          url: `${API_URL}${endpoint}`,
          method,
          data,
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      }
    }
    throw error;
  }
};

const refreshToken = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_URL}/refresh-token.php`, { refreshToken });
    if (response.data.success) {
      const { newToken, newRefreshToken } = response.data;
      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
      return newToken;
    } else {
      // Handle refresh token failure (e.g., prompt user to log in again)
      console.error('Refresh token failed');
      return null;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginPress = async () => {
    console.log('Attempting to login'); // Debug statement
    await handleLogin(username, password, navigation);
  };

  return (
    <View style={styles.container}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button title="Login" onPress={handleLoginPress} />
      <View style={styles.registerButton}>
        <Button
          title="Register"
          onPress={() => navigation.navigate('Register')}
        />
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 50,
    marginLeft: 110,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  registerButton: {
    marginTop: 10,
  },
});

export default LoginScreen;
