import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
} from './firebase';
import { BlogPost } from '../types';
import { INITIAL_POSTS } from '../data/categories';

const POSTS_COLLECTION = 'posts';

// Sync / Fetch all posts from Firestore with fallback to initial sample data
export const fetchFirestorePosts = async (): Promise<BlogPost[]> => {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Seed initial posts into Firestore so there's rich content
      console.log('Seeding initial posts to Firestore...');
      for (const post of INITIAL_POSTS) {
        const postDoc = doc(db, POSTS_COLLECTION, post.id);
        await setDoc(postDoc, post);
      }
      return INITIAL_POSTS;
    }

    const posts: BlogPost[] = [];
    snapshot.forEach((docSnap) => {
      posts.push({ ...docSnap.data(), id: docSnap.id } as BlogPost);
    });
    return posts;
  } catch (error) {
    console.warn('Firestore fetch failed, falling back to local memory:', error);
    return INITIAL_POSTS;
  }
};

// Save a newly generated post to Firestore
export const savePostToFirestore = async (post: BlogPost): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, post.id);
    await setDoc(postRef, post);
  } catch (error) {
    console.error('Error saving post to Firestore:', error);
  }
};

// Update an existing post (e.g. refined content, title) in Firestore
export const updatePostInFirestore = async (postId: string, updates: Partial<BlogPost>): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, updates);
  } catch (error) {
    console.error('Error updating post in Firestore:', error);
  }
};

// Delete a post from Firestore
export const deletePostFromFirestore = async (postId: string): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await deleteDoc(postRef);
  } catch (error) {
    console.error('Error deleting post from Firestore:', error);
  }
};

// Toggle likes in Firestore
export const togglePostLikeInFirestore = async (postId: string, newLikes: number): Promise<void> => {
  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    await updateDoc(postRef, { likes: newLikes });
  } catch (error) {
    console.error('Error toggling like in Firestore:', error);
  }
};
