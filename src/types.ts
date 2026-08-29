export type CategoryId =
  | 'all'
  | 'cooking'
  | 'cleaning'
  | 'finance'
  | 'health'
  | 'travel'
  | 'tech'
  | 'hobby'
  | 'golf'
  | 'entertainment'
  | 'sports'
  | 'news';

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  iconName: string;
  badgeColor: string;
  gradient: string;
  description: string;
  popularTopics: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface SEOMetadata {
  metaDescription: string;
  targetKeywords: string[];
  hashtags: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  category: CategoryId;
  categoryName: string;
  estimatedReadTime: string;
  summaryBox: string[];
  tableOfContents: string[];
  contentMarkdown: string;
  faqs?: FAQItem[];
  checklist?: string[];
  seo: SEOMetadata;
  coverImageUrl: string;
  coverPhotoKeyword?: string;
  tone: 'friendly' | 'professional' | 'story' | 'viral';
  createdAt: string;
  likes: number;
  views: number;
  status: 'published' | 'draft';
  isBookmarked?: boolean;
  authorId?: string;
  authorName?: string;
  authorEmail?: string;
  newsSource?: {
    originalTitle: string;
    mediaName: string;
    originalUrl?: string;
    publishedAt?: string;
  };
}

export interface NewsArticle {
  id: string;
  title: string;
  cleanTitle: string;
  mediaName: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  snippet: string;
  category?: CategoryId;
}

export interface GenerationOptions {
  topic: string;
  category: CategoryId;
  categoryName: string;
  tone: 'friendly' | 'professional' | 'story' | 'viral';
  targetAudience: string;
  lengthOption: 'short' | 'standard' | 'inDepth';
  includeFaq: boolean;
  includeChecklist: boolean;
  customNotes: string;
}

export interface NewsRepublishOptions {
  keyword: string;
  newsTitle: string;
  newsSource: string;
  newsUrl?: string;
  newsSnippet?: string;
  newsPubDate?: string;
  category: CategoryId;
  categoryName: string;
  tone: 'friendly' | 'professional' | 'story' | 'viral';
  targetAudience: string;
  lengthOption: 'short' | 'standard' | 'inDepth';
  focusAngle?: string;
  customNotes?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'member';
  status: 'active' | 'pending' | 'suspended';
  createdAt?: any;
  lastLoginAt?: any;
  postsCount?: number;
  totalViews?: number;
  bio?: string;
}

export type ViewMode = 'webzine' | 'generator' | 'detail' | 'library' | 'admin';

