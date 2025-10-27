// 게시글 상세 페이지
import { get, post, patch } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';
import {
  renderCommentAccordion,
  renderCommentsInGroup,
  updateCommentCount,
  appendComment,
  removeComment,
  updateCommentContent
} from '/components/comment/comment.js';

let postId = null;
let currentPost = null;
let isLiked = false;
let totalComments = 0;  // 전체 댓글 수
const PAGE_SIZE = 20;   // 페이지당 댓글 수

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // URL에서 게시글 ID 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  postId = urlParams.get('id');

  if (!postId) {
    showError('잘못된 접근입니다.');
    return;
  }

  initPostDetail();
  attachEventListeners();
});

// 게시글 상세 초기화
async function initPostDetail() {
  try {
    await fetchPostDetail();
    await fetchComments();
  } catch (error) {
    console.error('게시글 로딩 실패:', error);
    showError('게시글을 불러오는데 실패했습니다.');
  }
}

// 게시글 상세 정보 가져오기
async function fetchPostDetail() {
  const { error, result } = await get(API_ENDPOINTS.POSTS.DETAIL(postId));

  if (error) {
    throw new Error(error.message);
  }

  currentPost = result.data;
  renderPost(currentPost);
  
  // 로딩 숨기고 게시글 표시
  document.getElementById('loading').style.display = 'none';
  document.getElementById('postDetail').style.display = 'block';
}

// 게시글 렌더링
function renderPost(post) {
  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postAuthor').textContent = post.nickname || post.author || '익명';
  document.getElementById('postDate').textContent = formatDate(post.createdAt);
  document.getElementById('postViews').textContent = post.viewCount || 0;
  document.getElementById('postContent').textContent = post.content;
  document.getElementById('likeCount').textContent = post.likeCount || 0;

  console.log('확인용 : ', localStorage.getItem("userId"));
  console.log('확인용 : ', localStorage.getItem("accessToken"));

  // 작성자인 경우 수정/삭제 버튼 표시
  checkAuthor(post);

  // 좋아요 상태 확인 (로컬스토리지 이용)
  checkLikeStatus();
}

// 작성자 확인
function checkAuthor(post) {
  const userId = localStorage.getItem('userId');
  console.log('userId입니다:', userId);
  const isAuthor = userId === post.userId;
  console.log('결과입니다,:', userId && userId === post.userId);
  console.log('결과입니다,:', userId === post.userId);

  if (isAuthor) {
    document.getElementById('btnEdit').style.display = 'inline-block';
    document.getElementById('btnDelete').style.display = 'inline-block';
  }
}

// 좋아요 상태 확인
function checkLikeStatus() {
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  isLiked = likedPosts.includes(postId);
  
  const btnLike = document.getElementById('btnLike');
  if (isLiked) {
    btnLike.classList.add('liked');
  } else {
    btnLike.classList.remove('liked');
  }
}

// 댓글 목록 가져오기 (초기 로드 - 최신 댓글만)
async function fetchComments() {
  try {
    // 먼저 마지막 페이지의 댓글을 가져오기 위해 전체 댓글 수 조회
    const { error: countError, result: countResult } = await get(
      `${API_ENDPOINTS.COMMENTS.LIST(postId)}?page=0&size=1`
    );
    
    if (countError) {
      console.error('댓글 조회 실패:', countError);
      renderCommentAccordion(0, [], 'commentList', handleCommentToggle, handleCommentDelete, PAGE_SIZE);
      updateCommentCount(0);
      return;
    }
    
    // 전체 댓글 수 저장
    totalComments = countResult.data.totalElements || 0;
    
    if (totalComments === 0) {
      renderCommentAccordion(0, [], 'commentList', handleCommentToggle, handleCommentDelete, PAGE_SIZE);
      updateCommentCount(0);
      return;
    }
    
    // 마지막 페이지 번호 계산
    const lastPage = Math.max(0, Math.ceil(totalComments / PAGE_SIZE) - 1);
    
    // 마지막 페이지의 댓글만 조회 (최신 댓글들)
    const { error, result } = await get(
      `${API_ENDPOINTS.COMMENTS.LIST(postId)}?page=${lastPage}&size=${PAGE_SIZE}`
    );
    
    if (error) {
      console.error('최신 댓글 조회 실패:', error);
      renderCommentAccordion(totalComments, [], 'commentList', handleCommentToggle, handleCommentDelete, PAGE_SIZE);
      updateCommentCount(totalComments);
      return;
    }
    
    const latestComments = result.data.content || [];
    
    // 아코디언 렌더링 (전체 댓글 수 + 최신 댓글들)
    renderCommentAccordion(
      totalComments,
      latestComments,
      'commentList',
      handleCommentToggle,
      handleCommentDelete,
      handleCommentEdit,
      PAGE_SIZE
    );
    updateCommentCount(totalComments);
    
  } catch (error) {
    console.error('댓글 조회 중 오류:', error);
    renderCommentAccordion(0, [], 'commentList', handleCommentToggle, handleCommentDelete, handleCommentEdit, PAGE_SIZE);
    updateCommentCount(0);
  }
}

