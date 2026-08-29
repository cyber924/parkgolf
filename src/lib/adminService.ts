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
  serverTimestamp,
  FirebaseUser,
} from './firebase';
import { AppUser, BlogPost } from '../types';

export const ADMIN_EMAILS = ['cyber924@naver.com', 'cyber92400@gmail.com'];

export const isUserAdmin = (user: FirebaseUser | null | undefined): boolean => {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(email);
};

// Initial Seed Users for preview / showcase
const DEFAULT_USERS: AppUser[] = [
  {
    uid: 'admin_cyber924',
    email: 'cyber924@naver.com',
    displayName: '사이버곰 (슈퍼 관리자)',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'super_admin',
    status: 'active',
    createdAt: '2026-01-15T09:00:00.000Z',
    lastLoginAt: '2026-08-24T04:12:00.000Z',
    postsCount: 14,
    totalViews: 3820,
    bio: 'AutoBlog AI 총괄 관리자 및 수석 에디터',
  },
  {
    uid: 'editor_golf_pro',
    email: 'golf.editor@autoblog.ai',
    displayName: '박프로 (골프 에디터)',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'editor',
    status: 'active',
    createdAt: '2026-03-10T11:20:00.000Z',
    lastLoginAt: '2026-08-23T18:40:00.000Z',
    postsCount: 8,
    totalViews: 1940,
    bio: '파크골프 & 필드 라운딩 전문 에디터',
  },
  {
    uid: 'creator_foodie',
    email: 'chef.lee@autoblog.ai',
    displayName: '이지은 셰프',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    role: 'editor',
    status: 'active',
    createdAt: '2026-04-02T14:15:00.000Z',
    lastLoginAt: '2026-08-22T09:30:00.000Z',
    postsCount: 6,
    totalViews: 1420,
    bio: '집밥 레시피 및 주방 정리 노하우 칼럼니스트',
  },
  {
    uid: 'user_finance_guru',
    email: 'investor_kim@autoblog.ai',
    displayName: '김재테크',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    role: 'member',
    status: 'active',
    createdAt: '2026-05-18T16:45:00.000Z',
    lastLoginAt: '2026-08-20T12:10:00.000Z',
    postsCount: 2,
    totalViews: 480,
    bio: '절세 및 청약 실전 노하우 구독자',
  },
  {
    uid: 'user_pending_demo',
    email: 'newbie_writer@test.com',
    displayName: '신규 에디터 지원자',
    photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80',
    role: 'member',
    status: 'pending',
    createdAt: '2026-08-23T20:00:00.000Z',
    lastLoginAt: '2026-08-23T20:05:00.000Z',
    postsCount: 0,
    totalViews: 0,
    bio: '문화/연예 전문 필진 승인 신청 대기 중',
  },
];

// Fetch all users from Firestore + merge with current active user & defaults
export const fetchAdminUsers = async (currentUser: FirebaseUser | null, allPosts: BlogPost[]): Promise<AppUser[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const cloudUsersMap = new Map<string, AppUser>();

    // Put default users
    DEFAULT_USERS.forEach((u) => {
      cloudUsersMap.set(u.email.toLowerCase(), { ...u });
    });

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const email = (data.email || '').toLowerCase();
      const isSuper = ADMIN_EMAILS.includes(email);

      const userObj: AppUser = {
        uid: docSnap.id,
        email: data.email || 'user@example.com',
        displayName: data.displayName || data.name || email.split('@')[0] || '크리에이터',
        photoURL: data.photoURL || '',
        role: isSuper ? 'super_admin' : (data.role || 'editor'),
        status: data.status || 'active',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate().toISOString() : data.lastLoginAt || new Date().toISOString(),
        postsCount: 0,
        totalViews: 0,
        bio: data.bio || (isSuper ? 'AutoBlog AI 최고 관리자' : '블로그 크리에이터'),
      };

      cloudUsersMap.set(email, userObj);
    });

    // If current logged-in user exists, ensure they are in the list
    if (currentUser && currentUser.email) {
      const cEmail = currentUser.email.toLowerCase();
      const isSuper = ADMIN_EMAILS.includes(cEmail);
      const existing = cloudUsersMap.get(cEmail);
      cloudUsersMap.set(cEmail, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || (isSuper ? '사이버곰 (슈퍼 관리자)' : currentUser.email.split('@')[0]),
        photoURL: currentUser.photoURL || existing?.photoURL || '',
        role: isSuper ? 'super_admin' : (existing?.role || 'editor'),
        status: 'active',
        createdAt: existing?.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        postsCount: existing?.postsCount || 0,
        totalViews: existing?.totalViews || 0,
        bio: existing?.bio || (isSuper ? 'AutoBlog AI 최고 관리자' : '웹진 에디터'),
      });
    }

    // Calculate real post counts & views per user
    const usersList = Array.from(cloudUsersMap.values());
    usersList.forEach((user) => {
      const userPosts = allPosts.filter(
        (p) =>
          (p.authorEmail && p.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
          (p.authorId && p.authorId === user.uid)
      );
      if (userPosts.length > 0) {
        user.postsCount = userPosts.length;
        user.totalViews = userPosts.reduce((acc, p) => acc + (p.views || 0), 0);
      } else if (user.role === 'super_admin') {
        user.postsCount = Math.max(user.postsCount || 0, allPosts.length);
        user.totalViews = allPosts.reduce((acc, p) => acc + (p.views || 0), 0);
      }
    });

    return usersList;
  } catch (error) {
    console.warn('Error fetching admin users:', error);
    return DEFAULT_USERS;
  }
};

// Update user role or status
export const updateUserInFirestore = async (
  userId: string,
  updates: Partial<AppUser>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, updates, { merge: true });
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
  }
};

// Delete user from Firestore
export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user from Firestore:', error);
  }
};
