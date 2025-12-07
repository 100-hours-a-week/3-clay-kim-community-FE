// postEdit.js - 종주 기록 수정 페이지
import { get, patch } from '/utils/fetchApi.js';
import { API_ENDPOINTS, BASE_URL } from '/utils/apiList.js';

let awayTrigger = false;
let postId = null;
let originalTitle = '';
let originalContent = '';
let originalType = '';
const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
let selectedImages = [];
let existingImages = [];
let removedImageIds = [];

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
  initTypeSelector();
  initImageUploader();
  loadPostData();
});

// 로그인 상태 체크
async function checkLoginStatus() {
  // refreshToken 유효성 검증 (토큰이 없거나 만료된 경우 401 에러 발생)
  const { error } = await get(API_ENDPOINTS.AUTH.REFRESH, {}, { auth: true });

  if (error) {
    // localStorage 정리
    localStorage.clear();

    // 로그인 페이지로 리다이렉트
    window.modal.alert('로그인 시간이 만료되었습니다. 다시 로그인해주세요.', '알림').then(() => {
      window.location.href = '/pages/login/login.html';
    });
  }
}

// 기존 종주 기록 데이터 불러오기
async function loadPostData() {
  const { error, result } = await get(API_ENDPOINTS.POSTS.DETAIL(postId), { auth: true });
  
  if (error) {
    console.error('종주 기록 로딩 실패:', error);
    await window.modal.alert('종주 기록을 불러오는데 실패했습니다.', '오류');
    window.location.href = '/pages/post/post.html';
    return;
  }
  
  const post = result.data;
  if (Array.isArray(post.images)) {
    existingImages = post.images
      .filter((img) => img && (img.imageUrl || img.url) && img.imageId != null);
  } else if (Array.isArray(post.imageUrls)) {
    // 백엔드 호환용 (imageId 없이 문자열만 있는 경우)
    existingImages = post.imageUrls.map((url, idx) => ({ imageId: idx, imageUrl: url }));
  } else {
    existingImages = [];
  }
  removedImageIds = [];
  
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

  // 타입 설정 (API는 postType으로 응답)
  const postType = post.postType || 'IN_PROGRESS';
  // HTML value는 소문자_언더스코어 형식 (in_progress, completed)
  const formTypeValue = postType === 'COMPLETED' ? 'completed' : 'in_progress';
  document.getElementById('postType').value = formTypeValue;

  // 타입 버튼 텍스트 업데이트
  const typeText = postType === 'COMPLETED' ? '국토종주 완료' : '국토종주 준비 & 진행';
  document.getElementById('typeSelectorText').textContent = typeText;

  // 드롭다운 active 상태 업데이트
  document.querySelectorAll('.type-dropdown-item').forEach(item => {
    if (item.dataset.value === formTypeValue) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 원본 데이터 저장 (변경 감지용)
  originalTitle = post.title;
  originalContent = post.content;
  originalType = formTypeValue;

  // 기존 이미지 렌더링
  renderImagePreviews();

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

// 타입 선택기 초기화
function initTypeSelector() {
  const dropdownItems = document.querySelectorAll('.type-dropdown-item');
  const typeSelectorText = document.getElementById('typeSelectorText');
  const postTypeInput = document.getElementById('postType');

  // 드롭다운 아이템 클릭 이벤트
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const value = item.dataset.value;
      const text = item.textContent.trim();

      // hidden input 값 업데이트
      postTypeInput.value = value;

      // 버튼 텍스트 업데이트
      typeSelectorText.textContent = text;

      // active 클래스 업데이트
      dropdownItems.forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // 드롭다운 닫기 (호버 상태 제거)
      const wrapper = document.querySelector('.type-selector-wrapper');
      wrapper.style.pointerEvents = 'none';
      setTimeout(() => {
        wrapper.style.pointerEvents = 'auto';
      }, 100);
    });
  });
}

// 이미지 업로더 초기화
function initImageUploader() {
  const imageInput = document.getElementById('postImages');

  if (!imageInput) return;

  imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    handleImageSelection(files);
    imageInput.value = '';
  });
}

// 이미지 유효성 체크 및 상태 업데이트
function handleImageSelection(files) {
  const validFiles = [];

  files.forEach((file) => {
    if (!file.type.startsWith('image/')) {
      window.modal.alert('이미지 파일만 업로드 가능합니다.', '알림');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      window.modal.alert('이미지 파일은 5MB 이하만 업로드 가능합니다.', '알림');
      return;
    }

    validFiles.push(file);
  });

  const availableSlots = MAX_IMAGES - existingImages.length - selectedImages.length;

  if (availableSlots <= 0) {
    window.modal.alert(`이미지는 최대 ${MAX_IMAGES}장까지 등록할 수 있습니다.`, '알림');
    return;
  }

  if (validFiles.length > availableSlots) {
    window.modal.alert(`기존 이미지를 포함해 최대 ${MAX_IMAGES}장까지 가능합니다.`, '알림');
    validFiles.splice(availableSlots);
  }

  selectedImages = [...selectedImages, ...validFiles];
  renderImagePreviews();
}

