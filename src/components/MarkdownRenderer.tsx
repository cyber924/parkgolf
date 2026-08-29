import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Camera, Edit2 } from 'lucide-react';

export type FontSizeOption = 'compact' | 'normal' | 'large';

interface MarkdownRendererProps {
  content: string;
  fontSize?: FontSizeOption;
  isEditorMode?: boolean;
  onEditImage?: (imgSrc: string, altText: string, imageIndex: number) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  fontSize = 'normal',
  isEditorMode = false,
  onEditImage,
}) => {
  let imgCount = 0;
  // Compact and clean typography scales
  const textScale = {
    compact: {
      h1: 'text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 pb-1 border-b border-[#27272A]',
      h2: 'text-sm sm:text-base font-bold text-white mt-4 mb-2 flex items-center gap-1.5',
      h3: 'text-xs sm:text-sm font-bold text-zinc-200 mt-3 mb-1.5',
      p: 'text-xs sm:text-sm text-zinc-300 leading-relaxed mb-3.5 font-normal',
      ul: 'list-disc list-outside pl-4 mb-3.5 space-y-1 text-zinc-300 text-xs sm:text-sm',
      ol: 'list-decimal list-outside pl-4 mb-3.5 space-y-1 text-zinc-300 text-xs sm:text-sm',
      li: 'leading-relaxed',
      blockquote: 'my-3.5 p-3 rounded-xl bg-[#141418] border-l-2 border-indigo-500 text-zinc-300 text-xs leading-relaxed',
      code: 'bg-[#1E1E24] text-indigo-300 border border-[#2D2D35] px-1 py-0.5 rounded text-xs font-mono',
      table: 'text-xs',
      th: 'px-3 py-2 text-xs font-bold text-zinc-200 border-b border-[#27272A]',
      td: 'px-3 py-2 text-xs text-zinc-300 border-t border-[#27272A]/70',
    },
    normal: {
      h1: 'text-xl sm:text-2xl font-extrabold text-white mt-6 mb-3 pb-2 border-b border-[#27272A]',
      h2: 'text-base sm:text-lg font-bold text-white mt-5 mb-2.5 flex items-center gap-2',
      h3: 'text-sm sm:text-base font-bold text-zinc-200 mt-4 mb-2',
      p: 'text-sm sm:text-base text-zinc-300 leading-relaxed mb-4 font-normal',
      ul: 'list-disc list-outside pl-5 mb-4 space-y-1.5 text-zinc-300 text-sm sm:text-base',
      ol: 'list-decimal list-outside pl-5 mb-4 space-y-1.5 text-zinc-300 text-sm sm:text-base',
      li: 'leading-relaxed',
      blockquote: 'my-4 p-4 rounded-xl bg-[#141418] border-l-3 border-indigo-500 text-zinc-300 text-xs sm:text-sm leading-relaxed',
      code: 'bg-[#1E1E24] text-indigo-300 border border-[#2D2D35] px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono',
      table: 'text-xs sm:text-sm',
      th: 'px-3.5 py-2.5 text-xs sm:text-sm font-bold text-zinc-200 border-b border-[#27272A]',
      td: 'px-3.5 py-2.5 text-xs sm:text-sm text-zinc-300 border-t border-[#27272A]/70',
    },
    large: {
      h1: 'text-2xl sm:text-3xl font-extrabold text-white mt-8 mb-4 pb-2 border-b border-[#27272A]',
      h2: 'text-lg sm:text-xl font-bold text-white mt-7 mb-3 flex items-center gap-2',
      h3: 'text-base sm:text-lg font-bold text-zinc-200 mt-5 mb-2.5',
      p: 'text-base sm:text-lg text-zinc-200 leading-relaxed mb-5 font-normal',
      ul: 'list-disc list-outside pl-6 mb-5 space-y-2 text-zinc-200 text-base sm:text-lg',
      ol: 'list-decimal list-outside pl-6 mb-5 space-y-2 text-zinc-200 text-base sm:text-lg',
      li: 'leading-relaxed',
      blockquote: 'my-5 p-5 rounded-xl bg-[#141418] border-l-4 border-indigo-500 text-zinc-200 text-sm sm:text-base leading-relaxed',
      code: 'bg-[#1E1E24] text-indigo-300 border border-[#2D2D35] px-1.5 py-0.5 rounded text-sm font-mono',
      table: 'text-sm sm:text-base',
      th: 'px-4 py-3 text-sm font-bold text-zinc-200 border-b border-[#27272A]',
      td: 'px-4 py-3 text-sm text-zinc-300 border-t border-[#27272A]/70',
    },
  }[fontSize];

  return (
    <div className="prose-custom max-w-none text-zinc-300 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => <h1 className={textScale.h1} {...props} />,
          h2: ({ ...props }) => <h2 className={textScale.h2} {...props} />,
          h3: ({ ...props }) => <h3 className={textScale.h3} {...props} />,
          p: ({ children, ...props }) => {
            // Check if any child is an img element or React element that renders block
            const hasBlockChild = React.Children.toArray(children).some((child: any) => {
              return child && (child.type === 'img' || (child.props && child.props.src));
            });
            if (hasBlockChild) {
              return <div className={textScale.p} {...props}>{children}</div>;
            }
            return <p className={textScale.p} {...props}>{children}</p>;
          },
          ul: ({ ...props }) => <ul className={textScale.ul} {...props} />,
          ol: ({ ...props }) => <ol className={textScale.ol} {...props} />,
          li: ({ ...props }) => <li className={textScale.li} {...props} />,
          blockquote: ({ ...props }) => <blockquote className={textScale.blockquote} {...props} />,
          strong: ({ ...props }) => (
            <strong className="font-bold text-white" {...props} />
          ),
          hr: ({ ...props }) => <hr className="my-6 border-[#27272A]" {...props} />,
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-[#27272A] bg-[#121215] shadow-md">
              <table className={`w-full divide-y divide-[#27272A] text-left ${textScale.table}`} {...props} />
            </div>
          ),
          thead: ({ ...props }) => <thead className="bg-[#18181D] text-zinc-200" {...props} />,
          th: ({ ...props }) => <th className={textScale.th} {...props} />,
          td: ({ ...props }) => <td className={textScale.td} {...props} />,
          code: ({ ...props }) => <code className={textScale.code} {...props} />,
          img: ({ src, alt, ...props }) => {
            const thisIndex = imgCount++;
            return (
              <div className="my-6 space-y-2 group/img relative">
                <div className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#141418] shadow-xl relative">
                  <img
                    src={src}
                    alt={alt || '웹진 일러스트'}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[440px] object-cover group-hover/img:scale-102 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('unsplash.com/photo-1535131749006')) {
                        target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80';
                      }
                    }}
                    {...props}
                  />

                  {/* Quick Image Replacement Button if in editor mode */}
                  {isEditorMode && onEditImage && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover/img:opacity-100 transition-all duration-200">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditImage(src || '', alt || '', thisIndex);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-indigo-600 border border-white/20 text-white text-xs font-bold shadow-lg backdrop-blur-md transition cursor-pointer"
                        title="본문 사진 및 캡션 교체"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>사진/캡션 변경</span>
                      </button>
                    </div>
                  )}
                </div>

                {alt && (
                  <div className="text-xs text-zinc-400 font-medium text-center italic flex items-center justify-center gap-1.5">
                    <span>{alt}</span>
                    {isEditorMode && onEditImage && (
                      <button
                        type="button"
                        onClick={() => onEditImage(src || '', alt || '', thisIndex)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 not-italic ml-1 underline cursor-pointer"
                      >
                        [캡션 수정]
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          },
          em: ({ ...props }) => (
            <em className="text-xs sm:text-sm text-zinc-400 italic font-medium block my-1 text-center" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
