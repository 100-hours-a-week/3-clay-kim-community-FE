// API 기본 설정
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  TIMEOUT: 10000, // 10초

  // 기본 헤더
  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // 쿠키를 사용하므로 Authorization 헤더는 필요 없음
    
    return headers;
  }
};