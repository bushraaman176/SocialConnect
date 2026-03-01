import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { getAllPosts, likePost, unlikePost } from '../services/postService';
import { Post } from '../types/post';
import PostCard from '../components/PostCard';

const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('HomeScreen: Component mounted, user:', user?.uid);
    loadPosts();

    // Set up navigation to refresh posts when returning to home
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('HomeScreen: Focus event, reloading posts');
      loadPosts();
    });

    return unsubscribe;
  }, [navigation, user?.uid]);

  const loadPosts = async () => {
    try {
      console.log('HomeScreen: Loading posts...');
      setError(null);
      if (!refreshing) setLoading(true);
      const fetchedPosts = await getAllPosts();
      console.log('HomeScreen: Loaded', fetchedPosts.length, 'posts');
      setPosts(fetchedPosts);
    } catch (error: any) {
      console.error('HomeScreen: Error loading posts:', error);
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      await likePost(postId, user.uid);
      const updatedPosts = posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes + 1,
              likedBy: [...p.likedBy, user.uid],
            }
          : p
      );
      setPosts(updatedPosts);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUnlike = async (postId: string) => {
    if (!user) return;
    try {
      await unlikePost(postId, user.uid);
      const updatedPosts = posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes: p.likes - 1,
              likedBy: p.likedBy.filter(uid => uid !== user.uid),
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

  const handleUserPress = (userId: string) => {
    // Find the post to get user data
    const post = posts.find(p => p.userId === userId);
    if (post) {
      navigation.navigate('UserProfile', {
        userId,
        user: {
          uid: userId,
          email: post.userName,
          displayName: post.userName,
          photoURL: post.userPhotoURL,
          bio: '',
          createdAt: null,
        },
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SocialConnect</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
          <Icon name="create-outline" size={28} color="#333" />
        </TouchableOpacity>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="document-text-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubtext}>
                Be the first to share something!
              </Text>
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
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});

export default HomeScreen;
