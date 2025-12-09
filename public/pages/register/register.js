import { post, get } from '/utils/fetchApi.js';
import { API_ENDPOINTS } from '/utils/apiList.js';

document.addEventListener("DOMContentLoaded", () => {
  const contentArea = document.getElementById("content-area");

  document.querySelector(".id-signup").addEventListener("click", () => {
    renderIdRegisterForm();
  });

  function renderIdRegisterForm() {
    contentArea.innerHTML = `
      <h2>아이디로 회원가입</h2>
      <form id="registerForm" class="register-form">
        <div class="form-group">
          <label for="email">이메일</label>
          <input type="email" id="email" name="email" placeholder="example@email.com" required>
          <div id="emailError" class="error"></div>
        </div>

        <div class="form-group">
          <label for="nickname">닉네임</label>
          <input type="text" id="nickname" name="nickname" placeholder="닉네임을 입력하세요" required>
          <div id="nicknameError" class="error"></div>
        </div>

        <div class="form-group">
          <label for="password">비밀번호</label>
          <input type="password" id="password" name="password" placeholder="비밀번호를 입력하세요" required>
          <div id="pwError" class="error"></div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">비밀번호 확인</label>
          <input type="password" id="confirmPassword" name="confirmPassword" placeholder="비밀번호를 다시 입력하세요" required>
          <div id="pwDuplicateError" class="error"></div>
        </div>

        <div class="form-group">
          <label for="profileImage">프로필 이미지</label>
          <input type="file" id="profileImage" name="profileImage" accept="image/*">
          <div id="imagePreview" class="image-preview"></div>
          <small class="image-info">* 이미지를 넣지 않으면 기본 이미지로 등록됩니다.</small>
        </div>

        <button type="submit" class="btn submit">회원가입</button>
      </form>

      <div id="formMessage" class="form-message"></div>

      <p class="back-text">
        <a href="#" id="backBtn" class="back-link">← 간편가입으로 돌아가기</a>
      </p>
    `;

    // ✅ 돌아가기 버튼
    document.getElementById("backBtn").addEventListener("click", (e) => {
      e.preventDefault();
      location.reload();
    });

    const emailInput = document.getElementById("email");
    const nicknameInput = document.getElementById("nickname");
    const pw = document.getElementById("password");
    const pwConfirm = document.getElementById("confirmPassword");
    const profileImageInput = document.getElementById("profileImage");
    const imagePreview = document.getElementById("imagePreview");

    const emailError = document.getElementById("emailError");
    const nicknameError = document.getElementById("nicknameError");
    const pwError = document.getElementById("pwError");
    const pwDuplicateError = document.getElementById("pwDuplicateError");
    const formMessage = document.getElementById("formMessage");
    const role = 'role';

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/; // 이메일 정규식

    let selectedImageFile = null;

    // ✅ 디바운스 유틸
    function debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    }

    // ✅ 로딩 점 애니메이션
    function showLoading(target) {
      target.innerHTML = `<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>`;
      target.style.color = "#666";
    }

    // ✅ 이메일 검증 + 중복확인
    const checkEmail = debounce(async (email) => {
      if (!email) {
        emailError.textContent = "";
        return;
      }

      if (!emailRegex.test(email)) {
        emailError.textContent = "올바른 이메일 형식이 아닙니다.";
        emailError.style.color = "#e60012";
        return;
      }

      showLoading(emailError);

      try {
        const { error, result } = await get(API_ENDPOINTS.USERS.CHECK_EMAIL(email));

        if (error) {
          emailError.textContent = "서버 오류가 발생했습니다.";
          emailError.style.color = "#e60012";
          return;
        }

        const isDuplicate = result.data;

        if (isDuplicate) {
          emailError.textContent = "이미 사용 중인 이메일입니다.";
          emailError.style.color = "#e60012";
        } else {
          emailError.textContent = "사용 가능한 이메일입니다.";
          emailError.style.color = "#03c75a";
        }
      } catch (err) {
        emailError.textContent = "서버 오류가 발생했습니다.";
        emailError.style.color = "#e60012";
      }
    }, 600);

    // ✅ 닉네임 검증 + 중복확인
    const checkNickname = debounce(async (nickname) => {
      if (!nickname) {
        nicknameError.textContent = "";
        return;
      }

      if (nickname.length < 2 || nickname.length > 10 || /\s/.test(nickname)) {
        nicknameError.textContent = "닉네임은 2~10자, 띄어쓰기 없이 입력해주세요.";
        nicknameError.style.color = "#e60012";
        return;
      }

      showLoading(nicknameError);

      try {
        const { error, result } = await get(API_ENDPOINTS.USERS.CHECK_NICKNAME(nickname));

        if (error) {
          nicknameError.textContent = "서버 오류가 발생했습니다.";
          nicknameError.style.color = "#e60012";
          return;
        }

        const isDuplicate = result.data;

        if (isDuplicate) {
          nicknameError.textContent = "이미 사용 중인 닉네임입니다.";
          nicknameError.style.color = "#e60012";
        } else {
          nicknameError.textContent = "사용 가능한 닉네임입니다.";
          nicknameError.style.color = "#03c75a";
        }
      } catch (err) {
        nicknameError.textContent = "서버 오류가 발생했습니다.";
        nicknameError.style.color = "#e60012";
      }
    }, 600);

    emailInput.addEventListener("input", (e) => checkEmail(e.target.value.trim()));
    nicknameInput.addEventListener("input", (e) => checkNickname(e.target.value.trim()));

    // ✅ 이미지 미리보기
    profileImageInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        selectedImageFile = file;
        const reader = new FileReader();
        reader.onload = (event) => {
          imagePreview.innerHTML = `<img src="${event.target.result}" alt="프로필 미리보기" style="max-width: 150px; max-height: 150px; border-radius: 8px; margin-top: 10px;">`;
        };
        reader.readAsDataURL(file);
      } else {
        selectedImageFile = null;
        imagePreview.innerHTML = "";
      }
    });

    // 비밀번호 실시간 검증
    function validatePassword() {
      if (!pw.value) {
        pwError.textContent = "";
        return;
      }

      if (pw.value.length < 8 || pw.value.length > 20) {
        pwError.textContent = "비밀번호는 8~20자 사이여야 합니다.";
        pwError.style.color = "#e60012";
        return;
      } else {
        pwError.textContent = "사용 가능한 비밀번호입니다.";
        pwError.style.color = "#03c75a";
      }

      if (!pw.value || !pwConfirm.value) {
        pwDuplicateError.textContent = "";
        return;
      }

      if (pw.value !== pwConfirm.value) {
        pwDuplicateError.textContent = "비밀번호가 일치하지 않습니다.";
        pwDuplicateError.style.color = "#e60012";
      } else {
        pwDuplicateError.textContent = "비밀번호가 일치합니다.";
        pwDuplicateError.style.color = "#03c75a";
      }
    }

    pw.addEventListener("input", validatePassword);
    pwConfirm.addEventListener("input", validatePassword);

    // 폼 제출 (alert → 화면 메시지 표시)
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      formMessage.textContent = "";
      formMessage.className = "form-message";

      // 기본 검증
      if (pw.value.length < 8 || pw.value.length > 20) {
        showFormMessage("비밀번호는 8~20자 사이여야 합니다.", false);
        return;
      }

      if (pw.value !== pwConfirm.value) {
        showFormMessage("비밀번호가 일치하지 않습니다.", false);
        return;
      }

      showLoading(formMessage);

      try {
        // FormData를 사용하여 이미지와 함께 전송
        const formData = new FormData();
        formData.append("email", emailInput.value.trim());
        formData.append("nickname", nicknameInput.value.trim());
        formData.append("password", pw.value.trim());
        formData.append("role", "user");

        // 이미지가 선택된 경우에만 추가
        if (selectedImageFile) {
          formData.append("profileImage", selectedImageFile);
        }

        const { error, result } = await post(API_ENDPOINTS.USERS.REGISTER, formData);

        if (error) {
          // conflict 상태이고 이미지 타입 에러인 경우
          if (error.status === 409 && error.message === "이미지 타입 에러") {
            showFormMessage("업로드 가능한 이미지 형식이 아닙니다. 이미지 타입을 확인해주세요.", false);
            return;
          }
          showFormMessage("회원가입 실패: " + (error.message || "서버 오류"), false);
          return;
        }

        showFormMessage("🎉 회원가입이 완료되었습니다!", true);
        setTimeout(() => (window.location.href = "/pages/login/login.html"), 1500);
      } catch (error) {
        showFormMessage("서버 연결에 실패했습니다.", false);
      }
    });

    // 화면 메시지 표시 함수
    function showFormMessage(text, success) {
      formMessage.textContent = text;
      formMessage.style.color = success ? "#03c75a" : "#e60012";
      formMessage.style.opacity = 1;
    }
  }
});
