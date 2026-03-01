import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import Input from '../components/Input';
import Button from '../components/Button';
import { updateProfile, uploadProfileImage } from '../services/authService';
import { User } from '../types/auth';

interface EditProfileFormValues {
  name: string;
  bio: string;
}

interface RouteParams {
  params: {
    user: User;
    onUpdateProfile: (updatedUser: User) => void;
  };
}

const EditProfileSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  bio: Yup.string()
    .max(500, 'Bio must be less than 500 characters'),
});

const EditProfileScreen: React.FC = () => {
  const route = useRoute() as { params: RouteParams['params'] };
  const { user, onUpdateProfile } = route.params;
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(user.photoURL);

  const formik = useFormik<EditProfileFormValues>({
    initialValues: {
      name: user.displayName,
      bio: user.bio || '',
    },
    validationSchema: EditProfileSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        let photoURL = profileImage;

        if (profileImage && profileImage !== user.photoURL) {
          photoURL = await uploadProfileImage(user.uid, profileImage);
        }

        await updateProfile(user.uid, {
          displayName: values.name,
          bio: values.bio,
          photoURL,
        });

        const updatedUser: User = {
          ...user,
          displayName: values.name,
          bio: values.bio,
          photoURL,
        };

        onUpdateProfile(updatedUser);
        Alert.alert('Success', 'Profile updated successfully!');
      } catch (error: any) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    },
  });

  const selectImage = () => {
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
          setProfileImage(imageUri);
        }
      }
    });
  };

  const removeImage = () => {
    Alert.alert(
      'Remove Profile Picture',
      'Are you sure you want to remove your profile picture?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: () => setProfileImage(null),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Text style={styles.profileInitial}>
                    {formik.values.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {imageLoading && (
                <View style={styles.imageLoadingOverlay}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              )}
            </View>
            
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.imageButton} onPress={selectImage}>
                <Text style={styles.imageButtonText}>
                  {profileImage ? 'Change Photo' : 'Add Photo'}
                </Text>
              </TouchableOpacity>
              
              {profileImage && (
                <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
            autoCapitalize="words"
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={formik.values.bio}
            onChangeText={formik.handleChange('bio')}
            onBlur={formik.handleBlur('bio')}
            error={formik.touched.bio && formik.errors.bio ? formik.errors.bio : undefined}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={styles.bioInput}
          />

          <Button
            title="Save Changes"
            onPress={formik.handleSubmit}
            loading={loading}
            disabled={loading}
            size="large"
            containerStyle={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultProfileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#666',
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  imageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bioInput: {
    height: 100,
  },
  button: {
    marginTop: 24,
  },
});

export default EditProfileScreen;
