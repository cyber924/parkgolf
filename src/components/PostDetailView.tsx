import React, { useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Share2,
  Copy,
  Check,
  Download,
  Edit3,
  Eye,
  Wand2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckSquare,
  Square,
  FileCode,
  Layers,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { BlogPost } from '../types';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { MarkdownRenderer, FontSizeOption } from './MarkdownRenderer';
import { ImageSelectModal } from './ImageSelectModal';
import confetti from 'canvas-confetti';

interface PostDetailViewProps {
  post: BlogPost;
  originView?: 'webzine' | 'library' | 'generator';
  onBack: () => void;
  onUpdatePost: (updatedPost: BlogPost) => void;
  onToggleBookmark: (id: string, e: React.MouseEvent) => void;
  onToggleLike: (id: string, e: React.MouseEvent) => void;
}

export const PostDetailView: React.FC<PostDetailViewProps> = ({
  post,
  originView = 'webzine',
  onBack,
  onUpdatePost,
  onToggleBookmark,
  onToggleLike,
}) => {
  // Only show author/editor tools if coming from library/generator or manually toggled
  const [isEditorMode, setIsEditorMode] = useState(originView !== 'webzine');
  const [isEditing, setIsEditing] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState(post.contentMarkdown);
  const [copiedType, setCopiedType] = useState<'md' | 'html' | 'tags' | null>(null);
  const [fontSize, setFontSize] = useState<FontSizeOption>('normal');

  // Image Selection Modal States
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [editingContentImg, setEditingContentImg] = useState<{
    src: string;
    alt: string;
    index: number;
  } | null>(null);

  // Interactive checklist state
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  // FAQ accordion open states
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({ 0: true, 1: true });

  // AI Refine Action state
  const [isRefining, setIsRefining] = useState(false);
  const [refineActionSelected, setRefineActionSelected] = useState<string>('expand');

  // Image regeneration state
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [imageRegenSuccess, setImageRegenSuccess] = useState(false);

  const categoryInfo = CATEGORIES.find((c) => c.id === post.category) || CATEGORIES[0];

  // Handle Cover Photo Selection
  const handleCoverPhotoSelect = (newUrl: string) => {
    const updated: BlogPost = {
      ...post,
      coverImageUrl: newUrl,
      contentMarkdown: editableMarkdown,
    };
    onUpdatePost(updated);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.4 } });
    } catch (e) {}
  };

  // Handle Content Photo Selection
  const handleContentPhotoSelect = (newUrl: string, newCaption?: string) => {
    if (!editingContentImg) return;

    let markdown = editableMarkdown;
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...markdown.matchAll(imgRegex)];

    const targetMatch = matches[editingContentImg.index];
    if (targetMatch) {
      const oldTag = targetMatch[0];
      const finalCaption = newCaption !== undefined ? newCaption : targetMatch[1];
      const newTag = `![${finalCaption}](${newUrl})`;
      markdown = markdown.replace(oldTag, newTag);

      // If caption was edited and there is an italic caption right below it (*▲ ...*), update it too
      const oldCaptionPattern = new RegExp(`\\*▲\\s*${targetMatch[1]}\\*`, 'g');
      if (oldCaptionPattern.test(markdown) && finalCaption) {
        markdown = markdown.replace(oldCaptionPattern, `*▲ ${finalCaption}*`);
      }

      setEditableMarkdown(markdown);
      const updated: BlogPost = {
        ...post,
        contentMarkdown: markdown,
      };
      onUpdatePost(updated);
      try {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      } catch (e) {}
    }
    setEditingContentImg(null);
  };

  const handleStartEditContentImage = (src: string, alt: string, index: number) => {
    setEditingContentImg({ src, alt, index });
  };

  const handleRegenerateImages = async () => {
    setIsRegeneratingImages(true);
    setImageRegenSuccess(false);
    try {
      const res = await fetch('/api/blog/regenerate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post }),
      });
      const data = await res.json();
      if (data.success && data.coverImageUrl) {
        const updated: BlogPost = {
          ...post,
          coverImageUrl: data.coverImageUrl,
          contentMarkdown: data.updatedMarkdown || post.contentMarkdown,
        };
        setEditableMarkdown(data.updatedMarkdown || post.contentMarkdown);
        onUpdatePost(updated);
        setImageRegenSuccess(true);
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
        setTimeout(() => setImageRegenSuccess(false), 3500);
      } else {
        alert(data.error || '이미지 재생성에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('이미지 맞춤 생성 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsRegeneratingImages(false);
    }
  };

  const handleCopyMarkdown = () => {
    const fullText = `# ${post.title}\n\n> ${post.subtitle}\n\n${editableMarkdown}\n\n---\n\n### 태그\n${post.seo?.hashtags?.join(' ') || ''}`;
    navigator.clipboard.writeText(fullText);
    setCopiedType('md');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyHTML = () => {
    // Generate simple clean HTML suitable for Naver/Tistory clipboard pasting
    const htmlString = `
      <h1>${post.title}</h1>
      <p><em>${post.subtitle}</em></p>
      <hr/>
      <div>${editableMarkdown.replace(/## (.*?)\n/g, '<h2>$1</h2>\n').replace(/### (.*?)\n/g, '<h3>$1</h3>\n').replace(/\n/g, '<br/>')}</div>
      <br/>
      <p><strong>태그:</strong> ${post.seo?.hashtags?.join(' ') || ''}</p>
    `;
    navigator.clipboard.writeText(htmlString);
    setCopiedType('html');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyHashtags = () => {
    const tags = post.seo?.hashtags?.join(' ') || '';
    navigator.clipboard.writeText(tags);
    setCopiedType('tags');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadFile = () => {
    const content = `# ${post.title}\n\n> ${post.subtitle}\n\n${editableMarkdown}\n\n---\n## 3줄 요약\n${post.summaryBox.map((s) => `- ${s}`).join('\n')}\n\n---\n## 해시태그\n${post.seo.hashtags.join(' ')}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.title.replace(/[^\w\sㄱ-힣]/gi, '').trim()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    const updated = {
      ...post,
      contentMarkdown: editableMarkdown,
    };
    onUpdatePost(updated);
    setIsEditing(false);
  };

  const handleRefineWithAI = async (action: string) => {
    setIsRefining(true);
    try {
      const res = await fetch('/api/blog/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          currentPost: {
            ...post,
            contentMarkdown: editableMarkdown,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.updatedMarkdown) {
        setEditableMarkdown(data.updatedMarkdown);
        const updated = { ...post, contentMarkdown: data.updatedMarkdown };
        onUpdatePost(updated);
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
    } catch (err) {
      console.error(err);
      alert('글 보강 중 오류가 발생했습니다.');
    } finally {
      setIsRefining(false);
    }
  };

  const toggleChecklist = (index: number) => {
    setCheckedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const toggleFaq = (index: number) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Action Nav */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          id="btn-back-to-feed"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#16161A] border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#222228] font-semibold text-xs sm:text-sm shadow-xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>목록으로 돌아가기</span>
        </button>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          {/* Font Size Adjuster */}
          <div className="flex items-center bg-[#16161A] p-0.5 rounded-xl border border-[#27272A]">
            <span className="text-[11px] text-zinc-400 font-bold px-2 hidden sm:inline">글자:</span>
            {(
              [
                { id: 'compact', label: '작게' },
                { id: 'normal', label: '보통' },
                { id: 'large', label: '크게' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setFontSize(item.id)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  fontSize === item.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`글자 크기 ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Editor Mode Toggle Button */}
          <button
            id="btn-toggle-author-tools"
            onClick={() => setIsEditorMode(!isEditorMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
              isEditorMode
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-[#16161A] text-zinc-400 border-[#27272A] hover:text-white hover:bg-[#222228]'
            }`}
            title="에디터 편집 및 AI 도구 토글"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isEditorMode ? '에디터 활성 중' : '에디터 도구'}</span>
          </button>

          {/* Author Only Controls */}
          {isEditorMode && (
            <>
              {/* Webzine Publish Status Toggle */}
              <button
                id={`detail-publish-btn-${post.id}`}
                onClick={() => {
                  const newStatus = post.status === 'published' ? 'draft' : 'published';
                  onUpdatePost({ ...post, status: newStatus });
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer border ${
                  post.status === 'published'
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/30'
                    : 'bg-amber-600/20 text-amber-300 border-amber-500/50 hover:bg-amber-600/30'
                }`}
                title="웹진 공개 발행 / 초안 변경"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{post.status === 'published' ? '웹진 발행 중' : '초안 (비공개)'}</span>
              </button>

              {/* Mode Switcher (Direct Markdown Edit) */}
              <button
                id="btn-toggle-edit-mode"
                onClick={() => {
                  if (isEditing) {
                    handleSaveEdit();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
                  isEditing
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
                    : 'bg-[#16161A] text-zinc-300 border-[#27272A] hover:text-white hover:bg-[#222228]'
                }`}
              >
                {isEditing ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>저장 완료</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>본문 편집</span>
                  </>
                )}
              </button>

              {/* Copy Markdown */}
              <button
                id="btn-copy-markdown"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#16161A] border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#222228] text-xs font-semibold transition cursor-pointer"
                title="마크다운 복사"
              >
                {copiedType === 'md' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">복사됨!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">MD 복사</span>
                  </>
                )}
              </button>

              {/* Download MD */}
              <button
                id="btn-download-post"
                onClick={handleDownloadFile}
                className="p-2 rounded-xl bg-[#16161A] border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#222228] transition cursor-pointer"
                title=".md 파일 다운로드"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Copy HTML for Naver/Tistory (Available to all) */}
          <button
            id="btn-copy-html"
            onClick={handleCopyHTML}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#16161A] border border-[#27272A] text-zinc-300 hover:text-white hover:bg-[#222228] text-xs font-semibold transition cursor-pointer"
            title="블로그 서식 복사"
          >
            {copiedType === 'html' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">서식 복사됨!</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">블로그 복사</span>
              </>
            )}
          </button>

          {/* Bookmark */}
          <button
            id={`detail-bookmark-btn-${post.id}`}
            onClick={(e) => onToggleBookmark(post.id, e)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              post.isBookmarked
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20'
                : 'bg-[#16161A] text-zinc-300 border-[#27272A] hover:text-white hover:bg-[#222228]'
            }`}
            title="북마크"
          >
            <Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-current' : ''}`} />
          </button>

          {/* Like */}
          <button
            id={`detail-like-btn-${post.id}`}
            onClick={(e) => onToggleLike(post.id, e)}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#16161A] border border-[#27272A] text-rose-400 hover:bg-[#222228] text-xs font-semibold transition cursor-pointer"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500/30" />
            <span>{post.likes}</span>
          </button>
        </div>
      </div>

      {/* Main Article Container */}
      <article className="bg-[#0F0F12] rounded-3xl border border-[#1F1F23] shadow-2xl overflow-hidden">
        {/* Cover Photo */}
        <div className="relative aspect-21/9 sm:aspect-16/7 w-full bg-[#16161A] overflow-hidden group/cover">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('unsplash.com/photo-1535131749006')) {
                target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80';
              }
            }}
            className="w-full h-full object-cover opacity-80 group-hover/cover:scale-102 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/60 to-black/30" />

          {/* Quick Cover Image Change Button (Always visible on hover or in editor mode) */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={() => setIsCoverModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/80 hover:bg-indigo-600 border border-white/20 text-white text-xs sm:text-sm font-bold shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
              title="커버 대표 사진 교체"
            >
              <ImageIcon className="w-4 h-4 text-indigo-300 group-hover:text-white" />
              <span>커버 사진 변경</span>
            </button>
          </div>

          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md mb-3 ${categoryInfo.badgeColor}`}
            >
              <CategoryIcon name={categoryInfo.iconName} className="w-3.5 h-3.5" />
              <span>{categoryInfo.name}</span>
            </span>

            <h1 className="text-xl sm:text-3xl font-extrabold leading-tight text-white drop-shadow-md">
              {post.title}
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
              {post.subtitle}
            </p>

            <div className="flex items-center gap-4 mt-4 text-xs text-zinc-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>예상 읽기: {post.estimatedReadTime || '4분'}</span>
              </span>
              <span>•</span>
              <span>작성일: {new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
              <span>•</span>
              <span>조회수 {post.views}회</span>
            </div>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="p-6 sm:p-10 space-y-8">
          {/* AI Image & Content Assist Toolbar (Shown ONLY in Author / Editor Mode) */}
          {isEditorMode && (
            <div className="space-y-3">
              {/* Image Regen Banner */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-purple-950/30 to-indigo-950/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 flex items-center justify-center shrink-0 shadow-xs">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>본문 & 커버 맞춤 사진 스마트 재매칭</span>
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-semibold border border-purple-500/30">Gemini AI</span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      글의 주제(골프, 드라마, 시사 등)에 100% 어울리는 고화질 사진 3장(커버 + 본문 2장)으로 즉시 교체합니다.
                    </div>
                  </div>
                </div>

                <button
                  id="btn-regenerate-images"
                  disabled={isRegeneratingImages}
                  onClick={handleRegenerateImages}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                    imageRegenSuccess
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-600/20'
                  } disabled:opacity-50`}
                >
                  {isRegeneratingImages ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>맞춤 사진 찾는 중...</span>
                    </>
                  ) : imageRegenSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>사진 교체 완료!</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>📸 사진만 다시 생성</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Text Refine Toolbar */}
              <div className="p-4 rounded-2xl bg-[#16161A] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Wand2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">AI 글 보강 & 원클릭 리터칭</div>
                    <div className="text-[11px] text-zinc-400">
                      Gemini AI로 분량을 확장하거나 문체를 즉시 변경할 수 있습니다.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { id: 'expand', label: '🔥 내용 30% 확장' },
                    { id: 'friendly', label: '🌸 친근한 어조로' },
                    { id: 'professional', label: '💼 전문 칼럼형' },
                    { id: 'add_qa', label: '❓ Q&A 추가' },
                    { id: 'seo_boost', label: '🚀 SEO 최적화' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      disabled={isRefining}
                      onClick={() => handleRefineWithAI(opt.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#222228] border border-[#2E2E36] text-zinc-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {isRefining ? <Loader2 className="w-3 h-3 animate-spin inline" /> : opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* News Source Attribution Box if Republished */}
          {post.newsSource && (
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[11px] font-bold">
                    📰 실시간 팩트 기사 재발행
                  </span>
                  <span className="text-xs font-bold text-blue-300">
                    언론사: {post.newsSource.mediaName}
                  </span>
                </div>
                <div className="text-xs text-zinc-300">
                  <strong>원문 표제:</strong> {post.newsSource.originalTitle}
                </div>
              </div>

              {post.newsSource.originalUrl && (
                <a
                  href={post.newsSource.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-300 hover:text-white hover:bg-blue-600 text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <span>원문 기사 확인</span>
                  <Share2 className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* 3-Bullet Summary Box */}
          {post.summaryBox && post.summaryBox.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#16161A] border border-amber-500/25 shadow-md">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>바쁜 분들을 위한 💡 3줄 핵심 요약</span>
              </div>
              <ul className="space-y-2">
                {post.summaryBox.map((summary, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-200 font-medium leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 border border-amber-500/30">
                      {idx + 1}
                    </span>
                    <span>{summary}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Table of Contents */}
          {post.tableOfContents && post.tableOfContents.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#16161A] border border-[#27272A]">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>목차 (Table of Contents)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                {post.tableOfContents.map((toc, index) => (
                  <div key={index} className="flex items-center gap-2 text-zinc-300 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span className="line-clamp-1">{toc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Markdown Body / Editor */}
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400 font-bold">
                <span>마크다운 실시간 편집기</span>
                <span className="text-indigo-400">완료 후 상단 '저장 완료' 버튼을 누르세요</span>
              </div>
              <textarea
                value={editableMarkdown}
                onChange={(e) => setEditableMarkdown(e.target.value)}
                rows={20}
                className="w-full p-4 rounded-2xl bg-[#16161A] border border-[#27272A] font-mono text-xs sm:text-sm text-white leading-relaxed focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden"
              />
            </div>
          ) : (
            <div>
              <MarkdownRenderer
                content={editableMarkdown}
                fontSize={fontSize}
                isEditorMode={isEditorMode}
                onEditImage={handleStartEditContentImage}
              />
            </div>
          )}

          {/* Actionable Checklist */}
          {post.checklist && post.checklist.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#16161A] border border-emerald-500/25">
              <div className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-2 mb-3">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>오늘 바로 실천하는 체크리스트</span>
              </div>
              <div className="space-y-2">
                {post.checklist.map((item, idx) => {
                  const isDone = !!checkedItems[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleChecklist(idx)}
                      className={`flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl cursor-pointer transition select-none ${
                        isDone
                          ? 'bg-emerald-950/40 text-emerald-300 line-through opacity-80 border border-emerald-800/40'
                          : 'bg-[#222228] text-zinc-100 hover:bg-[#282830] border border-[#2E2E36]'
                      }`}
                    >
                      {isDone ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      )}
                      <span className="text-xs sm:text-sm font-medium leading-relaxed">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FAQ Accordion Section */}
          {post.faqs && post.faqs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#1F1F23]">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>자주 묻는 질문 (FAQ)</span>
              </h3>
              <div className="space-y-2">
                {post.faqs.map((faq, index) => {
                  const isOpen = !!openFaqs[index];
                  return (
                    <div
                      key={index}
                      className="border border-[#27272A] rounded-xl overflow-hidden bg-[#16161A]"
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-white hover:bg-[#222228] transition cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-indigo-400 font-extrabold text-xs sm:text-sm">Q.</span>
                          <span>{faq.question}</span>
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-zinc-300 bg-[#1A1A20] border-t border-[#27272A] leading-relaxed">
                          <span className="text-emerald-400 font-bold mr-1.5 text-xs sm:text-sm">A.</span>
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEO Meta Information Card */}
          {post.seo && (
            <div className="p-6 rounded-2xl bg-[#0A0A0B] border border-[#27272A] text-zinc-300 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>SEO 검색 최적화 & 메타데이터</span>
                </div>
                <button
                  onClick={handleCopyHashtags}
                  className="text-xs text-zinc-300 hover:text-white bg-[#1E1E24] border border-[#2E2E36] px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  {copiedType === 'tags' ? '해시태그 복사완료!' : '해시태그 일괄 복사'}
                </button>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">메타 설명 (Meta Description)</div>
                <p className="text-xs sm:text-sm text-zinc-200 bg-[#16161A] p-3 rounded-xl border border-[#27272A] leading-relaxed">
                  {post.seo.metaDescription}
                </p>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1.5">타겟 키워드</div>
                <div className="flex flex-wrap gap-1.5">
                  {post.seo.targetKeywords?.map((kw, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1.5">추천 해시태그</div>
                <div className="flex flex-wrap gap-1.5">
                  {post.seo.hashtags?.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md bg-[#16161A] border border-[#27272A] text-zinc-300 hover:text-indigo-300 transition"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Cover Image Select Modal */}
      <ImageSelectModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        currentImageUrl={post.coverImageUrl}
        title="대표 커버 사진 변경"
        subtitle="기사의 첫인상을 결정하는 대표 고화질 커버 사진을 선택하거나 직접 업로드하세요."
        category={post.category}
        allowCaptionEdit={false}
        onSelect={(newUrl) => handleCoverPhotoSelect(newUrl)}
      />

      {/* Content Image Select & Caption Edit Modal */}
      {editingContentImg && (
        <ImageSelectModal
          isOpen={!!editingContentImg}
          onClose={() => setEditingContentImg(null)}
          currentImageUrl={editingContentImg.src}
          currentCaption={editingContentImg.alt}
          title={`본문 ${editingContentImg.index + 1}번째 사진 & 캡션 변경`}
          subtitle="본문 단락의 맥락과 일치하는 실제 파크골프/주제 사진 및 설명을 적용합니다."
          category={post.category}
          allowCaptionEdit={true}
          onSelect={(newUrl, newCaption) => handleContentPhotoSelect(newUrl, newCaption)}
        />
      )}
    </div>
  );
};
