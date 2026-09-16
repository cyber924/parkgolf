import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  Database,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  Search,
  Filter,
  Check,
  ClipboardCopy,
  FileImage,
} from 'lucide-react';
import { FirebaseUser } from '../lib/firebase';
import { SharedImage } from '../types';
import {
  fetchSharedImages,
  saveSharedImageToFirestore,
  deleteSharedImageFromFirestore,
} from '../lib/firestoreService';
import { compressImageBase64, getBase64SizeKB } from '../lib/imageCompressor';

interface AdminImageAssetsProps {
  currentUser: FirebaseUser | null;
  showToast: (msg: string) => void;
}

const PRESET_THEMES = [
  { id: 'golf', name: '파크골프 (Park Golf)', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'cooking', name: '요리 & 간편 레시피', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { id: 'cleaning', name: '살림 & 가사 꿀팁', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'finance', name: '재테크 & 은퇴 경제', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'health', name: '건강 & 시니어 웰빙', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' },
  { id: 'travel', name: '힐링 여행 & 나들이', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
];

const PRESET_PROMPTS: Record<string, { label: string; prompt: string }[]> = {
  golf: [
    {
      label: '국내 명문 파크골프장 전경',
      prompt: '국내 최고 명문 파크골프장의 광활한 전경, 푸르고 비단 같은 천연 잔디, 깔끔한 페어웨이와 빨간색 홀컵 깃발이 부드럽게 흩날리는 맑고 투명한 하늘 아래 화창한 날씨, 실사 스타일, DSLR 35mm 렌즈 촬영, 초고화질'
    },
    {
      label: '파크골프 명품 우드 클럽 & 볼 세팅',
      prompt: '그린 잔디 위에 나란히 놓여 있는 최고급 파크골프 전용 우드 클럽(채)과 선명한 오렌지색, 옐로우색 전용 4피스 공의 세련된 클로즈업 샷, 자연광, 아웃포커싱 배경, 전문가 감성 사진'
    },
    {
      label: '시니어 에디터 드라이버 스윙 피니시',
      prompt: '밝고 맑은 가을날, 탁 트인 한국 파크골프 필드 페어웨이를 향해 부드러우면서도 강력한 드라이버 스윙을 마치고 멋진 피니시 자세를 잡고 있는 중장년 시니어의 활기찬 뒷모습, 건강한 은퇴 생활'
    },
    {
      label: '그린 위 핀 홀 퍼팅 성공 순간',
      prompt: '그린 홀컵 바로 옆에서 파크골프 공이 부드럽게 홀인하기 직전의 극적인 초점 묘사, 미세한 잔디의 잎사귀 하나하나와 햇빛에 반사되어 빛나는 골프볼 클로즈업, 역동적이고 짜릿한 느낌'
    }
  ],
  cooking: [
    {
      label: '정갈한 한국 시니어 건강 밥상',
      prompt: '따뜻한 햇살이 드는 아침 식탁 위, 잡곡밥과 정갈한 제철 야채 나물, 된장찌개, 구운 생선이 정성스레 놓인 유기그릇 한식 가정식 밥상, 소박하고 평화로운 분위기'
    },
    {
      label: '제철 유기농 신선한 야채 샐러드',
      prompt: '나무 볼에 가득 담긴 신선하고 아삭아삭한 파프리카, 양상추, 방울토마토, 시금치 샐러드와 올리브유 드레싱이 살짝 뿌려진 건강한 저염식 식단, 클로즈업'
    }
  ],
  cleaning: [
    {
      label: '햇살 가득 머금은 아늑한 거실',
      prompt: '청소와 정리가 아주 완벽하게 되어 먼지 하나 없이 깨끗하고, 베이지색 소파와 실내 화분 식물이 아침 햇살을 받아 아늑하고 위생적인 거실 인테리어 전경'
    },
    {
      label: '자연 친화 천연 살림 세제 세트',
      prompt: '베이킹소다, 구연산, 과탄산소다 가루와 천연 비누, 레몬 조각이 브라운 유리병에 깔끔하게 담겨 있는 미니멀하고 위생적인 욕실 가사 공간'
    }
  ],
  finance: [
    {
      label: '은퇴 노후 자금 계획 가계부',
      prompt: '원목 책상 위에 펼쳐진 은퇴 재무 계획 설계도와 정갈한 연필, 스마트폰 금융 계산기 화면, 뒤로 부드러운 화초 화분이 보이며 아침 햇빛이 비치는 희망찬 분위기'
    },
    {
      label: '스마트한 디지털 금융 자산 앱 화면',
      prompt: '테이블 위에 놓인 태블릿PC 화면에 나타난 주식 차트, 연금 성장 자산 그래프와 그 옆의 따뜻한 아메리카노 한 잔, 지적이고 스마트한 노후 자산 관리 이미지'
    }
  ],
  health: [
    {
      label: '시니어 부부 야외 건강 산책 코스',
      prompt: '푸른 메타세쿼이아 숲길 산책로에서 편안한 트레이닝복을 입고 손을 잡고 행복한 미소를 지으며 활기차게 워킹 운동을 하고 있는 한국의 중장년 노부부, 건강한 웰빙 라이프'
    },
    {
      label: '햇살 가득 아침 실내 스트레칭',
      prompt: '화창한 아침, 채광이 잘 드는 방 안 요가 매트 위에서 유연하게 허리와 다리를 스트레칭하고 있는 차분하고 활기찬 시니어 홈트레이닝 모습'
    }
  ],
  travel: [
    {
      label: '아름다운 제주도 오름 산책로',
      prompt: '바람에 은빛 갈대가 휘날리는 제주도 오름 언덕 산책로를 따라 올라가는 길, 뒤로 펼쳐진 파란 바다와 한라산 비경, 고요하고 평화로운 국내 힐링 명소'
    },
    {
      label: '호젓한 숲속 럭셔리 글램핑 캠핑',
      prompt: '한적한 숲속 맑은 계곡 옆에 아늑하게 설치된 감성 캠핑 텐트와 나무 의자, 모닥불 연기가 솟아오르는 잔잔한 오후 가을 캠핑 풍경'
    }
  ]
};

export const AdminImageAssets: React.FC<AdminImageAssetsProps> = ({
  currentUser,
  showToast,
}) => {
  // Generator state
  const [selectedTheme, setSelectedTheme] = useState<string>('golf');
  const [promptInput, setPromptInput] = useState<string>('');
  const [assetTitle, setAssetTitle] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  
  // Image result states
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalSizeKB, setOriginalSizeKB] = useState<number>(0);
  const [compressedImage, setCompressedImage] = useState<string | null>(null);
  const [compressedSizeKB, setCompressedSizeKB] = useState<number>(0);
  const [compressionQuality, setCompressionQuality] = useState<number>(0.7);
  const [maxDimension, setMaxDimension] = useState<number>(800);
  const [isCompacting, setIsCompacting] = useState<boolean>(false);

  // Gallery states
  const [sharedImages, setSharedImages] = useState<SharedImage[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState<boolean>(false);
  const [galleryFilter, setGalleryFilter] = useState<string>('all');
  const [gallerySearch, setGallerySearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Initialize with a preset prompt when changing theme
  useEffect(() => {
    const presets = PRESET_PROMPTS[selectedTheme] || [];
    if (presets.length > 0) {
      setPromptInput(presets[0].prompt);
      setAssetTitle(presets[0].label);
    }
  }, [selectedTheme]);

  // Load public image assets gallery from Firestore
  const loadGallery = async () => {
    setIsLoadingGallery(true);
    try {
      const data = await fetchSharedImages();
      setSharedImages(data);
    } catch (err) {
      console.error('Failed to load shared image gallery:', err);
    } finally {
      setIsLoadingGallery(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Run compression whenever generated image or options change
  const handleCompress = async (base64Img: string, dim: number, q: number) => {
    setIsCompacting(true);
    try {
      const result = await compressImageBase64(base64Img, dim, q);
      setCompressedImage(result.compressedBase64);
      setCompressedSizeKB(result.sizeKB);
    } catch (err) {
      console.error('Compression failed:', err);
    } finally {
      setIsCompacting(false);
    }
  };

  useEffect(() => {
    if (generatedImage) {
      handleCompress(generatedImage, maxDimension, compressionQuality);
    }
  }, [generatedImage, maxDimension, compressionQuality]);

  // Handle image generation from server API
  const handleGenerateImage = async () => {
    if (!promptInput.trim()) {
      showToast('프롬프트를 입력해주세요!');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setCompressedImage(null);
    
    const statuses = [
      'Gemini AI 엔진 및 엔드포인트 연결 중...',
      '고화질 라이프스타일 이미지 에셋 랜더링 중...',
      '세부 색감 밸런싱 및 질감 디테일 매핑 중...',
      '고정 데이터 스트림 추출 및 인코딩 진행 중...',
    ];

    let statusIndex = 0;
    setGenerationStatus(statuses[0]);
    const statusInterval = setInterval(() => {
      if (statusIndex < statuses.length - 1) {
        statusIndex++;
        setGenerationStatus(statuses[statusIndex]);
      }
    }, 1200);

    try {
      const res = await fetch('/api/blog/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput.trim(),
          theme: selectedTheme,
        }),
      });

      const data = await res.json();
      clearInterval(statusInterval);

      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        const originalSize = getBase64SizeKB(data.imageUrl);
        setOriginalSizeKB(originalSize);
        showToast('성공적으로 이미지 에셋을 생성 및 추출하였습니다!');
      } else {
        throw new Error(data.error || '에셋 생성 도중 에러가 발생했습니다.');
      }
    } catch (err: any) {
      clearInterval(statusInterval);
      console.error('Image asset generation error:', err);
      showToast(err.message || '이미지 생성 서버 지연이 발생하여 내장 고화질 에셋으로 교체되었습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the compressed image asset to Firestore Public Shared Collection
  const handleSaveToSharedCollection = async () => {
    if (!compressedImage) return;
    if (compressedSizeKB > 200) {
      showToast('에셋 크기가 200KB를 초과합니다. 압축 슬라이더를 조절해주세요!');
      return;
    }

    try {
      const imageId = `asset_${Date.now()}`;
      const creatorName = currentUser?.displayName || currentUser?.email?.split('@')[0] || '최고관리자';
      const newAsset: SharedImage = {
        id: imageId,
        url: compressedImage,
        prompt: promptInput,
        theme: selectedTheme,
        title: assetTitle.trim() || `${selectedTheme} 생성 이미지 에셋`,
        sizeKB: Math.round(compressedSizeKB),
        createdAt: new Date().toISOString(),
        createdBy: creatorName,
      };

      await saveSharedImageToFirestore(newAsset);
      showToast('공용 이미지 에셋 저장 완료! 100개 컬렉션 리스트에 실시간 연동되었습니다. 🟢');
      
      // Refresh the list immediately
      loadGallery();

      // Clear generation outputs to allow next action
      setGeneratedImage(null);
      setCompressedImage(null);
      setAssetTitle('');
    } catch (err) {
      console.error('Error saving image asset:', err);
      showToast('데이터베이스 저장 중 에러가 발생했습니다.');
    }
  };

  // Delete an image asset from Firestore
  const handleDeleteAsset = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 에셋을 공용 이미지 컬렉션에서 정말로 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteSharedImageFromFirestore(id);
      setSharedImages(prev => prev.filter(img => img.id !== id));
      showToast('공용 에셋이 안전하게 영구 제거되었습니다.');
    } catch (err) {
      console.error('Failed to delete asset:', err);
      showToast('에셋 제거 중 실패하였습니다.');
    }
  };

  // Copy Image link/Base64 to clipboard for use in blogs
  const handleCopyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('에셋 소스(Base64 데이터)가 클립보드에 무손실 복사되었습니다! 📋');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and search gallery
  const filteredGallery = useMemo(() => {
    return sharedImages.filter(img => {
      const matchesFilter = galleryFilter === 'all' || img.theme === galleryFilter;
      const matchesSearch =
        img.title.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        img.prompt.toLowerCase().includes(gallerySearch.toLowerCase()) ||
        img.createdBy.toLowerCase().includes(gallerySearch.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [sharedImages, galleryFilter, gallerySearch]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
      
      {/* LEFT COLUMN: Topic, Prompt & AI Compressed Generator (5/12 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI 맞춤형 이미지 에셋 생성기</h2>
              <p className="text-[11px] text-zinc-400">블로그 테마별 맞춤 프롬프트 및 압축 제어</p>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              1단계: 블로그 세부 주제 (Theme)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition cursor-pointer flex items-center justify-between ${
                    selectedTheme === theme.id
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-[#1A1A20] border-[#27272A] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{theme.name.split(' (')[0]}</span>
                  {selectedTheme === theme.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              2단계: 최적화 추천 프롬프트 선택
            </label>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
              {(PRESET_PROMPTS[selectedTheme] || []).map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(preset.prompt);
                    setAssetTitle(preset.label);
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-[#1A1A20] hover:bg-[#22222A] border border-[#27272A] text-[11px] text-zinc-300 hover:text-white font-medium flex items-center justify-between transition cursor-pointer"
                >
                  <span className="truncate pr-2">{preset.label}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">추천</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                3단계: 프롬프트 디테일 편집
              </label>
              <span className="text-[10px] text-indigo-400 font-bold">Gemini-3.1-Flash 가동</span>
            </div>
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="프롬프트를 입력하면 국내 분위기에 꼭 맞는 맞춤 이미지가 정밀 생성됩니다."
              rows={4}
              className="w-full p-3 rounded-xl bg-[#1A1A20] border border-[#27272A] text-white text-xs focus:outline-hidden resize-none focus:border-indigo-500/40"
            />
          </div>

          {/* Asset Title input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              에셋 파일 이름 (에셋 제목)
            </label>
            <input
              type="text"
              value={assetTitle}
              onChange={(e) => setAssetTitle(e.target.value)}
              placeholder="예: 한국 파크골프장 가을 전경"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1A1A20] border border-[#27272A] text-white text-xs focus:outline-hidden"
            />
          </div>

          {/* Submit Action */}
          <button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">맞춤 에셋 그리는 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>AI 명품 이미지 에셋 생성</span>
              </>
            )}
          </button>

          {isGenerating && (
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-center space-y-1 animate-pulse">
              <p className="text-[11px] text-indigo-400 font-bold">생성 상태 디렉토리 피드백</p>
              <p className="text-[10px] text-zinc-400">{generationStatus}</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Real-Time Audio-Visual Compression Feedback & Firestore Library (7/12 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* COMPRESSION PANEL: Triggers only if image generated */}
        {generatedImage && (
          <div className="p-6 rounded-3xl bg-[#141418] border border-indigo-500/30 shadow-xl space-y-5 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">이미지 실시간 정밀 압축 제어</h3>
                  <p className="text-[10px] text-zinc-400">데이터베이스 1MB 초과 방지를 위한 200KB 한계 검사</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                compressedSizeKB <= 200
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}>
                {compressedSizeKB <= 200 ? '저장 규격 적합 ✅' : '200KB 초과 ⚠️'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Image Preview Container */}
              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-zinc-400">에셋 추출 원본 (Preview)</span>
                <div className="aspect-video rounded-2xl bg-black border border-[#27272A] overflow-hidden relative group">
                  <img
                    src={compressedImage || generatedImage}
                    alt="Result preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition p-4 text-center">
                    <p className="text-[10px] text-zinc-300 font-mono leading-relaxed truncate-3">
                      {promptInput}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
                  <span>해상도: 최대 {maxDimension}px</span>
                  <span>포맷: JPEG 변환</span>
                </div>
              </div>

              {/* Slider Controls */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Quality slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">압축 화질 (Quality)</span>
                      <span className="font-mono text-indigo-400 font-bold">{Math.round(compressionQuality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={compressionQuality}
                      onChange={(e) => setCompressionQuality(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 cursor-pointer bg-[#222] h-1.5 rounded-full"
                    />
                  </div>

                  {/* Resolution limits */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-300">최대 가로/세로 제한</span>
                      <span className="font-mono text-indigo-400 font-bold">{maxDimension}px</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[600, 800, 1024].map(size => (
                        <button
                          key={size}
                          onClick={() => setMaxDimension(size)}
                          className={`py-1 rounded-lg border text-[10px] font-bold transition cursor-pointer ${
                            maxDimension === size
                              ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                              : 'bg-[#1A1A20] border-[#27272A] text-zinc-400'
                          }`}
                        >
                          {size}px
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Audit size indicator */}
                <div className="p-3 rounded-xl bg-[#1A1A20] border border-[#27272A] flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="text-[10px] text-zinc-400">압축 전: <span className="font-mono text-zinc-500">{Math.round(originalSizeKB)}KB</span></div>
                    <div className="text-xs font-bold text-white">
                      압축 후: <span className="font-mono text-indigo-400 text-sm font-black">{Math.round(compressedSizeKB)} KB</span>
                    </div>
                  </div>
                  {compressedSizeKB <= 200 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        저장 승인
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono">가볍고 쾌적함</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        용량 초과
                      </span>
                      <span className="text-[8px] text-zinc-500 font-mono">200KB 이하 필수</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save to Shared Collection Action */}
            <div className="pt-3 border-t border-[#27272A] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setGeneratedImage(null);
                  setCompressedImage(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#1C1C24] hover:bg-[#22222C] text-zinc-400 hover:text-white text-xs font-bold border border-[#27272A] transition cursor-pointer"
              >
                에셋 취소
              </button>
              <button
                onClick={handleSaveToSharedCollection}
                disabled={compressedSizeKB > 200 || isCompacting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>공용 이미지 컬렉션에 등록 및 저장</span>
              </button>
            </div>
          </div>
        )}

        {/* PUBLIC ASSETS SHARED LIBRARY / GALLERY */}
        <div className="p-6 rounded-3xl bg-[#141418] border border-[#27272A] shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#27272A] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>공용 이미지 라이브러리</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1F1F24] text-zinc-400 border border-zinc-700">
                  실시간 {filteredGallery.length}개
                </span>
              </h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                영구 데이터로 저장되어 모든 포스팅 대표/본문 이미지로 즉시 사용 가능합니다.
              </p>
            </div>
            
            {/* Sync Refresh */}
            <button
              onClick={loadGallery}
              disabled={isLoadingGallery}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGallery ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>

          {/* Filtering & Search Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={gallerySearch}
                onChange={(e) => setGallerySearch(e.target.value)}
                placeholder="에셋 명칭 또는 프롬프트 검색..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#1A1A20] border border-[#27272A] text-white text-xs focus:outline-hidden focus:border-indigo-500/40"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center bg-[#1A1A20] p-1 rounded-xl border border-[#27272A] overflow-x-auto select-scrollbar max-w-full">
              <button
                onClick={() => setGalleryFilter('all')}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                  galleryFilter === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                전체
              </button>
              {PRESET_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setGalleryFilter(theme.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition shrink-0 cursor-pointer ${
                    galleryFilter === theme.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {theme.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* GALLERY GRID */}
          {isLoadingGallery ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
              <p className="text-xs text-zinc-400 font-medium">Firestore 공용 이미지 데이터베이스 로딩 중...</p>
            </div>
          ) : filteredGallery.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-[#27272A] rounded-2xl">
              <ImageIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-400 font-bold">부합하는 이미지 에셋이 존재하지 않습니다.</p>
              <p className="text-[10px] text-zinc-500 mt-1">왼쪽 생성기에서 나만의 맞춤형 파크골프 에셋을 첫 생성해보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredGallery.map((img) => {
                const themeObj = PRESET_THEMES.find(t => t.id === img.theme) || PRESET_THEMES[0];
                return (
                  <div
                    key={img.id}
                    className="group rounded-2xl bg-[#1A1A20] border border-[#27272A] overflow-hidden flex flex-col justify-between hover:border-indigo-500/30 transition relative"
                  >
                    {/* Size badge */}
                    <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono font-bold text-zinc-300">
                      {img.sizeKB} KB
                    </span>

                    {/* Delete Icon (Admin/Super Admin only) */}
                    <button
                      onClick={() => handleDeleteAsset(img.id, img.title)}
                      className="absolute top-2 right-2 z-10 p-1 rounded bg-black/70 hover:bg-rose-600 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="에셋 영구 삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* Image visual */}
                    <div className="aspect-square bg-black overflow-hidden relative">
                      <img
                        src={img.url}
                        alt={img.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                      />
                      {/* Hover Info Panel overlay */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2.5 transition text-left">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Prompt</span>
                        <p className="text-[9px] text-zinc-200 mt-0.5 leading-relaxed truncate-3 font-medium">
                          {img.prompt}
                        </p>
                        <div className="text-[8px] text-zinc-500 font-mono mt-1">
                          생성자: {img.createdBy}
                        </div>
                      </div>
                    </div>

                    {/* Title & Actions footer */}
                    <div className="p-2 space-y-1.5 bg-[#1F1F26]">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[9px] font-black text-white truncate flex-1">
                          {img.title}
                        </span>
                        <span className={`text-[8px] font-bold px-1 rounded-sm shrink-0 uppercase tracking-wider ${themeObj.color}`}>
                          {themeObj.name.split(' (')[0]}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-zinc-800">
                        {/* Copy data button */}
                        <button
                          onClick={() => handleCopyToClipboard(img.url, img.id)}
                          className="py-1 rounded bg-zinc-800 hover:bg-indigo-600 hover:text-white text-zinc-300 text-[8px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                          title="블로그 에디터에 주소/데이터 붙여넣기 위해 복사"
                        >
                          {copiedId === img.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span>복사됨</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="w-2.5 h-2.5" />
                              <span>소스 복사</span>
                            </>
                          )}
                        </button>

                        {/* Open in tab */}
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[8px] font-bold flex items-center justify-center gap-1 transition text-center"
                        >
                          <FileImage className="w-2.5 h-2.5" />
                          <span>크게 보기</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
