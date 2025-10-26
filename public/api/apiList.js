// API 엔드포인트 목록
export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: '/auth',
    LOGOUT: '/auth/logout',
  },
  
  // 사용자 관련
  USERS: {
    REGISTER: '/users',
    CHECK_EMAIL: (email) => `/users/email?email=${encodeURIComponent(email)}`,
    CHECK_NICKNAME: (nickname) => `/users/nickname?nickname=${encodeURIComponent(nickname)}`,
  },
  
  // 게시글 관련
  POSTS: {
    LIST: (cursor = null, size = 10) => {
      let url = `/posts?size=${size}`;
      if (cursor) url += `&cursor=${cursor}`;
      return url;
    },
    CREATE: '/posts',
    DETAIL: (id) => `/posts/${id}`,
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}`,
    STATUSES: '/posts/statuses',
  },
  
  // 댓글 관련 (필요시 추가)
  COMMENTS: {
    LIST: (postId) => `/posts/${postId}/comments`,
    CREATE: (postId) => `/posts/${postId}/comments`,
    DELETE: (postId, commentId) => `/posts/${postId}/comments/${commentId}`,
  }
};