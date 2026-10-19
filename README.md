# Rectangular Tester

이 저장소에는 Teachable Machine 기반의 "직육면체인지 아닌지" 판별 웹사이트 샘플 코드가 들어 있습니다.

- 모델: https://teachablemachine.withgoogle.com/models/DZQZEKHCH/
- 사용 파일: index.html, style.css, script.js

설치 및 사용
1. 저장소를 로컬로 clone합니다.
2. 간단한 HTTP 서버로 index.html을 제공하세요 (브라우저 보안 때문에 파일://로 열면 모델 로드가 실패할 수 있습니다).
   - 예: `npx http-server` 또는 `python -m http.server 8000`
3. 페이지에서 이미지를 업로드하고 실제(정답) 레이블을 선택한 뒤 "판단하기" 버튼을 눌러 결과를 확인하세요.

기능
- 왼쪽: 이미지 업로드 및 미리보기 (화면의 약 1/4 크기로 표시)
- 오른쪽 상단: 혼동행렬 (정분류: 연두색, 오분류 및 불확실: 붉은색)
- 오른쪽 하단: 오답/불확실 사진 갤러리 (파일명과 예측 확률 포함)
- 정확도는 전체 입력 수에 대해 계산되며, 확신이 없는(확률 < 60%) 경우는 오답으로 간주됩니다.

참고: 모델 라벨은 페이지에 동적으로 반영됩니다.
