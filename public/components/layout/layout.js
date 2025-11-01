import { post } from '/api/fetchApi.js';
import { API_ENDPOINTS } from '/api/apiList.js';

class Layout {
  constructor() {
    this.injectLayout();
    this.initHeader();
    this.setActiveSidebar();
  }

  /**
   * Layout 구조 삽입
   * - 다른 HTML 페이지에서 placeholder를 사용할 때 동적으로 레이아웃을 주입
   */
  injectLayout() {
    // Header 삽입
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (headerPlaceholder) {
      headerPlaceholder.innerHTML = `
        <header class="header">
          <div class="header-container">
            <a href="/" class="header-logo">🎉 아무 말 대잔치</a>
            <div class="header-user" id="headerUser"></div>
          </div>
        </header>
      `;
    }

    // Footer 삽입
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
      footerPlaceholder.innerHTML = `
        <footer class="footer">
          <p>© 2025 아무 말 대잔치 | <a href="http://localhost:8080/tos-policy">이용약관</a> | <a href="/pages/privacyPolicy/privacyPolicy.html">개인정보처리방침</a></p>
        </footer>
      `;
    }

    // Sidebar 삽입
    const sidebarPlaceholder = document.getElementById("sidebar-placeholder");
    if (sidebarPlaceholder) {
      sidebarPlaceholder.innerHTML = `
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-title">📌 메뉴</h3>
            <ul>
              <li><a href="/"><span class="sidebar-icon">🏠</span>홈</a></li>
              <li><a href="/pages/post/post.html"><span class="sidebar-icon">📝</span>전체 게시글</a></li>
            </ul>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-title">🔥 인기글</h3>
            <ul>
              <li><a href="/pages/latest/latest.html"><span class="sidebar-icon">🆕</span>최신글</a></li>
              <li><a href="/pages/today/today.html"><span class="sidebar-icon">⭐</span>오늘 추천글</a></li>
              <li><a href="/pages/week/week.html"><span class="sidebar-icon">🏆</span>이번주 추천글</a></li>
            </ul>
          </div>
        </aside>
      `;
    }
  }

  /**
   * Header 초기화
   * - 로그인 상태 확인하고 UI 렌더링
   */
  initHeader() {
    this.userEmail = localStorage.getItem("userEmail");
    this.userNickname = localStorage.getItem("userNickname");
    this.renderHeader();
    this.attachEventListeners();
  }

  /**
   * 로그인 여부 확인
   */
  isLoggedIn() {
    return !!this.userEmail;
  }

  /**
   * Header에 로그인/로그아웃 버튼 렌더링
   */
  renderHeader() {
    const headerUser = document.getElementById("headerUser");
    if (!headerUser) return;

    headerUser.innerHTML = this.isLoggedIn()
      ? this.renderLoggedIn()
      : this.renderLoggedOut();
  }

  /**
   * 로그인 상태 UI
   */
  renderLoggedIn() {
    return `
      <div class="header-user-wrapper">
        <div class="header-user-info">
          <span class="header-user-email">${this.userNickname || "닉네임"} / ${this.userEmail || "접속 아이디"}</span>
        </div>
        <div class="user-dropdown">
          <a href="/pages/myProfile/myProfile.html" class="dropdown-item">
            <span class="dropdown-icon">👤</span>
            <span>내 프로필</span>
          </a>
          <a href="/pages/myPosts/myPosts.html" class="dropdown-item">
            <span class="dropdown-icon">📝</span>
            <span>내 게시글</span>
          </a>
          <a href="/pages/myComments/myComments.html" class="dropdown-item">
            <span class="dropdown-icon">💬</span>
            <span>내 댓글</span>
          </a>
        </div>
      </div>
      <button class="header-btn header-btn-logout" id="logoutBtn">로그아웃</button>
    `;
  }

  /**
   * 로그아웃 상태 UI
   */
  renderLoggedOut() {
    return `
      <a href="/pages/login/login.html" class="header-btn header-btn-secondary">로그인</a>
      <a href="/pages/register/register.html" class="header-btn header-btn-primary">회원가입</a>
    `;
  }

  /**
   * 이벤트 리스너 등록
   * 이벤트 위임 패턴
   */
  attachEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.id === "logoutBtn") this.handleLogout();
    });
  }

  /**
   * 로그아웃 처리
   */
  async handleLogout() {
    const { error, result } = await post(API_ENDPOINTS.AUTH.LOGOUT);

    console.log('로그아웃 결과 : ', result);

    if (error) {
      throw new error.message;
    }

    localStorage.removeItem("userEmail");
    localStorage.removeItem("userNickname");
    localStorage.removeItem("userId");
    window.location.href = "/";
  }

  /**
   * 현재 페이지에 맞는 사이드바 메뉴 활성화
   */
  setActiveSidebar() {
    const currentPath = window.location.pathname;
    const sidebarLinks = document.querySelectorAll(".sidebar a");

    sidebarLinks.forEach((link) => {
      if (link.getAttribute("href") === currentPath) {
        link.classList.add("active");
      }
    });
  }
}

// 페이지 로드 시 Layout 초기화
document.addEventListener("DOMContentLoaded", () => {
  new Layout();
});