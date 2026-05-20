import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { executeSql } from '../database/database';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleAuth = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    try {
      if (isLogin) {
        // Login logic
        // 首先检查邮箱是否存在
        const emailCheck = await executeSql(
          'SELECT id, password FROM users WHERE email = ?',
          [email]
        );

        if (emailCheck.rows.length === 0) {
          // 邮箱不存在
          Alert.alert('Authentication Failed', 'Email not registered. Please create an account first.');
          return;
        }

        // 邮箱存在，检查密码
        console.log('Email check rows:', JSON.stringify(emailCheck.rows));

        // 检查rows._array是否存在并且有数据
        if (emailCheck.rows._array && emailCheck.rows._array.length > 0) {
          const user = emailCheck.rows._array[0];
          console.log('User data:', JSON.stringify(user));

          if (user.password === password) {
            // 密码正确，登录成功
            navigation.navigate('Home', { userId: user.id });
          } else {
            // 密码错误
            Alert.alert('Authentication Failed', 'Incorrect password. Please try again.');
          }
        } else {
          // 无法获取用户数据
          console.error('Could not retrieve user data from rows');
          Alert.alert('Error', 'Could not retrieve user data. Please try again.');
        }
      } else {
        // Registration logic
        // First check if email exists
        const checkResult = await executeSql(
          'SELECT id FROM users WHERE email = ?',
          [email]
        );

        console.log('Check result rows:', JSON.stringify(checkResult.rows));

        // 检查rows._array是否存在并且有数据
        if (checkResult.rows._array && checkResult.rows._array.length > 0) {
          Alert.alert('Registration Failed', 'Email already exists');
          return;
        }

        const insertResult = await executeSql(
          'INSERT INTO users (email, password) VALUES (?, ?)',
          [email, password]
        );

        console.log('Insert result:', JSON.stringify(insertResult));

        // 检查insertResult的结构，确保能正确获取insertId
        if (insertResult && insertResult.insertId) {
          navigation.navigate('Home', { userId: insertResult.insertId });
        } else if (insertResult && insertResult.lastInsertRowId) {
          // 新版API可能使用lastInsertRowId
          navigation.navigate('Home', { userId: insertResult.lastInsertRowId });
        } else {
          console.error('Could not get inserted user ID');
          Alert.alert('Error', 'Registration successful but could not retrieve user ID.');
        }
      }
    } catch (error) {
      console.error('Database error:', error);

      // 检查是否是唯一性约束错误
      if (error.message && error.message.includes('UNIQUE constraint failed: users.email')) {
        Alert.alert('Registration Failed', 'This email address is already registered. Please use a different email or try logging in.');
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Screen UI structure页面UI
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{isLogin ? 'Login' : 'Create Account'}</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />

        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuth}
            disabled={isLoading}
          >
            <Text style={styles.authButtonText}>
              {isLogin ? 'Login' : 'Register'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchButtonText}>
            {isLogin
              ? 'Need an account? Register'
              : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  authButton: {
    backgroundColor: '#4285f4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#4285f4',
    fontSize: 14,
  },
});

export default AuthScreen;