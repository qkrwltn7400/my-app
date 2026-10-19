# my-app — 직육면체 판별기 (초등학교 5학년 수업용)

이 프로젝트는 사진(또는 웹캠)을 보고 해당 물체가 직육면체(정육면체 포함)인지 아닌지를 판별하는 간단한 웹 앱입니다. 수업 시간에 Teachable Machine으로 만든 이미지 분류 모델을 보여주고, 학생들이 모델이 어떻게 판단하는지 실습해볼 수 있도록 구성되어 있습니다. GitHub와 Vercel을 연결해 간단히 배포할 수 있습니다.

---

## 데모
- 로컬: 브라우저에서 index.html을 열어 테스트할 수 있습니다.
- 배포(예시): Vercel과 연결하면 https://<your-project>.vercel.app 에서 바로 사용 가능합니다.

---

## 프로젝트 구성(권장)
- public/ 또는 static/ : 정적 파일 (HTML/CSS/JS)
- public/model/ : Teachable Machine에서 내보낸 모델 파일들 (model.json, metadata.json, weights.bin 등)
- src/ : (선택) React, Next.js 등 앱 소스
- README.md : 이 파일

---

## 요구사항
- 최신 브라우저(크롬, 엣지, 파이어폭스 등)
- (로컬 개발) Node.js & npm (선택사항: 빌드 도구 사용 시)
- 인터넷 연결 (모델을 원격에서 불러오는 경우)

---

## 설치 및 로컬 실행(간단한 정적 페이지 가정)
1. 레포지토리 복제
   - git clone https://github.com/qkrwltn7400/my-app.git
2. 모델 파일을 `public/model/` (또는 프로젝트에서 사용하는 정적 폴더) 안에 넣습니다.
3. 로컬에서 확인
   - 정적 파일만 있을 경우 파일을 직접 열어 보거나 간단한 정적 서버 사용:
     - Python: `python3 -m http.server 8000` (프로젝트 루트에서)  
       브라우저에서 http://localhost:8000 접근
     - 또는 VSCode의 Live Server 확장 사용

(React/Next.js 등 프레임워크를 사용하면 각 프레임워크의 빌드/개발 명령을 사용하세요.)

---

## Teachable Machine 모델 다운로드 및 배치
1. Teachable Machine에서 이미지 프로젝트 생성 및 학습
   - 클래스 예시: `직육면체`, `직육면체아님` (원하면 더 많은 예제 클래스 추가)
2. 모델 내보내기: Export → TensorFlow.js
3. 다운로드한 폴더(예: `my-model/`)의 내용을 프로젝트의 `public/model/` 폴더로 복사
   - 파일들 예: `model.json`, `metadata.json`, `weights.bin` 등
4. 모델 경로(아래 코드 예시의 `URL`)를 실제 위치로 맞춰주세요.

---

## 모델 로딩 및 간단한 사용 예시 (Teachable Machine Image JS)
HTML에 Teachable Machine 스크립트를 포함하고 모델을 로드하는 예:

```html
<!-- index.html 안에 -->
<script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8/dist/teachablemachine-image.min.js"></script>

<script>
  // 모델이 public/model/에 있다고 가정
  const URL = "./model/"; // 또는 "/model/"

  let model, maxPredictions;

  async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    // 이후 웹캠/이미지 업로드에서 model.predict()를 사용
  }

  async function predictFromImage(imageElement) {
    const prediction = await model.predict(imageElement);
    // prediction은 각 클래스에 대한 확률을 포함
    console.log(prediction);
  }

  init();
</script>
```

참고: 웹캠을 사용하려면 Teachable Machine 예제의 webcam 코드(웹캠 권한 요청, 캔버스 업데이트 등)를 참고하세요.

---

## Vercel에 배포하기
1. Vercel 계정 생성 및 로그인
2. Vercel에서 "Import Project" → GitHub 연결 → 해당 리포지토리 선택
3. 빌드 설정
   - 정적 사이트인 경우: 빌드 명령 비움, Output Directory 비움(또는 `/`), Vercel이 자동 감지
   - React/Next.js 프로젝트면 각 프레임워크에 맞춘 빌드 명령(`npm run build`)과 출력 폴더 설정
4. 배포 후 `https://<project>.vercel.app`에서 모델이 정상적으로 로드되는지 확인
   - 모델 파일을 정적 자원(public)에 넣었다면 별도 환경변수 불필요
   - 모델을 외부 URL로 불러올 경우 CORS 문제를 확인하세요

---

## 수업 활용 가이드 (초등학교 5학년용)
목표
- 학생들이 직육면체의 특징을 복습하고, 시각적 단서를 통해 직육면체를 식별하는 법을 이해한다.
- 기초적인 머신러닝(이미지 분류)의 개념을 체험적으로 접한다.

준비물
- 시연용 노트북 또는 빔프로젝터 연결된 컴퓨터
- 여러 각도에서 찍은 물체 사진(직육면체 예: 교구 상자, 책, 정육면체 예: 주사위 등 / 직육면체 아님 예: 공, 원통, 원형 접시)
- (선택) 학생용 태블릿 또는 스마트폰

진행 순서 (약 30–45분)
1. 도입(5분): 직육면체의 정의와 특징(모서리, 면의 모양 등) 간단 복습
2. 시범(10분): 웹 앱 실행 → 웹캠 또는 사진 업로드로 모델에 이미지 넣어보기. 모델의 예측(확률)을 보여주며 설명
   - 예: "이 사진은 85% 확률로 직육면체입니다" → 왜 그렇게 나왔는지 학생들과 토의
3. 실습(15–20분): 학생들이 직접 물건을 가져와 모델에 넣어보기(소그룹 또는 순서대로)
   - 학생들이 왜 맞거나 틀렸는지 토의하게 함
4. 정리(5–10분): 관찰된 오류 사례와 모델의 한계(데이터 편중, 각도 문제 등) 설명

평가 및 확장
- 간단한 퀴즈: 사진을 보고 직육면체인지 표시하게 하여 정오 확인
- 더 나아가, 학생들과 함께 추가 사진을 모아 모델을 재학습해보는 프로젝트 확장 가능

수업 중 교사용 팁
- 모델이 틀렸을 때 학생들이 이유를 추론하게 하고, 직육면체의 정의로 되돌아가게 하세요.
- 모델의 확률값을 보여줘 학생들이 '불확실성' 개념을 이해하도록 유도하면 좋습니다.

---

## 모델 개선 아이디어
- 더 다양한 각도, 다른 배경, 조명 조건에서 사진을 수집하여 모델 재학습
- 정육면체(주사위 등)과 일반 직육면체를 별도 클래스로 분리하여 상세 판별
- 학생들이 직접 사진을 업로드하고 라벨링해 데이터셋을 확장

---

## 기여 및 라이선스
- 교육적 목적으로 자유롭게 사용, 수정 가능합니다.
- 간단한 기여(더 좋은 예제 사진, 수업 자료 등)는 PR로 환영합니다.

---

문의
- 작성자: (담임교사 이름 또는 연락처 기입)
- 프로젝트 관련하여 README를 그대로 리포지토리에 커밋해드리길 원하시면 알려주세요.