// 댓글 토글 핸들러 (아코디언 열렸을 때)
async function handleCommentToggle(page, groupId) {
  try {
    const { error, result } = await get(
      `${API_ENDPOINTS.COMMENTS.LIST(postId)}?page=${page}&size=${PAGE_SIZE}`
    );
    
    if (error) {
      const group = document.getElementById(groupId);
      if (group) {
        group.innerHTML = '<div class="comment-empty-text">댓글을 불러오는데 실패했습니다.</div>';
      }
      return;
    }

    const comments = result.data.content || [];
    renderCommentsInGroup(comments, groupId, handleCommentDelete, handleCommentEdit);

  } catch (error) {
    console.error('댓글 그룹 로드 실패:', error);
    const group = document.getElementById(groupId);
    if (group) {
      group.innerHTML = '<div class="comment-empty-text">댓글을 불러오는데 실패했습니다.</div>';
    }
  }
}

// 댓글 수정
async function handleCommentEdit(commentId, newContent, commentItem) {
  try {
    // 댓글 수정 API 호출
    const { error } = await patch(
      API_ENDPOINTS.COMMENTS.UPDATE(commentId),
      { content: newContent },
      { auth: true }
    );

    if (error) {
      await window.modal.alert('댓글 수정에 실패했습니다.', '오류');
      return;
    }

    // UI 업데이트
    updateCommentContent(commentId, newContent);
    await window.modal.alert('댓글이 수정되었습니다.', '완료');

  } catch (error) {
    console.error('댓글 수정 실패:', error);
    await window.modal.alert('댓글 수정에 실패했습니다.', '오류');
  }
}

// 이벤트 리스너 등록
function attachEventListeners() {
  // 좋아요 버튼
  document.getElementById('btnLike').addEventListener('click', handleLike);

  // 수정 버튼
  document.getElementById('btnEdit').addEventListener('click', handleEdit);

  // 삭제 버튼
  document.getElementById('btnDelete').addEventListener('click', handleDelete);

  // 댓글 작성 버튼
  document.getElementById('btnCommentSubmit').addEventListener('click', handleCommentSubmit);

  // 댓글 글자 수 카운터
  const commentInput = document.getElementById('commentInput');
  commentInput.addEventListener('input', () => {
    document.getElementById('commentLength').textContent = commentInput.value.length;
  });

  // 목록으로 버튼
  document.getElementById('btnList').addEventListener('click', () => {
    window.location.href = '/pages/post/post.html';
  });
}

// 좋아요 처리
async function handleLike() {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    const alerted = await window.modal.alert(
      '로그인이 필요한 서비스입니다.',
      '알림'
    );
    if (alerted) {
      window.location.href = '/pages/login/login.html';
    }
    return;
  }

  // 좋아요 토글 (로컬에서만)
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  
  if (isLiked) {
    // 좋아요 취소
    const index = likedPosts.indexOf(postId);
    if (index > -1) likedPosts.splice(index, 1);
    currentPost.likeCount = Math.max(0, (currentPost.likeCount || 0) - 1);
  } else {
    // 좋아요
    likedPosts.push(postId);
    currentPost.likeCount = (currentPost.likeCount || 0) + 1;
  }
  
  localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
  isLiked = !isLiked;
  
  // UI 업데이트
  checkLikeStatus();
  document.getElementById('likeCount').textContent = currentPost.likeCount;

  // TODO: 서버에 좋아요 API 호출
  // await post(API_ENDPOINTS.POSTS.LIKE(postId), {}, { auth: true });
}

