import React, { useState } from 'react';
import {
  Bookmark,
  PenTool,
  Globe,
  FileEdit,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Share2,
  Copy,
  Plus,
  LogIn,
  AlertCircle,
  FileText,
  Lock,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { BlogPost } from '../types';
import { FirebaseUser } from '../lib/firebase';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { ImageSelectModal } from './ImageSelectModal';
import { Image as ImageIcon, Camera } from 'lucide-react';

interface LibraryViewProps {
  posts: BlogPost[];
  currentUser: FirebaseUser | null;
  onSelectPost: (post: BlogPost) => void;
  onUpdatePost?: (post: BlogPost) => void;
  onTogglePublish: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  onOpenQuickGenerator: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  posts,
  currentUser,
  onSelectPost,
  onUpdatePost,
  onTogglePublish,
  onDeletePost,
  onToggleBookmark,
  onToggleLike,
  onOpenQuickGenerator,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'my_posts' | 'bookmarks'>('my_posts');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [regeneratingImgId, setRegeneratingImgId] = useState<string | null>(null);
  const [selectedPostForCoverModal, setSelectedPostForCoverModal] = useState<BlogPost | null>(null);

  const handleQuickCoverChange = (post: BlogPost, newUrl: string) => {
    if (onUpdatePost) {
      const updated: BlogPost = {
        ...post,
        coverImageUrl: newUrl,
      };
      onUpdatePost(updated);
    }
    setSelectedPostForCoverModal(null);
  };

  const handleQuickRegenerateImages = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    if (regeneratingImgId) return;
    setRegeneratingImgId(post.id);
    try {
      const res = await fetch('/api/blog/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      });
      const data = await res.json();
      if (data.success && data.coverImageUrl && onUpdatePost) {
        const updated: BlogPost = {
          ...post,
          coverImageUrl: data.coverImageUrl,
          contentMarkdown: data.updatedMarkdown || post.contentMarkdown,
        };
        onUpdatePost(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegeneratingImgId(null);
    }
  };

  // My generated posts (matching current user UID or generated in session)
  const myPosts = posts.filter((p) => {
    if (currentUser) {
      return p.authorId === currentUser.uid || !p.authorId;
    }
    return true; // If not logged in, show all session-generated posts
  });

  const publishedCount = myPosts.filter((p) => p.status === 'published').length;
  const draftCount = myPosts.filter((p) => p.status === 'draft').length;

  const filteredMyPosts = myPosts.filter((p) => {
    if (filterStatus === 'published') return p.status === 'published';
    if (filterStatus === 'draft') return p.status === 'draft';
    return true;
  });

  const bookmarkedPosts = posts.filter((p) => p.isBookmarked);

  const handleDeleteConfirm = (id: string) => {
    if (window.confirm('정말 이 글을 보관함 및 클라우드에서 삭제하시겠습니까?')) {
      onDeletePost(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Workspace Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0F0F12] border border-[#1F1F23] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>크리에이터 전용 자동 저장 워크스페이스</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>내 글 보관함 (Workspace)</span>
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
            {currentUser
              ? `👤 ${currentUser.displayName || currentUser.email} 님의 계정으로 AI 생성 글이 자동 영구 저장됩니다. 언제든지 웹진 발행 여부를 설정하고 수정/삭제하세요.`
              : '내가 생성한 글이 자동으로 보관함에 저장됩니다. 로그인하시면 클라우드 영구 보관 및 웹진 발행 관리가 가능합니다.'}
          </p>
        </div>

        {/* Action Button & Quick Stats */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
          <button
            onClick={onOpenQuickGenerator}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 active:scale-98 transition cursor-pointer"
          >
            <PenTool className="w-4 h-4" />
            <span>AI 새 글 자동생성</span>
          </button>

          {!currentUser && (
            <button
              onClick={() => onOpenAuth('login')}
              className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#16161A] hover:bg-[#222228] border border-[#27272A] text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>로그인하고 영구저장</span>
            </button>
          )}
        </div>
      </div>

      {/* Non-logged in helper callout */}
      {!currentUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">비로그인 상태입니다:</span>{' '}
              생성하신 글은 현재 브라우저 임시 보관함에 자동 저장 중입니다. Firebase 계정으로 로그인하면 언제 어디서나 기기 제한 없이 클라우드에 안전하게 영구 보관되며 웹진으로 자유롭게 발행할 수 있습니다.
            </div>
          </div>
          <button
            onClick={() => onOpenAuth('signup')}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 transition cursor-pointer"
          >
            1초 간편 회원가입
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F23] pb-4">
        <div className="flex items-center gap-2 bg-[#0F0F12] p-1 rounded-2xl border border-[#1F1F23]">
          <button
            onClick={() => setActiveTab('my_posts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'my_posts'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>내가 생성한 글</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[11px]">
              {myPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>북마크한 웹진 글</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[11px]">
              {bookmarkedPosts.length}
            </span>
          </button>
        </div>

        {/* Status filter for My Posts */}
        {activeTab === 'my_posts' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-500 font-medium mr-1">상태 필터:</span>
            {[
              { id: 'all', label: '전체', count: myPosts.length },
              { id: 'published', label: '웹진 발행됨', count: publishedCount },
              { id: 'draft', label: '나만의 초안', count: draftCount },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id as any)}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  filterStatus === f.id
                    ? 'bg-[#27272E] text-white border-zinc-600'
                    : 'bg-[#16161A] text-zinc-400 border-[#27272A] hover:text-white'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: MY GENERATED POSTS */}
      {activeTab === 'my_posts' && (
        <div className="space-y-4">
          {filteredMyPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredMyPosts.map((post) => {
                const categoryObj =
                  CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[0];
                const isPublished = post.status === 'published';

                return (
                  <div
                    key={post.id}
                    className="group bg-[#0F0F12] border border-[#1F1F23] hover:border-[#2E2E35] rounded-2xl p-5 sm:p-6 transition flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl"
                  >
                    {/* Left: Info & Thumbnail */}
                    <div
                      onClick={() => onSelectPost(post)}
                      className="flex items-start gap-4 flex-1 cursor-pointer"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-20 h-20 sm:w-28 sm:h-24 rounded-xl bg-[#16161A] overflow-hidden shrink-0 relative border border-[#27272A] group/thumb">
                        <img
                          src={post.coverImageUrl}
                          alt={post.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {/* Hover Overlay Button to change cover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPostForCoverModal(post);
                          }}
                          className="absolute inset-0 bg-black/70 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-bold text-white transition-opacity backdrop-blur-xs cursor-pointer"
                          title="대표 사진 직접 변경"
                        >
                          <Camera className="w-4 h-4 text-indigo-300" />
                          <span>사진 변경</span>
                        </button>
                      </div>

                      {/* Text info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Publish Status Badge */}
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                              <Globe className="w-3 h-3" />
                              <span>웹진 발행 중 (공개)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
                              <Lock className="w-3 h-3" />
                              <span>나만의 초안 (비공개)</span>
                            </span>
                          )}

                          <span className="text-xs text-zinc-400 bg-[#16161A] px-2 py-0.5 rounded border border-[#27272A]">
                            {categoryObj.shortName}
                          </span>

                          <span className="text-[11px] text-zinc-500">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                          {post.title}
                        </h3>

                        <p className="text-xs text-zinc-400 line-clamp-1 leading-relaxed">
                          {post.subtitle}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-zinc-500 pt-0.5">
                          <span>읽기 {post.estimatedReadTime}</span>
                          <span>•</span>
                          <span>조회 {post.views}</span>
                          <span>•</span>
                          <span>좋아요 {post.likes}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[#1F1F23] flex-wrap justify-end">
                      {/* Change Cover Direct Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPostForCoverModal(post);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#16161A] hover:bg-[#222228] border border-[#27272A] text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer"
                        title="대표 커버 사진 변경"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>사진 변경</span>
                      </button>

                      {/* Regenerate Images Button */}
                      <button
                        id={`regen-images-btn-${post.id}`}
                        disabled={regeneratingImgId === post.id}
                        onClick={(e) => handleQuickRegenerateImages(post, e)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        title="글 주제에 맞는 고화질 이미지 스마트 AI 재매칭"
                      >
                        {regeneratingImgId === post.id ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                            <span>재매칭 중</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI 자동매칭</span>
                          </>
                        )}
                      </button>

                      {/* Publish / Unpublish Toggle Button */}
                      <button
                        id={`toggle-publish-btn-${post.id}`}
                        onClick={() => onTogglePublish(post)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isPublished
                            ? 'bg-[#16161A] text-zinc-300 border-[#27272A] hover:bg-amber-500/10 hover:text-amber-300 hover:border-amber-500/40'
                            : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
                        }`}
                        title={isPublished ? '웹진 발행 취소 (초안으로 변경)' : '웹진으로 공식 발행'}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>{isPublished ? '발행 취소' : '웹진 발행'}</span>
                      </button>

                      {/* Detail View / Edit */}
                      <button
                        onClick={() => onSelectPost(post)}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>본문 편집</span>
                      </button>

                      {/* Delete */}
                      <button
                        id={`delete-post-btn-${post.id}`}
                        onClick={() => handleDeleteConfirm(post.id)}
                        className="p-2 rounded-xl bg-[#16161A] hover:bg-rose-950/30 border border-[#27272A] hover:border-rose-800 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                        title="글 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#0F0F12] rounded-3xl border border-[#1F1F23] max-w-md mx-auto space-y-4">
              <PenTool className="w-10 h-10 text-zinc-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">생성된 글이 없습니다</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  원하는 주제를 한 줄만 입력하면 AI가 고품격 글을 작성하여 보관함에 자동 저장해 드립니다.
                </p>
              </div>
              <button
                onClick={onOpenQuickGenerator}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                AI 새 글 생성하기
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOKMARKED ARTICLES */}
      {activeTab === 'bookmarks' && (
        <div>
          {bookmarkedPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => onSelectPost(post)}
                  className="group bg-[#0F0F12] rounded-2xl border border-[#1F1F23] hover:border-indigo-500/50 transition overflow-hidden flex flex-col cursor-pointer shadow-xl"
                >
                  <div className="relative aspect-16/9 w-full bg-[#16161A] overflow-hidden">
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                    />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => onToggleBookmark(post.id, e)}
                        className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md cursor-pointer"
                        title="북마크 해제"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-400">
                        {post.categoryName}
                      </span>
                      <h3 className="text-base font-bold text-white line-clamp-2 mt-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {post.subtitle}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#1F1F23] flex items-center justify-between text-xs text-zinc-400">
                      <span>{post.estimatedReadTime}</span>
                      <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                        <span>자세히 보기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#0F0F12] rounded-3xl border border-[#1F1F23] max-w-md mx-auto space-y-4">
              <Bookmark className="w-10 h-10 text-zinc-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">북마크한 글이 없습니다</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  웹진에서 마음에 드는 글의 북마크 아이콘을 클릭하면 보관함에 스크랩됩니다.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Direct Cover Image Modal for Library */}
      {selectedPostForCoverModal && (
        <ImageSelectModal
          isOpen={!!selectedPostForCoverModal}
          onClose={() => setSelectedPostForCoverModal(null)}
          currentImageUrl={selectedPostForCoverModal.coverImageUrl}
          title={`[${selectedPostForCoverModal.title}] 대표 사진 변경`}
          subtitle="보관함 카드의 대표 커버 사진을 변경합니다."
          category={selectedPostForCoverModal.category}
          allowCaptionEdit={false}
          onSelect={(newUrl) => handleQuickCoverChange(selectedPostForCoverModal, newUrl)}
        />
      )}
    </div>
  );
};
