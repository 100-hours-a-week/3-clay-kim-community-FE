// postCreate.js - 게시글 작성 페이지

const API_BASE_URL = 'http://localhost:8080';
let awayTrigger = false;

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  initFormHandlers();
  initCharacterCount();
});

// 로그인 상태 체크
function checkLoginStatus() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    window.modal.alert('로그인이 필요한 서비스입니다.', '알림').then(() => {
      window.location.href = '/pages/login/login.html';
    });
  }
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

  // 유효성 검사
  if (!validateForm(title, content)) {
    return;
  }

  // 버튼 비활성화 및 로딩 상태
  btnSubmit.disabled = true;
  btnSubmit.classList.add('loading');

  try {
    await createPost(title, content);
  } catch (error) {
    console.error('게시글 작성 실패:', error);
    await window.modal.alert('게시글 작성에 실패했습니다.<br>잠시 후 다시 시도해주세요.', '오류');
  } finally {
    // 버튼 활성화 및 로딩 상태 해제
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('loading');
  }
}

// 유효성 검사
function validateForm(title, content) {
  // 제목 검사
  // if (title.length < 2) {
  //   window.modal.alert('제목은 최소 2자 이상 입력해주세요.', '입력 오류');
  //   document.getElementById('postTitle').focus();
  //   return false;
  // }

  if (title.length > 26) {
    window.modal.alert('제목은 최대 26자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postTitle').focus();
    return false;
  }

  // 내용 검사
  // if (content.length < 10) {
  //   window.modal.alert('내용은 최소 10자 이상 입력해주세요.', '입력 오류');
  //   document.getElementById('postContent').focus();
  //   return false;
  // }

  if (content.length > 1000) {
    window.modal.alert('내용은 최대 1000자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postContent').focus();
    return false;
  }

  return true;
}

// 게시글 작성 API 호출
async function createPost(title, content) {
  const accessToken = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE_URL}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access': `${accessToken}`
    },
    body: JSON.stringify({
      title: title,
      content: content
    })
  });

  if (!response.ok) {
    // 401 Unauthorized - 토큰 만료
    if (response.status === 401) {
      await window.modal.alert('로그인이 만료되었습니다.<br>다시 로그인해주세요.', '인증 오류');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('nickname');
      // localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
      window.location.href = '/pages/login/login.html';
      return;
    }

    // 400 Bad Request
    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.message || '잘못된 요청입니다.');
    }

    throw new Error('게시글 작성에 실패했습니다.');
  }

  const result = await response.json();
  awayTrigger = true;
  
  // 성공 메시지 표시 후 목록으로 이동
  await window.modal.alert('게시글이 작성되었습니다!', '완료');

  // 작성된 게시글로 이동하거나 목록으로 이동
  if (result.data) {
    window.location.href = `/pages/postDetails/postDetails.html?id=${result.data}`
  } else {
    window.location.href = '/pages/post/post.html';
  }
}

// 취소 버튼 처리
async function handleCancel() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  // 작성 중인 내용이 있으면 확인
  if (title || content) {
    const confirmed = await window.modal.confirm(
      '작성 중인 내용이 있습니다.<br>정말 취소하시겠습니까?',
      '작성 취소'
    );
    
    if (confirmed) {
      awayTrigger = true;
    } else {
      return;
    }
  }

  // 이전 페이지로 이동 (없으면 목록으로)
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = '/pages/post/post.html';
  }
}

// 페이지 이탈 시 경고 (작성 중인 내용이 있을 때)
window.addEventListener('beforeunload', (e) => {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (awayTrigger) {
    return;
  }

  if (title || content) {
    e.preventDefault();
    e.returnValue = ''; // Chrome에서 필요
  }
});