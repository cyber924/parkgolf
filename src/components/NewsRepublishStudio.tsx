import React, { useState, useEffect } from 'react';
import {
  Search,
  Newspaper,
  Sparkles,
  ExternalLink,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Loader2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Flag,
  Tv,
  Coins,
  Cpu,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { NewsArticle, BlogPost, CategoryId } from '../types';
import { FirebaseUser } from '../lib/firebase';
import confetti from 'canvas-confetti';

interface NewsRepublishStudioProps {
  onPostCreated: (post: BlogPost) => void;
  onCancel?: () => void;
  currentUser?: FirebaseUser | null;
}

const POPULAR_NEWS_PRESETS = [
  { label: '⛳ 파크골프 / PGA 투어', query: '파크골프 대회 골프', category: 'golf', categoryName: '파크골프 & 필드 라이프' },
  { label: '📺 화제의 드라마 / OTT', query: '인기 드라마 OTT', category: 'entertainment', categoryName: '드라마 & 방송/연예' },
  { label: '⚽ 해외축구 / 스포츠', query: '해외축구 손흥민', category: 'sports', categoryName: '스포츠 & 경기 분석' },
  { label: '💰 기준금리 / 증시 환율', query: '기준금리 환율 증시', category: 'finance', categoryName: '재테크 & 경제 동향' },
  { label: '💻 AI 반도체 / IT 테크', query: 'AI 반도체 기술', category: 'tech', categoryName: '스마트 IT & 테크' },
  { label: '⚾ 프로야구 KBO', query: '프로야구 KBO', category: 'sports', categoryName: '스포츠 & 경기 분석' },
];

const FOCUS_PRESETS_BY_CATEGORY: Record<string, string[]> = {
  golf: [
    '우승자 클럽/장비 세팅 & 승부처 코스 분석 및 아마추어 골퍼 팁',
    '경기 최종 스코어 타임라인 및 샷별 기술/스윙 메커니즘 해설',
    '골프 대회 상금 랭킹 변화 및 향후 투어 일정 전망',
  ],
  entertainment: [
    '이번 회차 결정적 복선 & 미회수 떡밥 분석 및 다음 회차 관전 포인트',
    '인물 간 심리 갈등 구도와 명장면/명대사 연출 비하인드',
    '시청률 추이 및 OTT 글로벌 랭킹과 시청자 반응 종합',
  ],
  finance: [
    '핵심 경제 수치 팩트체크 & 일반 가계 및 주식 시장 파급 효과',
    '전문가 시장 전망 분석 및 개인 투자자 실전 대응 전략',
    '과거 유사 사례 비교 및 정책 수혜/피해 분야 총정리',
  ],
  tech: [
    '신제품/기술 핵심 스펙 분석 및 기존 모델과의 심층 비교',
    '글로벌 빅테크 경쟁 구도와 산업 생태계에 미치는 영향',
    '일반 소비자를 위한 실사용 체감 포인트 및 구매 가이드',
  ],
  sports: [
    '경기 결정적 승부처 타임라인 및 감독 전술/선수 평점 분석',
    '선수 개인 기록 달성 배경 및 리그 순위 경쟁 구도 해설',
  ],
  news: [
    '보도 팩트 3줄 요약 & 사건 전개 일지 타임라인 정리',
    '이슈의 핵심 쟁점 분석 및 독자가 꼭 알아야 할 시사 상식',
  ],
};

export const NewsRepublishStudio: React.FC<NewsRepublishStudioProps> = ({
  onPostCreated,
  onCancel,
  currentUser,
}) => {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [newsList, setNewsList] = useState<NewsArticle[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected article for republication
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('golf');
  const [categoryName, setCategoryName] = useState('골프 & 필드 라이프');
  const [focusAngle, setFocusAngle] = useState(
    '우승자 클럽/장비 세팅 & 승부처 코스 분석 및 아마추어 골퍼 팁'
  );
  const [tone, setTone] = useState<'professional' | 'friendly' | 'story' | 'viral'>('professional');
  const [lengthOption, setLengthOption] = useState<'short' | 'standard' | 'inDepth'>('standard');
  const [customNotes, setCustomNotes] = useState('');
  const [publishDirectly, setPublishDirectly] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [genErrorMessage, setGenErrorMessage] = useState<string | null>(null);

  const generationSteps = [
    '구글 실시간 검색 기반 팩트 및 보도 수치 정밀 검증 중...',
    '전문가 관점 심층 분석 및 배경 지식 결합 중...',
    'Gemini 3.7 Flash가 고화질 사진 2장 및 에디토리얼 마크다운 작성 중...',
    '3줄 팩트 브리핑, 타임라인 비교표, FAQ 및 SEO 메타태그 완성 중...',
  ];

  const handleSearchNews = async (targetQuery?: string) => {
    const queryToSearch = (targetQuery !== undefined ? targetQuery : keyword).trim();
    if (!queryToSearch) {
      setSearchError('검색할 뉴스 주제나 키워드를 입력해주세요.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    setSelectedArticle(null);

    try {
      const res = await fetch(`/api/news/search?keyword=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        setNewsList(data.articles);
        if (data.articles.length > 0) {
          // Default select the first article
          handleSelectArticle(data.articles[0]);
        } else {
          setSearchError(`'${queryToSearch}'에 대한 최신 구글 뉴스 결과를 찾지 못했습니다. 다른 키워드로 검색해보세요.`);
        }
      } else {
        setSearchError(data.error || '뉴스 기사를 불러오지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setSearchError('네트워크 연결 문제로 기사를 가져오지 못했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPreset = (preset: (typeof POPULAR_NEWS_PRESETS)[0]) => {
    setKeyword(preset.query);
    setSelectedCategory(preset.category as CategoryId);
    setCategoryName(preset.categoryName);
    const availableFocuses = FOCUS_PRESETS_BY_CATEGORY[preset.category] || FOCUS_PRESETS_BY_CATEGORY.news;
    setFocusAngle(availableFocuses[0] || '팩트 분석 및 전문가 인사이트 해설');
    handleSearchNews(preset.query);
  };

  const handleSelectArticle = (article: NewsArticle) => {
    setSelectedArticle(article);
    // Guess category from keywords or article title
    const lower = (article.cleanTitle + ' ' + article.snippet).toLowerCase();
    if (lower.includes('골프') || lower.includes('pga') || lower.includes('lpga') || lower.includes('버디')) {
      setSelectedCategory('golf');
      setCategoryName('골프 & 필드 라이프');
      setFocusAngle(FOCUS_PRESETS_BY_CATEGORY.golf[0]);
    } else if (lower.includes('드라마') || lower.includes('배우') || lower.includes('넷플릭스') || lower.includes('방영')) {
      setSelectedCategory('entertainment');
      setCategoryName('드라마 & 방송/연예');
      setFocusAngle(FOCUS_PRESETS_BY_CATEGORY.entertainment[0]);
    } else if (lower.includes('축구') || lower.includes('야구') || lower.includes('손흥민') || lower.includes('kbo')) {
      setSelectedCategory('sports');
      setCategoryName('스포츠 & 경기 분석');
      setFocusAngle(FOCUS_PRESETS_BY_CATEGORY.sports[0]);
    } else if (lower.includes('금리') || lower.includes('주식') || lower.includes('증시') || lower.includes('환율')) {
      setSelectedCategory('finance');
      setCategoryName('재테크 & 경제 동향');
      setFocusAngle(FOCUS_PRESETS_BY_CATEGORY.finance[0]);
    } else if (lower.includes('ai') || lower.includes('반도체') || lower.includes('스마트폰') || lower.includes('엔비디아')) {
      setSelectedCategory('tech');
      setCategoryName('스마트 IT & 테크');
      setFocusAngle(FOCUS_PRESETS_BY_CATEGORY.tech[0]);
    }
  };

  const handleGenerateRepublish = async () => {
    if (!selectedArticle) {
      setGenErrorMessage('재발행할 뉴스 기사를 선택해주세요.');
      return;
    }

    setGenErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep(0);

    const stepTimer = setInterval(() => {
      setGenerationStep((prev) => (prev < generationSteps.length - 1 ? prev + 1 : prev));
    }, 2500);

    try {
      const payload = {
        keyword: keyword.trim(),
        newsTitle: selectedArticle.cleanTitle,
        newsSource: selectedArticle.mediaName,
        newsUrl: selectedArticle.link,
        newsSnippet: selectedArticle.snippet,
        newsPubDate: selectedArticle.pubDate,
        category: selectedCategory,
        categoryName,
        tone,
        targetAudience: '관련 분야 관심 독자 및 일반 대중',
        lengthOption,
        focusAngle,
        customNotes,
        authorId: currentUser?.uid,
        authorName: currentUser?.displayName || currentUser?.email?.split('@')[0] || '뉴스 팩트 에디터',
        authorEmail: currentUser?.email || undefined,
        status: publishDirectly ? 'published' : 'draft',
      };

      const response = await fetch('/api/news/republish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '뉴스 기반 블로그 글 생성에 실패했습니다.');
      }

      // Success
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }

      onPostCreated(data.post);
    } catch (err: any) {
      console.error(err);
      setGenErrorMessage(err.message || '글 생성 중 오류가 발생했습니다.');
    } finally {
      clearInterval(stepTimer);
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header Banner */}
      <div className="bg-[#121216] border border-[#27272A] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[90px] rounded-full pointer-events-none" />

        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
            <Newspaper className="w-3.5 h-3.5" />
            <span>실시간 구글 뉴스 피드 팩트 큐레이션 & 재발행 엔진</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            최신 뉴스 팩트 기반 전문 블로그 기사 재발행
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            골프, 드라마, 스포츠, 경제 등 실시간 언론사 기사의 <strong>정확한 팩트</strong>를 가져와,
            <strong>전문가적 인사이트와 고품격 마크다운 포맷(사진 2장, 타임라인, FAQ, 출처 표기)</strong>으로
            완성도 높은 웹진 기사를 재발행합니다.
          </p>

          {/* Search Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchNews();
            }}
            className="pt-2 flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                id="news-keyword-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="키워드 입력 (예: 파크골프, 손흥민, 골프 PGA 투어, 기준금리, AI 반도체)"
                className="w-full pl-10 pr-4 py-3 bg-[#18181C] border border-[#2A2A30] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              id="search-news-btn"
              disabled={isSearching}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>실시간 뉴스 검색</span>
            </button>
          </form>

          {/* Quick Presets */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> 인기 주제:
            </span>
            {POPULAR_NEWS_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  keyword === preset.query
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-[#18181C] text-zinc-400 border-[#2A2A30] hover:text-white hover:border-zinc-500'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left News Article List, Right Republish Editor Setup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Fetched News Cards (5 cols on lg) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>실시간 뉴스 피드 결과 ({newsList.length}건)</span>
            </h3>
            {isSearching && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> 수집 중...
              </span>
            )}
          </div>

          {searchError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{searchError}</span>
            </div>
          )}

          {/* News List Container */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1 scrollbar-thin">
            {newsList.length === 0 && !isSearching ? (
              <div className="p-8 text-center bg-[#121216] border border-[#27272A] rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {hasSearched ? '검색된 최신 뉴스가 없습니다' : '실시간 구글 뉴스 검색 대기 중'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {hasSearched
                      ? '입력하신 검색어에 대한 최신 기사가 없습니다. 다른 키워드나 상단 인기 주제 버튼을 눌러보세요.'
                      : '상단 검색창에 관심 있는 키워드(예: 손흥민, 골프, 기준금리 등)를 입력하거나 인기 주제 버튼을 클릭해 실시간 뉴스를 검색하세요.'}
                  </p>
                </div>
                {!hasSearched && (
                  <div className="pt-2 flex flex-wrap justify-center gap-1.5">
                    {POPULAR_NEWS_PRESETS.slice(0, 4).map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className="px-2.5 py-1 rounded-lg bg-[#18181C] hover:bg-blue-600/20 hover:text-blue-300 border border-[#2A2A30] text-xs text-zinc-400 transition cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              newsList.map((article, idx) => {
                const isSelected = selectedArticle?.id === article.id || selectedArticle?.cleanTitle === article.cleanTitle;
                return (
                  <div
                    key={article.id || idx}
                    id={`news-card-${idx}`}
                    onClick={() => handleSelectArticle(article)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
                        : 'bg-[#121216] border-[#222226] hover:border-zinc-600 hover:bg-[#16161B]'
                    }`}
                  >
                    {/* Source & Time Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-300 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-blue-400" />
                          {article.mediaName}
                        </span>
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {article.timeAgo}
                        </span>
                      </div>

                      {article.link && (
                        <a
                          href={article.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-500 hover:text-blue-400 transition"
                          title="원문 기사 열람"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {/* Headline */}
                    <h4
                      className={`text-sm font-bold leading-snug ${
                        isSelected ? 'text-blue-200' : 'text-zinc-100'
                      }`}
                    >
                      {article.cleanTitle}
                    </h4>

                    {/* Snippet */}
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                      {article.snippet}
                    </p>

                    {/* Select indicator */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          isSelected ? 'text-blue-400' : 'text-zinc-500'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                            <span>선택됨 (재발행 준비 완료)</span>
                          </>
                        ) : (
                          <span>클릭하여 이 기사 선택</span>
                        )}
                      </span>

                      <span className="text-[11px] text-zinc-400 font-medium">
                        {isSelected ? '옵션 설정하기 →' : '선택'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Republish Engine Settings (6 cols on lg) */}
        <div className="lg:col-span-6 space-y-5 bg-[#121216] border border-[#27272A] rounded-2xl p-6 shadow-xl">
          <div className="border-b border-[#222226] pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>선택 기사 팩트 재발행 및 전문 에디팅 설정</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              선택한 언론사 기사의 팩트를 분석하고 심층 해설을 더해 고품격 블로그 글로 변환합니다.
            </p>
          </div>

          {selectedArticle ? (
            <div className="space-y-5">
              {/* Selected Article Summary Box */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>분석 대상 기사: [{selectedArticle.mediaName}]</span>
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {selectedArticle.cleanTitle}
                </div>
                <div className="text-[11px] text-zinc-400 line-clamp-2">
                  {selectedArticle.snippet}
                </div>
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  1. 발행 카테고리
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'golf', name: '골프 & 스포츠', icon: Flag },
                    { id: 'entertainment', name: '드라마/연예', icon: Tv },
                    { id: 'news', name: '최신 시사/뉴스', icon: Newspaper },
                    { id: 'finance', name: '경제/재테크', icon: Coins },
                    { id: 'tech', name: '스마트 IT/테크', icon: Cpu },
                    { id: 'hobby', name: '라이프 & 취미', icon: Layers },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isCurrent = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id as CategoryId);
                          setCategoryName(cat.name);
                          const focusList = FOCUS_PRESETS_BY_CATEGORY[cat.id] || FOCUS_PRESETS_BY_CATEGORY.news;
                          if (focusList && focusList.length > 0) {
                            setFocusAngle(focusList[0]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                            : 'bg-[#18181C] text-zinc-400 border-[#2A2A30] hover:text-white hover:border-zinc-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Analysis & Focus Angle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-300">
                  2. 전문 분석 및 강조 초점 (Focus Angle)
                </label>
                <input
                  type="text"
                  value={focusAngle}
                  onChange={(e) => setFocusAngle(e.target.value)}
                  placeholder="예: 우승 클럽 장비 세팅 & 승부처 코스 분석 및 아마추어 팁"
                  className="w-full px-3.5 py-2.5 bg-[#18181C] border border-[#2A2A30] rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />

                {/* Preset Suggestions for the category */}
                <div className="flex flex-col gap-1 pt-1">
                  {(FOCUS_PRESETS_BY_CATEGORY[selectedCategory] || FOCUS_PRESETS_BY_CATEGORY.news).map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFocusAngle(preset)}
                      className={`text-left text-[11px] px-2.5 py-1 rounded-lg border transition ${
                        focusAngle === preset
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                          : 'bg-[#16161A] text-zinc-400 border-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      💡 {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone & Length */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">3. 글 어조 (Tone)</label>
                  <select
                    value={tone}
                    onChange={(e: any) => setTone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181C] border border-[#2A2A30] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="professional">전문 언론/칼럼니스트 톤 (~합니다)</option>
                    <option value="friendly">친근한 라이프스타일 톤 (~해요)</option>
                    <option value="story">생생한 현장감 스토리 톤</option>
                    <option value="viral">핵심 브리핑 트렌드 톤</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">4. 글 길이 분량</label>
                  <select
                    value={lengthOption}
                    onChange={(e: any) => setLengthOption(e.target.value)}
                    className="w-full px-3 py-2 bg-[#18181C] border border-[#2A2A30] rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="standard">표준 심층 분석 (약 3,000자)</option>
                    <option value="short">핵심 요약 브리핑 (약 1,500자)</option>
                    <option value="inDepth">기획 특집 완벽 가이드 (약 4,000자)</option>
                  </select>
                </div>
              </div>

              {/* Direct Webzine Publishing Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#18181C] border border-[#2A2A30]">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">웹진에 즉시 공식 기사로 공개 발행</div>
                  <div className="text-[11px] text-zinc-400">
                    체크 시 생성 즉시 메인 웹진 피드 및 내 보관함에 등록됩니다.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={publishDirectly}
                  onChange={(e) => setPublishDirectly(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-zinc-800 border-zinc-700 focus:ring-blue-500"
                />
              </div>

              {/* Error Display */}
              {genErrorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{genErrorMessage}</span>
                </div>
              )}

              {/* Generation Progress Indicator */}
              {isGenerating && (
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{generationSteps[generationStep]}</span>
                    </span>
                    <span>{generationStep + 1} / {generationSteps.length}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500 rounded-full"
                      style={{ width: `${((generationStep + 1) / generationSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="button"
                id="generate-republish-btn"
                onClick={handleGenerateRepublish}
                disabled={isGenerating || !selectedArticle}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini 3.7 Flash 팩트 기사 작성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>선택 기사 팩트 기반 블로그 재발행 시작</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-8 text-center text-zinc-400 text-sm">
              왼쪽 목록에서 재발행할 뉴스 기사를 클릭하여 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
