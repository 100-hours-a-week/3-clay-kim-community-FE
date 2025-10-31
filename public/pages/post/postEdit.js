// postEdit.js - 게시글 수정 페이지
import { get, patch } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

let awayTrigger = false;
let postId = null;
let originalTitle = '';
let originalContent = '';

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  // URL에서 postId 가져오기
  const urlParams = new URLSearchParams(window.location.search);
  postId = urlParams.get('id');
  
  if (!postId) {
    window.modal.alert('잘못된 접근입니다.', '오류').then(() => {
      window.location.href = '/pages/post/post.html';
    });
    return;
  }
  
  checkLoginStatus();
  initFormHandlers();
  initCharacterCount();
  loadPostData();
});

// 로그인 상태 체크
function checkLoginStatus() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    window.modal.alert('로그인이 필요한 서비스입니다.', '알림').then(() => {
      window.location.href = '/pages/login/login.html';
    });
  }
}

// 기존 게시글 데이터 불러오기
async function loadPostData() {
  const { error, result } = await get(API_ENDPOINTS.POSTS.DETAIL(postId), { auth: true });
  
  if (error) {
    console.error('게시글 로딩 실패:', error);
    await window.modal.alert('게시글을 불러오는데 실패했습니다.', '오류');
    window.location.href = '/pages/post/post.html';
    return;
  }
  
  const post = result.data;
  
  // 작성자 확인 (본인이 작성한 글만 수정 가능)
  const userId = localStorage.getItem('userId');
  if (post.userId !== userId) {
    await window.modal.alert('본인이 작성한 글만 수정할 수 있습니다.', '권한 없음');
    window.location.href = `/pages/postDetails/postDetails.html?id=${postId}`;
    return;
  }
  
  // 폼에 데이터 채우기
  document.getElementById('postTitle').value = post.title;
  document.getElementById('postContent').value = post.content;
  
  // 원본 데이터 저장 (변경 감지용)
  originalTitle = post.title;
  originalContent = post.content;
  
  // 글자 수 초기화
  document.getElementById('titleCount').textContent = post.title.length;
  document.getElementById('contentCount').textContent = post.content.length;
}

// 폼 핸들러 초기화
function initFormHandlers() {
  const form = document.getElementById('postCreateForm');
  const btnCancel = document.getElementById('btnCancel');

  // 폼 제출 이벤트
  form.addEventListener('submit', handleSubmit);

  // 취소 버튼 이벤트
  btnCancel.addEventListener('click', handleCancel);
}

// 글자 수 카운터 초기화
function initCharacterCount() {
  const titleInput = document.getElementById('postTitle');
  const contentInput = document.getElementById('postContent');
  const titleCount = document.getElementById('titleCount');
  const contentCount = document.getElementById('contentCount');

  // 제목 글자 수
  titleInput.addEventListener('input', () => {
    const length = titleInput.value.length;
    titleCount.textContent = length;
    
    // 길이에 따라 색상 변경
    if (length > 20) {
      titleCount.style.color = '#e74c3c';
    } else if (length > 15) {
      titleCount.style.color = '#f39c12';
    } else {
      titleCount.style.color = '#007bff';
    }
  });

  // 내용 글자 수
  contentInput.addEventListener('input', () => {
    const length = contentInput.value.length;
    contentCount.textContent = length;
    
    // 길이에 따라 색상 변경
    if (length > 800) {
      contentCount.style.color = '#e74c3c';
    } else if (length > 900) {
      contentCount.style.color = '#f39c12';
    } else {
      contentCount.style.color = '#007bff';
    }
  });
}

// 폼 제출 처리
async function handleSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const btnSubmit = document.getElementById('btnSubmit');

  // 변경 사항이 없는지 확인
  if (title === originalTitle && content === originalContent) {
    await window.modal.alert('변경된 내용이 없습니다.', '알림');
    return;
  }

  // 유효성 검사
  if (!validateForm(title, content)) {
    return;
  }

  // 버튼 비활성화 및 로딩 상태
  btnSubmit.disabled = true;
  btnSubmit.classList.add('loading');

  try {
    await updatePost(title, content);
  } catch (error) {
    console.error('게시글 수정 실패:', error);
    await window.modal.alert('게시글 수정에 실패했습니다.<br>잠시 후 다시 시도해주세요.', '오류');
  } finally {
    // 버튼 활성화 및 로딩 상태 해제
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('loading');
  }
}

// 유효성 검사
function validateForm(title, content) {
  if (title.length > 26) {
    window.modal.alert('제목은 최대 26자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postTitle').focus();
    return false;
  }

  if (content.length > 1000) {
    window.modal.alert('내용은 최대 1000자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postContent').focus();
    return false;
  }

  return true;
}

// 게시글 수정 API 호출
async function updatePost(title, content) {
  const { error, result } = await patch(
    API_ENDPOINTS.POSTS.UPDATE(postId),
    {
      title: title,
      content: content
    },
    { auth: true }
  );

  if (error) {
    // 에러는 fetchApi.js에서 이미 처리되므로 (401은 자동 리다이렉트)
    // 여기서는 일반적인 에러만 처리
    throw new Error(error.message || '게시글 수정에 실패했습니다.');
  }

  awayTrigger = true;
  
  // 성공 메시지 표시 후 상세 페이지로 이동
  await window.modal.alert('게시글이 수정되었습니다!', '완료');
  window.location.href = `/pages/postDetail/postDetail.html?id=${postId}`;
}

// 취소 버튼 처리
async function handleCancel() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  // 변경 사항이 있으면 확인
  if (title !== originalTitle || content !== originalContent) {
    const confirmed = await window.modal.confirm(
      '수정 중인 내용이 있습니다.<br>정말 취소하시겠습니까?',
      '수정 취소'
    );
    
    if (confirmed) {
      awayTrigger = true;
    } else {
      return;
    }
  }

  // 상세 페이지로 돌아가기
  window.location.href = `/pages/postDetail/postDetail.html?id=${postId}`;
}

// 페이지 이탈 시 경고 (수정 중인 내용이 있을 때)
window.addEventListener('beforeunload', (e) => {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (awayTrigger) {
    return;
  }

  // 변경 사항이 있을 때만 경고
  if (title !== originalTitle || content !== originalContent) {
    e.preventDefault();
    e.returnValue = '';
  }
});