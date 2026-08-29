import React from 'react';
import {
  X,
  Database,
  ShieldCheck,
  Server,
  Cloud,
  CheckCircle2,
  Lock,
  User,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { FirebaseUser, logOutUser } from '../lib/firebase';

interface FirebaseInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: FirebaseUser | null;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const FirebaseInfoModal: React.FC<FirebaseInfoModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0F0F12] w-full max-w-2xl rounded-3xl border border-[#1F1F23] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-[#16161A] border-b border-[#1F1F23] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Firebase 클라우드 연동 현황</h2>
              <p className="text-xs text-zinc-400">
                Firebase Authentication & Firestore DB 실시간 클라우드 영구 저장
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-[#222228] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-zinc-300">
          {/* User Auth Real Status Box */}
          <div className="p-4 rounded-2xl bg-[#16161A] border border-[#27272A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center font-bold">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="User Avatar"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-semibold flex items-center gap-1.5">
                  <span>Firebase Authentication 인증 상태</span>
                  {currentUser && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> 인증 완료
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {currentUser
                    ? `${currentUser.displayName || '사용자'} (${currentUser.email})`
                    : '게스트 모드 (로그인 시 클라우드 영구 동기화)'}
                </div>
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={() => logOutUser()}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#27272A] bg-[#222228] text-zinc-300 hover:text-white transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>로그인 / 가입</span>
              </button>
            )}
          </div>

          {/* Architecture Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Gemini 3.7 + Auto Fallback</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                서버사이드 AI 포스팅 생성, 목차, 꿀팁, FAQ 자동 완성
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-2 shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Firebase Auth (Google & Email)</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                Google 소셜 로그인 및 이메일 계정 보안 인증 완비
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-white">Cloud Firestore</div>
              <div className="text-[11px] text-zinc-400 mt-1">
                생성 글, 수정 이력, 북마크 클라우드 영구 저장
              </div>
            </div>
          </div>

          {/* Data Schema Spec */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
              <span>Cloud Firestore 실시간 연동 컬렉션 (`/posts`)</span>
              <span className="text-[10px] text-emerald-400 font-normal">Active & Synced</span>
            </h3>
            <pre className="p-4 rounded-2xl bg-[#0A0A0B] text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-[#27272A]">
{`// Firestore Collection: /posts/{postId}
{
  "title": "싱크대 찌든 때 10분 정복기",
  "category": "cleaning",
  "summaryBox": ["...", "..."],
  "contentMarkdown": "## 1. 서론...",
  "faqs": [{ "question": "...", "answer": "..." }],
  "seo": { "targetKeywords": [...], "hashtags": [...] },
  "authorEmail": "${currentUser?.email || 'guest'}",
  "createdAt": "2026-08-23T...",
  "likes": 128,
  "views": 1420,
  "status": "published"
}`}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#16161A] border-t border-[#1F1F23] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs sm:text-sm hover:bg-indigo-500 transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
