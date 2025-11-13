// 게시글 목록 페이지 - 최종 버전
import { renderPostCards } from '/components/postCard/postCard.js';
import { get } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

let currentCursor = null;
let hasNext = false;
const PAGE_SIZE = 10;
let isLoading = false;

// 자동 pagination을 위한 Intersection Observer 생성
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && hasNext && !isLoading) {
      loadMore();
    }
  });
}, {
  root: null,           // 뷰포트 기준
  rootMargin: '100px',  // 100px 미리 감지
  threshold: 0          // 1px만 보여도 트리거
});

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  updatePageHeader();
  initPostList();
  attachEventListeners();
});

// URL 파라미터에 따라 페이지 제목과 설명 업데이트
function updatePageHeader() {
  const params = new URLSearchParams(window.location.search);
  const period = params.get('period');
  const view = params.get('view');
  const filter = params.get('filter');

  const headerConfig = {
    daily: {
      title: '⭐ 오늘 추천글',
      description: '오늘 가장 인기있는 게시글을 확인하세요!'
    },
    weekly: {
      title: '🏆 이번주 추천글',
      description: '이번 주 가장 인기있는 게시글을 확인하세요!'
    },
    top10: {
      title: '🔥 이번주 인기 TOP 10',
      description: '이번 주 가장 인기있는 게시글 TOP 10을 확인하세요!'
    },
    myPosts: {
      title: '📝 내 게시글',
      description: '내가 작성한 게시글을 확인하세요!'
    }
  };

  const key = filter || view || period;
  const config = headerConfig[key] || {
    title: '안녕하세요, 아무 말 대잔치 게시판 입니다.',
    description: '자유롭게 이야기를 나눠보세요!'
  };

  document.title = config.title.replace(/[⭐🏆🔥]\s/, '') + ' | 아무 말 대잔치';

  const headerElement = document.getElementById('postHeader');
  if (headerElement) {
    headerElement.innerHTML = `
      <h1>${config.title}</h1>
      <p class="post-description">${config.description}</p>
    `;
  }
}

// 게시글 작성 버튼 이벤트
function attachEventListeners() {
  const btnWrite = document.getElementById('btnWrite');
  btnWrite.addEventListener('click', async () => {
    const userId = localStorage.getItem('userId');
    
    if (!userId) {
      const alerted = await window.modal.alert(
        '로그인이 필요한 서비스입니다.', 
        '알림',
        '로그인'
      );
      if (alerted) {
        window.location.href = '/pages/login/login.html';
      }
    } else {
      window.location.href = '/pages/post/postCreate.html';
    }
  });
}

// 게시글 목록 초기화
async function initPostList() {
  try {
    await fetchPosts();
  } catch (error) {
    console.error('게시글 로딩 실패:', error);
    renderError();
  }
}

// 게시글 목록 불러오기 (cursor 기반)
async function fetchPosts(cursor = null) {
  const params = new URLSearchParams(window.location.search);
  const period = params.get('period');
  const view = params.get('view');
  const filter = params.get('filter');

  let endpoint;

  // view=top10이면 GET /posts/top10
  if (view === 'top10') {
    endpoint = API_ENDPOINTS.POSTS.TOP10;
  } else if (filter === 'myPosts') {
    // 내 게시글 필터링
    const nickname = localStorage.getItem('userNickname');
    if (!nickname) {
      throw new Error('로그인이 필요합니다.');
    }
    // /posts?nickname=실제닉네임 형태로 요청
    const baseEndpoint = API_ENDPOINTS.POSTS.LIST(cursor, PAGE_SIZE, period);
    endpoint = `${baseEndpoint}&nickname=${encodeURIComponent(nickname)}`;
  } else {
    // 일반 목록 (period 있으면 필터링)
    endpoint = API_ENDPOINTS.POSTS.LIST(cursor, PAGE_SIZE, period);
  }

  const { error, result } = await get(endpoint);

  console.log('error : ', error);

  if (error) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  const data = result.data;
  currentCursor = data.nextCursor;
  hasNext = data.hasNext;

  // 첫 로딩: 전체 교체 (append = false)
  renderPostCards(data.posts || [], 'postList', false);

  // 페이지네이션 버튼 렌더링
  renderPaginationAuto();
}

// 자동 페이지네이션 렌더링 (Intersection Observer)
function renderPaginationAuto() {
  const pagination = document.getElementById('pagination');
  
  if (!hasNext) {
    pagination.innerHTML = '<p id="header-logo">더이상 게시물이 없습니다.</p>';
    observer.disconnect(); // 관찰 중지
    return;
  }
  
  pagination.innerHTML = `
    <div id="loadMoreTrigger" style="height: 1px; margin: 20px 0;"></div>
  `;
  
  // Intersection Observer로 감지
  const trigger = document.getElementById('loadMoreTrigger');
  observer.observe(trigger);
}

// 더 보기 (다음 페이지) - renderPostCards 통일!
async function loadMore() {
  if (!hasNext || !currentCursor || isLoading) return;

  isLoading = true; // 로딩 시작

  try {
    const params = new URLSearchParams(window.location.search);
    const period = params.get('period');
    const view = params.get('view');

    let endpoint;

    // fetchPosts()와 동일한 로직
    if (view === 'top10') {
      endpoint = API_ENDPOINTS.POSTS.TOP10;
    } else {
      endpoint = API_ENDPOINTS.POSTS.LIST(currentCursor, PAGE_SIZE, period);
    }

    const { error, result } = await get(endpoint);

    if (error) {
      throw new Error('게시글을 불러오는데 실패했습니다.');
    }

    currentCursor = result.data.nextCursor;
    hasNext = result.data.hasNext;

    // 더보기: 기존 목록에 추가 (append = true)
    renderPostCards(result.data.posts || [], 'postList', true);
    // 페이지네이션 버튼 업데이트
    renderPaginationAuto();
  } catch (error) {
    console.error('게시글 로딩 실패:', error);
    await window.modal.alert('게시글을 불러오는데 실패했습니다.', '오류');
  }  finally {
    isLoading = false; // 로딩 완료
  }
}

// 에러 렌더링
function renderError() {
  const postList = document.getElementById('postList');
  postList.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">게시글을 불러오는데 실패했습니다.</div>
      <button class="btn-write" onclick="location.reload()">
        다시 시도
      </button>
    </div>
  `;
}