// 이미지 미리보기 렌더링 (기존 + 신규)
function renderImagePreviews() {
  const previewContainer = document.getElementById('imagePreviewList');
  if (!previewContainer) return;

  previewContainer.innerHTML = '';

  // 기존 이미지
  existingImages.forEach((img) => {
    const rawUrl = img.imageUrl || img.url || '';
    const safeUrl = (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
      ? rawUrl
      : `${BASE_URL}/${rawUrl}`;

    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML = `
      <div class="image-preview-badge">기존</div>
      <img src="${safeUrl}" alt="기존 이미지" class="image-preview-thumb" onerror="this.style.display='none';">
      <div class="image-preview-name" title="${safeUrl}">${rawUrl}</div>
      <button type="button" class="image-remove-button image-remove-existing" data-id="${img.imageId}">×</button>
    `;
    previewContainer.appendChild(item);

    const removeButton = item.querySelector('.image-remove-existing');
    removeButton.addEventListener('click', () => removeExistingImage(img.imageId));
  });

  // 새로 선택한 이미지
  selectedImages.forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const item = document.createElement('div');
      item.className = 'image-preview-item';
      item.innerHTML = `
        <button type="button" class="image-remove-button" data-index="${index}">×</button>
        <img src="${event.target.result}" alt="${file.name}" class="image-preview-thumb" />
        <div class="image-preview-name" title="${file.name}">${file.name}</div>
      `;

      previewContainer.appendChild(item);

      const removeButton = item.querySelector('.image-remove-button');
      removeButton.addEventListener('click', () => removeImage(index));
    };

    reader.readAsDataURL(file);
  });
}

// 선택한 신규 이미지 제거
function removeImage(index) {
  selectedImages = selectedImages.filter((_, i) => i !== index);
  renderImagePreviews();
}

// 기존 이미지 제거 (삭제 목록에 추가)
function removeExistingImage(imageId) {
  if (imageId == null) return;
  if (!removedImageIds.includes(imageId)) {
    removedImageIds.push(imageId);
  }
  existingImages = existingImages.filter((img) => img.imageId !== imageId);
  renderImagePreviews();
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
  const type = document.getElementById('postType').value;
  const content = document.getElementById('postContent').value.trim();
  const btnSubmit = document.getElementById('btnSubmit');

  const hasChanges = (
    title !== originalTitle ||
    content !== originalContent ||
    type !== originalType ||
    selectedImages.length > 0 ||
    removedImageIds.length > 0
  );

  if (!hasChanges) {
    await window.modal.alert('변경된 내용이 없습니다.', '알림');
    return;
  }

  // 유효성 검사
  if (!validateForm(title, type, content)) {
    return;
  }

  // 버튼 비활성화 및 로딩 상태
  btnSubmit.disabled = true;
  btnSubmit.classList.add('loading');

  try {
    await updatePost(title, type, content);
  } catch (error) {
    console.error('종주 기록 수정 실패:', error);
    await window.modal.alert('종주 기록 수정에 실패했습니다.<br>잠시 후 다시 시도해주세요.', '오류');
  } finally {
    // 버튼 활성화 및 로딩 상태 해제
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('loading');
  }
}

// 유효성 검사
function validateForm(title, type, content) {
  if (title.length > 40) {
    window.modal.alert('제목은 최대 40자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postTitle').focus();
    return false;
  }

  if (!type) {
    window.modal.alert('타입을 선택해주세요.', '입력 오류');
    return false;
  }

  if (content.length > 1000) {
    window.modal.alert('내용은 최대 1000자까지 입력 가능합니다.', '입력 오류');
    document.getElementById('postContent').focus();
    return false;
  }

  return true;
}

// 종주 기록 수정 API 호출
async function updatePost(title, type, content) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('type', type);
  formData.append('content', content);

  // 삭제할 기존 이미지 id 전송
  if (removedImageIds.length > 0) {
    formData.append('removeImageIds', JSON.stringify(removedImageIds));
  }

  selectedImages.forEach((file) => {
    formData.append('postImages', file);
  });

  const { error } = await patch(
    API_ENDPOINTS.POSTS.UPDATE(postId),
    formData,
    { auth: true }
  );

  if (error) {
    // 에러는 fetchApi.js에서 이미 처리되므로 (401은 자동 리다이렉트)
    // 여기서는 일반적인 에러만 처리
    throw new Error(error.message || '종주 기록 수정에 실패했습니다.');
  }

  awayTrigger = true;

  // 성공 메시지 표시 후 상세 페이지로 이동
  await window.modal.alert('종주 기록이 수정되었습니다!', '완료');
  window.location.href = `/pages/postDetail/postDetail.html?id=${postId}`;
}

// 취소 버튼 처리
async function handleCancel() {
  const title = document.getElementById('postTitle').value.trim();
  const type = document.getElementById('postType').value;
  const content = document.getElementById('postContent').value.trim();

  // 변경 사항이 있으면 확인
  if (title !== originalTitle || content !== originalContent || type !== originalType || selectedImages.length > 0 || removedImageIds.length > 0) {
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
  const type = document.getElementById('postType').value;
  const content = document.getElementById('postContent').value.trim();

  if (awayTrigger) {
    return;
  }

  // 변경 사항이 있을 때만 경고
  if (title !== originalTitle || content !== originalContent || type !== originalType || selectedImages.length > 0 || removedImageIds.length > 0) {
    e.preventDefault();
    e.returnValue = '';
  }
});
