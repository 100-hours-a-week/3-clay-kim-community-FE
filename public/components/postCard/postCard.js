// Post Card Component - 개선 버전

// 게시글 카드 생성
function createPostCard(post) {
  return `
    <div class="post-item" data-post-id="${post.id}">
      <div class="post-item-header">
        <div>
          <div class="post-item-title">${escapeHtml(post.title)}</div>
          <div class="post-item-author">${escapeHtml(post.nickname || post.authorEmail || post.author || '익명')}</div>
        </div>
      </div>
      
      <div class="post-item-meta">
        <div class="post-meta-item">
          <span class="icon">조회수</span>
          <span>${post.viewCount || 0}</span>
        </div>
        <div class="post-meta-item">
          <span class="icon">좋아요</span>
          <span>${post.likeCount || 0}</span>
        </div>
        <div class="post-meta-item">
          <span class="icon">댓글</span>
          <span>${post.commentCount || 0}</span>
        </div>
        <div class="post-item-time">${formatTime(post.createdAt)}</div>
      </div>
    </div>
  `;
}

// ✅ 게시글 카드 리스트 렌더링 (append 모드 추가!)
function renderPostCards(posts, containerId, append = false, onClickCallback) {
  const container = document.getElementById(containerId);
  
  // posts가 null이거나 비어있으면
  if (!posts || posts.length === 0) {
    // append 모드가 아닐 때만 empty state 표시
    if (!append) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">아직 작성된 게시글이 없습니다.</div>
        </div>
      `;
    }
    return;
  }

  if (append) {
    // ✅ 추가 모드: 기존 목록에 이어붙이기
    posts.forEach(post => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = createPostCard(post).trim();
      const postElement = tempDiv.firstChild;
      
      // 클릭 이벤트 등록
      postElement.addEventListener('click', () => {
        const postId = postElement.dataset.postId;
        if (onClickCallback) {
          onClickCallback(postId);
        } else {
          window.location.href = `/pages/postDetail/postDetail.html?id=${postId}`;
        }
      });
      
      container.appendChild(postElement);
    });
  } else {
    // ✅ 교체 모드: 전체 새로 그리기
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
    
    // 클릭 이벤트 등록
    container.querySelectorAll('.post-item').forEach(item => {
      item.addEventListener('click', () => {
        const postId = item.dataset.postId;
        if (onClickCallback) {
          onClickCallback(postId);
        } else {
          window.location.href = `/pages/postDetail/postDetail.html?id=${postId}`;
        }
      });
    });
  }
}

// 시간 포맷팅
function formatTime(timestamp) {
  if (!timestamp) return '방금 전';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// export (모듈로 사용할 경우)
export { createPostCard, renderPostCards, formatTime, escapeHtml };