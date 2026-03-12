import { get, post } from '/utils/fetchApi.js';
import { API_ENDPOINTS, BASE_URL } from '/utils/apiList.js';
import {
    DEFAULT_PROFILE_IMAGE,
    pickProfileImageValue,
    resolveProfileImageUrl,
} from '/utils/profileImage.js';

class Layout {
    constructor() {
        console.log('[Layout] Constructor 호출됨');
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
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.innerHTML = `
        <header class="header">
          <nav class="header-nav">
            <a href="/" class="header-logo">🚴‍♂️ 종주메이트</a>
            <div class="header-nav-links">
              <a href="/pages/post/post.html">국토종주 기록</a>
              <a href="/pages/post/post.html?period=weekly">주간 인기 여정</a>
              <a href="/pages/post/post.html?view=top10">완주 인증 TOP 10</a>
              <div class="header-user" id="headerUser"></div>
            </div>
          </nav>
        </header>
      `;
        }

        // Footer 삽입
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.innerHTML = `
        <footer class="footer">
          <p>© 2025 종주 메이트 | <a href="http://localhost:8080/tos-policy">이용약관</a> | <a href="/pages/privacyPolicy/privacyPolicy.html">개인정보처리방침</a></p>
        </footer>
      `;
        }

        // Sidebar 삽입
        const sidebarPlaceholder = document.getElementById(
            'sidebar-placeholder',
        );
        if (sidebarPlaceholder) {
            sidebarPlaceholder.innerHTML = `
        <aside class="sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-title">📌 메뉴</h3>
            <ul>
              <li><a href="/"><span class="sidebar-icon">🏠</span>홈</a></li>
              <li><a href="/pages/post/post.html"><span class="sidebar-icon">🚴</span>전체 국토종주 기록</a></li>
            </ul>
          </div>

          <div class="sidebar-section">
            <h3 class="sidebar-title">🏃 종주 일지</h3>
            <ul>
              <li><a href="/pages/post/post.html?period=daily"><span class="sidebar-icon"></span>오늘의 국토종주 기록</a></li>
              <li><a href="/pages/post/post.html?period=weekly"><span class="sidebar-icon"></span>인기 국토종주 코스</a></li>
              <li><a href="/pages/post/post.html?view=top10"><span class="sidebar-icon"></span>완주 인증 TOP 10</a></li>
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
        console.log('[Layout] initHeader 호출됨');
        this.userEmail = localStorage.getItem('userEmail');
        this.userNickname = localStorage.getItem('userNickname');
        this.userId = localStorage.getItem('userId');
        this.userProfileImage = pickProfileImageValue(
            localStorage.getItem('userProfileImage'),
        );

        console.log('[Layout] localStorage 값:', {
            userEmail: this.userEmail,
            userNickname: this.userNickname,
            userId: this.userId,
            userProfileImage: this.userProfileImage,
        });

        this.renderHeader();
        this.attachEventListeners();

        if (this.userId && !this.userProfileImage) {
            console.log('[Layout] 프로필 이미지 없음 - API 호출 시작');
            this.loadUserProfileImage();
        } else if (this.userProfileImage) {
            console.log(
                '[Layout] 프로필 이미지 있음 - localStorage 사용:',
                this.userProfileImage,
            );
        }
    }

    /**
     * 사용자 프로필 이미지 로드
     */
    async loadUserProfileImage() {
        console.log('[Layout] loadUserProfileImage 호출됨');
        if (this.isLoadingProfileImage) {
            console.log('[Layout] 이미 로딩 중 - 중복 호출 차단');
            return;
        }
        this.isLoadingProfileImage = true;
        console.log('[Layout] 프로필 이미지 API 호출 시작');

        try {
            const endpoint = API_ENDPOINTS.USERS.GET_USER(this.userId);
            console.log('[Layout] API endpoint:', endpoint);

            const { error, result } = await get(endpoint, {
                auth: true,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken') || ''}`,
                },
            });

            console.log('[Layout] API 응답 상태:', error?.status ?? 200);

            if (error) {
                console.error('[Layout] 프로필 이미지 API 응답 에러:', error);
                return;
            }

            const profileImageValue = pickProfileImageValue(result?.data?.imageUrl);

            if (profileImageValue) {
                this.userProfileImage = profileImageValue;
                console.log('[Layout] 프로필 이미지 URL:', this.userProfileImage);
                localStorage.setItem('userProfileImage', this.userProfileImage);
            } else {
                this.userProfileImage = '';
                localStorage.removeItem('userProfileImage');
                console.log('[Layout] API 응답에 imageUrl 없음');
            }

            const profileImage = document.querySelector('.header-profile-image');
            if (profileImage) {
                const newSrc = resolveProfileImageUrl(this.userProfileImage);
                console.log('[Layout] 이미지 src 업데이트:', newSrc);
                profileImage.src = newSrc;
            } else {
                console.log('[Layout] .header-profile-image 요소를 찾을 수 없음');
            }
        } catch (error) {
            console.error('[Layout] 프로필 이미지 로드 실패:', error);
        } finally {
            this.isLoadingProfileImage = false;
            console.log('[Layout] loadUserProfileImage 완료');
        }
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
        console.log('[Layout] renderHeader 호출됨');
        const headerUser = document.getElementById('headerUser');
        if (!headerUser) {
            console.log('[Layout] headerUser 요소를 찾을 수 없음');
            return;
        }

        console.log('[Layout] 로그인 상태:', this.isLoggedIn());
        headerUser.innerHTML = this.isLoggedIn()
            ? this.renderLoggedIn()
            : this.renderLoggedOut();
        console.log('[Layout] renderHeader 완료');
    }

    /**
     * 로그인 상태 UI
     */
    renderLoggedIn() {
        const profileImageUrl = resolveProfileImageUrl(this.userProfileImage);
        const profileImageHtml = `<img src="${profileImageUrl}" alt="프로필" class="header-profile-image" onerror="this.onerror=null; this.src='${DEFAULT_PROFILE_IMAGE}';">`;

        return `
      <div class="header-user-wrapper">
        <div class="header-user-info">
          ${profileImageHtml}
          <span class="header-user-email">${this.userNickname || '닉네임'} / ${this.userEmail || '접속 아이디'}</span>
        </div>
        <div class="user-dropdown">
          <a href="/pages/myProfile/myProfile.html" class="dropdown-item">
            <span class="dropdown-icon">👤</span>
            <span>내 프로필</span>
          </a>
          <a href="/pages/post/post.html?filter=myPosts" class="dropdown-item">
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
        document.addEventListener('click', e => {
            if (e.target.id === 'logoutBtn') this.handleLogout();
        });
    }

    /**
     * 로그아웃 처리
     */
    async handleLogout() {
        try {
            const { error, result } = await post(API_ENDPOINTS.AUTH.LOGOUT);

            if (error) {
                console.error('로그아웃 API 실패:', error);
            }
        } catch (e) {
            console.error('로그아웃 요청 중 에러:', e);
        } finally {
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userNickname');
            localStorage.removeItem('userId');
            localStorage.removeItem('userProfileImage');
            window.location.href = '/';
        }
    }

    /**
     * 현재 페이지에 맞는 탭 메뉴 활성화
     */
    setActiveSidebar() {
        const currentPath = window.location.pathname + window.location.search;
        const navLinks = document.querySelectorAll('.header-nav-tabs a');

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPath) {
                link.classList.add('active');
            }
        });
    }
}

// 페이지 로드 시 Layout 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Layout] DOMContentLoaded 이벤트 발생 - Layout 인스턴스 생성');
    new Layout();
});
