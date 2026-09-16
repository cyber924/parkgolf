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
import { BlogPost, SharedImage } from '../types';
import { INITIAL_POSTS } from '../data/categories';
import { CURATED_GALLERY } from '../data/curatedImages';

const POSTS_COLLECTION = 'posts';
const SHARED_IMAGES_COLLECTION = 'shared_images';

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

// Fetch all public shared images with fallback to CURATED_GALLERY seeding
export const fetchSharedImages = async (): Promise<SharedImage[]> => {
  try {
    const imagesRef = collection(db, SHARED_IMAGES_COLLECTION);
    const q = query(imagesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('Seeding initial shared images to Firestore...');
      const seededList: SharedImage[] = [];
      let count = 0;
      for (const catColl of CURATED_GALLERY) {
        for (let i = 0; i < catColl.images.length; i++) {
          const img = catColl.images[i];
          const imageId = `seeded_img_${catColl.category}_${i}`;
          // Stagger dates slightly so they order nicely
          const date = new Date(Date.now() - count * 1000 * 60 * 60 * 2).toISOString();
          const sharedImg: SharedImage = {
            id: imageId,
            url: img.url,
            prompt: `${img.title} (${img.tag})`,
            theme: catColl.category,
            title: img.title,
            sizeKB: 45,
            createdAt: date,
            createdBy: 'System',
          };
          
          const imgDoc = doc(db, SHARED_IMAGES_COLLECTION, imageId);
          await setDoc(imgDoc, sharedImg);
          seededList.push(sharedImg);
          count++;
        }
      }
      return seededList.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    const images: SharedImage[] = [];
    snapshot.forEach((docSnap) => {
      images.push({ ...docSnap.data(), id: docSnap.id } as SharedImage);
    });
    return images;
  } catch (error) {
    console.warn('Firestore fetch shared images failed, returning local curated list:', error);
    // Fallback in-memory list
    const fallbackList: SharedImage[] = [];
    let count = 0;
    for (const catColl of CURATED_GALLERY) {
      for (let i = 0; i < catColl.images.length; i++) {
        const img = catColl.images[i];
        fallbackList.push({
          id: `local_fallback_${catColl.category}_${i}`,
          url: img.url,
          prompt: `${img.title} (${img.tag})`,
          theme: catColl.category,
          title: img.title,
          sizeKB: 45,
          createdAt: new Date(Date.now() - count * 1000 * 60 * 60 * 2).toISOString(),
          createdBy: 'System',
        });
        count++;
      }
    }
    return fallbackList;
  }
};

// Save a shared image to Firestore
export const saveSharedImageToFirestore = async (image: SharedImage): Promise<void> => {
  try {
    const imageRef = doc(db, SHARED_IMAGES_COLLECTION, image.id);
    await setDoc(imageRef, image);
  } catch (error) {
    console.error('Error saving shared image to Firestore:', error);
  }
};

// Delete a shared image from Firestore
export const deleteSharedImageFromFirestore = async (imageId: string): Promise<void> => {
  try {
    const imageRef = doc(db, SHARED_IMAGES_COLLECTION, imageId);
    await deleteDoc(imageRef);
  } catch (error) {
    console.error('Error deleting shared image from Firestore:', error);
  }
};

