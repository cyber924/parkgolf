import React from 'react';
import {
  Clock,
  Heart,
  Bookmark,
  ChevronRight,
  Sparkles,
  Share2,
} from 'lucide-react';
import { BlogPost } from '../types';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';

interface PostCardProps {
  post: BlogPost;
  onSelectPost: (post: BlogPost) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onSelectPost,
  onToggleBookmark,
  onToggleLike,
}) => {
  const categoryInfo = CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[0];

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.subtitle,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${post.title}\n${window.location.href}`);
      alert('블로그 글 링크와 제목이 클립보드에 복사되었습니다.');
    }
  };

  return (
    <article
      id={`post-card-${post.id}`}
      onClick={() => onSelectPost(post)}
      className="group bg-[#0F0F12] rounded-2xl border border-[#1F1F23] shadow-xl hover:border-indigo-500/50 hover:shadow-indigo-500/5 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-16/9 w-full bg-[#16161A] overflow-hidden">
        <img
          src={post.coverImageUrl}
          alt={post.title}
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('unsplash.com/photo-1499750310107')) {
              target.src = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80';
            }
          }}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-black/30 opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${categoryInfo.badgeColor}`}
          >
            <CategoryIcon name={categoryInfo.iconName} className="w-3.5 h-3.5" />
            <span>{categoryInfo.shortName}</span>
          </span>

          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              id={`bookmark-btn-${post.id}`}
              onClick={(e) => onToggleBookmark(post.id, e)}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition ${
                post.isBookmarked
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-black/60 text-zinc-300 hover:text-white hover:bg-black/80'
              }`}
              title={post.isBookmarked ? '북마크 해제' : '북마크 저장'}
            >
              <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom stats overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{post.estimatedReadTime || '3분 읽기'}</span>
          </span>
          <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs text-[11px] text-zinc-400">
            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Post Title */}
          <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5">
            {post.title}
          </h3>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {post.subtitle}
          </p>

          {/* News Source Fact Badge if Republished */}
          {post.newsSource && (
            <div className="mb-3 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1 font-bold">
                <span>📰 팩트 출처:</span>
                <span className="text-white">{post.newsSource.mediaName}</span>
              </span>
              <span className="text-blue-400 text-[10px]">실시간 뉴스 재발행</span>
            </div>
          )}

          {/* Summary Box Snippet */}
          {post.summaryBox && post.summaryBox.length > 0 && (
            <div className="bg-[#16161A] rounded-xl p-3 border border-[#27272A] mb-4">
              <div className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>핵심 포인트 요약</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-300">
                {post.summaryBox.slice(0, 2).map((item, i) => (
                  <li key={i} className="line-clamp-1 flex items-start gap-1.5">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hashtags */}
          {post.seo?.hashtags && (
            <div className="flex flex-wrap gap-1 mb-4">
              {post.seo.hashtags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-medium text-zinc-400 bg-[#16161A] border border-[#27272A] px-2 py-0.5 rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="pt-3 border-t border-[#1F1F23] flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-3">
            <button
              id={`like-btn-${post.id}`}
              onClick={(e) => onToggleLike(post.id, e)}
              className="flex items-center gap-1 hover:text-rose-400 transition"
            >
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/20" />
              <span>{post.likes}</span>
            </button>
            <button
              id={`share-btn-${post.id}`}
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-indigo-400 transition"
              title="공유하기"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="inline-flex items-center gap-0.5 font-semibold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform">
            <span>자세히 보기</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
