import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, MediaType, ImagePickerResponse } from 'react-native-image-picker';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { createPost } from '../services/postService';

interface CreatePostScreenProps {
  navigation: any;
  onPostCreated?: () => void;
}

const CreatePostScreen: React.FC<CreatePostScreenProps> = ({ navigation, onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          setImage(imageUri);
        }
      }
    });
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before posting.');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User information is not available.');
      return;
    }

    setLoading(true);
    try {
      await createPost(
        user.uid,
        user.displayName,
        user.photoURL,
        content.trim(),
        image || undefined
      );

      Alert.alert('Success', 'Post created successfully!');
      setContent('');
      setImage(null);
      onPostCreated?.();
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* User Info */}
      {user && (
        <View style={styles.userSection}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{user.displayName}</Text>
        </View>
      )}

      {/* Text Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
      </View>

      {/* Image Preview */}
      {image && (
        <View style={styles.imagePreviewSection}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={handleRemoveImage}
          >
            <Icon name="close-circle" size={28} color="#ff4444" />
          </TouchableOpacity>
        </View>
      )}

      {/* Add Image Button */}
      <View style={styles.imageSection}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleSelectImage}
        >
          <Icon name="image-outline" size={24} color="#007AFF" />
          <Text style={styles.imageButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>

      {/* Post Button */}
      <View style={styles.buttonSection}>
        <Button
          title="Post"
          onPress={handlePost}
          loading={loading}
          disabled={loading || !content.trim()}
          size="large"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 60,
  },
  closeButton: {
    fontSize: 28,
    color: '#333',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  input: {
    fontSize: 16,
    color: '#333',
    minHeight: 120,
  },
  imageSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  imageButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
    fontWeight: '600',
  },
  imagePreviewSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  buttonSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
  },
});

export default CreatePostScreen;
