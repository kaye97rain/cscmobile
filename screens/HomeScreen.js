import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, Image, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://192.168.1.11/api';

const HomeScreen = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/fetch-events.php`);
      console.log('Events response:', response.data);

      if (response.data.success) {
        setEvents(response.data.events);
      } else {
        console.error('Error fetching events:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching events:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUsername = async () => {
      const storedUsername = await AsyncStorage.getItem('username'); // Retrieve username from AsyncStorage
      if (storedUsername) {
        setUsername(storedUsername);
      }
    };
    getUsername();
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('username'); // Remove username from AsyncStorage
    navigation.replace('Login');
  };

  const handleScannerScreen = () => {
    if (selectedEvent) {
      navigation.navigate('Scanner', { eventName: selectedEvent, username });
    } else {
      Alert.alert('Select Event', 'Please select an event before proceeding');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.usernameText}>Hello, {username}!</Text>
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.welcomeText}>ATTENDANCE SCANNER</Text>
      
      {loading ? (
        <Text>Loading events...</Text>
      ) : (
        <Picker
          selectedValue={selectedEvent}
          style={styles.picker}
          onValueChange={(itemValue) => setSelectedEvent(itemValue)}
        >
          <Picker.Item label="Select an event" value="" />
          {events.map((event) => (
            <Picker.Item key={event.id} label={event.name} value={event.name} />
          ))}
        </Picker>
      )}

      <View style={styles.buttonContainer}>
        <Button title="SCAN" onPress={handleScannerScreen} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  usernameText: {
    fontSize: 16,
    alignSelf: 'flex-start', // Align text to the left
    marginBottom: 10,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 50,
  },
  welcomeText: {
    fontSize: 30,
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: '80%',
    marginBottom: 100,
  },
  buttonContainer: {
    marginTop: 100,
    width: '80%',
    paddingHorizontal: 10,
  },
});

export default HomeScreen;
