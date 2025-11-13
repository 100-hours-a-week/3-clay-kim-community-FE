// 이미지 업로드 테스트
const BASE_URL = 'http://localhost:8080';

document.addEventListener('DOMContentLoaded', () => {
  // 단일 이미지 업로드
  document.getElementById('btnSingleUpload').addEventListener('click', handleSingleUpload);

  // 다중 이미지 업로드
  document.getElementById('btnMultipleUpload').addEventListener('click', handleMultipleUpload);

  // 이미지 선택 시 미리보기
  document.getElementById('singleImage').addEventListener('change', (e) => {
    previewImages(e.target.files, 'singlePreview');
  });

  document.getElementById('multipleImages').addEventListener('change', (e) => {
    previewImages(e.target.files, 'multiplePreview');
  });
});

// 단일 이미지 업로드
async function handleSingleUpload() {
  const fileInput = document.getElementById('singleImage');
  const file = fileInput.files[0];

  if (!file) {
    alert('이미지를 선택해주세요.');
    return;
  }

  // FormData 생성
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`${BASE_URL}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: formData
    });

    const result = await response.json();
    displayResponse(result);

    if (response.ok) {
      alert('업로드 성공!');
    } else {
      alert('업로드 실패: ' + result.message);
    }
  } catch (error) {
    console.error('업로드 실패:', error);
    displayResponse({ error: error.message });
    alert('업로드 중 오류 발생');
  }
}

// 다중 이미지 업로드
async function handleMultipleUpload() {
  const fileInput = document.getElementById('multipleImages');
  const files = fileInput.files;

  if (files.length === 0) {
    alert('이미지를 선택해주세요.');
    return;
  }

  // FormData 생성
  const formData = new FormData();

  // 여러 파일을 같은 이름으로 추가
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await fetch(`${BASE_URL}/images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
      },
      body: formData
    });

    const result = await response.json();
    displayResponse(result);

    if (response.ok) {
      alert(`${files.length}개 이미지 업로드 성공!`);
    } else {
      alert('업로드 실패: ' + result.message);
    }
  } catch (error) {
    console.error('업로드 실패:', error);
    displayResponse({ error: error.message });
    alert('업로드 중 오류 발생');
  }
}

// 이미지 미리보기
function previewImages(files, previewId) {
  const preview = document.getElementById(previewId);
  preview.innerHTML = '';

  if (!files || files.length === 0) return;

  Array.from(files).forEach(file => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.alt = file.name;

      const fileInfo = document.createElement('div');
      fileInfo.className = 'file-info';
      fileInfo.innerHTML = `
        <p><strong>파일명:</strong> ${file.name}</p>
        <p><strong>크기:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
        <p><strong>타입:</strong> ${file.type}</p>
      `;

      const imgContainer = document.createElement('div');
      imgContainer.className = 'img-container';
      imgContainer.appendChild(img);
      imgContainer.appendChild(fileInfo);

      preview.appendChild(imgContainer);
    };

    reader.readAsDataURL(file);
  });
}

// 서버 응답 표시
function displayResponse(data) {
  const responseElement = document.getElementById('response');
  responseElement.textContent = JSON.stringify(data, null, 2);
}
