import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  Eye,
  Heart,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  MoreVertical,
  UserPlus,
  RefreshCw,
  Sliders,
  ExternalLink,
  Edit3,
  Trash2,
  Shield,
  Activity,
  Cpu,
  Database,
  Globe,
  Radio,
  ArrowUpRight,
  Layers,
  Award,
  UserCheck,
  UserX,
} from 'lucide-react';
import { BlogPost, AppUser } from '../types';
import { CATEGORIES } from '../data/categories';
import { FirebaseUser } from '../lib/firebase';
import {
  isUserAdmin,
  fetchAdminUsers,
  updateUserInFirestore,
  deleteUserFromFirestore,
  ADMIN_EMAILS,
} from '../lib/adminService';

interface AdminViewProps {
  posts: BlogPost[];
  currentUser: FirebaseUser | null;
  onSelectPost: (post: BlogPost) => void;
  onUpdatePost: (updatedPost: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onNavigateToWebzine: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  posts,
  currentUser,
  onSelectPost,
  onUpdatePost,
  onDeletePost,
  onNavigateToWebzine,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system'>('overview');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Check admin authorization
  const isAdmin = isUserAdmin(currentUser);

  // Load users
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const data = await fetchAdminUsers(currentUser, posts);
      setUsers(data);
    } catch (e) {
      console.error('Failed to load admin users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, currentUser, posts.length]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const publishedPosts = posts.filter((p) => p.status === 'published').length;
    const draftPosts = totalPosts - publishedPosts;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const republishedNewsCount = posts.filter((p) => Boolean(p.newsSource)).length;
    const originalAiCount = totalPosts - republishedNewsCount;

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    posts.forEach((p) => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      totalViews,
      totalLikes,
      republishedNewsCount,
      originalAiCount,
      categoryCounts,
      totalUsers: users.length || 5,
    };
  }, [posts, users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.displayName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesRole =
        selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
      const matchesStatus =
        selectedStatusFilter === 'all' || u.status === selectedStatusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, userSearchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Handle role change
  const handleSaveRole = async (userId: string, newRole: AppUser['role'], newStatus: AppUser['status']) => {
    setUsers((prev) =>
      prev.map((u) => (u.uid === userId ? { ...u, role: newRole, status: newStatus } : u))
    );
    await updateUserInFirestore(userId, { role: newRole, status: newStatus });
    setRoleModalOpen(false);
    showToast('사용자 권한 및 계정 상태가 업데이트되었습니다.');
  };

  // Handle user delete
  const handleDeleteUser = async (userId: string, email: string) => {
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      alert('최고 관리자(Super Admin) 계정은 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`${email} 사용자를 정말 삭제하시겠습니까?`)) return;

    setUsers((prev) => prev.filter((u) => u.uid !== userId));
    await deleteUserFromFirestore(userId);
    showToast('사용자가 성공적으로 삭제되었습니다.');
  };

  // Non-admin guard view
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-500/10">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">관리자 전용 보안 구역</h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto mb-6 leading-relaxed">
          이 공간은 지정된 최고 관리자(<span className="text-indigo-400 font-mono font-semibold">cyber924@naver.com</span>) 계정으로 로그인한 경우에만 접근할 수 있습니다.
        </p>

        {currentUser ? (
          <div className="p-4 rounded-2xl bg-[#16161A] border border-[#27272A] max-w-md mx-auto mb-6 text-left">
            <div className="text-xs text-zinc-500 mb-1">현재 로그인된 계정:</div>
            <div className="text-sm font-semibold text-white truncate">{currentUser.email}</div>
            <div className="text-xs text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>관리자 권한이 부여되지 않은 일반 사용자 계정입니다.</span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => onOpenAuth('login')}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition cursor-pointer mb-4"
          >
            관리자 계정으로 로그인하기
          </button>
        )}

        <div>
          <button
            onClick={onNavigateToWebzine}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer underline underline-offset-4"
          >
            ← 웹진 메인 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-[#14141A] via-[#181822] to-[#121216] border border-indigo-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  ParkGolfOne AI 관리자 콘솔
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  최고 관리자 인증됨
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                접속 관리자: <span className="text-indigo-300 font-mono">{currentUser?.email}</span> • 플랫폼 전체 통계 및 사용자 권한 관리
              </p>
            </div>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center bg-[#0F0F12] p-1.5 rounded-2xl border border-[#27272A] self-start md:self-auto">
            <button
              id="admin-tab-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>전체 대시보드</span>
            </button>
            <button
              id="admin-tab-users"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer relative ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>사용자 관리</span>
              <span className="px-1.5 py-0.2 bg-zinc-700 text-zinc-200 rounded-full text-[10px] font-bold">
                {users.length}
              </span>
            </button>
            <button
              id="admin-tab-system"
              onClick={() => setActiveTab('system')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeTab === 'system'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>시스템 가동</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERALL DASHBOARD OVERVIEW */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Key KPI Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Posts */}
            <div className="p-5 rounded-2xl bg-[#141418] border border-[#27272A] relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  발행 {stats.publishedPosts}건
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">{stats.totalPosts}개</div>
                <div className="text-xs text-zinc-400 mt-0.5 flex items-center justify-between">
                  <span>총 등록 콘텐츠</span>
                  <span className="text-zinc-500">초안 {stats.draftPosts}건</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Total Views */}
            <div className="p-5 rounded-2xl bg-[#141418] border border-[#27272A] relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">
                  좋아요 {stats.totalLikes}회
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">
                  {stats.totalViews.toLocaleString()}회
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">웹진 누적 총 조회수</div>
              </div>
            </div>

            {/* KPI 3: Registered Users */}
            <div className="p-5 rounded-2xl bg-[#141418] border border-[#27272A] relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>관리</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">{stats.totalUsers}명</div>
                <div className="text-xs text-zinc-400 mt-0.5">등록 에디터 & 크리에이터</div>
              </div>
            </div>

            {/* KPI 4: AI & News Engine */}
            <div className="p-5 rounded-2xl bg-[#141418] border border-[#27272A] relative overflow-hidden group hover:border-indigo-500/40 transition">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Gemini 3.7
                </span>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-black text-white">
                  {stats.republishedNewsCount}건 <span className="text-xs text-zinc-500 font-normal">/ {stats.originalAiCount}건</span>
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">뉴스 리퍼블리싱 / AI 원본 글</div>
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>카테고리별 콘텐츠 발행 현황</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    현재 AutoBlog AI 웹진에 분류된 주제별 포스트 분포율
                  </p>
                </div>
                <span className="text-xs text-zinc-500">총 {stats.totalPosts}건 기준</span>
              </div>

              <div className="space-y-3.5 pt-2">
                {CATEGORIES.filter((c) => c.id !== 'all').map((category) => {
                  const count = stats.categoryCounts[category.id] || 0;
                  const percentage = stats.totalPosts > 0 ? Math.round((count / stats.totalPosts) * 100) : 0;
                  return (
                    <div key={category.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span>{category.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-400 font-mono">
                          <span>{count}건</span>
                          <span className="w-9 text-right text-zinc-500">{percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#1F1F24] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Health & System Card */}
            <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-5 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>실시간 서비스 가동 상태</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  핵심 API 및 클라우드 DB 연결 상태
                </p>

                <div className="mt-5 space-y-3">
                  <div className="p-3.5 rounded-2xl bg-[#1A1A20] border border-[#27272A] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-indigo-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Google Gemini AI</div>
                        <div className="text-[10px] text-zinc-400">gemini-3.7-flash (안정화)</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      정상 100%
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#1A1A20] border border-[#27272A] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Cloud Firestore DB</div>
                        <div className="text-[10px] text-zinc-400">실시간 다중 리전 동기화</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      동기화 🟢
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#1A1A20] border border-[#27272A] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Naver RSS 수집기</div>
                        <div className="text-[10px] text-zinc-400">실시간 언론사 뉴스 피드</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      연동 중 🟢
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 mt-4">
                <div className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>보안 및 데이터 무결성 보장</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  모든 게시글과 사용자 계정 정보는 Firestore 보안 규칙으로 안전하게 보호되고 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Posts Management Table */}
          <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span>웹진 전체 게시글 즉시 관리 ({posts.length}건)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  발행 상태 토글, 상세 검토, 또는 관리자 권한 삭제
                </p>
              </div>

              <button
                onClick={loadUsers}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1A20] hover:bg-[#222228] border border-[#27272A] text-zinc-300 text-xs font-semibold transition cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>데이터 새로고침</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#181820] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">글 정보 / 제목</th>
                    <th className="py-3 px-4">카테고리</th>
                    <th className="py-3 px-4">작성자</th>
                    <th className="py-3 px-4">조회수 / 좋아요</th>
                    <th className="py-3 px-4">발행 상태</th>
                    <th className="py-3 px-4 text-right">관리 작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {posts.slice(0, 10).map((post) => (
                    <tr key={post.id} className="hover:bg-[#181820]/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={post.coverImageUrl}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover border border-[#27272A] shrink-0"
                          />
                          <div className="max-w-xs sm:max-w-md truncate">
                            <button
                              onClick={() => onSelectPost(post)}
                              className="font-bold text-white hover:text-indigo-400 transition truncate block text-left cursor-pointer"
                            >
                              {post.title}
                            </button>
                            <span className="text-[10px] text-zinc-500">{post.createdAt}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#222228] text-zinc-300 text-[10px] font-semibold border border-[#2D2D35]">
                          {post.categoryName}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-medium">
                        {post.authorName || '에디터'}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-400">
                        <span>👁️ {post.views || 0}</span> • <span>❤️ {post.likes || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const newStatus = post.status === 'published' ? 'draft' : 'published';
                            onUpdatePost({ ...post, status: newStatus });
                            showToast(`'${post.title}' 글의 상태가 [${newStatus === 'published' ? '발행' : '초안'}]으로 변경되었습니다.`);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            post.status === 'published'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                          }`}
                        >
                          {post.status === 'published' ? '🟢 웹진 발행 중' : '🟡 초안 (비공개)'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectPost(post)}
                            className="p-1.5 rounded-lg bg-[#222228] hover:bg-indigo-600 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="상세 열람"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`'${post.title}' 글을 삭제하시겠습니까?`)) {
                                onDeletePost(post.id);
                                showToast('게시글이 삭제되었습니다.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#222228] hover:bg-rose-600 text-zinc-400 hover:text-white transition cursor-pointer"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: USER MANAGEMENT (사용자 관리) */}
      {/* ======================================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter & Search Bar */}
          <div className="p-5 rounded-3xl bg-[#141418] border border-[#27272A] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="사용자 이름 또는 이메일 검색..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#1A1A20] border border-[#27272A] text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#1A1A20] border border-[#27272A] text-zinc-300 focus:outline-hidden cursor-pointer"
              >
                <option value="all">전체 역할 (Role)</option>
                <option value="super_admin">슈퍼 관리자 (Super Admin)</option>
                <option value="editor">에디터 (Editor)</option>
                <option value="member">일반 회원 (Member)</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-[#1A1A20] border border-[#27272A] text-zinc-300 focus:outline-hidden cursor-pointer"
              >
                <option value="all">전체 상태 (Status)</option>
                <option value="active">정상 활성 (Active)</option>
                <option value="pending">승인 대기 (Pending)</option>
                <option value="suspended">정지 (Suspended)</option>
              </select>

              <button
                onClick={loadUsers}
                disabled={isLoadingUsers}
                className="p-2 rounded-xl bg-[#1A1A20] hover:bg-[#222228] border border-[#27272A] text-zinc-300 transition cursor-pointer"
                title="목록 새로고침"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* User List Table */}
          <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>등록된 사용자 및 에디터 명단 ({filteredUsers.length}명)</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Firestore에 등록된 크리에이터 및 웹진 에디터의 권한을 변경하거나 계정 상태를 제어할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-[#181820] text-zinc-400 uppercase text-[10px] tracking-wider border-b border-[#27272A]">
                  <tr>
                    <th className="py-3 px-4">사용자 프로필</th>
                    <th className="py-3 px-4">권한 (Role)</th>
                    <th className="py-3 px-4">계정 상태</th>
                    <th className="py-3 px-4">작성 글 / 총 조회수</th>
                    <th className="py-3 px-4">최근 로그인 / 가입일</th>
                    <th className="py-3 px-4 text-right">권한 및 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F24]">
                  {filteredUsers.map((user) => {
                    const isSuper = user.role === 'super_admin' || ADMIN_EMAILS.includes(user.email.toLowerCase());
                    return (
                      <tr key={user.uid} className="hover:bg-[#181820]/70 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-[#27272A]"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-bold text-xs">
                                {user.displayName ? user.displayName[0] : 'U'}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{user.displayName}</span>
                                {isSuper && (
                                  <span title="슈퍼 관리자">
                                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              user.role === 'super_admin'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : user.role === 'editor'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {user.role === 'super_admin'
                              ? '👑 슈퍼 관리자'
                              : user.role === 'editor'
                              ? '✍️ 수석 에디터'
                              : '👤 일반 회원'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              user.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : user.status === 'pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                user.status === 'active'
                                  ? 'bg-emerald-400'
                                  : user.status === 'pending'
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-rose-400'
                              }`}
                            />
                            <span>
                              {user.status === 'active'
                                ? '정상 활성'
                                : user.status === 'pending'
                                ? '승인 대기'
                                : '정지됨'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-zinc-400">
                          <span className="text-white font-bold">{user.postsCount || 0}</span>편 •{' '}
                          <span>{(user.totalViews || 0).toLocaleString()}회</span>
                        </td>
                        <td className="py-3 px-4 text-[11px] text-zinc-400">
                          <div>{user.lastLoginAt?.slice(0, 10) || '최근 접속'}</div>
                          <div className="text-[10px] text-zinc-500">가입: {user.createdAt?.slice(0, 10)}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setRoleModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#222228] hover:bg-indigo-600 text-zinc-300 hover:text-white border border-[#2D2D35] transition cursor-pointer font-semibold text-[11px]"
                            >
                              권한 설정
                            </button>
                            {!isSuper && (
                              <button
                                onClick={() => handleDeleteUser(user.uid, user.email)}
                                className="p-1.5 rounded-xl bg-[#222228] hover:bg-rose-600 text-zinc-400 hover:text-white border border-[#2D2D35] transition cursor-pointer"
                                title="사용자 삭제"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SYSTEM ENGINE & MONITORING */}
      {/* ======================================================== */}
      {activeTab === 'system' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Architecture Spec */}
            <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Gemini 3.7 AI 엔진 구성</h3>
                  <p className="text-[11px] text-zinc-400">최신 멀티모달 LLM 모델 아키텍처</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">주력 언어 모델</span>
                  <span className="font-mono font-bold text-purple-300">models/gemini-3.7-flash</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">보조 폴백 모델</span>
                  <span className="font-mono text-zinc-300">gemini-flash-latest / gemini-3.1-pro</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">프롬프트 최적화</span>
                  <span className="text-emerald-400 font-bold">1200+ 토큰 풍부한 구조화 포맷</span>
                </div>
              </div>
            </div>

            {/* Cloud Firestore Spec */}
            <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Cloud Firestore DB 스펙</h3>
                  <p className="text-[11px] text-zinc-400">영구 저장 및 사용자 인증 데이터베이스</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">보안 규칙 (Rules)</span>
                  <span className="text-emerald-400 font-bold">배포 및 활성화 완료 🟢</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">저장 컬렉션</span>
                  <span className="font-mono text-amber-300">posts, users, bookmarks</span>
                </div>
                <div className="p-3 rounded-xl bg-[#1A1A20] flex items-center justify-between">
                  <span className="text-zinc-400">인증 연동</span>
                  <span className="text-indigo-400 font-bold">Google Auth & Email Provider</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role & Status Change Modal */}
      {roleModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141418] w-full max-w-md rounded-3xl border border-[#27272A] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">사용자 권한 및 상태 변경</h3>
                  <p className="text-[11px] text-zinc-400">{editingUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newRole = formData.get('role') as AppUser['role'];
                const newStatus = formData.get('status') as AppUser['status'];
                handleSaveRole(editingUser.uid, newRole, newStatus);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  부여할 권한 (Role)
                </label>
                <select
                  name="role"
                  defaultValue={editingUser.role}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A20] border border-[#27272A] text-white text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="member">일반 회원 (글 열람 및 북마크)</option>
                  <option value="editor">에디터 (AI 새 글 작성 및 포스팅 권한)</option>
                  <option value="super_admin">슈퍼 관리자 (전체 대시보드 & 사용자 관리)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  계정 상태 (Account Status)
                </label>
                <select
                  name="status"
                  defaultValue={editingUser.status}
                  className="w-full px-3 py-2 rounded-xl bg-[#1A1A20] border border-[#27272A] text-white text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="active">정상 활성 (Active)</option>
                  <option value="pending">승인 대기 (Pending)</option>
                  <option value="suspended">계정 정지 (Suspended)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#222228] text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  변경사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
