import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Post } from '../../types/post';

interface PostsState {
  posts: Post[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setPosts: (state, action: PayloadAction<Post[]>) => {
      state.posts = action.payload;
    },
    addPost: (state, action: PayloadAction<Post>) => {
      state.posts.unshift(action.payload);
    },
    updatePost: (state, action: PayloadAction<Post>) => {
      const index = state.posts.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.posts[index] = action.payload;
      }
    },
    deletePost: (state, action: PayloadAction<string>) => {
      state.posts = state.posts.filter(p => p.id !== action.payload);
    },
    likePost: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        if (!post.likedBy.includes(action.payload.userId)) {
          post.likedBy.push(action.payload.userId);
          post.likes += 1;
        }
      }
    },
    unlikePost: (state, action: PayloadAction<{ postId: string; userId: string }>) => {
      const post = state.posts.find(p => p.id === action.payload.postId);
      if (post) {
        const index = post.likedBy.indexOf(action.payload.userId);
        if (index !== -1) {
          post.likedBy.splice(index, 1);
          post.likes -= 1;
        }
      }
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLoading,
  setPosts,
  addPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  setError,
} = postsSlice.actions;

export default postsSlice.reducer;
