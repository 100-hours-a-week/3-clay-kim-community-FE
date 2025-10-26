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
  initPostList();
  attachEventListeners();
});

// 게시글 작성 버튼 이벤트
function attachEventListeners() {
  const btnWrite = document.getElementById('btnWrite');
  btnWrite.addEventListener('click', async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
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
  const { error, result } = await get(
    API_ENDPOINTS.POSTS.LIST(cursor, PAGE_SIZE)
  );

  if (error) {
    throw new Error('게시글을 불러오는데 실패했습니다.');
  }

  const data = result.data;
  currentCursor = data.nextCursor;
  hasNext = data.hasNext;
  
  // ✅ 첫 로딩: 전체 교체 (append = false)
  renderPostCards(data.posts || [], 'postList', false);
  
  // 페이지네이션 버튼 렌더링
  // renderPaginationButton();
  renderPaginationAuto();
}

// 페이지네이션 버튼 렌더링
function renderPaginationButton() {
  const pagination = document.getElementById('pagination');
  isLoading = true;

  if (!hasNext) {
    pagination.innerHTML = '';
    return;
  }
  
  pagination.innerHTML = `
    <button class="page-btn" id="btnLoadMore">더 보기</button>
  `;
  
  document.getElementById('btnLoadMore').addEventListener('click', loadMore);
}

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
    const { error, result } = await get(
      API_ENDPOINTS.POSTS.LIST(currentCursor, PAGE_SIZE)
    );

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
    isLoading = false; // ✅ 로딩 완료
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