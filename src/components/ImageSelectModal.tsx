import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Check,
  Upload,
  Link2,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import { CURATED_GALLERY, CuratedImageItem } from '../data/curatedImages';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string;
  currentCaption?: string;
  title: string;
  subtitle?: string;
  category?: string;
  allowCaptionEdit?: boolean;
  onSelect: (newUrl: string, caption?: string) => void;
}

export const ImageSelectModal: React.FC<ImageSelectModalProps> = ({
  isOpen,
  onClose,
  currentImageUrl,
  currentCaption = '',
  title,
  subtitle = '기사와 가장 잘 어울리는 고화질 사진을 선택하거나 직접 등록하세요.',
  category = 'golf',
  allowCaptionEdit = false,
  onSelect,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'custom' | 'upload'>('gallery');
  const [selectedUrl, setSelectedUrl] = useState<string>(currentImageUrl);
  const [captionText, setCaptionText] = useState<string>(currentCaption);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'golf');

  if (!isOpen) return null;

  const currentCategoryData =
    CURATED_GALLERY.find((c) => c.category === selectedCategory) ||
    CURATED_GALLERY[0];

  const filteredImages = currentCategoryData.images.filter((img) => {
    if (!searchFilter.trim()) return true;
    return (
      img.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      img.tag.toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하만 업로드 가능합니다.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setSelectedUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!selectedUrl) {
      alert('적용할 사진을 선택하거나 입력해주세요.');
      return;
    }
    onSelect(selectedUrl, captionText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121215] border border-[#27272A] rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1F1F23] flex items-center justify-between bg-[#16161A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{title}</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#222228] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-[#1F1F23] bg-[#121215] shrink-0">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'gallery'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>고화질 갤러리에서 선택</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>직접 사진 파일 업로드</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'custom'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>외부 이미지 URL 입력</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: CURATED GALLERY */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {CURATED_GALLERY.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => {
                        setSelectedCategory(cat.category);
                        setSearchFilter('');
                      }}
                      className={`text-xs px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer border ${
                        selectedCategory === cat.category
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : 'bg-[#18181D] text-zinc-400 border-[#27272A] hover:text-white'
                      }`}
                    >
                      {cat.categoryName}
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="사진 키워드 검색..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#18181D] border border-[#27272A] rounded-xl text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[340px] overflow-y-auto pr-1">
                {filteredImages.map((img, idx) => {
                  const isSelected = selectedUrl === img.url;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedUrl(img.url);
                        if (!captionText && allowCaptionEdit) {
                          setCaptionText(img.title);
                        }
                      }}
                      className={`group relative rounded-2xl overflow-hidden aspect-16/10 cursor-pointer border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                          : 'border-[#27272A] hover:border-zinc-500 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img.url}
                        alt={img.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {/* Tag & Title */}
                      <div className="absolute bottom-2 left-2 right-2 text-white text-left">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/60 font-semibold text-indigo-300 mb-1 inline-block">
                          {img.tag}
                        </span>
                        <div className="text-xs font-bold line-clamp-1 drop-shadow-sm">
                          {img.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LOCAL FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-[#27272A] hover:border-indigo-500/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-[#16161A] transition text-center group">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">클릭하여 기기에서 사진 선택</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    PNG, JPG, WEBP 최대 5MB (파크골프 라운딩 현장 촬영 사진 등)
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {selectedUrl && selectedUrl.startsWith('data:') && (
                <div className="p-3 rounded-2xl bg-[#16161A] border border-[#27272A] flex items-center gap-4">
                  <img
                    src={selectedUrl}
                    alt="업로드 미리보기"
                    className="w-20 h-16 object-cover rounded-xl border border-zinc-700"
                  />
                  <div className="text-xs text-zinc-300">
                    <span className="text-emerald-400 font-bold">✓ 사진 업로드 완료</span>
                    <p className="text-zinc-500 mt-0.5">이 사진을 기사에 즉시 적용합니다.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 mb-1.5 block">
                  외부 고화질 이미지 URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-4 py-2.5 bg-[#18181D] border border-[#27272A] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setSelectedUrl(customUrlInput.trim());
                      }
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    미리보기
                  </button>
                </div>
              </div>

              {selectedUrl && (
                <div className="rounded-2xl overflow-hidden border border-[#27272A] aspect-16/9 max-h-48 bg-black">
                  <img
                    src={selectedUrl}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                    onError={() => alert('이미지 URL을 불러올 수 없습니다. 올바른 주소인지 확인하세요.')}
                  />
                </div>
              )}
            </div>
          )}

          {/* Optional Caption Editor */}
          {allowCaptionEdit && (
            <div className="p-4 rounded-2xl bg-[#16161A] border border-[#27272A] space-y-2">
              <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span>본문 사진 설명 (캡션) 수정</span>
                <span className="text-[11px] text-zinc-500 font-normal">본문 사진 아래 이탤릭체로 표기</span>
              </label>
              <input
                type="text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="예: ▲ 화천 파크골프장 푸른 잔디 코스 전경 및 홀컵 라인"
                className="w-full px-3.5 py-2 bg-[#101014] border border-[#27272A] rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 sm:p-6 border-t border-[#1F1F23] bg-[#16161A] flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-400 hidden sm:block">
            {selectedUrl ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>사진이 선택되었습니다. '이 사진으로 적용'을 누르세요.</span>
              </span>
            ) : (
              '원하는 사진을 클릭하세요.'
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#27272A] bg-[#1E1E24] text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>이 사진으로 적용</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
