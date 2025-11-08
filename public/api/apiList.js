// API 기본 설정
import { API_CONFIG } from './config.js';

// BASE_URL export
export const BASE_URL = API_CONFIG.BASE_URL;

// API 엔드포인트 목록
export const API_ENDPOINTS = {
  // 인증 관련
  AUTH: {
    LOGIN: '/auth',
    LOGOUT: '/auth/token',
  },
  
  // 사용자 관련
  USERS: {
    REGISTER: '/users',
    CHECK_EMAIL: (email) => `/users/email?email=${encodeURIComponent(email)}`,
    CHECK_NICKNAME: (nickname) => `/users/nickname?nickname=${encodeURIComponent(nickname)}`,
    GET_USER: (userId) => `/users/${userId}`,
    UPDATE_PASSWORD: '/users/password',
    UPDATE_USER: (userId) => `/users/${userId}`,
  },
  
  // 게시글 관련
  POSTS: {
    LIST: (cursor = null, size = 10, period = null) => {
      let url = `/posts?size=${size}`;
      if (cursor) url += `&cursor=${cursor}`;
      if (period) url += `&period=${period}`;
      return url;
    },
    TOP10: '/posts/top10',
    CREATE: '/posts',
    DETAIL: (id) => `/posts/${id}`,
    UPDATE: (id) => `/posts/${id}`,
    DELETE: (id) => `/posts/${id}/deactivation`,
    STATUSES: '/posts/statuses',
  },
  
  // 댓글 관련
  COMMENTS: {
    LIST: (postId) => `/posts/${postId}/comments`,
    CREATE: (postId) => `/posts/${postId}/comments`,
    UPDATE: (commentId) => `/comments/${commentId}`,
    SOFT_DELETE: (commentId) => `/comments/${commentId}/deactivation`,
  },

  TOS: {
    GET: '/tos',
  }
};