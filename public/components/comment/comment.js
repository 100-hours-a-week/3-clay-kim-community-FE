// Comment Component - 댓글 렌더링 전담

/**
 * 댓글 아코디언 그룹 렌더링 (토글 방식)
 * @param {number} totalComments - 전체 댓글 수
 * @param {Array} latestComments - 최신 댓글 배열 (마지막 그룹)
 * @param {string} containerId - 렌더링할 컨테이너 ID
 * @param {Function} onToggle - 토글 클릭 콜백 (pageNumber)
 * @param {Function} onDelete - 삭제 버튼 클릭 콜백
 * @param {Function} onEdit - 수정 버튼 클릭 콜백
 * @param {number} pageSize - 페이지당 댓글 수 (기본 20)
 */
export function renderCommentAccordion(totalComments, latestComments, containerId, onToggle, onDelete, onEdit, pageSize = 20) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // 댓글이 없는 경우
  if (totalComments === 0) {
    container.innerHTML = `
      <div class="comment-empty">
        <div class="comment-empty-icon">💬</div>
        <div class="comment-empty-text">첫 댓글을 작성해보세요!</div>
      </div>
    `;
    return;
  }

  const totalPages = Math.ceil(totalComments / pageSize);
  const lastPageStart = (totalPages - 1) * pageSize + 1;
  
  let html = '';
  
  // 이전 그룹들 (접혀있는 토글 버튼들)
  for (let page = 0; page < totalPages - 1; page++) {
    const start = page * pageSize + 1;
    const end = (page + 1) * pageSize;
    
    html += `
      <div class="comment-accordion-toggle" data-page="${page}">
        <div class="accordion-toggle-header">
          <span class="accordion-toggle-label">${start} ~ ${end} 번째 댓글</span>
          <button class="accordion-toggle-btn" data-page="${page}">
            <span class="toggle-icon">+</span>
          </button>
        </div>
        <div class="accordion-toggle-content" id="comment-group-${page}" style="display: none;">
          <!-- 클릭 시 댓글이 여기에 로드됨 -->
        </div>
      </div>
    `;
  }
  
  // 마지막 그룹 (펼쳐져 있음 - 최신 댓글들)
  const lastPage = totalPages - 1;
  html += `
    <div class="comment-accordion-toggle active" data-page="${lastPage}">
      <div class="accordion-toggle-header">
        <span class="accordion-toggle-label">${lastPageStart} ~ 번째 댓글</span>
        <button class="accordion-toggle-btn" data-page="${lastPage}">
          <span class="toggle-icon">-</span>
        </button>
      </div>
      <div class="accordion-toggle-content" id="comment-group-${lastPage}" style="display: block;">
        ${latestComments.map(comment => createCommentHTML(comment)).join('')}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // 토글 버튼 이벤트 등록
  attachAccordionEvents(container, onToggle);

  // 삭제/수정 버튼 이벤트 등록 (마지막 그룹에만)
  const lastGroup = container.querySelector(`#comment-group-${lastPage}`);
  if (lastGroup) {
    if (onDelete) {
      attachDeleteEvents(lastGroup, onDelete);
    }
    if (onEdit) {
      attachEditEvents(lastGroup, onEdit);
    }
  }
}

/**
 * 댓글 목록 렌더링 (기존 방식 - 토글 없이)
 * @param {Array} comments - 댓글 배열
 * @param {string} containerId - 렌더링할 컨테이너 ID
 * @param {Function} onDelete - 삭제 버튼 클릭 콜백
 * @param {Function} onEdit - 수정 버튼 클릭 콜백
 */
export function renderComments(comments, containerId, onDelete, onEdit) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`Container with id "${containerId}" not found`);
    return;
  }

  // 댓글이 없는 경우
  if (!comments || comments.length === 0) {
    container.innerHTML = `
      <div class="comment-empty">
        <div class="comment-empty-icon">💬</div>
        <div class="comment-empty-text">첫 댓글을 작성해보세요!</div>
      </div>
    `;
    return;
  }

  // 댓글 목록 렌더링
  container.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');

  // 삭제/수정 버튼 이벤트 등록
  if (onDelete) {
    attachDeleteEvents(container, onDelete);
  }
  if (onEdit) {
    attachEditEvents(container, onEdit);
  }
}

/**
 * 개별 댓글 HTML 생성
 * @param {Object} comment - 댓글 객체
 * @returns {string} 댓글 HTML
 */
