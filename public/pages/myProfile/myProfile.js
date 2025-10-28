// myProfile.js - 프로필 수정 페이지 (fetchApi 사용)

import { get, fetchApi } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

let originalNickname = ''; // 원래 닉네임 저장
let isNicknameValid = false; // 닉네임 유효성 여부
let selectedImageFile = null; // 선택된 새 이미지 파일
let originalProfileImage = ''; // 원래 프로필 이미지 URL

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  initTabs();
  loadUserInfo();
  initProfileForm();
  initPasswordForm();
  initDeleteAccount();
});

// 로그인 상태 체크
function checkLoginStatus() {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    alert('로그인이 필요한 서비스입니다.');
    window.location.href = '/pages/login/login.html';
  }
}

// 탭 전환 기능
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // 모든 탭 버튼과 컨텐츠에서 active 제거
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      // 클릭한 탭 활성화
      btn.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });
}

// 사용자 정보 불러오기
async function loadUserInfo() {
  const email = localStorage.getItem('userEmail');
  const nickname = localStorage.getItem('userNickname');
  const userId = localStorage.getItem('userId');

  // 화면에 표시
  document.getElementById('email').value = email || '';
  document.getElementById('nickname').value = nickname || '';
  originalNickname = nickname || '';

  // 프로필 이미지 불러오기
  try {
    const { error, result } = await get(API_ENDPOINTS.USERS.GET_USER(userId));

    if (!error && result?.data?.profileImage) {
      originalProfileImage = result.data.profileImage;
      document.getElementById('currentProfileImage').src = result.data.profileImage;
    } else {
      // 기본 이미지 설정
      document.getElementById('currentProfileImage').src = '/images/default-profile.png';
    }
  } catch (err) {
    console.error('프로필 이미지 로드 에러:', err);
    document.getElementById('currentProfileImage').src = '/images/default-profile.png';
  }
}

// ===== 기본 정보 수정 폼 =====
function initProfileForm() {
  const form = document.getElementById('profileForm');
  const nicknameInput = document.getElementById('nickname');
  const btnCancel = document.getElementById('btnCancel');
  const profileImageInput = document.getElementById('profileImageInput');

  // 닉네임 실시간 검증 (debounce)
  nicknameInput.addEventListener('input', (e) => {
    checkNicknameDebounced(e.target.value.trim());
  });

  // 이미지 변경 처리
  profileImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        window.modal.alert('이미지 파일은 5MB 이하만 업로드 가능합니다.', '알림');
        e.target.value = '';
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.startsWith('image/')) {
        window.modal.alert('이미지 파일만 업로드 가능합니다.', '알림');
        e.target.value = '';
        return;
      }

      selectedImageFile = file;

      // 미리보기 표시
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('currentProfileImage').src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // 취소 버튼
  btnCancel.addEventListener('click', async () => {
    if (await window.modal.confirm('수정을 취소하시겠습니까?')) {
      loadUserInfo(); // 원래 정보로 복원
      selectedImageFile = null;
      isNicknameValid = false;
      document.getElementById('nicknameError').textContent = '';
      window.location.href = '/pages/post/post.html';
    }
  });

  // 폼 제출
  form.addEventListener('submit', handleProfileSubmit);
}

