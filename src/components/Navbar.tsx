import React, { useState } from 'react';
import {
  Sparkles,
  PenTool,
  BookOpen,
  ShieldCheck,
  LogIn,
  LogOut,
  ChevronDown,
  UserPlus,
  Layers,
  LayoutDashboard,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { CategoryId, ViewMode } from '../types';
import { CategoryIcon } from './CategoryIcon';
import { FirebaseUser, logOutUser } from '../lib/firebase';
import { isUserAdmin } from '../lib/adminService';

interface NavbarProps {
  currentCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  viewMode: ViewMode;
  onSelectView: (view: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  savedCount: number;
  onOpenQuickGenerator: () => void;
  currentUser: FirebaseUser | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentCategory,
  onSelectCategory,
  viewMode,
  onSelectView,
  searchQuery,
  onSearchChange,
  savedCount,
  onOpenQuickGenerator,
  currentUser,
  onOpenAuth,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isAdmin = isUserAdmin(currentUser);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logOutUser();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0F0F12]/95 backdrop-blur-md border-b border-[#1F1F23] shadow-lg shadow-black/20">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Service Title */}
          <div className="flex items-center gap-3">
            <button
              id="nav-logo-btn"
              onClick={() => {
                onSelectView('webzine');
                onSelectCategory('all');
              }}
              className="flex items-center gap-2.5 text-left group transition cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-lg tracking-tight">ParkGolfOne AI</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    WEBZINE
                  </span>
                </div>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  파크골프 & 프리미엄 라이프스타일 공식 매거진
                </p>
              </div>
            </button>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Nav */}
            <nav className="flex items-center bg-[#16161A] p-1 rounded-xl border border-[#27272A]">
              <button
                id="nav-webzine-btn"
                onClick={() => onSelectView('webzine')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  viewMode === 'webzine'
                    ? 'bg-[#27272E] text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-bold">웹진</span>
              </button>

              {/* Logged-in only tabs */}
              {currentUser && (
                <>
                  <button
                    id="nav-library-btn"
                    onClick={() => onSelectView('library')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer relative ${
                      viewMode === 'library'
                        ? 'bg-[#27272E] text-white shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>내 보관함</span>
                    {savedCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 bg-indigo-500 text-white rounded-full text-[10px] font-bold">
                        {savedCount}
                      </span>
                    )}
                  </button>

                  {/* Admin Menu: ONLY shown if cyber924@naver.com / cyber92400@gmail.com */}
                  {isAdmin && (
                    <button
                      id="nav-admin-btn"
                      onClick={() => onSelectView('admin')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                        viewMode === 'admin'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/40'
                      }`}
                      title="최고 관리자 전용 콘솔 (대시보드 & 사용자 관리)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                      <span>관리자</span>
                    </button>
                  )}
                </>
              )}
            </nav>

            {/* AI Generate Action Button (Logged-in only) */}
            {currentUser && (
              <button
                id="nav-create-post-btn"
                onClick={onOpenQuickGenerator}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-98 transition cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AI 새 글 작성</span>
                <span className="sm:hidden">작성</span>
              </button>
            )}

            {/* User Auth Section (Login / Sign Up / Profile) */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-[#16161A] hover:bg-[#222228] border border-[#27272A] text-white transition cursor-pointer"
                >
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover border border-indigo-500/40"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 text-xs font-bold">
                      {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold max-w-[90px] truncate hidden md:inline">
                    {currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 bg-[#0F0F12] rounded-2xl border border-[#1F1F23] shadow-2xl p-2 z-40 animate-in fade-in">
                      <div className="p-3 border-b border-[#1F1F23] mb-1">
                        <div className="text-xs font-bold text-white truncate flex items-center justify-between">
                          <span>{currentUser.displayName || '웹진 에디터'}</span>
                          {isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                              관리자
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {currentUser.email}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Firebase 인증 계정 연동됨
                        </div>
                      </div>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onSelectView('admin');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-950/40 rounded-xl transition cursor-pointer text-left mb-1"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>관리자 콘솔 (대시보드 & 유저)</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onSelectView('library');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#16161A] rounded-xl transition cursor-pointer text-left"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>내 보관함 & 작성 글 관리</span>
                      </button>

                      <div className="my-1 border-t border-[#1F1F23]" />

                      <button
                        id="nav-logout-btn"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 rounded-xl transition cursor-pointer text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="nav-login-btn"
                  onClick={() => onOpenAuth('login')}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white bg-[#16161A] hover:bg-[#222228] border border-[#27272A] transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                  <span>로그인</span>
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-300" />
                  <span>회원가입</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
