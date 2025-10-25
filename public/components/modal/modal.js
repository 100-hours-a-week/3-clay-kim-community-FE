// modal.js - 재사용 가능한 모달 컴포넌트

class Modal {
  constructor() {
    this.overlay = null;
    this.container = null;
    this.currentResolve = null;
    this.init();
  }

  init() {
    // 모달이 이미 존재하면 제거
    const existingModal = document.getElementById('modalOverlay');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 HTML 생성
    this.createModal();
    this.overlay = document.getElementById('modalOverlay');
    this.container = this.overlay.querySelector('.modal-container');
    
    // 이벤트 리스너 등록
    this.attachEventListeners();
  }

  createModal() {
    const modalHTML = `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-container">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">알림</h3>
            <button class="modal-close" id="modalClose">&times;</button>
          </div>
          <div class="modal-body" id="modalBody">
            <p>메시지 내용</p>
          </div>
          <div class="modal-footer" id="modalFooter">
            <button class="modal-btn modal-btn-primary" id="modalConfirm">확인</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  attachEventListeners() {
    // 오버레이 클릭 시 닫기
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close(false);
      }
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
        this.close(true);
      }
    });
  }

  /**
   * Alert 모달 표시 (확인 버튼만)
   * @param {string} message - 표시할 메시지
   * @param {string} title - 모달 제목 (기본: '알림')
   * @returns {Promise<void>}
   */
  alert(message, title = '알림') {
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = `<p>${message}</p>`;
      
      const footer = document.getElementById('modalFooter');
      footer.innerHTML = `
        <button class="modal-btn modal-btn-primary" id="modalConfirm">확인</button>
      `;

      const confirmBtn = document.getElementById('modalConfirm');
      const closeBtn = document.getElementById('modalClose');

      confirmBtn.onclick = () => this.close(true);
      closeBtn.onclick = () => this.close(false);

      this.show();
    });
  }

  /**
   * Confirm 모달 표시 (확인/취소 버튼)
   * @param {string} message - 표시할 메시지
   * @param {string} title - 모달 제목 (기본: '확인')
   * @returns {Promise<boolean>} - 확인: true, 취소: false
   */
  confirm(message, title = '확인') {
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = `<p>${message}</p>`;
      
      const footer = document.getElementById('modalFooter');
      footer.innerHTML = `
        <button class="modal-btn modal-btn-primary" id="modalConfirm">확인</button>  
        <button class="modal-btn modal-btn-cancel" id="modalCancel">취소</button>
      `;

      const confirmBtn = document.getElementById('modalConfirm');
      const cancelBtn = document.getElementById('modalCancel');
      const closeBtn = document.getElementById('modalClose');

      confirmBtn.onclick = () => this.close(true);
      cancelBtn.onclick = () => this.close(false);
      closeBtn.onclick = () => this.close(false);

      this.show();
    });
  }

  /**
   * 커스텀 모달 표시
   * @param {Object} options - 모달 옵션
   * @param {string} options.title - 모달 제목
   * @param {string} options.message - 표시할 메시지
   * @param {Array} options.buttons - 버튼 배열 [{text: '버튼명', value: 반환값, className: 'css클래스'}]
   * @returns {Promise<any>} - 클릭한 버튼의 value 반환
   */
  custom({ title = '알림', message = '', buttons = [] }) {
    return new Promise((resolve) => {
      this.currentResolve = resolve;
      
      document.getElementById('modalTitle').textContent = title;
      document.getElementById('modalBody').innerHTML = `<p>${message}</p>`;
      
      const footer = document.getElementById('modalFooter');
      footer.innerHTML = buttons.map((btn, index) => 
        `<button class="modal-btn ${btn.className || 'modal-btn-primary'}" data-value="${index}">${btn.text}</button>`
      ).join('');

      footer.querySelectorAll('button').forEach((btn, index) => {
        btn.onclick = () => this.close(buttons[index].value);
      });

      const closeBtn = document.getElementById('modalClose');
      closeBtn.onclick = () => this.close(null);

      this.show();
    });
  }

  show() {
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // 스크롤 방지
  }

  close(result) {
    this.overlay.classList.remove('active');
    document.body.style.overflow = ''; // 스크롤 복원
    
    if (this.currentResolve) {
      this.currentResolve(result);
      this.currentResolve = null;
    }
  }
}

// 전역 모달 인스턴스 생성
const modal = new Modal();

// 전역으로 사용 가능하도록 export (ES6 모듈)
// export default modal;

// 또는 window 객체에 할당하여 어디서나 사용 가능하게
window.modal = modal;