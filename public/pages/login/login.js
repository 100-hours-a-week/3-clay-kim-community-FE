import { post } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  // 에러 메시지 표시 함수
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block"; // CSS 클래스 대신 직접 스타일 적용
  }

  // 에러 메시지 숨김 함수
  function hideError() {
    errorMessage.textContent = "";
    errorMessage.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 기존 에러 메시지 초기화
    hideError();

    if (!email || !password) {
      showError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const { error, result } = await post(
        API_ENDPOINTS.AUTH.LOGIN,
        { email, password },
        { auth: false }
      );

      console.log('[login.js]: ', error);

      if (error) {
        showError("아이디 또는 비밀번호가 잘못 되었습니다. 아이디와 비밀번호를 정확히 입력해 주세요.");
        return;
      } 

      // localStorage에 토큰과 이메일 저장
      if (result) {
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userNickname", result.data.nickname);
        localStorage.setItem("userId", result.data.userId);
        
        window.location.href = "/pages/post/post.html";
      }

    } catch (err) {
      console.error("로그인 에러:", err);
      showError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  });

  // 입력 필드에 focus 시 에러 메시지 숨김
  document.getElementById("email").addEventListener("focus", hideError);
  document.getElementById("password").addEventListener("focus", hideError);
});