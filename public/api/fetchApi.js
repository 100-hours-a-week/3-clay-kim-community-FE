// fetch API 래퍼 함수
import { API_CONFIG } from './config.js';

/**
 * API 호출 래퍼 함수
 * @param {string} endpoint - API 엔드포인트 경로
 * @param {Object} options - fetch 옵션
 * @param {string} options.method - HTTP 메서드 (GET, POST, PUT, DELETE)
 * @param {Object} options.body - 요청 바디 (자동으로 JSON.stringify 처리)
 * @param {boolean} options.auth - 인증 토큰 포함 여부 (기본값: false)
 * @returns {Promise<{error: null|Object, result: Object}>}
 */
export async function fetchApi(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    auth = false,
    headers = {},
  } = options;

  try {
    // URL 생성
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // 헤더 설정
    const requestHeaders = {
      ...API_CONFIG.getHeaders(auth),
      ...headers,
    };

    // fetch 옵션 설정
    const fetchOptions = {
      method,
      headers: requestHeaders,
    };

    // body가 있으면 추가 (GET 요청에는 body 없음)
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    // API 호출
    const response = await fetch(url, fetchOptions);

    // 응답 처리
    const contentType = response.headers.get('content-type');
    let data = null;

    // JSON 응답인 경우에만 파싱
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    // 401 Unauthorized - 토큰 만료
    if (response.status === 401 && auth) {
      handleUnauthorized();
      return {
        error: {
          status: 401,
          message: '로그인이 만료되었습니다.',
        },
        result: null,
      };
    }

    if (response.status === 401 && !auth) {
      return {
        error: {
          status: 401,
          message: '아이디 또는 비밀번호가 잘못 되었습니다.',
        },
        result: null,
      };
    }

    // 에러 응답
    if (!response.ok) {
      return {
        error: {
          status: response.status,
          message: data?.message || '요청에 실패했습니다.',
          data: data,
        },
        result: null,
      };
    }

    // 성공 응답
    return {
      error: null,
      result: data,
    };

  } catch (error) {
    console.error('API 호출 에러:', error);
    
    // return {
    //   error: {
    //     status: 0,
    //     message: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.',
    //     originalError: error,
    //   },
    //   result: null,
    // };
  }
}

/**
 * 401 에러 처리 - 로그인 페이지로 리다이렉트
 */
function handleUnauthorized() {
  // 로컬스토리지 클리어
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userNickname');
  
  // 모달이 있으면 알림 표시
  if (window.modal) {
    window.modal.alert('로그인이 만료되었습니다.<br>다시 로그인해주세요.', '인증 오류')
      .then(() => {
        window.location.href = '/pages/login/login.html';
      });
  } else {
    // 모달이 없으면 바로 리다이렉트
    alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
    window.location.href = '/pages/login/login.html';
  }
}

/**
 * GET 요청 헬퍼 함수
 */
export async function get(endpoint, options = {}) {
  return fetchApi(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 요청 헬퍼 함수
 */
export async function post(endpoint, body, options = {}) {
  return fetchApi(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT 요청 헬퍼 함수
 */
export async function put(endpoint, body, options = {}) {
  return fetchApi(endpoint, { ...options, method: 'PUT', body });
}

/**
 * PATCH 요청 헬퍼 함수
 */
export async function patch(endpoint, body, options = {}) {
  return fetchApi(endpoint, { ...options, method: 'PATCH', body });
}

/**
 * DELETE 요청 헬퍼 함수
 */
export async function del(endpoint, options = {}) {
  return fetchApi(endpoint, { ...options, method: 'DELETE' });
}