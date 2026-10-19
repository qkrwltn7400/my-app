// script.js
const URL = "https://teachablemachine.withgoogle.com/models/DZQZEKHCH/";
let model, maxPredictions;

const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const filenameEl = document.getElementById('filename');
const classifyBtn = document.getElementById('classifyBtn');
const clearBtn = document.getElementById('clearBtn');
const actualLabelSelect = document.getElementById('actualLabelSelect');
const confusionTable = document.getElementById('confusionTable');
const gallery = document.getElementById('gallery');
const accuracyText = document.getElementById('accuracyText');

// confusion matrix data structures
let labels = [];
let matrix = null; // rows: actual labels, cols: predicted labels + '불확실'
let totals = 0;
let corrects = 0;
let wrongItems = [];

async function init() {
  const modelURL = URL + 'model.json';
  const metadataURL = URL + 'metadata.json';
  try {
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    labels = [];
    for (let i = 0; i < maxPredictions; i++) labels.push(model.getClassLabel(i));

    populateActualSelect();
    resetMatrix();
    renderMatrix();
  } catch (e) {
    console.error('모델 로드 실패', e);
    alert('모델을 불러오는 데 실패했습니다. 콘솔을 확인하세요.');
  }
}

function populateActualSelect() {
  actualLabelSelect.innerHTML = '';
  labels.forEach((lab, idx) => {
    const opt = document.createElement('option');
    opt.value = lab;
    opt.textContent = lab; // show the model's label text
    actualLabelSelect.appendChild(opt);
  });
}

function resetMatrix() {
  // columns = labels + '불확실'
  matrix = [];
  for (let i = 0; i < labels.length; i++) {
    const row = new Array(labels.length + 1).fill(0);
    matrix.push(row);
  }
  totals = 0;
  corrects = 0;
  wrongItems = [];
}

function renderMatrix() {
  // Build table with equal-width columns. First column for actual label names, next columns for predicted labels and '불확실'
  confusionTable.innerHTML = '';

  const colgroup = document.createElement('colgroup');
  const totalCols = labels.length + 1 + 1; // one col for row header + predicted cols + uncertain?
  // We'll create  (labels.length + 2) columns: row header + predicted label cols + uncertain
  // But to keep equal widths for matrix cells (as user requested), set each col to 25% when 4 cols, or equal when n cols.
  const numCols = labels.length + 2;
  for (let i = 0; i < numCols; i++) {
    const col = document.createElement('col');
    colgroup.appendChild(col);
  }
  confusionTable.appendChild(colgroup);

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  const emptyHeader = document.createElement('th');
  emptyHeader.textContent = 'Actual \ Predicted';
  headRow.appendChild(emptyHeader);
  labels.forEach(l => {
    const th = document.createElement('th');
    th.textContent = l;
    headRow.appendChild(th);
  });
  const uncertainTh = document.createElement('th');
  uncertainTh.textContent = '불확실';
  headRow.appendChild(uncertainTh);
  thead.appendChild(headRow);
  confusionTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  labels.forEach((actualLabel, i) => {
    const tr = document.createElement('tr');
    const actualTh = document.createElement('th');
    actualTh.textContent = actualLabel;
    tr.appendChild(actualTh);

    for (let j = 0; j < labels.length + 1; j++) {
      const td = document.createElement('td');
      td.dataset.row = i;
      td.dataset.col = j;
      td.textContent = matrix[i][j];
      // style color: diagonal (j === i) correct, uncertain (j === labels.length) wrong
      if (j === i) td.classList.add('cell-correct');
      else td.classList.add('cell-wrong');
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
  confusionTable.appendChild(tbody);

  updateAccuracyText();
}

function updateMatrixDisplay() {
  const tds = confusionTable.querySelectorAll('td');
  tds.forEach(td => {
    const r = Number(td.dataset.row);
    const c = Number(td.dataset.col);
    td.textContent = matrix[r][c];
  });
  updateAccuracyText();
}

function updateAccuracyText() {
  const acc = totals === 0 ? 0 : Math.round((corrects / totals) * 10000) / 100;
  accuracyText.textContent = `정확도: ${acc}% (${corrects}/${totals})`;
}

imageInput.addEventListener('change', (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const url = URLCreateObjectURL(file);
  preview.src = url;
  filenameEl.textContent = file.name;
  preview.onload = () => {
    URL.revokeObjectURL(url);
  };
});

function URLCreateObjectURL(file) {
  try { return window.URL.createObjectURL(file); }
  catch (e) { return ''; }
}

classifyBtn.addEventListener('click', async () => {
  if (!model) { alert('모델이 아직 로드되지 않았습니다.'); return; }
  if (!preview.src) { alert('사진을 먼저 업로드하세요.'); return; }
  const actual = actualLabelSelect.value;
  if (!actual) { alert('정답(Actual) 레이블을 선택하세요.'); return; }

  // run prediction on the image element
  const predictions = await model.predict(preview, false);
  // predictions: array of {className, probability}
  predictions.sort((a,b) => b.probability - a.probability);
  const top = predictions[0];
  const confidence = top.probability;
  let predicted = top.className;
  let predictedColIndex = labels.indexOf(predicted);
  let isUncertain = false;
  if (confidence < 0.6) {
    predicted = '불확실';
    isUncertain = true;
    predictedColIndex = labels.length; // last column is uncertain
  }

  // map actual label index
  const actualIndex = labels.indexOf(actual);
  if (actualIndex === -1) {
    alert('선택하신 정답 레이블이 모델 레이블과 일치하지 않습니다.');
    return;
  }

  // update matrix
  matrix[actualIndex][predictedColIndex] += 1;
  totals += 1;
  if (!isUncertain && predictedColIndex === actualIndex) corrects += 1;

  // if wrong or uncertain, add to gallery
  if (isUncertain || predictedColIndex !== actualIndex) {
    // grab displayed filename if present
    const fname = filenameEl.textContent || ('image-' + totals);
    const canvas = document.createElement('canvas');
    const img = preview;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const thumbUrl = canvas.toDataURL('image/jpeg', 0.7);
    wrongItems.push({ name: fname, url: thumbUrl, predicted, confidence });
    renderGallery();
  }

  updateMatrixDisplay();
});

function renderGallery() {
  gallery.innerHTML = '';
  wrongItems.forEach(it => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = it.url;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<div>${it.name}</div><div>예측: ${it.predicted} (${Math.round(it.confidence*100)}%)</div>`;
    div.appendChild(img);
    div.appendChild(meta);
    gallery.appendChild(div);
  });
}

clearBtn.addEventListener('click', () => {
  preview.src = '';
  imageInput.value = '';
  filenameEl.textContent = '';
});

// initialize on load
init();
