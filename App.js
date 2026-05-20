// 导入 React 核心库
// Import React core library
import React, { useEffect, useState } from 'react';

// 导入 React Native 基础组件
// Import basic React Native components
import { View, Text,  Button, ActivityIndicator } from 'react-native';

// 导入导航容器（所有页面都包在里面）
// Import navigation container (wraps all pages)
import { NavigationContainer } from '@react-navigation/native';

// 导入栈导航（页面跳转用）
// Import stack navigator (for page switching)
import { createStackNavigator } from '@react-navigation/stack';

// 导入登录页面
// Import login/register screen
import AuthScreen from './components/auth/authScreen';

// 导入主页（拍照、日记页面）
// Import home screen (camera, journal)
import HomeScreen from './screens/homeScreen';

// 导入数据库初始化函数
// Import database initialization function
import { initDatabase } from './components/database/database';

// 创建一个栈导航对象
// Create a stack navigator object
const Stack = createStackNavigator();

// App 主组件（整个APP的入口）
// App main component (entry of the whole APP)
const App = () => {

  // 状态1：数据库是否初始化完成
  // State 1: Is database ready?
  const [dbInitialized, setDbInitialized] = useState(false);

  // 状态2：是否出现错误
  // State 2: Did any error happen?
  const [error, setError] = useState(null);

  // ==================== 启动时执行一次 ====================
  // Run once when app starts
  useEffect(() => {

    // 定义初始化函数
    // Define initialization function
    const initializeApp = async () => {
      try {
        // 第一步：初始化数据库（建表、连接）
        // Step 1: Initialize database (create tables, connect)
        await initDatabase();

        // 数据库成功 → 标记为已完成
        // DB success → mark as ready
        setDbInitialized(true);
      } catch (err) {
        // 出错 → 打印错误 + 显示错误界面
        // Error → show error screen
        console.error('Initialization error:', err);
        setError(err);
      }
    };

    // 执行初始化
    // Run initialization
    initializeApp();
  }, []);

  // ==================== 如果出错，显示错误页面 ====================
  // If error → show error screen
  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Database initialization failed</Text>
        <Text>{error.message}</Text>
        <Button 
          title="Retry" 
          onPress={() => {
            setError(null);
            setDbInitialized(false);
          }} 
        />
      </View>
    );
  }

  // ==================== 如果还在加载，显示加载动画 ====================
  // If still loading → show loading indicator
  if (!dbInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  // ==================== 初始化完成 → 显示APP页面 ====================
  // All ready → show APP navigation
  return (
    <NavigationContainer>
      {/* 栈导航：管理页面跳转 */}
      {/* Stack Navigator: manages page switching */}
      <Stack.Navigator>

        {/* 页面1：登录注册页面 */}
        {/* Screen 1: Login / Register */}
        <Stack.Screen name="Auth" component={AuthScreen} />

        {/* 页面2：主页（拍照、日记） */}
        {/* Screen 2: Home (camera, journal list) */}
        <Stack.Screen name="Home" component={HomeScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

// 导出 App 组件
// Export App component
export default App;