// 게시글 수정
function handleEdit() {
  window.location.href = `/pages/post/postEdit.html?id=${postId}`;
}

// 게시글 삭제
async function handleDelete() {
  const confirmed = await window.modal.confirm(
    '정말로 이 게시글을 삭제하시겠습니까?',
    '게시글 삭제'
  );

  if (!confirmed) return;

  const { error } = await patch(
    API_ENDPOINTS.POSTS.DELETE(postId),
    null,
    { auth: true, autoRedirect: true }
  );

  console.log("error", error);

  if (error) {
    await window.modal.alert('게시글 삭제에 실패했습니다.', '오류');
    return;
  }

  await window.modal.alert('게시글이 삭제되었습니다.', '완료');
  window.location.href = '/pages/post/post.html';
}

// 댓글 작성
async function handleCommentSubmit() {
  const accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    const alerted = await window.modal.alert(
      '로그인이 필요한 서비스입니다.',
      '알림'
    );
    if (alerted) {
      window.location.href = '/pages/login/login.html';
    }
    return;
  }

  const commentInput = document.getElementById('commentInput');
  const content = commentInput.value.trim();

  if (!content) {
    await window.modal.alert('댓글 내용을 입력해주세요.', '알림');
    return;
  }

  try {
    // 댓글 작성 API 호출
    const { error, result } = await post(
      API_ENDPOINTS.COMMENTS.CREATE(postId),
      { content },
      { auth: true },
    );

    if (error) {
      await window.modal.alert('댓글 작성에 실패했습니다.', '오류');
      return;
    }

    // 입력창 초기화
    commentInput.value = '';
    document.getElementById('commentLength').textContent = '0';
    
    await window.modal.alert('댓글이 작성되었습니다.', '완료');
    
    // 댓글 목록 새로고침 (아코디언 다시 렌더링)
    await fetchComments();
    
  } catch (error) {
    console.error('댓글 작성 실패:', error);
    await window.modal.alert('댓글 작성에 실패했습니다.', '오류');
  }
}

// 댓글 삭제
async function handleCommentDelete(commentId) {
  const confirmed = await window.modal.confirm(
    '정말로 이 댓글을 삭제하시겠습니까?',
    '댓글 삭제'
  );

  if (!confirmed) return;

  try {
    // 댓글 삭제 API 호출
    const { error } = await patch(
      API_ENDPOINTS.COMMENTS.SOFT_DELETE(commentId),
      {},
      { auth: true }
    );

    if (error) {
    // 401은 이미 처리됨
      // if (error.status !== 401) {
      //   await window.modal.alert('댓글 삭제에 실패했습니다.', '오류');
      // }
      await window.modal.alert('댓글 삭제에 실패했습니다.', '오류');
      return;
    }
    
    await window.modal.alert('댓글이 삭제되었습니다.', '완료');
    
    // 댓글 목록 새로고침
    await fetchComments();
    
  } catch (error) {
    console.error('댓글 삭제 실패:', error);
    await window.modal.alert('댓글 삭제에 실패했습니다.', '오류');
  }
}

// 댓글 이벤트 등록 (더 이상 필요 없음 - 컴포넌트에서 처리)
function attachCommentEvents() {
  // 컴포넌트에서 처리하므로 비워둠
}

/**
 * 시간 포맷팅
 * @param {string} timestamp - ISO 8601 타임스탬프
 * @returns {string} 포맷된 시간 문자열
 */
function formatDate(timestamp) {
  if (!timestamp) return '방금 전';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  
  // 일주일 이상 지난 경우 날짜 표시
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 에러 표시
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('postDetail').style.display = 'none';
  
  const errorState = document.getElementById('errorState');
  errorState.style.display = 'block';
  errorState.querySelector('.error-message').textContent = message;
}