export function createCommentHTML(comment) {
  const currentUserId = localStorage.getItem('userId');
  const isAuthor = currentUserId && currentUserId === comment.userId;

  return `
    <div class="comment-item" data-comment-id="${comment.id}">
      <div class="comment-header">
        <div class="comment-author">
          <span class="comment-author-name">${escapeHtml(comment.nickname || comment.email || '익명')}</span>
        </div>
        <div class="comment-meta">
          <span class="comment-date">${formatTime(comment.createdAt)}</span>
          ${isAuthor ? `
            <div class="comment-actions">
              <button class="btn-comment-edit" data-comment-id="${comment.id}">
                <span class="icon">✏️</span>
                수정
              </button>
              <button class="btn-comment-delete" data-comment-id="${comment.id}">
                <span class="icon">🗑️</span>
                삭제
              </button>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="comment-content" data-original-content="${escapeHtml(comment.content)}">${escapeHtml(comment.content)}</div>
      <div class="comment-edit-form" style="display: none;">
        <textarea class="comment-edit-input" maxlength="500">${escapeHtml(comment.content)}</textarea>
        <div class="comment-edit-actions">
          <button class="btn-comment-save" data-comment-id="${comment.id}">저장</button>
          <button class="btn-comment-cancel" data-comment-id="${comment.id}">취소</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 댓글 개수 업데이트
 * @param {number} count - 댓글 개수
 * @param {string} countElementId - 댓글 개수를 표시할 요소 ID
 */
export function updateCommentCount(count, countElementId = 'commentCount') {
  const countElement = document.getElementById(countElementId);
  if (countElement) {
    countElement.textContent = count;
  }
}

/**
 * 아코디언 토글 버튼 이벤트 등록
 * @param {HTMLElement} container - 댓글 컨테이너
 * @param {Function} onToggle - 토글 콜백 함수
 */
function attachAccordionEvents(container, onToggle) {
  const toggleButtons = container.querySelectorAll('.accordion-toggle-btn');
  
  toggleButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const page = parseInt(button.dataset.page);
      const accordionItem = button.closest('.comment-accordion-toggle');
      const content = accordionItem.querySelector('.accordion-toggle-content');
      const icon = button.querySelector('.toggle-icon');
      
      // 이미 열려있으면 닫기
      if (accordionItem.classList.contains('active')) {
        accordionItem.classList.remove('active');
        content.style.display = 'none';
        icon.textContent = '+';
      } else {
        // 닫혀있으면 열기 - 콜백 호출하여 데이터 로드
        if (onToggle && content.children.length === 0) {
          // 로딩 표시
          content.innerHTML = '<div class="comment-loading">댓글을 불러오는 중...</div>';
          content.style.display = 'block';
          
          // 데이터 로드
          await onToggle(page, content.id);
        }
        
        accordionItem.classList.add('active');
        content.style.display = 'block';
        icon.textContent = '-';
      }
    });
  });
}

/**
 * 특정 그룹에 댓글 렌더링 (토글 열렸을 때)
 * @param {Array} comments - 댓글 배열
 * @param {string} groupId - 그룹 컨테이너 ID
 * @param {Function} onDelete - 삭제 콜백
 * @param {Function} onEdit - 수정 콜백
 */
export function renderCommentsInGroup(comments, groupId, onDelete, onEdit) {
  const group = document.getElementById(groupId);

  if (!group) return;

  if (!comments || comments.length === 0) {
    group.innerHTML = '<div class="comment-empty-text">댓글이 없습니다.</div>';
    return;
  }

  group.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');

  // 삭제/수정 버튼 이벤트 등록
  if (onDelete) {
    attachDeleteEvents(group, onDelete);
  }
  if (onEdit) {
    attachEditEvents(group, onEdit);
  }
}

/**
 * 삭제 버튼 이벤트 등록
 * @param {HTMLElement} container - 댓글 컨테이너
 * @param {Function} onDelete - 삭제 콜백 함수
 */
function attachDeleteEvents(container, onDelete) {
  const deleteButtons = container.querySelectorAll('.btn-comment-delete');

  deleteButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const commentId = button.dataset.commentId;
      if (onDelete && commentId) {
        onDelete(commentId);
      }
    });
  });
}

/**
 * 수정 버튼 이벤트 등록
 * @param {HTMLElement} container - 댓글 컨테이너
 * @param {Function} onEdit - 수정 콜백 함수
 */
