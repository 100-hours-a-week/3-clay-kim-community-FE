// 게시글 상세 페이지
import { get, post, patch } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

let postId = null;
let currentPost = null;
let isLiked = false;

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

// 댓글 목록 가져오기
async function fetchComments() {
  // API가 있다면 사용, 없으면 더미 데이터
  // const { error, result } = await get(API_ENDPOINTS.COMMENTS.LIST(postId));
  
  // 임시: 빈 댓글
  renderComments([]);
}

// 댓글 렌더링
function renderComments(comments) {
  const commentList = document.getElementById('commentList');
  const commentCount = document.getElementById('commentCount');
  
  commentCount.textContent = comments.length;

  if (comments.length === 0) {
    commentList.innerHTML = `
      <div class="comment-empty">
        첫 댓글을 작성해보세요!
      </div>
    `;
    return;
  }

  commentList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
  
  // 댓글 삭제 버튼 이벤트 등록
  attachCommentEvents();
}

// 댓글 HTML 생성
function createCommentHTML(comment) {
  const userId = localStorage.getItem('userId');
  const isAuthor = userId && userId === comment.authorUserId;

  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="comment-header-info">
        <span class="comment-author">${escapeHtml(comment.nickname || comment.author || '익명')}</span>
        <span class="comment-date">${formatDate(comment.createdAt)}</span>
      </div>
      <div class="comment-content">${escapeHtml(comment.content)}</div>
      ${isAuthor ? `
        <div class="comment-actions">
          <button class="btn-delete" onclick="deleteComment('${comment.id}')">삭제</button>
        </div>
      ` : ''}
    </div>
  `;
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

  // TODO: 댓글 작성 API 호출
  // const { error, result } = await post(
  //   API_ENDPOINTS.COMMENTS.CREATE(postId),
  //   { content },
  //   { auth: true, autoRedirect: true }
  // );

  // 임시: 로컬에서만 댓글 추가
  await window.modal.alert('댓글 기능은 준비 중입니다.', '알림');
  commentInput.value = '';
  document.getElementById('commentLength').textContent = '0';
}

// 댓글 삭제
window.deleteComment = async function(commentId) {
  const confirmed = await window.modal.confirm(
    '정말로 이 댓글을 삭제하시겠습니까?',
    '댓글 삭제'
  );

  if (!confirmed) return;

  // TODO: 댓글 삭제 API 호출
  // const { error } = await del(
  //   API_ENDPOINTS.COMMENTS.DELETE(postId, commentId),
  //   { auth: true, autoRedirect: true }
  // );

  await window.modal.alert('댓글 기능은 준비 중입니다.', '알림');
};

// 댓글 이벤트 등록
function attachCommentEvents() {
  // 필요시 추가
}

// 날짜 포맷팅
function formatDate(timestamp) {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// HTML 이스케이프
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 에러 표시
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('postDetail').style.display = 'none';
  
  const errorState = document.getElementById('errorState');
  errorState.style.display = 'block';
  errorState.querySelector('.error-message').textContent = message;
}