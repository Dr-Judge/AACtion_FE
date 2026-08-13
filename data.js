/* ============================================
   Dr.Judge — 목업 데이터 (API 연동 시 이 파일만 교체)
   ============================================ */

const CATEGORIES = [
  '전체 카테고리',
  '다이어트',
  '미용/화장품',
  '건강/면역',
  '질환·증상관리',
  '기타',
];

const BRIEFINGS = [
  {
    id: 'b1',
    title: '오늘 주목할 건강 이슈는?',
    desc: '매일 1분, 검증된 건강·미용 정보 브리핑',
    cta: '브리핑 확인하기',
  },
  {
    id: 'b2',
    title: '이번 주 화제의 성분 TOP 3',
    desc: '검색량이 급증한 성분을 정리했어요',
    cta: '브리핑 확인하기',
  },
  {
    id: 'b3',
    title: '가짜뉴스 판정 결과 모아보기',
    desc: 'Dr.Judge가 검증한 이번 주 루머',
    cta: '브리핑 확인하기',
  },
  {
    id: 'b4',
    title: '내 관심 카테고리 브리핑',
    desc: '관심 주제만 골라 받아보세요',
    cta: '브리핑 확인하기',
  },
];

const FEEDS = [
  {
    id: 'f1',
    category: '건강/면역',
    title: '비타민C 고함량 제품 정말 더 좋을까?',
    desc: '고함량 비타민 C 섭취 시 면역력 강화 효과는 제한적일 수 있다는 연구 결과가 나왔어요.',
    author: '건강정보러버',
    createdAt: '2026-08-10T09:00:00',
    likes: 128,
    liked: false,
  },
  {
    id: 'f2',
    category: '다이어트',
    title: '공복 유산소, 체지방 감소에 도움될까?',
    desc: '공복 유산소 운동이 체지방 감소에 미치는 영향에 대한 전문가 의견을 정리했어요.',
    author: '오늘부터운동',
    createdAt: '2026-08-11T13:20:00',
    likes: 96,
    liked: false,
  },
  {
    id: 'f3',
    category: '미용/화장품',
    title: "'PDRN 화장품' 효과, 임상으로 입증됐을까?",
    desc: 'PDRN 성분의 피부 재생 효과에 대한 임상 연구 결과를 확인해봤어요.',
    author: '피부는과학',
    createdAt: '2026-08-12T18:40:00',
    likes: 231,
    liked: true,
  },
  {
    id: 'f4',
    category: '질환·증상관리',
    title: '양배추즙, 위염에 도움이 될까?',
    desc: '양배추즙이 위염 증상 완화에 도움이 된다는 주장, 사실인지 알아봤어요.',
    author: '건강한일상',
    createdAt: '2026-08-11T08:10:00',
    likes: 74,
    liked: false,
  },
  {
    id: 'f5',
    category: '기타',
    title: '아침 사과가 몸에 더 좋다는 말, 근거 있나?',
    desc: '섭취 시간대에 따른 영양 흡수 차이를 다룬 자료를 살펴봤어요.',
    author: '팩트체커',
    createdAt: '2026-08-09T07:30:00',
    likes: 45,
    liked: false,
  },
];

/* 판정 기록 (판정 화면 · 마이페이지 공용) */
const JUDGEMENTS = [
  {
    id: 'j1',
    category: '다이어트',
    title: '공복 유산소가 체지방을 더 태운다?',
    verdict: 'partly',
    createdAt: '2026-08-12T21:10:00',
  },
  {
    id: 'j2',
    category: '건강/면역',
    title: '비타민C 메가도스가 감기를 막아준다?',
    verdict: 'false',
    createdAt: '2026-08-11T10:05:00',
  },
  {
    id: 'j3',
    category: '미용/화장품',
    title: 'PDRN 성분이 피부 재생에 도움된다?',
    verdict: 'true',
    createdAt: '2026-08-09T15:42:00',
  },
];

const VERDICT_LABEL = {
  true: '사실',
  partly: '일부 사실',
  false: '사실 아님',
};

/* ============================================
   피드 탭 · 마이페이지 데이터
   ============================================ */

/* 내 정보 */
const ME = {
  nickname: '마라탕후루이비똥',
  studentNo: '2022147034',
  email: 'tmxhdjf12@g.eulji.ac.kr',
  avatar: null, // 미등록 시 기본 이미지
  point: 1250,
};

/* 판정 결과 뱃지 */
const RESULT = {
  expert: { label: '전문가 의견 있음', hint: '근거 확인', tone: 'ok', icon: 'check' },
  lack: { label: '근거 부족', hint: '확인 기준 필요', tone: 'warn', icon: 'bang' },
  hold: { label: '판단보류', hint: '추가 근거 확인', tone: 'hold', icon: 'question' },
};

