import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Post, Comment } from '../types/post';

export const createPost = async (
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  content: string,
  imageUri?: string
): Promise<Post> => {
  try {
    let imageURL: string | null = null;

    // Upload image if provided
    if (imageUri) {
      imageURL = await uploadPostImage(userId, imageUri);
    }

    const postData: Omit<Post, 'id'> = {
      userId,
      userName,
      userPhotoURL,
      content,
      imageURL: imageURL || null,
      likes: 0,
      likedBy: [],
      comments: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore().collection('posts').add(postData);

    return {
      id: docRef.id,
      ...postData,
    } as Post;
  } catch (error: any) {
    throw new Error('Failed to create post: ' + error.message);
  }
};

export const getAllPosts = async (): Promise<Post[]> => {
  try {
    console.log('PostService: Fetching all posts...');
    const snapshot = await firestore()
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .get();

    console.log('PostService: Fetched', snapshot.size, 'posts');
    const posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as Post;
    });
    console.log('PostService: Mapped posts:', posts.length);
    return posts;
  } catch (error: any) {
    console.error('PostService: Error fetching posts:', error.message, error.code);
    // Return empty array instead of throwing, so app doesn't crash
    console.log('PostService: Returning empty posts array as fallback');
    return [];
  }
};

export const getUserPosts = async (userId: string): Promise<Post[]> => {
  try {
    const snapshot = await firestore()
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  } catch (error: any) {
    throw new Error('Failed to fetch user posts: ' + error.message);
  }
};

export const likePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = firestore().collection('posts').doc(postId);
    const post = await postRef.get();

    if (post.exists) {
      const likedBy = (post.data() as Post).likedBy || [];
      if (!likedBy.includes(userId)) {
        await postRef.update({
          likedBy: [...likedBy, userId],
          likes: firestore.FieldValue.increment(1),
        });
      }
    }
  } catch (error: any) {
    throw new Error('Failed to like post: ' + error.message);
  }
};

export const unlikePost = async (postId: string, userId: string): Promise<void> => {
  try {
    const postRef = firestore().collection('posts').doc(postId);
    const post = await postRef.get();

    if (post.exists) {
      const likedBy = (post.data() as Post).likedBy || [];
      const filteredLikes = likedBy.filter(id => id !== userId);
      await postRef.update({
        likedBy: filteredLikes,
        likes: firestore.FieldValue.increment(-1),
      });
    }
  } catch (error: any) {
    throw new Error('Failed to unlike post: ' + error.message);
  }
};

export const addComment = async (
  postId: string,
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  content: string
): Promise<Comment> => {
  try {
    const commentData: Omit<Comment, 'id'> = {
      postId,
      userId,
      userName,
      userPhotoURL,
      content,
      createdAt: firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .add(commentData);

    // Update comment count on post
    await firestore().collection('posts').doc(postId).update({
      comments: firestore.FieldValue.increment(1),
    });

    return {
      id: docRef.id,
      ...commentData,
    } as Comment;
  } catch (error: any) {
    throw new Error('Failed to add comment: ' + error.message);
  }
};

export const getPostComments = async (postId: string): Promise<Comment[]> => {
  try {
    const snapshot = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
  } catch (error: any) {
    throw new Error('Failed to fetch comments: ' + error.message);
  }
};

export const deletePost = async (postId: string): Promise<void> => {
  try {
    // Delete all comments first
    const commentsSnapshot = await firestore()
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .get();

    for (const doc of commentsSnapshot.docs) {
      await doc.ref.delete();
    }

    // Delete the post
    await firestore().collection('posts').doc(postId).delete();
  } catch (error: any) {
    throw new Error('Failed to delete post: ' + error.message);
  }
};

export const uploadPostImage = async (userId: string, imageUri: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const reference = storage().ref(`post-images/${userId}/${timestamp}`);
    await reference.putFile(imageUri);
    const downloadURL = await reference.getDownloadURL();
    return downloadURL;
  } catch (error: any) {
    throw new Error('Failed to upload image: ' + error.message);
  }
};
