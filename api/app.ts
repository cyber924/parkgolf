import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

export const app = express();

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini AI SDK
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-parkgolfone',
        },
      },
    });
  }
  return aiClient;
}

// Curated lifestyle image map for fallbacks & nice aesthetics
const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  cooking: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
  cleaning: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
  finance: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
  health: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
  travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  tech: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  hobby: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=80',
  golf: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
  entertainment: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  news: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
  all: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
};

// Helper: Fetch real-time Google News RSS and parse into clean articles
async function fetchGoogleNews(query: string) {
  const cleanQuery = query.trim();
  const encodedQuery = encodeURIComponent(cleanQuery);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=ko&gl=KR&ceid=KR:ko`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });

    if (response.ok) {
      const xmlText = await response.text();
      const items: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
      let match;
      let count = 0;

      while ((match = itemRegex.exec(xmlText)) !== null && count < 10) {
        const itemContent = match[1];

        const titleMatch = /<title>([\s\S]*?)<\/title>/i.exec(itemContent);
        const linkMatch = /<link>([\s\S]*?)<\/link>/i.exec(itemContent);
        const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
        const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemContent);
        const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/i.exec(itemContent);

        const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : '';
        const rawLink = linkMatch ? linkMatch[1].trim() : '';
        const rawPubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
        const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') : '';
        let mediaName = sourceMatch ? sourceMatch[1].trim() : '';

        let cleanTitle = rawTitle;
        if (rawTitle.includes(' - ')) {
          const parts = rawTitle.split(' - ');
          if (!mediaName) {
            mediaName = parts[parts.length - 1];
          }
          cleanTitle = parts.slice(0, parts.length - 1).join(' - ').trim();
        }

        const cleanSnippet = rawDesc
          .replace(/<[^>]*>/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/\s+/g, ' ')
          .trim();

        let timeAgo = '최신';
        if (rawPubDate) {
          try {
            const pubTime = new Date(rawPubDate).getTime();
            const now = Date.now();
            const diffMinutes = Math.floor((now - pubTime) / (1000 * 60));
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffMinutes < 60) {
              timeAgo = `${Math.max(1, diffMinutes)}분 전`;
            } else if (diffHours < 24) {
              timeAgo = `${diffHours}시간 전`;
            } else {
              timeAgo = `${Math.floor(diffHours / 24)}일 전`;
            }
          } catch (e) {
            timeAgo = rawPubDate;
          }
        }

        if (cleanTitle) {
          items.push({
            id: 'news_rss_' + Date.now() + '_' + count,
            title: rawTitle,
            cleanTitle: cleanTitle || rawTitle,
            mediaName: mediaName || '실시간 언론 보도',
            link: rawLink || 'https://news.google.com',
            pubDate: rawPubDate || new Date().toISOString(),
            timeAgo,
            snippet: cleanSnippet || cleanTitle,
          });
          count++;
        }
      }

      if (items.length > 0) {
        return items;
      }
    }
  } catch (error) {
    console.warn('Google News RSS direct fetch error, falling back to Google Search Grounding:', error);
  }

  // Real-Time Google Search Grounding with Gemini
  try {
    const aiPrompt = `[실시간 구글 검색 지침]
검색 키워드: "${cleanQuery}"
현재 시점 기준 최신 실제 뉴스 기사 및 언론 보도를 구글 검색(googleSearch)으로 직접 확인하고, 실제 언론사에서 보도된 최신 뉴스 5개를 정확히 정리해주세요.

[경고: 할루시네이션 및 과거 기억 재생산 엄금]
- 과거 기억을 사실인 것처럼 지어내지 마세요.
- 반드시 구글 검색을 통해 확인된 최신의 정확한 사실만을 포함해야 합니다.

반드시 다음 JSON 배열 형식으로만 출력하세요 (코드블록 외 잡담 금지):
[
  {
    "id": "news_grounded_1",
    "title": "실제 보도 기사 제목 - 언론사명",
    "cleanTitle": "실제 보도 기사 제목",
    "mediaName": "실제 언론사명 (예: 연합뉴스, 스포티비뉴스, 중앙일보, JTBC 등)",
    "link": "https://news.google.com",
    "pubDate": "${new Date().toISOString()}",
    "timeAgo": "최신 보도",
    "snippet": "구글 검색으로 확인된 실제 보도 핵심 팩트 2~3줄 요약"
  }
]`;

    const result = await callGeminiWithFallback({
      prompt: aiPrompt,
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    });

    if (result.text) {
      let cleaned = result.text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Google Search Grounded news fetch error:', err);
  }

  return [];
}

// Helper: Execute Gemini call with automatic fallback and clean error handling
async function callGeminiWithFallback(
  params: {
    prompt: string;
    systemInstruction?: string;
    responseSchema?: any;
    responseMimeType?: string;
    tools?: any[];
    temperature?: number;
  }
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }

  const ai = getAIClient();
  const models = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview'];

  let lastError: any = null;
  for (const model of models) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (params.responseSchema) config.responseSchema = params.responseSchema;
      if (params.tools) config.tools = params.tools;
      if (typeof params.temperature === 'number') config.temperature = params.temperature;

      const response = await ai.models.generateContent({
        model,
        contents: params.prompt,
        config,
      });

      if (response && response.text) {
        return { 
          text: response.text, 
          modelUsed: model,
          groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        };
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err.message || err);
      lastError = err;
      continue;
    }
  }

  throw lastError || new Error('모든 AI 모델 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
}

// Health check endpoint for Vercel & Cloud Run
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'ParkGolfOne AI',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// API: Suggest trending topics for categories
app.post('/api/blog/suggest-topics', async (req, res) => {
  try {
    const { category = 'golf', categoryName = '파크골프 & 필드 라이프' } = req.body;

    const prompt = `대한민국 대표 파크골프 및 라이프스타일 웹진을 위한 최신 트렌드/생활밀착형 블로그 글 주제 5개를 추천해주세요.
카테고리: ${categoryName} (${category})
조건:
1. 검색 유입 및 SNS 공유가 잘 될 만한 구체적이고 실용적인 주제
2. 독자의 호기심과 실생활 고민을 즉시 해결해주는 매력적인 제목
3. 각 주제별 간단한 한 줄 추천 이유 포함

JSON 배열 형식으로만 응답해주세요:
[
  {
    "title": "주제 제목",
    "reason": "추천 이유 및 기대 검색 타겟",
    "suggestedKeywords": ["키워드1", "키워드2", "키워드3"]
  }
]`;

    const result = await callGeminiWithFallback({
      prompt,
      responseMimeType: 'application/json',
    });

    const text = result.text || '[]';
    const topics = JSON.parse(text);
    res.json({ success: true, topics, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('Topic suggestion error:', error);
    let errMsg = error.message || '주제 추천 중 오류가 발생했습니다.';
    if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      errMsg = 'AI 모델 서버 사용량이 급증하여 일시적인 지연이 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// API: Generate full blog post
app.post('/api/blog/generate', async (req, res) => {
  try {
    const {
      topic,
      category = 'golf',
      categoryName = '파크골프 & 필드 라이프',
      tone = 'friendly',
      targetAudience = 'all',
      lengthOption = 'standard',
      includeFaq = true,
      includeChecklist = true,
      customNotes = '',
      authorId,
      authorName,
      authorEmail,
      status = 'published',
    } = req.body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ success: false, error: '블로그 주제를 입력해주세요.' });
    }

    const toneDescriptions: Record<string, string> = {
      friendly: '친근하고 따뜻한 이웃 같은 어조 (~해요, ~해보세요, 이모지 적절히 활용, 네이버 파워블로거 스타일)',
      professional: '전문적이고 신뢰감 있는 정보 전달 어조 (~합니다, 객관적인 데이터와 원리 설명, 티스토리/칼럼 스타일)',
      story: '생생한 1인칭 경험담 및 감성 에세이 톤 (~했더니 정말 놀라웠어요, 브런치 스타일)',
      viral: '주목도 높은 핵심 꿀팁 요약 및 호기심 유발 바이럴 톤 (결론부터 빠르게, 가독성 극대화)',
    };

    const lengthGuides: Record<string, string> = {
      short: '핵심 요약 중심 (공백 제외 약 1,200~1,500자, 소제목 3개 내외)',
      standard: '표준 정석 블로그 포스팅 (공백 제외 약 2,500~3,000자, 소제목 4~5개 내외, 상세 꿀팁 포함)',
      inDepth: '초고품질 완벽 가이드북 형태 (공백 제외 약 3,500자 이상, 심층 비교 및 실천 단계별 상세 설명)',
    };

    const systemInstruction = `당신은 대한민국 최고 수준의 전문 파크골프 & 라이프스타일 웹진 수석 에디터이자 파워블로거입니다.
사용자가 요청한 주제에 대해 웹진 및 검색 엔진에서 상위 노출되고 독자 만족도와 시각적 완성도가 극대화되는 고품격 웹진 기사를 작성합니다.

작성 가이드:
1. 제목: 검색량이 높은 인기 키워드를 자연스럽게 포함하고, 독자의 클릭을 유도하는 매력적인 메인 제목과 감각적인 부제목을 작성하세요.
2. 서론: 독자의 일상 공감대 형성 + 이 글을 읽고 얻을 수 있는 명확한 가치 제시.
3. 본문 (Markdown):
   - 소제목(##, ###)을 논리적으로 구성
   - 중요 정보는 **볼드체** 및 인용구(>)로 강조
   - 비교나 정리 내용은 표(Markdown Table) 활용
   - **[필수] 고화질 이미지 2개 배치**: 본문 중간에 주제와 어울리는 감성적인 Picsum 이미지 2개를 마크다운 문법으로 자연스럽게 삽입하고 그 아래에 이탤릭 캡션(*▲ 사진 설명*)을 작성하세요.
     (예시: ![사진설명](https://picsum.photos/seed/${category}1/800/450)
     *▲ 사진에 대한 감각적인 캡션 설명*)
     (예시 2번째: ![사진설명2](https://picsum.photos/seed/${category}2/800/450)
     *▲ 상세 과정 및 꿀팁 캡션*)
   - 실전 꿀팁, 흔히 하는 실수(주의사항) 명시
4. 3줄 핵심 요약 (Summary Box): 바쁜 독자를 위한 한눈에 보는 요점 정리
5. FAQ (자주 묻는 질문 3가지): 독자들이 실제로 궁금해할 만한 질문과 명쾌한 답변
6. 실천 체크리스트: 오늘 바로 따라해볼 수 있는 3~5가지 체크리스트
7. SEO 메타 정보: 검색 엔진 최적화를 위한 120자 메타 설명, 대중 인기 검색어/연관 키워드 5~8개, 해시태그 10개 내외.`;

    const userPrompt = `주제: "${topic.trim()}"
카테고리: ${categoryName} (${category})
어조: ${toneDescriptions[tone] || toneDescriptions.friendly}
타겟 독자: ${targetAudience}
글 길이: ${lengthGuides[lengthOption] || lengthGuides.standard}
추가 요청사항: ${customNotes || '없음'}
FAQ 포함 여부: ${includeFaq ? '포함' : '미포함'}
체크리스트 포함 여부: ${includeChecklist ? '포함' : '미포함'}

반드시 아래 JSON 형식으로 응답해주세요. 마크다운 본문은 한국어로 매우 정성스럽고 완성도 높게 작성해야 합니다.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: '매력적인 메인 블로그 제목' },
        subtitle: { type: Type.STRING, description: '부제목 또는 후킹 카피' },
        category: { type: Type.STRING, description: '카테고리 ID' },
        categoryName: { type: Type.STRING, description: '카테고리 한글명' },
        estimatedReadTime: { type: Type.STRING, description: '예상 읽기 시간 (예: "3분", "5분")' },
        summaryBox: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3줄 핵심 요약 목록',
        },
        tableOfContents: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '목차 항목 리스트',
        },
        contentMarkdown: {
          type: Type.STRING,
          description: '완성된 블로그 본문 (Markdown 포맷, ##, ###, 볼드, 목록, 인용문 등 풍부한 서식)',
        },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
          description: '자주 묻는 질문 3가지',
        },
        checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '실천 체크리스트 3~5가지',
        },
        seo: {
          type: Type.OBJECT,
          properties: {
            metaDescription: { type: Type.STRING, description: '120자 내외 검색 엔진 메타 디스크립션' },
            targetKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '핵심 검색 타겟 키워드 5~8개',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '#으로 시작하는 추천 해시태그 8~12개',
            },
          },
          required: ['metaDescription', 'targetKeywords', 'hashtags'],
        },
        coverPhotoKeyword: { type: Type.STRING, description: '대표 이미지 영문 검색 키워드' },
      },
      required: [
        'title',
        'subtitle',
        'estimatedReadTime',
        'summaryBox',
        'tableOfContents',
        'contentMarkdown',
        'seo',
      ],
    };

    const result = await callGeminiWithFallback({
      prompt: userPrompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
    });

    const text = result.text;
    if (!text) {
      throw new Error('AI 응답을 생성하지 못했습니다.');
    }

    const postData = JSON.parse(text);
    const photos = getDiversePhotos(category, postData.title || topic);
    const coverImageUrl = photos.cover;

    // Replace any picsum or placeholder images in markdown with curated high-quality thematic images
    let contentMarkdown = postData.contentMarkdown || '';
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...contentMarkdown.matchAll(imgRegex)];
    if (matches.length >= 2) {
      contentMarkdown = contentMarkdown
        .replace(matches[0][0], `![${matches[0][1] || '관련 주요 장면'}](${photos.content1})`)
        .replace(matches[1][0], `![${matches[1][1] || '상세 핵심 가이드'}](${photos.content2})`);
    } else if (matches.length === 1) {
      contentMarkdown = contentMarkdown.replace(matches[0][0], `![${matches[0][1] || '관련 주요 장면'}](${photos.content1})`);
    }

    const resultPost = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      ...postData,
      contentMarkdown,
      category,
      categoryName,
      coverImageUrl,
      tone,
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 1,
      status: status || 'published',
      authorId: authorId || undefined,
      authorName: authorName || undefined,
      authorEmail: authorEmail || undefined,
    };

    res.json({ success: true, post: resultPost, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('Blog generation error:', error);
    let errMsg = error.message || '블로그 글 생성 중 오류가 발생했습니다.';
    if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      errMsg = 'AI 모델 서버에 일시적인 트래픽 급증(503 High Demand)이 발생했습니다. 자동 복구 엔진을 통해 재시도하실 수 있습니다.';
    }
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// API: Refine/Improve blog post
app.post('/api/blog/refine', async (req, res) => {
  try {
    const { action, currentPost } = req.body;
    if (!currentPost || !currentPost.contentMarkdown) {
      return res.status(400).json({ success: false, error: '수정할 원본 글 정보가 없습니다.' });
    }

    let instruction = '';
    if (action === 'expand') {
      instruction = '본문의 내용을 더욱 구체적인 예시, 실제 꿀팁 사례, 세부 주의사항을 추가하여 훨씬 풍성하고 심도 있게 30% 이상 확장해주세요.';
    } else if (action === 'friendly') {
      instruction = '본문 전체를 매우 다정하고 친근한 이웃 블로거 말투(~해요, ~답니다, 꿀팁이에요!)로 부드럽게 다듬어주세요.';
    } else if (action === 'professional') {
      instruction = '본문을 신뢰도 높은 전문 칼럼니스트 어조(~합니다, 명확한 근거와 원리 중심)로 격조 있게 수정해주세요.';
    } else if (action === 'add_qa') {
      instruction = '본문 마지막 부분에 독자들이 가장 많이 오해하거나 실수하는 포인트에 대한 Q&A 심화 해설 2개를 추가해주세요.';
    } else if (action === 'seo_boost') {
      instruction = '검색 유입을 극대화하기 위해 본문 내 핵심 키워드를 자연스럽게 반복 배치하고 소제목을 더욱 매력적으로 개선해주세요.';
    } else {
      instruction = '본문의 완성도와 가독성을 전체적으로 더욱 높여주세요.';
    }

    const prompt = `다음 블로그 글의 본문(Markdown)을 개선해주세요.
원래 제목: ${currentPost.title}
요청 작업: ${instruction}

기존 본문:
${currentPost.contentMarkdown}

반드시 개선된 전체 Markdown 본문 문자열만을 반환해주세요 (JSON 포맷 없이 순수 마크다운으로 출력).`;

    const result = await callGeminiWithFallback({
      prompt,
    });

    const updatedMarkdown = result.text || currentPost.contentMarkdown;

    res.json({
      success: true,
      updatedMarkdown,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Refine error:', error);
    let errMsg = error.message || '글 수정 중 오류가 발생했습니다.';
    if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      errMsg = 'AI 모델 트래픽 급증(503)으로 지연되었습니다. 다시 한 번 리터칭 버튼을 눌러주세요.';
    }
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// API: Search real-time Google News by keyword
app.get('/api/news/search', async (req, res) => {
  try {
    const keyword = (req.query.keyword as string) || '파크골프';
    const articles = await fetchGoogleNews(keyword);
    res.json({
      success: true,
      keyword,
      articles,
    });
  } catch (error: any) {
    console.error('News search error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '뉴스 기사를 검색하는 중 오류가 발생했습니다.',
    });
  }
});

// API: Fact-checked Expert Blog Republication from News
app.post('/api/news/republish', async (req, res) => {
  try {
    const {
      keyword = '파크골프',
      newsTitle,
      newsSource = '언론사 보도',
      newsUrl = '',
      newsSnippet = '',
      newsPubDate = '',
      category = 'golf',
      categoryName = '파크골프 & 필드 라이프',
      tone = 'professional',
      targetAudience = 'all',
      lengthOption = 'standard',
      focusAngle = '팩트 분석 및 전문가 인사이트 해설',
      customNotes = '',
      authorId,
      authorName,
      authorEmail,
      status = 'published',
    } = req.body;

    if (!newsTitle || typeof newsTitle !== 'string' || !newsTitle.trim()) {
      return res.status(400).json({ success: false, error: '분석 및 재발행할 기사 제목 정보가 없습니다.' });
    }

    const toneDescriptions: Record<string, string> = {
      professional: '신뢰도 높은 전문 언론/칼럼니스트 어조 (~합니다, 객관적인 데이터와 원리 설명, 깊이 있는 해설)',
      friendly: '친근하고 가독성 좋은 라이프스타일 매거진 톤 (~해요, ~해보세요, 이모지와 함께 부드럽고 쉬운 설명)',
      story: '생생한 현장감과 몰입감 넘치는 스토리텔링 에디토리얼 톤',
      viral: '핵심 팩트와 승부처를 단숨에 짚어주는 빠른 호흡의 트렌드 브리핑 톤',
    };

    const lengthGuides: Record<string, string> = {
      short: '핵심 팩트 요약 중심 (공백 제외 약 1,500자, 소제목 3개 내외)',
      standard: '심층 팩트 분석 및 전문가 해설 (공백 제외 약 2,800~3,200자, 소제목 4~5개, 타임라인/비교표 포함)',
      inDepth: '종합 기획 특집 칼럼 (공백 제외 약 3,800자 이상, 완벽한 배경지식/기술분석/향후 전망 수록)',
    };

    const systemInstruction = `당신은 대한민국 최고 수준의 전문 파크골프/스포츠/라이프스타일 수석 에디터이자 팩트체크 전문 칼럼니스트입니다.
구글 뉴스 피드로 보도된 실제 기사 팩트를 철저히 분석하고, 여기에 깊이 있는 전문 지식을 더해 독자들에게 최고의 가치를 주는 프리미엄 웹진 기사로 재발행(Curate & Republish)합니다.

[핵심 작성 원칙]
1. 팩트 보존 (Fact Verification):
   - 원문 기사에 보도된 핵심 사실을 왜곡하거나 허위 사실을 날조하지 마세요.
2. 전문적 해설 & 독자 인사이트:
   - 파크골프/골프/스포츠의 경우: 스윙 궤적, 사용 클럽 장비 스펙, 코스 공략법, 아마추어 레슨 팁
   - 라이프스타일/시사의 경우: 독자에게 미치는 실질적 영향 및 실생활 가이드
3. 마크다운 에디토리얼 서식:
   - 도입부 3줄 핵심 이슈 요약 (Summary Box)
   - 소제목(##, ###)과 사건/경기 일지 타임라인 또는 표(Markdown Table)
   - **[필수] 고화질 Picsum 본문 사진 2장과 감각적인 캡션(*▲ 사진 설명*)**:
     (예시 1: ![기사 관련 사진1](https://picsum.photos/seed/${category}_news1/800/450)
     *▲ 현장의 긴박한 순간과 결정적 승부처 장면*)
     (예시 2: ![기사 관련 사진2](https://picsum.photos/seed/${category}_news2/800/450)
     *▲ 주요 데이터 분석 및 핵심 비교 장면*)
   - 독자 FAQ 3문 3답
   - **출처 투명 표기**: 본문 마지막에 '> 📌 **보도 팩트 출처:** [${newsSource}] ('${newsTitle}') 보도 내용 기반 종합 심층 분석' 문구 수록.
   - 검색 상위 노출 SEO 메타데이터`;

    const userPrompt = `[기반 뉴스 기사 정보]
- 키워드: "${keyword}"
- 원문 기사 제목: "${newsTitle}"
- 언론사/출처: "${newsSource}"
- 보도 시각: "${newsPubDate || '최근 보도'}"
- 기사 내용 요약: "${newsSnippet || newsTitle}"
${newsUrl ? `- 원문 링크: ${newsUrl}` : ''}

[작성 조건]
- 카테고리: ${categoryName} (${category})
- 어조: ${toneDescriptions[tone] || toneDescriptions.professional}
- 타겟 독자: ${targetAudience}
- 글 길이: ${lengthGuides[lengthOption] || lengthGuides.standard}
- 분석 강조 포인트: ${focusAngle}
- 추가 요청: ${customNotes || '없음'}

반드시 아래 JSON 포맷으로 완벽한 품질의 한국어 마크다운 본문을 작성해 주세요.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: '클릭을 유도하는 매력적인 팩트 기반 블로그 메인 제목' },
        subtitle: { type: Type.STRING, description: '핵심 팩트와 인사이트를 요약한 부제목' },
        category: { type: Type.STRING, description: '카테고리 ID' },
        categoryName: { type: Type.STRING, description: '카테고리 한글명' },
        estimatedReadTime: { type: Type.STRING, description: '예상 읽기 시간 (예: "4분", "6분")' },
        summaryBox: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3줄 핵심 팩트 요약 목록',
        },
        tableOfContents: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '목차 항목 리스트',
        },
        contentMarkdown: {
          type: Type.STRING,
          description: '완성된 블로그 본문 (Markdown 포맷, 사진 2장 포함, 타임라인/비교표, 전문 해설, 출처 표기)',
        },
        faqs: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
            },
            required: ['question', 'answer'],
          },
          description: '독자들이 가장 궁금해할 질문과 명쾌한 답변 3가지',
        },
        checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '핵심 요약 포인트 또는 실천 팁 3~5가지',
        },
        seo: {
          type: Type.OBJECT,
          properties: {
            metaDescription: { type: Type.STRING, description: '120자 내외 검색 최적화 메타 디스크립션' },
            targetKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '검색 상위 노출 타겟 키워드 5~8개',
            },
            hashtags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '#으로 시작하는 추천 해시태그 8~12개',
            },
          },
          required: ['metaDescription', 'targetKeywords', 'hashtags'],
        },
        coverPhotoKeyword: { type: Type.STRING, description: '대표 이미지 영문 검색 키워드' },
      },
      required: [
        'title',
        'subtitle',
        'estimatedReadTime',
        'summaryBox',
        'tableOfContents',
        'contentMarkdown',
        'seo',
      ],
    };

    const result = await callGeminiWithFallback({
      prompt: userPrompt,
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema,
    });

    const text = result.text;
    if (!text) {
      throw new Error('AI 응답을 생성하지 못했습니다.');
    }

    const postData = JSON.parse(text);
    const photos = getDiversePhotos(category, postData.title || newsTitle);
    const coverImageUrl = photos.cover;

    // Replace any picsum or placeholder images in markdown with curated high-quality thematic images
    let contentMarkdown = postData.contentMarkdown || '';
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...contentMarkdown.matchAll(imgRegex)];
    if (matches.length >= 2) {
      contentMarkdown = contentMarkdown
        .replace(matches[0][0], `![${matches[0][1] || '관련 주요 장면'}](${photos.content1})`)
        .replace(matches[1][0], `![${matches[1][1] || '상세 핵심 가이드'}](${photos.content2})`);
    } else if (matches.length === 1) {
      contentMarkdown = contentMarkdown.replace(matches[0][0], `![${matches[0][1] || '관련 주요 장면'}](${photos.content1})`);
    }

    const resultPost = {
      id: 'news_post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      ...postData,
      contentMarkdown,
      category,
      categoryName,
      coverImageUrl,
      tone,
      createdAt: new Date().toISOString(),
      likes: 0,
      views: 1,
      status: status || 'published',
      authorId: authorId || undefined,
      authorName: authorName || undefined,
      authorEmail: authorEmail || undefined,
      newsSource: {
        originalTitle: newsTitle,
        mediaName: newsSource,
        originalUrl: newsUrl || undefined,
        publishedAt: newsPubDate || new Date().toISOString(),
      },
    };

    res.json({ success: true, post: resultPost, modelUsed: result.modelUsed });
  } catch (error: any) {
    console.error('News republish generation error:', error);
    let errMsg = error.message || '뉴스 기반 블로그 글 생성 중 오류가 발생했습니다.';
    if (errMsg.includes('503') || errMsg.includes('high demand') || errMsg.includes('UNAVAILABLE')) {
      errMsg = 'AI 모델 트래픽 급증(503 High Demand)이 발생했습니다. 잠시 후 다시 생성 버튼을 눌러주세요.';
    }
    res.status(500).json({
      success: false,
      error: errMsg,
    });
  }
});

// Curated high quality photos per category (Park Golf, Sports, Health, Cooking, etc.)
const CURATED_CATEGORY_PHOTOS: Record<string, string[]> = {
  golf: [
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1622396636133-ba43f812dd33?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1510563800743-aed236490d09?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1591491634960-9ba2802611a5?auto=format&fit=crop&w=1200&q=80',
  ],
  cooking: [
    'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507048821117-6573c21c4388?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80',
  ],
  cleaning: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  ],
  finance: [
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
  ],
  health: [
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
  ],
  travel: [
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  ],
  sports: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  ],
  entertainment: [
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
  ],
  news: [
    'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=1200&q=80',
  ],
  all: [
    'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
  ],
};

function getDiversePhotos(category: string, title: string = ''): { cover: string; content1: string; content2: string } {
  const catList = CURATED_CATEGORY_PHOTOS[category] || CURATED_CATEGORY_PHOTOS.golf;
  
  // Deterministic or diverse hash based on title string
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const startIndex = Math.abs(hash) % catList.length;
  
  const cover = catList[startIndex];
  const content1 = catList[(startIndex + 1) % catList.length];
  const content2 = catList[(startIndex + 2) % catList.length];
  
  return { cover, content1, content2 };
}

// API: Regenerate tailored contextual images for a blog post
app.post('/api/blog/regenerate-images', async (req, res) => {
  try {
    const { post } = req.body;
    if (!post || !post.title) {
      return res.status(400).json({ success: false, error: '분석할 글 정보가 전달되지 않았습니다.' });
    }

    const catKey = post.category || 'golf';
    // Use diverse curated category photos instead of generic picsum
    const photos = getDiversePhotos(catKey, post.title + '_' + Date.now());
    const newCoverUrl = photos.cover;
    const newContentImg1Url = photos.content1;
    const newContentImg2Url = photos.content2;

    let updatedMarkdown = post.contentMarkdown || '';
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const matches = [...updatedMarkdown.matchAll(imgRegex)];

    if (matches.length >= 2) {
      const firstMatch = matches[0];
      const secondMatch = matches[1];
      const caption1 = firstMatch[1] || '현장 주요 장면';
      const caption2 = secondMatch[1] || '상세 분석 및 팁';

      updatedMarkdown = updatedMarkdown.replace(firstMatch[0], `![${caption1}](${newContentImg1Url})`);
      updatedMarkdown = updatedMarkdown.replace(secondMatch[0], `![${caption2}](${newContentImg2Url})`);
    } else if (matches.length === 1) {
      const firstMatch = matches[0];
      const caption1 = firstMatch[1] || '현장 주요 장면';
      updatedMarkdown = updatedMarkdown.replace(firstMatch[0], `![${caption1}](${newContentImg1Url})`);
    } else {
      const sections = updatedMarkdown.split('\n## ');
      if (sections.length > 2) {
        sections[1] = sections[1] + `\n\n![주요 핵심 장면](${newContentImg1Url})\n*▲ 주요 핵심 장면*\n`;
        sections[2] = sections[2] + `\n\n![심층 분석 및 가이드](${newContentImg2Url})\n*▲ 심층 분석 및 가이드*\n`;
        updatedMarkdown = sections.join('\n## ');
      }
    }

    res.json({
      success: true,
      coverImageUrl: newCoverUrl,
      updatedMarkdown,
    });
  } catch (error: any) {
    console.error('Image regeneration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '이미지 재생성 중 오류가 발생했습니다.',
    });
  }
});

// API: Generate image with Gemini AI or high-quality curated fallback
app.post('/api/blog/generate-image', async (req, res) => {
  try {
    const { prompt, theme = 'golf' } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: '프롬프트를 입력해주세요.' });
    }

    console.log(`Generating image for prompt: "${prompt}", theme: ${theme}`);

    // Try Gemini image generation if key is present
    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite-image',
          contents: {
            parts: [
              {
                text: prompt,
              },
            ],
          },
          config: {
            imageConfig: {
              aspectRatio: '4:3',
            },
          },
        });

        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const mimeType = part.inlineData.mimeType || 'image/png';
              const base64Data = part.inlineData.data;
              return res.json({
                success: true,
                imageUrl: `data:${mimeType};base64,${base64Data}`,
                source: 'gemini-ai'
              });
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('Gemini image generation failed, using high-quality curated fallback:', geminiErr.message || geminiErr);
      }
    }

    // High-quality fallback: Select from CURATED_CATEGORY_PHOTOS
    const catList = CURATED_CATEGORY_PHOTOS[theme] || CURATED_CATEGORY_PHOTOS.golf;
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = (hash << 5) - hash + prompt.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % catList.length;
    const fallbackUrl = catList[index];

    // Fetch the fallback image on the server and return it as a base64 DataURL
    try {
      const imgRes = await fetch(fallbackUrl);
      if (imgRes.ok) {
        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        const base64Data = buffer.toString('base64');
        return res.json({
          success: true,
          imageUrl: `data:${mimeType};base64,${base64Data}`,
          source: 'curated-fallback',
          originalUrl: fallbackUrl
        });
      }
    } catch (fetchErr) {
      console.error('Failed to fetch fallback image as base64, returning direct URL:', fetchErr);
    }

    res.json({
      success: true,
      imageUrl: fallbackUrl,
      source: 'curated-fallback-url'
    });

  } catch (error: any) {
    console.error('Image generation main loop error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '이미지 생성 중 오류가 발생했습니다.'
    });
  }
});

// Direct SEO Endpoints: robots.txt & sitemap.xml
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Allow: /

# Sitemap Index for Google Search Console & Naver Search Advisor
Sitemap: https://parkgolfone.co.kr/sitemap.xml
`);
});

app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://parkgolfone.co.kr/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=golf</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=sports</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=health</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=news</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=travel</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=cooking</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://parkgolfone.co.kr/?cat=finance</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`);
});

