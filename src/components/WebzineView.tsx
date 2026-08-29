import React, { useMemo } from 'react';
import {
  Sparkles,
  Award,
  Clock,
  ArrowUpRight,
  Eye,
  Heart,
  Search,
  X,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { BlogPost, CategoryId } from '../types';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { PostCard } from './PostCard';

interface WebzineViewProps {
  posts: BlogPost[];
  currentCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  onSelectPost: (post: BlogPost) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenQuickGenerator: () => void;
}

export const WebzineView: React.FC<WebzineViewProps> = ({
  posts,
  currentCategory,
  onSelectCategory,
  onSelectPost,
  onToggleBookmark,
  onToggleLike,
  searchQuery,
  onSearchChange,
}) => {
  // Filter only published posts for the Webzine
  const publishedPosts = useMemo(
    () => posts.filter((p) => p.status === 'published' || !p.status),
    [posts]
  );

  // Dynamically extract real tags from actual published posts
  const dynamicTags = useMemo(() => {
    const tagSet = new Set<string>();
    publishedPosts.forEach((p) => {
      p.seo?.hashtags?.forEach((t) => {
        const clean = t.replace(/^#/, '').trim();
        if (clean && clean.length <= 10) tagSet.add(clean);
      });
      p.seo?.targetKeywords?.forEach((k) => {
        if (k && k.length <= 10) tagSet.add(k.trim());
      });
    });

    // Fallback if very few tags found
    if (tagSet.size === 0) {
      return ['주방청소', '식비절약', 'K패스', '골프', '건강', '살림꿀팁'];
    }
    return Array.from(tagSet).slice(0, 10);
  }, [publishedPosts]);

  const filteredPosts = publishedPosts.filter((post) => {
    const matchesCategory = currentCategory === 'all' || post.category === currentCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.seo?.targetKeywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      post.seo?.hashtags?.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Featured Lead Story (Top article)
  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : publishedPosts[0];

  const currentCategoryObj = CATEGORIES.find((c) => c.id === currentCategory) || CATEGORIES[0];

  return (
    <div className="min-h-screen">
      {/* Editorial Webzine Header & Integrated Search Bar */}
      <section className="border-b border-[#1F1F23] bg-gradient-to-b from-[#121216] via-[#0D0D10] to-[#0A0A0B] pt-6 pb-7 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Ambient Background Light */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-10 right-10 w-[400px] h-[250px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-4">
          {/* Top Brand Flag & Slogan */}
          <div className="flex items-center justify-between border-b border-[#1F1F23]/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>ParkGolf WEBZINE</span>
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                ParkGolfOne 공식매거진
              </span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="py-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight leading-snug">
              파크골프와 일상의 모든 지혜를 담은,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-amber-200">
                ParkGolfOne 프리미엄 웹진
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              파크골프 코스 안내, 장비 리뷰, 스윙 꿀팁부터 살림·건강·재테크 등 실생활에 꼭 필요한 핵심 정보까지 큐레이션합니다.
            </p>
          </div>

          {/* Integrated Webzine Search & Real Topic Keywords */}
          <div className="pt-2 space-y-3">
            {/* Direct Webzine Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="webzine-integrated-search"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="웹진 기사 검색 (예: 파크골프, 스윙 레슨, 장비 리뷰, 골프, K패스, 건강 등)..."
                className="w-full pl-11 pr-10 py-2.5 text-sm rounded-2xl bg-[#16161A] border border-[#27272A] text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  title="검색어 지우기"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Keyword Tags dynamically derived from published posts */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3 text-indigo-400" />
                <span>추천 키워드:</span>
              </span>

              {dynamicTags.map((tag, idx) => {
                const isSelected = searchQuery.toLowerCase() === tag.toLowerCase();
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        onSearchChange('');
                      } else {
                        onSearchChange(tag);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-xs'
                        : 'bg-[#16161A] text-zinc-300 border-[#27272A] hover:border-indigo-500/50 hover:text-white'
                    }`}
                  >
                    <span>#{tag}</span>
                  </button>
                );
              })}

              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-xs text-rose-400 hover:text-rose-300 bg-rose-950/30 border border-rose-800/40 px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>검색 초기화</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Webzine Body Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* 1. Featured Cover Story (Hero Magazine Feature) */}
        {featuredPost && !searchQuery && currentCategory === 'all' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Editor's Pick • 이달의 웹진 대표 커버스토리</span>
                </h2>
              </div>
              <span className="text-xs font-semibold text-zinc-400">인기 에디토리얼</span>
            </div>

            <article
              id={`featured-lead-post-${featuredPost.id}`}
              onClick={() => onSelectPost(featuredPost)}
              className="group relative rounded-3xl bg-[#0F0F12] border border-[#1F1F23] hover:border-indigo-500/50 transition-all duration-300 overflow-hidden cursor-pointer grid grid-cols-1 lg:grid-cols-12 shadow-2xl"
            >
              {/* Left Large Hero Image */}
              <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] bg-[#16161A] overflow-hidden">
                <img
                  src={featuredPost.coverImageUrl}
                  alt={featuredPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-transparent to-black/30 lg:hidden" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-lg">
                    HOT 커버스토리
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-zinc-200 text-xs font-medium border border-white/10">
                    {featuredPost.categoryName}
                  </span>
                </div>
              </div>

              {/* Right Content Column */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 text-indigo-400 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{featuredPost.estimatedReadTime}</span>
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(featuredPost.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                    {featuredPost.authorName && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-300">By {featuredPost.authorName}</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white group-hover:text-indigo-300 transition-colors leading-snug">
                    {featuredPost.title}
                  </h3>

                  <p className="text-sm text-zinc-300 line-clamp-3 leading-relaxed">
                    {featuredPost.subtitle}
                  </p>

                  {/* Summary Box Preview */}
                  {featuredPost.summaryBox && featuredPost.summaryBox.length > 0 && (
                    <div className="bg-[#16161A] p-4 rounded-2xl border border-[#27272A] space-y-2">
                      <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>핵심 요약 포인트</span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                        {featuredPost.summaryBox[0]}
                      </p>
                    </div>
                  )}

                  {/* Hashtags */}
                  {featuredPost.seo?.hashtags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {featuredPost.seo.hashtags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-zinc-400 bg-[#16161A] border border-[#27272A] px-2.5 py-1 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Read Action */}
                <div className="pt-4 border-t border-[#1F1F23] flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-zinc-400">
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                      <span>{featuredPost.likes}</span>
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{featuredPost.views} 읽음</span>
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
                    <span>기사 전문 읽기</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </article>
          </section>
        )}

        {/* 2. Category Filtered / Grid Articles Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F23] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CategoryIcon name={currentCategoryObj.iconName} className="w-5 h-5 text-indigo-400" />
                <h2 className="text-xl font-black text-white">
                  {searchQuery
                    ? `'${searchQuery}' 검색 결과`
                    : currentCategory === 'all'
                    ? '최신 웹진 에디토리얼'
                    : currentCategoryObj.name}
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#16161A] text-zinc-400 border border-[#27272A]">
                  {filteredPosts.length}편 발행
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                {searchQuery
                  ? '입력하신 키워드와 일치하는 웹진 기사 목록입니다.'
                  : currentCategoryObj.description}
              </p>
            </div>

            {/* Quick Category switcher pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                    currentCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-[#16161A] text-zinc-400 border-[#27272A] hover:text-white'
                  }`}
                >
                  {cat.shortName}
                </button>
              ))}
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectPost={onSelectPost}
                  onToggleBookmark={onToggleBookmark}
                  onToggleLike={onToggleLike}
                />
              ))}
            </div>
          ) : (
            /* Reader-focused Empty Search State with Quick Reset */
            <div className="p-12 text-center bg-[#0F0F12] rounded-3xl border border-[#1F1F23] max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  '{searchQuery || currentCategoryObj.name}' 검색 결과가 없습니다
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  검색어의 철자를 확인하시거나, 전체 기사 목록에서 유용한 생활 꿀팁을 찾아보세요.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <button
                  onClick={() => {
                    onSearchChange('');
                    onSelectCategory('all');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>전체 웹진 기사 보기</span>
                </button>
              </div>

              {/* Quick suggestion tags */}
              {dynamicTags.length > 0 && (
                <div className="pt-4 border-t border-[#1F1F23]">
                  <p className="text-[11px] text-zinc-400 mb-2">추천 검색어:</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {dynamicTags.slice(0, 5).map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => onSearchChange(t)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-[#16161A] text-zinc-300 hover:text-white border border-[#27272A] hover:border-indigo-500 transition cursor-pointer"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