function attachEditEvents(container, onEdit) {
  const editButtons = container.querySelectorAll('.btn-comment-edit');

  editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const commentId = button.dataset.commentId;
      const commentItem = button.closest('.comment-item');

      if (commentItem) {
        enterEditMode(commentItem);
      }
    });
  });

  // 저장 버튼 이벤트
  const saveButtons = container.querySelectorAll('.btn-comment-save');
  saveButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const commentId = button.dataset.commentId;
      const commentItem = button.closest('.comment-item');
      const textarea = commentItem.querySelector('.comment-edit-input');
      const newContent = textarea.value.trim();

      if (!newContent) {
        await window.modal.alert('댓글 내용을 입력해주세요.', '알림');
        return;
      }

      if (onEdit && commentId) {
        await onEdit(commentId, newContent, commentItem);
      }
    });
  });

  // 취소 버튼 이벤트
  const cancelButtons = container.querySelectorAll('.btn-comment-cancel');
  cancelButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const commentItem = button.closest('.comment-item');
      if (commentItem) {
        exitEditMode(commentItem);
      }
    });
  });
}

/**
 * 댓글 수정 모드로 전환
 * @param {HTMLElement} commentItem - 댓글 요소
 */
function enterEditMode(commentItem) {
  const contentDiv = commentItem.querySelector('.comment-content');
  const editForm = commentItem.querySelector('.comment-edit-form');
  const actions = commentItem.querySelector('.comment-actions');

  if (contentDiv && editForm && actions) {
    contentDiv.style.display = 'none';
    editForm.style.display = 'block';
    actions.style.display = 'none';

    // textarea에 포커스
    const textarea = editForm.querySelector('.comment-edit-input');
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }
}

/**
 * 댓글 수정 모드 종료
 * @param {HTMLElement} commentItem - 댓글 요소
 */
function exitEditMode(commentItem) {
  const contentDiv = commentItem.querySelector('.comment-content');
  const editForm = commentItem.querySelector('.comment-edit-form');
  const actions = commentItem.querySelector('.comment-actions');
  const textarea = commentItem.querySelector('.comment-edit-input');
  const originalContent = contentDiv.dataset.originalContent;

  if (contentDiv && editForm && actions) {
    contentDiv.style.display = 'block';
    editForm.style.display = 'none';
    actions.style.display = 'flex';

    // 원본 내용으로 복원
    if (textarea && originalContent) {
      textarea.value = originalContent;
    }
  }
}

/**
 * 댓글 내용 업데이트 (수정 후)
 * @param {string} commentId - 댓글 ID
 * @param {string} newContent - 새로운 내용
 */
export function updateCommentContent(commentId, newContent) {
  const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!commentItem) return;

  const contentDiv = commentItem.querySelector('.comment-content');
  const textarea = commentItem.querySelector('.comment-edit-input');

  if (contentDiv && textarea) {
    const escapedContent = escapeHtml(newContent);
    contentDiv.textContent = newContent;
    contentDiv.dataset.originalContent = escapedContent;
    textarea.value = newContent;

    exitEditMode(commentItem);
  }
}

/**
 * 시간 포맷팅
 * @param {string} timestamp - ISO 8601 타임스탬프
 * @returns {string} 포맷된 시간 문자열
 */
function formatTime(timestamp) {
  if (!timestamp) return '방금 전';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  
  // 일주일 이상 지난 경우 날짜 표시
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * HTML 이스케이프 (XSS 방지)
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} 이스케이프된 텍스트
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 댓글 추가 (기존 목록에 새 댓글 추가)
 * @param {Object} comment - 새 댓글 객체
 * @param {string} containerId - 컨테이너 ID
 * @param {Function} onDelete - 삭제 콜백
 */
export function appendComment(comment, containerId, onDelete) {
  const container = document.getElementById(containerId);
  
  if (!container) return;

  // 빈 상태 메시지 제거
  const emptyState = container.querySelector('.comment-empty');
  if (emptyState) {
    emptyState.remove();
  }

  // 새 댓글을 맨 위에 추가
  const commentHTML = createCommentHTML(comment);
  container.insertAdjacentHTML('afterbegin', commentHTML);

  // 삭제 버튼 이벤트 등록
  if (onDelete) {
    const newComment = container.querySelector(`[data-comment-id="${comment.id}"]`);
    const deleteButton = newComment?.querySelector('.btn-comment-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(comment.id);
      });
    }
  }
}

/**
 * 댓글 삭제 (DOM에서 제거)
 * @param {string} commentId - 삭제할 댓글 ID
 * @param {string} containerId - 컨테이너 ID
 */
export function removeComment(commentId, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const commentElement = container.querySelector(`[data-comment-id="${commentId}"]`);
  if (commentElement) {
    commentElement.remove();
  }

  // 댓글이 모두 삭제된 경우 빈 상태 표시
  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="comment-empty">
        <div class="comment-empty-icon">💬</div>
        <div class="comment-empty-text">첫 댓글을 작성해보세요!</div>
      </div>
    `;
  }
}
