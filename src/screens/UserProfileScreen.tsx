import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import { User } from '../types/auth';
import { Post } from '../types/post';
import { getUserPosts, likePost, unlikePost } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

interface RouteParams {
  params: {
    userId: string;
    user: User;
  };
}

const UserProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const route = useRoute() as { params: RouteParams['params'] };
  const { userId, user: profileUser } = route.params;
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserPosts();
  }, [userId]);

  const loadUserPosts = async () => {
    try {
      setLoading(true);
      const userPosts = await getUserPosts(userId);
      setPosts(userPosts);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    try {
      await likePost(postId, currentUser.uid);
      const updatedPosts = posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes + 1,
              likedBy: [...p.likedBy, currentUser.uid],
            }
          : p
      );
      setPosts(updatedPosts);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!currentUser) return;
    try {
      await unlikePost(postId, currentUser.uid);
      const updatedPosts = posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes - 1,
              likedBy: p.likedBy.filter(uid => uid !== currentUser.uid),
            }
          : p
      );
      setPosts(updatedPosts);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCommentPress = (postId: string) => {
    navigation.navigate('Comments', { postId });
  };

  const handleUserPress = (uid: string) => {
    if (uid !== userId) {
      // Navigate to different user profile
      navigation.push('UserProfile', { userId: uid, user: profileUser });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onLike={handleLike}
              onUnlike={handleUnlike}
              onCommentPress={handleCommentPress}
              onUserPress={handleUserPress}
            />
          )}
          keyExtractor={item => item.id}
          ListHeaderComponent={
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {profileUser.photoURL ? (
                  <Image
                    source={{ uri: profileUser.photoURL }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.defaultProfileImage}>
                    <Text style={styles.profileInitial}>
                      {profileUser.displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.profileName}>{profileUser.displayName}</Text>
              <Text style={styles.profileEmail}>{profileUser.email}</Text>

              {profileUser.bio && (
                <Text style={styles.bioText}>{profileUser.bio}</Text>
              )}

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{posts.length}</Text>
                  <Text style={styles.statLabel}>Posts</Text>
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet</Text>
            </View>
          }
        />
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#666',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default UserProfileScreen;
