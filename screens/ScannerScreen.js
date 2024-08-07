import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, TextInput, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner'; // Use expo-barcode-scanner for barcode scanning
import { Camera } from 'expo-camera'; // Import Camera for requesting permissions
import axios from 'axios';
import { useIsFocused } from '@react-navigation/native';

const API_URL = 'http://192.168.1.11/api'; // Ensure this is correct for your setup

const ScannerScreen = ({ route, navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [employee, setEmployee] = useState(null);
  const [searching, setSearching] = useState(false);
  const isFocused = useIsFocused();
  const { eventName } = route.params;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync(); // Request permissions using Camera
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return; // Avoid scanning multiple times

    setScanned(true);
    setLoading(true);
    try {
      // Extract numbers and hyphens from scanned data
      const trimmedData = data.match(/^[0-9\-]+/)[0];

      // Send trimmed data to API
      const response = await axios.post(`${API_URL}/scan-data.php`, { data: trimmedData });
      if (response.data.success) {
        setScannedData(response.data);
      } else {
        Alert.alert('No Data Found', 'No additional information found for the scanned data.');
        setScannedData(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch additional information. Displaying scanned data.');
      setScannedData({ data });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchEmployee = async () => {
    if (!employeeName.trim()) {
      Alert.alert('Input Error', 'Please enter a name to search.');
      return;
    }

    setSearching(true);
    try {
      const response = await axios.post(`${API_URL}/search-employee.php`, { name: employeeName });
      if (response.data.success) {
        setEmployee(response.data.employee);
      } else {
        Alert.alert('No Results', 'No employee found with the given name.');
        setEmployee(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search for employee.');
      setEmployee(null);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!employee) {
      Alert.alert('No Employee Data', 'No employee data to submit.');
      return;
    }

    // Implement your submit logic here
    Alert.alert('Submit', `Submitting details for ${employee.name}`);
    // Example:
    // try {
    //   await axios.post(`${API_URL}/submit-employee.php`, { employee });
    //   Alert.alert('Success', 'Employee details submitted successfully.');
    // } catch (error) {
    //   Alert.alert('Error', 'Failed to submit employee details.');
    // }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
    setEmployeeName(null);
  };
  if (hasPermission === null) {
    return <View><Text>Requesting for camera permission</Text></View>;
  }
  if (hasPermission === false) {
    return <View><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{eventName}</Text>

      <View style={styles.scannerContainer}>
        {isFocused && (
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
        )}
      </View>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      
      {scannedData && (
        <View style={styles.resultContainer}>
          <Text>Scanned Data: {scannedData.data}</Text>
        </View>
      )}

      {!scannedData && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="Search Employee by Name"
            value={employeeName}
            onChangeText={setEmployeeName}
          />
          <Button title="Find Employee" onPress={handleSearchEmployee} disabled={searching} />
          {searching && <ActivityIndicator size="small" color="#0000ff" />}
          {employee && (
            <View style={styles.employeeInfo}>
              <Text>ID: {employee.id}</Text>
              <Text>Name: {employee.name}</Text>
              <Text>Event Type: {employee.eventType}</Text>
              <Text>Login User: {employee.loginUser}</Text>
              <Button title="Submit" onPress={handleSubmit} />
            </View>
          )}
        </View>
      )}

      <Button title="Scan Again" onPress={handleScanAgain} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  scannerContainer: {
    flex: .7,
    marginVertical: 5,
  },
  scanner: {
    flex: 1,
  },
  resultContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  searchContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  employeeInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
});

export default ScannerScreen;