// 디바운스 유틸
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// 닉네임 검증 (debounce 적용)
const checkNicknameDebounced = debounce(async (nickname) => {
  const nicknameError = document.getElementById('nicknameError');
  
  // 빈 값
  if (!nickname) {
    nicknameError.textContent = '';
    isNicknameValid = false;
    return;
  }

  // 원래 닉네임과 같으면
  if (nickname === originalNickname) {
    showMessage(nicknameError, '현재 사용 중인 닉네임입니다.', 'error');
    isNicknameValid = true;
    return;
  }

  // 길이 및 공백 검증
  if (nickname.length < 2 || nickname.length > 10) {
    showMessage(nicknameError, '닉네임은 2~10자 사이여야 합니다.', 'error');
    isNicknameValid = false;
    return;
  }

  if (/\s/.test(nickname)) {
    showMessage(nicknameError, '닉네임에 공백을 포함할 수 없습니다.', 'error');
    isNicknameValid = false;
    return;
  }

  // 로딩 표시
  showLoadingMessage(nicknameError);

  try {
    // fetchApi 사용
    const { error, result } = await get(API_ENDPOINTS.USERS.CHECK_NICKNAME(nickname));

    if (error) {
      showMessage(nicknameError, '중복확인에 실패했습니다.', 'error');
      isNicknameValid = false;
      return;
    }

    const isDuplicate = result.data;

    if (isDuplicate) {
      showMessage(nicknameError, '이미 사용 중인 닉네임입니다.', 'error');
      isNicknameValid = false;
    } else {
      showMessage(nicknameError, '사용 가능한 닉네임입니다.', 'success');
      isNicknameValid = true;
    }
  } catch (err) {
    console.error('닉네임 중복확인 에러:', err);
    showMessage(nicknameError, '서버 오류가 발생했습니다.', 'error');
    isNicknameValid = false;
  }
}, 600);

