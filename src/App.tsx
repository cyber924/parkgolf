import React, { useState, useEffect } from 'react';
import { Sparkles, Bookmark, Search } from 'lucide-react';
import { BlogPost, CategoryId, ViewMode } from './types';
import { CATEGORIES, INITIAL_POSTS } from './data/categories';
import { Navbar } from './components/Navbar';
import { WebzineView } from './components/WebzineView';
import { LibraryView } from './components/LibraryView';
import { PostDetailView } from './components/PostDetailView';
import { AIStudioView } from './components/AIStudioView';
import { AdminView } from './components/AdminView';
import { FirebaseInfoModal } from './components/FirebaseInfoModal';
import { AuthModal } from './components/AuthModal';
import {
  auth,
  onAuthStateChanged,
  FirebaseUser,
} from './lib/firebase';
import {
  fetchFirestorePosts,
  savePostToFirestore,
  updatePostInFirestore,
  deletePostFromFirestore,
  togglePostLikeInFirestore,
} from './lib/firestoreService';

const STORAGE_KEY = 'autoblog_ai_posts_v2';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load posts from storage', e);
    }
    return INITIAL_POSTS;
  });

  const [currentCategory, setCurrentCategory] = useState<CategoryId>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('webzine');
  const [originView, setOriginView] = useState<'webzine' | 'library' | 'generator'>('webzine');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Firestore Posts on mount and sync
  useEffect(() => {
    const loadCloudPosts = async () => {
      try {
        const cloudPosts = await fetchFirestorePosts();
        if (cloudPosts && cloudPosts.length > 0) {
          setPosts(cloudPosts);
        }
      } catch (err) {
        console.warn('Could not sync Firestore posts:', err);
      }
    };
    loadCloudPosts();
  }, []);

  // Save posts to localStorage backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save posts to storage', e);
    }
  }, [posts]);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  // Handle post selection (detail view)
  const handleSelectPost = (post: BlogPost, origin: 'webzine' | 'library' | 'generator' = 'webzine') => {
    const updatedViews = (post.views || 0) + 1;
    const updated = posts.map((p) => (p.id === post.id ? { ...p, views: updatedViews } : p));
    setPosts(updated);
    setSelectedPost({ ...post, views: updatedViews });
    setOriginView(origin);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Background update view count in Firestore
    updatePostInFirestore(post.id, { views: updatedViews });
  };

  // Toggle bookmark
  const handleToggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p))
    );
    if (selectedPost && selectedPost.id === id) {
      setSelectedPost((prev) => (prev ? { ...prev, isBookmarked: !prev.isBookmarked } : null));
    }
  };

  // Toggle like
  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let targetNewLikes = 0;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          targetNewLikes = (p.likes || 0) + 1;
          return { ...p, likes: targetNewLikes };
        }
        return p;
      })
    );
    if (selectedPost && selectedPost.id === id) {
      setSelectedPost((prev) => (prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null));
    }
    if (targetNewLikes > 0) {
      togglePostLikeInFirestore(id, targetNewLikes);
    }
  };

  // On new post created by AI Studio (Auto-saved to Library & Firestore)
  const handlePostCreated = (newPost: BlogPost) => {
    const postWithAuthor: BlogPost = {
      ...newPost,
      authorId: currentUser?.uid || newPost.authorId,
      authorName: currentUser?.displayName || currentUser?.email?.split('@')[0] || newPost.authorName || '에디터',
      authorEmail: currentUser?.email || newPost.authorEmail,
      status: newPost.status || 'published',
    };

    setPosts([postWithAuthor, ...posts]);
    setSelectedPost(postWithAuthor);
    setViewMode('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Save to Cloud Firestore
    savePostToFirestore(postWithAuthor);
  };

  // Update existing post after manual edit or AI refine
  const handleUpdatePost = (updatedPost: BlogPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setSelectedPost(updatedPost);

    // Save update to Cloud Firestore
    updatePostInFirestore(updatedPost.id, updatedPost);
  };

  // Toggle publish status (Published to Webzine vs Draft in Workspace)
  const handleTogglePublish = (post: BlogPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const updatedPost: BlogPost = { ...post, status: newStatus };
    handleUpdatePost(updatedPost);
  };

  // Delete post from library and Firestore
  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
      setViewMode('library');
    }
    deletePostFromFirestore(postId);
  };

  const bookmarkedPosts = posts.filter((p) => p.isBookmarked);
  const savedCount = bookmarkedPosts.length;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Navbar with Real Firebase Auth and Section Navigation */}
      <Navbar
        currentCategory={currentCategory}
        onSelectCategory={(catId) => {
          setCurrentCategory(catId);
          if (viewMode === 'detail') setViewMode('webzine');
        }}
        viewMode={viewMode}
        onSelectView={(view) => setViewMode(view)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savedCount={savedCount}
        onOpenQuickGenerator={() => setViewMode('generator')}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Dynamic Viewport */}
      <main className="flex-1">
        {/* VIEW 1: HIGH-END EDITORIAL WEBZINE (Representative Public Main Page) */}
        {viewMode === 'webzine' && (
          <WebzineView
            posts={posts}
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            onSelectPost={(post) => handleSelectPost(post, 'webzine')}
            onToggleBookmark={handleToggleBookmark}
            onToggleLike={handleToggleLike}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenQuickGenerator={() => setViewMode('generator')}
          />
        )}

        {/* VIEW 2: AUTHOR WORKSPACE / AUTO-SAVED LIBRARY */}
        {viewMode === 'library' && (
          <LibraryView
            posts={posts}
            currentUser={currentUser}
            onSelectPost={(post) => handleSelectPost(post, 'library')}
            onUpdatePost={handleUpdatePost}
            onTogglePublish={handleTogglePublish}
            onDeletePost={handleDeletePost}
            onToggleBookmark={handleToggleBookmark}
            onToggleLike={handleToggleLike}
            onOpenQuickGenerator={() => setViewMode('generator')}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* VIEW 3: AI GENERATOR STUDIO */}
        {viewMode === 'generator' && (
          <AIStudioView
            onPostCreated={(newPost) => {
              setOriginView('generator');
              handlePostCreated(newPost);
            }}
            onCancel={() => setViewMode('webzine')}
            initialCategory={currentCategory}
            currentUser={currentUser}
          />
        )}

        {/* VIEW 4: POST DETAIL / READER & EDITOR */}
        {viewMode === 'detail' && selectedPost && (
          <PostDetailView
            post={selectedPost}
            originView={originView}
            onBack={() => setViewMode(originView === 'library' ? 'library' : 'webzine')}
            onUpdatePost={handleUpdatePost}
            onToggleBookmark={(id, e) => handleToggleBookmark(id, e)}
            onToggleLike={(id, e) => handleToggleLike(id, e)}
          />
        )}

        {/* VIEW 5: ADMIN CONSOLE (Super Admin Only: cyber924@naver.com) */}
        {viewMode === 'admin' && (
          <AdminView
            posts={posts}
            currentUser={currentUser}
            onSelectPost={(post) => handleSelectPost(post, 'library')}
            onUpdatePost={handleUpdatePost}
            onDeletePost={handleDeletePost}
            onNavigateToWebzine={() => setViewMode('webzine')}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0A0A0B] text-zinc-500 text-xs py-10 border-t border-[#1F1F23]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-sm">ParkGolfOne AI Webzine</span>
            <span className="text-zinc-600">|</span>
            <span>파크골프 & 프리미엄 라이프스타일 공식 매거진</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
            >
              <span>Firebase 클라우드 연동 현황</span>
            </button>
            <span>•</span>
            <span>Powered by Gemini 3.7 Flash & Firestore</span>
          </div>
        </div>
      </footer>

      {/* Firebase Architecture Modal */}
      <FirebaseInfoModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Authentication Modal (Login & Sign Up) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}
