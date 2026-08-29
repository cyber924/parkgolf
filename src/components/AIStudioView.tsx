import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  PenTool,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Loader2,
  Newspaper,
  BookOpen,
} from 'lucide-react';
import { CategoryId, GenerationOptions, BlogPost } from '../types';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { FirebaseUser } from '../lib/firebase';
import { NewsRepublishStudio } from './NewsRepublishStudio';
import confetti from 'canvas-confetti';

interface AIStudioViewProps {
  initialCategory?: CategoryId;
  onPostCreated: (post: BlogPost) => void;
  onCancel?: () => void;
  currentUser?: FirebaseUser | null;
}

export const AIStudioView: React.FC<AIStudioViewProps> = ({
  initialCategory = 'cooking',
  onPostCreated,
  onCancel,
  currentUser,
}) => {
  const [studioMode, setStudioMode] = useState<'news' | 'lifestyle'>('news');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>(
    initialCategory === 'all' ? 'cooking' : initialCategory
  );
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'friendly' | 'professional' | 'story' | 'viral'>('friendly');
  const [targetAudience, setTargetAudience] = useState('2030 1인 가구 및 일반 독자');
  const [lengthOption, setLengthOption] = useState<'short' | 'standard' | 'inDepth'>('standard');
  const [includeFaq, setIncludeFaq] = useState(true);
  const [includeChecklist, setIncludeChecklist] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [publishDirectly, setPublishDirectly] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Trending topic recommendations
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestedTopics, setSuggestedTopics] = useState<Array<{ title: string; reason: string }>>([]);

  const currentCategoryData = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[1];

  const steps = [
    '생활 키워드 분석 및 SEO 타겟팅 중...',
    '소제목 및 독자 맞춤형 목차 구성 중...',
    'Gemini AI가 실생활 꿀팁 본문 작성 중...',
    '3줄 요약, FAQ 및 추천 해시태그 완성 중...',
  ];

  const handleSuggestTopics = async () => {
    setIsSuggesting(true);
    try {
      const response = await fetch('/api/blog/suggest-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          categoryName: currentCategoryData.name,
        }),
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.topics)) {
        setSuggestedTopics(data.topics);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setErrorMessage('생성할 블로그 주제를 입력해주세요.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setGenerationStep(0);

    // Step progress interval
    const stepInterval = setInterval(() => {
      setGenerationStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2400);

    try {
      const payload = {
        topic: topic.trim(),
        category: selectedCategory,
        categoryName: currentCategoryData.name,
        tone,
        targetAudience,
        lengthOption,
        includeFaq,
        includeChecklist,
        customNotes,
        authorId: currentUser?.uid,
        authorName: currentUser?.displayName || currentUser?.email?.split('@')[0] || '에디터',
        authorEmail: currentUser?.email || undefined,
        status: publishDirectly ? 'published' : 'draft',
      };

      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '블로그 글 생성에 실패했습니다.');
      }

      // Success
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onPostCreated(data.post);
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMessage(err.message || '글 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      clearInterval(stepInterval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Mode Switcher Tabs */}
      <div className="flex justify-center mb-8 relative z-10">
        <div className="bg-[#121216] p-1.5 rounded-2xl border border-[#27272A] flex items-center gap-1.5 shadow-xl">
          <button
            type="button"
            id="mode-tab-news"
            onClick={() => setStudioMode('news')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              studioMode === 'news'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Newspaper className="w-4 h-4 text-blue-300" />
            <span>최신 뉴스/이슈 팩트 재발행기</span>
            <span className="px-1.5 py-0.5 bg-blue-400/20 text-blue-200 text-[10px] rounded-md font-black">
              NEW
            </span>
          </button>

          <button
            type="button"
            id="mode-tab-lifestyle"
            onClick={() => setStudioMode('lifestyle')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              studioMode === 'lifestyle'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-indigo-300" />
            <span>생활정보 & 노하우 창작 생성기</span>
          </button>
        </div>
      </div>

      {studioMode === 'news' ? (
        <NewsRepublishStudio
          onPostCreated={onPostCreated}
          onCancel={onCancel}
          currentUser={currentUser}
        />
      ) : (
        <>
          {/* Studio Header */}
          <div className="mb-8 text-center relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold mb-3 backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ParkGolfOne & Gemini 3.7 Flash AI 포스팅 엔진</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              파크골프 & 라이프스타일 AI 기사 생성기
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-xl mx-auto">
              원하는 파크골프/생활 주제 한 줄만 입력하면 상위 노출 SEO, 목차, 본문 노하우, FAQ, 해시태그까지 완벽하게 작성해 드립니다.
            </p>
          </div>

          {/* Main Generator Form */}
          <form
            onSubmit={handleGenerate}
            className="bg-[#0F0F12] rounded-3xl border border-[#1F1F23] shadow-2xl p-6 sm:p-8 space-y-7 relative z-10"
          >
        {/* 1. Category Selection */}
        <div>
          <label className="block text-sm font-bold text-white mb-2.5">
            1. 카테고리 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  id={`select-cat-${cat.id}`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSuggestedTopics([]);
                  }}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                      : 'bg-[#16161A] border-[#27272A] text-zinc-300 hover:border-zinc-500 hover:text-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-[#222228] text-zinc-400'
                    }`}
                  >
                    <CategoryIcon name={cat.iconName} className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{cat.shortName}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Topic Input & Recommended Chips */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>2. 블로그 주제 입력</span>
              <span className="text-rose-400 font-normal">*필수</span>
            </label>
            <button
              type="button"
              id="btn-suggest-topics"
              onClick={handleSuggestTopics}
              disabled={isSuggesting}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              {isSuggesting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5" />
              )}
              <span>인기 트렌드 주제 추천받기</span>
            </button>
          </div>

          <div className="relative">
            <textarea
              id="topic-input-textarea"
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`예시: ${currentCategoryData.popularTopics[0] || '작성하고 싶은 생활 꿀팁이나 레시피를 적어보세요'}`}
              className="w-full p-4 rounded-2xl bg-[#16161A] border border-[#27272A] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden text-sm sm:text-base text-white placeholder:text-zinc-500 transition leading-relaxed resize-none"
            />
            {topic && (
              <button
                type="button"
                onClick={() => setTopic('')}
                className="absolute top-3 right-3 text-xs text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-[#222228] transition cursor-pointer"
              >
                지우기
              </button>
            )}
          </div>

          {/* Quick Click Topic Chips */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>추천 주제를 클릭하여 즉시 입력해보세요:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(suggestedTopics.length > 0
                ? suggestedTopics.map((t) => t.title)
                : currentCategoryData.popularTopics
              ).map((presetTopic, idx) => (
                <button
                  type="button"
                  key={idx}
                  id={`preset-topic-btn-${idx}`}
                  onClick={() => setTopic(presetTopic)}
                  className="text-xs text-zinc-300 bg-[#16161A] hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/40 border border-[#27272A] px-3 py-1.5 rounded-full transition text-left cursor-pointer flex items-center gap-1"
                >
                  <span>{presetTopic}</span>
                  <ArrowRight className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Tone & Style Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Tone selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              글 어조 (Voice & Tone)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'friendly', name: '🌸 친근한 이웃', desc: '~해요 (네이버)' },
                { id: 'professional', name: '💼 전문 칼럼', desc: '~합니다 (티스토리)' },
                { id: 'story', name: '📖 생생 후기', desc: '경험담/에세이' },
                { id: 'viral', name: '⚡ 핵심 요약', desc: '결론 중심 바이럴' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  id={`tone-btn-${item.id}`}
                  onClick={() => setTone(item.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    tone === item.id
                      ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold'
                      : 'border-[#27272A] bg-[#16161A] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{item.name}</div>
                  <div className="text-[10px] text-zinc-400">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Length & Target */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              포스팅 분량 (Length)
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { id: 'short', name: '요약형', len: '1,500자' },
                { id: 'standard', name: '표준형', len: '2,500자' },
                { id: 'inDepth', name: '가이드북', len: '3,500자+' },
              ].map((l) => (
                <button
                  type="button"
                  key={l.id}
                  id={`length-btn-${l.id}`}
                  onClick={() => setLengthOption(l.id as any)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    lengthOption === l.id
                      ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold'
                      : 'border-[#27272A] bg-[#16161A] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{l.name}</div>
                  <div className="text-[10px] text-zinc-400">{l.len}</div>
                </button>
              ))}
            </div>

            {/* Target Audience Input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                타겟 독자층
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="예: 2030 자취생, 살림 초보, 주부, 직장인"
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#16161A] border border-[#27272A] text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* 4. Extra Components checkboxes & notes */}
        <div className="pt-2 border-t border-[#1F1F23] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-zinc-300">
              <input
                type="checkbox"
                checked={includeFaq}
                onChange={(e) => setIncludeFaq(e.target.checked)}
                className="rounded border-[#27272A] bg-[#16161A] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>자주 묻는 질문(FAQ 3선) 포함</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-zinc-300">
              <input
                type="checkbox"
                checked={includeChecklist}
                onChange={(e) => setIncludeChecklist(e.target.checked)}
                className="rounded border-[#27272A] bg-[#16161A] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span>실천 체크리스트 포함</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setCustomNotes(customNotes ? '' : '다이소 꿀템이나 저렴한 대체품 팁을 강조해줘')}
            className="text-zinc-400 hover:text-indigo-400 underline font-medium cursor-pointer"
          >
            {customNotes ? '추가 요구사항 닫기' : '+ 추가 요구사항 메모'}
          </button>
        </div>

        {customNotes !== '' && (
          <div>
            <input
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="예: 다이소 제품으로 가능한 방법 위주로 작성, 실패했던 후기 사례 포함 등"
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#16161A] border border-[#27272A] text-white placeholder-zinc-500 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* 5. Auto Save & Publish Mode Option */}
        <div className="p-4 rounded-2xl bg-[#16161A] border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>보관함 자동 저장 & 웹진 발행 설정</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              생성 즉시 내 보관함에 자동 저장되며, 웹진 발행 여부를 결정할 수 있습니다.
            </p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-xl">
            <input
              type="checkbox"
              checked={publishDirectly}
              onChange={(e) => setPublishDirectly(e.target.checked)}
              className="rounded border-[#27272A] bg-[#16161A] text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span>웹진에 즉시 공개 발행하기</span>
          </label>
        </div>

        {/* Error message display */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold">생성 중 문제가 발생했습니다</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Action Buttons / Progress State */}
        {isGenerating ? (
          <div className="p-6 rounded-2xl bg-[#16161A] border border-indigo-500/30 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
              <span className="font-bold text-white text-base">
                AI 블로그 포스팅 작성 중입니다...
              </span>
            </div>
            <p className="text-xs text-indigo-300 font-semibold animate-pulse">
              {steps[generationStep]}
            </p>
            <div className="w-full max-w-md mx-auto bg-[#222228] h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${((generationStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-3 rounded-xl border border-[#27272A] text-zinc-400 hover:text-white hover:bg-[#16161A] font-semibold text-sm transition cursor-pointer"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              id="btn-start-generate"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-600/30 active:scale-98 transition cursor-pointer"
            >
              <Wand2 className="w-5 h-5" />
              <span>원클릭 AI 블로그 생성하기</span>
            </button>
          </div>
        )}
      </form>
      </>
      )}
    </div>
  );
};