/* 공유 피드 카드 */
const FEED_CARDS = [
  {
    id: 'c1',
    category: '건강 · 질환/증상관리',
    title: '혈당을 낮추려면 식후 10분만 걸어도 효과가 있다?',
    desc: '식후 가벼운 걷기가 혈당 관리에 도움이 될 수 있지만, 개인의 상태와 운동 강도에 따라 차이가 있습니다.',
    result: 'expert',
    author: '건강확인러',
    likes: 128,
    createdAt: '2026-08-12T09:41:00',
  },
  {
    id: 'c2',
    category: '미용 · 화장품',
    title: '모공을 완전히 없애주는 홈케어 제품이 있다?',
    desc: '화장품으로 모공 자체를 완전히 없애는 것은 어렵습니다. 제품의 효과는 피부 상태와 성분에 따라 달라집니다.',
    result: 'lack',
    author: '뷰티체크',
    likes: 94,
    createdAt: '2026-08-11T16:22:00',
    detail: {
      verdict: '근거 부족',
      summary: '임상적 근거 없음',
      info: [
        ['대상', '성인 일반'],
        ['효과', '피부 모공 개선'],
        ['조건 · 범위', '일반적 사용 조건 기준'],
        ['근거 버전', 'v2024.11'],
      ],
      evidence:
        '모공은 피부 상태(피지 분비, 탄력, 각질 등)에 따라 일시적으로 가려지거나 눈에 덜 띌 수는 있으나, 화장품만으로 모공을 완전히 없애는 것은 어렵습니다. 현재까지 ‘모공을 완전히 없앤다’는 주장을 뒷받침하는 임상적 근거는 확인되지 않았습니다.',
      checkpoints: [
        '제품이 ‘의약품’이 아닌 ‘화장품’인지 확인',
        '과장 광고 여부 확인 (식약처 기능성 심사 여부 확인)',
        '전성분 및 주요 기능성 성분(피지·각질 관리 성분) 확인',
        '피부 타입에 맞는 제품 선택 및 패치 테스트 권장',
      ],
    },
  },
  {
    id: 'c3',
    category: '이너뷰티 · 건강기능식품',
    title: '비타민을 많이 먹을수록 면역력이 계속 올라간다?',
    desc: '필요량을 넘어선 섭취가 효과를 계속 높인다고 보기는 어렵습니다. 제품의 공식 함량과 섭취 기준을 확인하세요.',
    result: 'hold',
    author: '웰니스노트',
    likes: 71,
    createdAt: '2026-08-10T11:30:00',
  },
];

/* 포인트 내역 */
const POINT_LOGS = [
  { label: '판정 완료', at: '2026.08.11  09:41', amount: 50 },
  { label: '카드 공유', at: '2026.08.10  16:22', amount: 50 },
  { label: '판정 완료', at: '2026.08.09  14:03', amount: 50 },
  { label: '카드 공유', at: '2026.08.08  11:30', amount: 50 },
  { label: '가입 축하 포인트', at: '2026.08.01  10:00', amount: 1000 },
];

/* 판정 이력 */
const HISTORY_STATUS = {
  fit: { label: '적합', hint: '근거 충분', mark: '✓' },
  vague: { label: '애매', hint: '정보 부족', mark: '?' },
  unfit: { label: '부적합', hint: '근거 부족', mark: '×' },
};

const JUDGE_HISTORY = [
  { category: '미용/화장품', title: '바이오레시피 헤어팩', at: '2026.08.11 · 09:41', status: 'fit' },
  { category: '건강/면역', title: '이뮨부스터 비타민C', at: '2026.08.10 · 16:22', status: 'fit' },
  { category: '기타', title: '꿀벌꿀잠 수면스프레이', at: '2026.08.09 · 21:15', status: 'vague' },
  { category: '다이어트', title: '잔티움 올데이 다이어트', at: '2026.08.09 · 14:03', status: 'unfit' },
  { category: '미용/화장품', title: '리페어 엠플 세럼', at: '2026.08.08 · 11:30', status: 'vague' },
];

/* 나의 공유 카드 */
const MY_CARDS = [
  {
    id: 'm1',
    category: '미용 · 화장품',
    date: '2026.08.11',
    title: '바이오레시피 헤어팩, 손상모 회복에 정말 효과가 있을까?',
    result: '근거 있음',
    likes: 24,
  },
  {
    id: 'm2',
    category: '다이어트 · 체중관리',
    date: '2026.08.09',
    title: '하루 한 끼만 먹으면 빠르게 살을 뺄 수 있다?',
    result: '주의 필요',
    likes: 12,
  },
  {
    id: 'm3',
    category: '건강 · 영양제',
    date: '2026.08.06',
    title: '비타민C는 많이 먹을수록 면역력에 더 좋다?',
    result: '과장 가능성',
    likes: 8,
  },
];
