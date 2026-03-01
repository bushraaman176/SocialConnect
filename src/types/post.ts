export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  content: string;
  imageURL?: string | null;
  likes: number;
  likedBy: string[]; // Array of user IDs who liked this post
  comments: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  content: string;
  createdAt: any;
}

export interface Like {
  postId: string;
  userId: string;
  createdAt: any;
}
