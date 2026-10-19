// script.js
const MODEL_BASE = "https://teachablemachine.withgoogle.com/models/DZQZEKHCH/";
let model = null;
let labels = [];
let totals = 0;
let corrects = 0;
let wrongItems = [];

const imageInput = document.getElementById('imageInput');
const preview = document.getElementById('preview');
const filenameEl = document.getElementById('filename');
const classifyBtn = document.getElementById('classifyBtn');
const clearBtn = document.getElementById('clearBtn');
const actualLabelSelect = document.getElementById('actualLabelSelect');
const confusionTable = document.getElementById('confusionTable');
const gallery = document.getElementById('gallery');
const accuracyText = document.getElementById('accuracyText');

async function init() {
  const modelURL = MODEL_BASE + 'model.json';
  const metadataURL = MODEL_BASE + 'metadata.json';

  try {
    console.log('Loading model from', MODEL_BASE);
    // Load tmImage model
    model = await tmImage.load(modelURL, metadataURL);

    // Try to read labels from metadata.json (most reliable)
    try {
      const res = await fetch(metadataURL);
      if (res.ok) {
        const meta = await res.json();
        if (Array.isArray(meta.labels) && meta.labels.length) {
          labels = meta.labels.slice();
        } else if (Array.isArray(meta.classNames) && meta.classNames.length) {
          labels = meta.classNames.slice();
        }
      }
    } catch (e) {
      console.warn('Could not fetch metadata.json, falling back to model API', e);
    }

    // Fallbacks if labels still empty
    if (!labels || labels.length === 0) {
      if (typeof model.getTotalClasses === 'function') {
        const n = model.getTotalClasses();
        // try to create generic labels if we can't read names
        labels = Array.from({ length: n }, (_, i) => 'Class ' + i);
      } else if (Array.isArray(model.labels) && model.labels.length) {
        labels = model.labels.slice();
      } else {
        // last resort
        labels = ['Class 0', 'Class 1'];
      }
    }

    populateActualSelect();
    resetMatrix();
    renderMatrix();
    console.log('Model loaded. Labels:', labels);
  } catch (err) {
    console.error('모델 로드 실패', err);
    alert('모델을 불러오는 데 실패했습니다. 콘솔을 확인하세요.');
  }
}

function populateActualSelect() {
  actualLabelSelect.innerHTML = '';
  labels.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l;
    actualLabelSelect.appendChild(opt);
  });
}

let matrix = [];
function resetMatrix() {
  matrix = [];
  for (let i = 0; i < labels.length; i++) {
    matrix.push(new Array(labels.length + 1).fill(0)); // +1 for '불확실'
  }
  totals = 0;
  corrects = 0;
  wrongItems = [];
  renderGallery();
}

function renderMatrix() {
  confusionTable.innerHTML = '';
  const numCols = labels.length + 2; // row header + label cols + uncertain
  const colgroup = document.createElement('colgroup');
  for (let i = 0; i < numCols; i++) colgroup.appendChild(document.createElement('col'));
  confusionTable.appendChild(colgroup);

  const thead = document.createElement('thead');
  const htr = document.createElement('tr');
  const empty = document.createElement('th');
  empty.textContent = '실제 \ 예측';
  htr.appendChild(empty);
  labels.forEach(l => { const th = document.createElement('th'); th.textContent = l; htr.appendChild(th); });
  const uth = document.createElement('th'); uth.textContent = '불확실'; htr.appendChild(uth);
  thead.appendChild(htr);
  confusionTable.appendChild(thead);

  const tbody = document.createElement('tbody');
  labels.forEach((lab, i) => {
    const tr = document.createElement('tr');
    const ath = document.createElement('th'); ath.textContent = lab; tr.appendChild(ath);
    for (let j = 0; j < labels.length + 1; j++) {
      const td = document.createElement('td');
      td.dataset.row = i; td.dataset.col = j;
      td.textContent = matrix[i] ? matrix[i][j] : 0;
      if (j === i && matrix[i] && matrix[i][j] > 0) td.classList.add('cell-correct');
      else if (matrix[i] && matrix[i][j] > 0) td.classList.add('cell-wrong');
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
    const r = Number(td.dataset.row); const c = Number(td.dataset.col);
    td.textContent = matrix[r][c];
  });
  updateAccuracyText();
}

function updateAccuracyText() {
  const acc = totals === 0 ? 0 : Math.round((corrects / totals) * 10000) / 100;
  accuracyText.textContent = `정확도: ${acc}% (${corrects}/${totals})`;
}

imageInput.addEventListener('change', e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const url = window.URL.createObjectURL(f);
  preview.src = url;
  filenameEl.textContent = f.name;
  preview.onload = () => { try { window.URL.revokeObjectURL(url); } catch (e) {} };
});

classifyBtn.addEventListener('click', async () => {
  if (!model) { alert('모델이 아직 로드되지 않았습니다.'); return; }
  if (!preview.src) { alert('사진을 업로드하세요.'); return; }
  const actual = actualLabelSelect.value;
  if (!actual) { alert('실제 레이블을 선택하세요.'); return; }

  try {
    const preds = await model.predict(preview, false);
    // preds might have different key names depending on version
    const formatted = preds.map(p => ({ label: p.className || p.label || p.class || p.name, prob: p.probability || p.prob || 0 }));
    formatted.sort((a,b) => b.prob - a.prob);
    const top = formatted[0];
    const confidence = top.prob;
    let predLabel = top.label || '---';
    let predIndex = labels.indexOf(predLabel);
    let isUncertain = false;
    if (confidence < 0.6 || predIndex === -1) { isUncertain = true; predIndex = labels.length; predLabel = '불확실'; }

    const actualIndex = labels.indexOf(actual);
    if (actualIndex === -1) { alert('선택한 실제 레이블이 목록에 없습니다.'); return; }

    matrix[actualIndex][predIndex] = (matrix[actualIndex][predIndex] || 0) + 1;
    totals += 1;
    if (!isUncertain && predIndex === actualIndex) corrects += 1;

    if (isUncertain || predIndex !== actualIndex) {
      // add to gallery
      const canvas = document.createElement('canvas');
      const img = preview;
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const thumb = canvas.toDataURL('image/jpeg', 0.7);
      wrongItems.push({ name: filenameEl.textContent || ('image-' + totals), url: thumb, trueLabel: actual, predLabel, confidence });
      renderGallery();
    }

    updateMatrixDisplay();
  } catch (err) {
    console.error('Prediction error', err);
    alert('예측 중 오류가 발생했습니다. 콘솔을 확인하세요.');
  }
});

function renderGallery() {
  gallery.innerHTML = '';
  if (wrongItems.length === 0) { gallery.innerHTML = '<div style="color:#666">오답이 없습니다.</div>'; return; }
  wrongItems.forEach(it => {
    const d = document.createElement('div'); d.className = 'gallery-item';
    const img = document.createElement('img'); img.src = it.url; img.alt = it.name; img.style.width = '120px';
    const meta = document.createElement('div'); meta.className = 'meta'; meta.innerHTML = `<div>${it.name}</div><div>${it.trueLabel} → ${it.predLabel} (${Math.round(it.confidence*100)}%)</div>`;
    d.appendChild(img); d.appendChild(meta); gallery.appendChild(d);
  });
}

clearBtn.addEventListener('click', () => { preview.src = ''; imageInput.value = ''; filenameEl.textContent = ''; });

// initialize
init();
