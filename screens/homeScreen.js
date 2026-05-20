import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Button,
  ScrollView
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { SwipeListView } from 'react-native-swipe-list-view';
import { executeSql } from '../components/database/database';
import { Picker } from '@react-native-picker/picker';

const HomeScreen = ({ route }) => {
  // State management
  const [camera, setCamera] = useState(null);
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [journals, setJournals] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [category, setCategory] = useState('All');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Camera permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Refs
  const scrollViewRef = useRef(null);

  // Categories for filtering
  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks'];

  // Initialize camera and load journals
  useEffect(() => {
    const initialize = async () => {
      try {
        // Request camera permissions if needed
        if (cameraPermission && !cameraPermission.granted) {
          await requestCameraPermission();
        }

        // Load journal entries
        await loadJournals();
      } catch (error) {
        console.error('Initialization error:', error);
        Alert.alert('Error', 'Failed to initialize the app');
      } finally {
        // Always set loading to false, even if there's an error
        setIsLoading(false);
      }
    };

    initialize();
  }, [cameraPermission]);

  // Load journals from database
  const loadJournals = async () => {
    try {
      console.log('Loading journals...');
      const userId = route.params?.userId;
      console.log('User ID:', userId);

      if (!userId) {
        console.error('No user ID found in route params');
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // 查询当前用户的所有日记
      // Query all journals for current user
      console.log('Executing SQL query...');
      const result = await executeSql(
        'SELECT * FROM journals WHERE userId = ? ORDER BY date DESC',
        [userId]
      );

      console.log('Query result:', JSON.stringify(result));

      if (result && result.rows && result.rows._array) {
        console.log('Setting journals with data:', result.rows._array.length, 'items');
        setJournals(result.rows._array);
      } else {
        console.log('No journals found or invalid result structure');
        setJournals([]);
      }
    } catch (error) {
      console.error('Error loading journals:', error);
      Alert.alert('Error', 'Failed to load journals: ' + error.message);
    }
  };

 // ==================== 拍照功能 ====================
  // Take picture function
  const takePicture = async () => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, // 允许编辑
      aspect: [4, 3],      // 宽高比
      quality: 0.8,        // 图片质量
    });
    if (!result.canceled) { // 检查是否取消拍照（Expo ImagePicker v14+ 返回 canceled 字段）
      setImage(result.assets[0].uri); // 保存拍照后的图片 URI
    }
  } catch (error) {
    console.error('Camera launch error:', error);
    Alert.alert('Error', 'Failed to open camera'); // 错误提示
  }
};

  // Select image from gallery从相册增加图片
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Save or update journal entry保存或更新日记
  const saveJournal = async () => {
    if (!image || !description.trim()) {
      Alert.alert('Validation Error', 'Please add both an image and description');
      return;
    }

    try {
      const userId = route.params?.userId;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      if (editingId) {
        // Update existing entry
        await executeSql(
          'UPDATE journals SET image = ?, description = ?, category = ? WHERE id = ?',
          [image, description.trim(), category, editingId]
        );
        Alert.alert('Success', 'Journal updated successfully');
      } else {
        // Create new entry新建日记
        await executeSql(
          'INSERT INTO journals (userId, image, description, category, date) VALUES (?, ?, ?, ?, ?)',
          [
            userId,
            image,
            description.trim(),
            category,
            new Date().toISOString(),
          ]
        );
        Alert.alert('Success', 'Journal saved successfully');
      }

      await loadJournals();
      resetForm();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  // Delete journal entry删除日记
  const deleteJournal = async (id) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this journal entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await executeSql(
                'DELETE FROM journals WHERE id = ?',
                [id]
              );
              await loadJournals();
              Alert.alert('Success', 'Journal deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete journal');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Reset form fields重置表单
  const resetForm = () => {
    setImage(null);
    setDescription('');
    setEditingId(null);
    setCategory('All');
  };

  // Filter journals by category根据分类过滤日记
  const filteredJournals = category === 'All'
    ? journals
    : journals.filter((item) => item.category === category);

  // Loading state加载界面
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading your food journals...</Text>
      </View>
    );
  }

  // Camera permission denied
  if (cameraPermission && !cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text>Camera permission is required to take photos</Text>
        <Button
          title="Grant Permission"
          onPress={requestCameraPermission}
        />
      </View>
    );
  }

  // ==================== 主界面 UI ====================
  // Main UI
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Camera Modal 相机弹窗*/}
      <Modal visible={isCameraOpen} animationType="slide">
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            ref={(ref) => setCamera(ref)}
            ratio="16:9"
          />
          
          <View style={styles.cameraButtons}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Button
              title="Close"
              onPress={() => setIsCameraOpen(false)}
              color="#ff4444"
            />
          </View>
        </View>
      </Modal>

      {/* 主内容Main Content */}
      <View style={styles.mainContainer}>
        {/* All Content in ScrollView */}
        <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
          {/* Journal Input Section */}
          <View style={styles.inputContainer}>
            <Text style={styles.sectionTitle}>
              {editingId ? 'Edit Journal Entry' : 'Add New Journal Entry'}
            </Text>

            {/* Image Preview */}
            {image ? (
              <Image source={{ uri: image }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>No image selected</Text>
              </View>
            )}

            {/* Image Selection Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={() => setIsCameraOpen(true)}
              >
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImage}
              >
                <Text style={styles.buttonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Description Input */}
            <TextInput
              placeholder="What did you eat? Add details..."
              value={description}
              onChangeText={setDescription}
              style={styles.input}
              multiline
              numberOfLines={3}
            />

            {/* Category Picker */}
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Category:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.picker}
                  itemStyle={{ height: 50, fontSize: 16 }} // 设置项目高度和字体大小
                  mode="dropdown" // 使用下拉模式
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Save/Update Button */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveJournal}
            >
              <Text style={styles.saveButtonText}>
                {editingId ? 'Update Journal' : 'Save Journal'}
              </Text>
            </TouchableOpacity>

            {/* Cancel Edit Button (visible only when editing) */}
            {editingId && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Journal List Section */}
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Your Food Journals</Text>

            {/* Category Filter */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by:</Text>
              <View style={styles.filterPickerWrapper}>
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => setCategory(itemValue)}
                  style={styles.filterPicker}
                  itemStyle={{ height: 50, fontSize: 16 }} // 设置项目高度和字体大小
                  mode="dropdown" // 使用下拉模式
                >
                  {categories.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* 日记列表Journal List - Scrollable */}
            <View style={styles.journalListWrapper}>
              {filteredJournals.length > 0 ? (
                <ScrollView
                  style={styles.journalListScroll}
                  nestedScrollEnabled={true}
                >
                  {filteredJournals.map((item) => (
                    <View key={item.id.toString()} style={styles.journalItemContainer}>
                      <View style={styles.journalItem}>
                        <Image source={{ uri: item.image }} style={styles.journalImage} />
                        <View style={styles.journalDetails}>
                          <Text style={styles.journalDescription}>
                            {item.description}
                          </Text>
                          <View style={styles.journalMeta}>
                            <Text style={styles.journalCategory}>
                              {item.category}
                            </Text>
                            <Text style={styles.journalDate}>
                              {new Date(item.date).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.editButton]}
                          onPress={() => {
                            console.log('Edit button pressed for item:', item.id);
                            setEditingId(item.id);
                            setDescription(item.description);
                            setImage(item.image);
                            setCategory(item.category);
                            // 滚动到顶部，让用户看到编辑表单
                            if (scrollViewRef.current) {
                              scrollViewRef.current.scrollTo({ y: 0, animated: true });
                            }
                          }}
                        >
                          <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => {
                            console.log('Delete button pressed for item:', item.id);
                            deleteJournal(item.id);
                          }}
                        >
                          <Text style={styles.actionButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    {category === 'All'
                      ? 'No journal entries yet. Add your first entry above!'
                      : `No entries in ${category} category`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

// 样式表Styles remain the same as in your original code
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  mainContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  scrollContainer: {
    flex: 1, // 占用所有可用空间
  },
  listHeaderContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraButtons: {
    position: 'absolute',
    bottom: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: '#4285f4',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  pickerLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#34a853',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#ea4335',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContainer: {
    backgroundColor: 'white',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  journalListWrapper: {
    marginTop: 10,
  },
  journalListScroll: {
    maxHeight: 400, // 设置最大高度
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  filterLabel: {
    marginRight: 10,
    fontSize: 16,
  },
  filterPickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    height: 50, // 增加高度
    justifyContent: 'center', // 垂直居中
  },
  filterPicker: {
    height: 50, // 增加高度
  },
  journalItem: {
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'row',
    minHeight: 110, // 设置最小高度，确保有足够的空间显示内容
  },
  journalImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  journalDetails: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  journalDescription: {
    fontSize: 16,
    marginBottom: 5,
  },
  journalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  journalCategory: {
    color: '#4285f4',
    fontWeight: 'bold',
  },
  journalDate: {
    color: '#666',
  },
  journalItemContainer: {
    marginBottom: 15,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 8,
    backgroundColor: '#f0f0f0',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#fbbc05',
  },
  deleteButton: {
    backgroundColor: '#ea4335',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default HomeScreen;