// 프로필 수정 제출
async function handleProfileSubmit(e) {
  e.preventDefault();

  const nickname = document.getElementById('nickname').value.trim();
  const btnSubmit = document.getElementById('btnSubmit');

  // 닉네임이나 이미지가 변경되었는지 확인
  const nicknameChanged = nickname !== originalNickname;
  const imageChanged = selectedImageFile !== null;

  if (!nicknameChanged && !imageChanged) {
    await window.modal.alert('변경된 정보가 없습니다.', '알림');
    return;
  }

  // 닉네임이 변경된 경우 유효성 확인
  if (nicknameChanged && !isNicknameValid) {
    await window.modal.alert('사용 가능한 닉네임인지 확인해주세요.', '알림');
    return;
  }

  // 버튼 비활성화 및 로딩 상태
  btnSubmit.disabled = true;
  btnSubmit.classList.add('loading');

  try {
    // FormData 사용 (이미지 포함 가능)
    const formData = new FormData();

    if (nicknameChanged) {
      formData.append('nickname', nickname);
    }

    if (imageChanged) {
      formData.append('profileImage', selectedImageFile);
    }

    // fetchApi를 사용하여 FormData 전송
    const response = await fetch(`http://localhost:8080/users/${localStorage.getItem('userId')}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '프로필 수정에 실패했습니다.');
    }

    const result = await response.json();

    // 로컬스토리지 업데이트
    if (nicknameChanged) {
      localStorage.setItem('userNickname', nickname);
      originalNickname = nickname;
    }

    if (imageChanged && result.data?.profileImage) {
      originalProfileImage = result.data.profileImage;
    }

    isNicknameValid = false;
    selectedImageFile = null;

    await window.modal.alert('프로필이 성공적으로 변경되었습니다!', '완료');

    // 헤더 업데이트를 위해 페이지 새로고침
    window.location.reload();

  } catch (error) {
    console.error('프로필 수정 에러:', error);
    await window.modal.alert(error.message || '프로필 수정에 실패했습니다.', '오류');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('loading');
  }
}

// ===== 비밀번호 변경 폼 =====
function initPasswordForm() {
  const form = document.getElementById('passwordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const btnCancel = document.getElementById('btnPasswordCancel');

  // 새 비밀번호 실시간 검증
  newPasswordInput.addEventListener('input', validateNewPassword);

  // 비밀번호 확인 실시간 검증
  confirmPasswordInput.addEventListener('input', validateConfirmPassword);

  // 취소 버튼
  btnCancel.addEventListener('click', async () => {
    if (await window.modal.confirm('비밀번호 변경을 취소하시겠습니까?')) {
      form.reset();
      document.getElementById('passwordError').textContent = '';
      document.getElementById('confirmPasswordError').textContent = '';
      window.location.href='/pages/post/post.html';
    }
  });

  // 폼 제출
  form.addEventListener('submit', handlePasswordSubmit);
}

// 새 비밀번호 유효성 검사
function validateNewPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const passwordError = document.getElementById('passwordError');

  if (!newPassword) {
    passwordError.textContent = '';
    return false;
  }

  if (newPassword.length < 8 || newPassword.length > 20) {
    showMessage(passwordError, '비밀번호는 8~20자 사이여야 합니다.', 'error');
    return false;
  }

  showMessage(passwordError, '사용 가능한 비밀번호입니다.', 'success');
  validateConfirmPassword(); // 확인 비밀번호도 다시 검증
  return true;
}

// 비밀번호 확인 검증
function validateConfirmPassword() {
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const confirmPasswordError = document.getElementById('confirmPasswordError');

  if (!confirmPassword) {
    confirmPasswordError.textContent = '';
    return false;
  }

  if (newPassword !== confirmPassword) {
    showMessage(confirmPasswordError, '비밀번호가 일치하지 않습니다.', 'error');
    return false;
  }

  showMessage(confirmPasswordError, '비밀번호가 일치합니다.', 'success');
  return true;
}

// 비밀번호 변경 제출
async function handlePasswordSubmit(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value.trim();
  const newPassword = document.getElementById('newPassword').value.trim();
  const confirmPassword = document.getElementById('confirmPassword').value.trim();
  const btnSubmit = document.getElementById('btnPasswordSubmit');

  // 유효성 검사
  if (!currentPassword) {
    await window.modal.alert('현재 비밀번호를 입력해주세요.', '입력 오류');
    return;
  }

  if (!validateNewPassword() || !validateConfirmPassword()) {
    await window.modal.alert('비밀번호를 올바르게 입력해주세요.', '입력 오류');
    return;
  }

  // 현재 비밀번호와 새 비밀번호가 같은지 확인
  if (currentPassword === newPassword) {
    await window.modal.alert('새 비밀번호는 현재 비밀번호와 달라야 합니다.', '입력 오류');
    return;
  }

  // 버튼 비활성화 및 로딩 상태
  btnSubmit.disabled = true;
  btnSubmit.classList.add('loading');

  try {
    const { error, result } = await fetchApi(API_ENDPOINTS.USERS.UPDATE_PASSWORD, {
      method: 'PATCH',
      body: { currentPassword, newPassword },
      auth: true
    });

    console.log("result", result);

    if (error) {
        console.log("error", error);
      if (error.status === 400) {
        await window.modal.alert('현재 비밀번호가 일치하지 않습니다.', '오류');
      } else {
        await window.modal.alert(error.message || '비밀번호 변경에 실패했습니다.', '오류');
      }
      return;
    }

    await window.modal.alert('비밀번호가 성공적으로 변경되었습니다!<br>다시 로그인해주세요.', '완료');
    
    // 로그아웃 처리
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userNickname');
    window.location.href = '/pages/login/login.html';

  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    await window.modal.alert('비밀번호 변경에 실패했습니다.', '오류');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.classList.remove('loading');
  }
}

// ===== 계정 탈퇴 =====
function initDeleteAccount() {
  const btnDeleteAccount = document.getElementById('btnDeleteAccount');
  btnDeleteAccount.addEventListener('click', handleDeleteAccount);
}

// 계정 탈퇴 처리
async function handleDeleteAccount() {
  // 1단계: 첫 번째 확인
  const confirmed = await window.modal.confirm(
    '정말로 계정을 탈퇴하시겠습니까?<br><br>' +
    '<strong style="color: #e74c3c;">모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.</strong>',
    '계정 탈퇴'
  );

  if (!confirmed) return;

  // 2단계: 비밀번호 입력 모달
  const password = await showPasswordConfirmModal();
  
  if (!password) return;

  try {
    const { error, result } = await fetchApi(API_ENDPOINTS.USERS.DELETE_ACCOUNT, {
      method: 'DELETE',
      body: { password },
      auth: true
    });

    if (error) {
      if (error.status === 400) {
        await window.modal.alert('비밀번호가 일치하지 않습니다.', '오류');
      } else {
        await window.modal.alert(error.message || '계정 탈퇴에 실패했습니다.', '오류');
      }
      return;
    }

    // 탈퇴 완료
    await window.modal.alert('계정이 성공적으로 탈퇴되었습니다.<br>그동안 이용해주셔서 감사합니다.', '탈퇴 완료');
    
    // 모든 로컬스토리지 데이터 삭제
    localStorage.clear();
    
    // 홈페이지로 이동
    window.location.href = '/';

  } catch (error) {
    console.error('계정 탈퇴 에러:', error);
    await window.modal.alert('계정 탈퇴에 실패했습니다.', '오류');
  }
}

// 비밀번호 확인 모달 (커스텀)
function showPasswordConfirmModal() {
  return new Promise((resolve) => {
    const modalHTML = `
      <div class="delete-modal-content">
        <div class="delete-modal-warning">
          <div class="delete-modal-warning-title">
            <span>⚠️</span>
            탈퇴 시 삭제되는 정보
          </div>
          <ul class="delete-modal-list">
            <li>작성한 모든 게시글</li>
            <li>작성한 모든 댓글</li>
            <li>좋아요 및 활동 기록</li>
            <li>회원 정보 (이메일, 닉네임)</li>
          </ul>
        </div>
        <div class="delete-modal-input-group">
          <label class="delete-modal-label" for="deletePassword">
            본인 확인을 위해 비밀번호를 입력해주세요
          </label>
          <input 
            type="password" 
            id="deletePassword" 
            class="delete-modal-input" 
            placeholder="비밀번호를 입력하세요"
            autocomplete="current-password"
          />
        </div>
      </div>
    `;

    // 모달 생성
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const modalBox = document.createElement('div');
    modalBox.style.cssText = `
      background: white;
      border-radius: 12px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    `;

    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
    `;
    modalHeader.innerHTML = '<h3 style="margin: 0; font-size: 18px; font-weight: 600;">계정 탈퇴 확인</h3>';

    const modalBody = document.createElement('div');
    modalBody.style.cssText = `padding: 24px;`;
    modalBody.innerHTML = modalHTML;

    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const btnCancel = document.createElement('button');
    btnCancel.textContent = '취소';
    btnCancel.style.cssText = `
      padding: 10px 20px;
      border: 2px solid #e0e0e0;
      background-color: #f8f9fa;
      color: #666;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    `;

    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = '탈퇴하기';
    btnConfirm.style.cssText = `
      padding: 10px 20px;
      border: none;
      background-color: #e74c3c;
      color: white;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    `;

    modalFooter.appendChild(btnCancel);
    modalFooter.appendChild(btnConfirm);

    modalBox.appendChild(modalHeader);
    modalBox.appendChild(modalBody);
    modalBox.appendChild(modalFooter);
    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    const passwordInput = document.getElementById('deletePassword');
    passwordInput.focus();

    // 취소 버튼
    btnCancel.addEventListener('click', () => {
      document.body.removeChild(modalOverlay);
      resolve(null);
    });

    // 확인 버튼
    btnConfirm.addEventListener('click', () => {
      const password = passwordInput.value.trim();
      if (!password) {
        alert('비밀번호를 입력해주세요.');
        return;
      }
      document.body.removeChild(modalOverlay);
      resolve(password);
    });

    // Enter 키 처리
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        btnConfirm.click();
      }
    });

    // ESC 키로 닫기
    modalOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        btnCancel.click();
      }
    });
  });
}

// ===== 유틸리티 함수 =====

// 메시지 표시
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `form-message ${type}`;
}

// 로딩 메시지 표시
function showLoadingMessage(element) {
  element.innerHTML = '<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
  element.className = 'form-message loading';
}