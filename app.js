// ─────────────────────────────────────────
//  PlantSanity — app.js
// ─────────────────────────────────────────

// ── State ──
let currentTab = 'upload';
let currentImageBase64 = null;
let currentImageUrl = null;

// ── System prompt for the AI ──
const SYSTEM_PROMPT = `Eres un experto en fitopatología (enfermedades de plantas). El usuario te manda una foto de una planta.

Tu tarea: analiza la imagen y devuelve SOLO un objeto JSON válido (sin markdown, sin backticks, sin texto extra) con esta estructura exacta:

{
  "diagnoses": [
    { "name": "Nombre en español", "nameEn": "Name in english", "percentage": 72, "severity": "healthy|warning|danger|info" },
    ...
  ],
  "verdict": "Texto de 2-3 oraciones explicando el diagnóstico principal y recomendaciones.",
  "primaryDiagnosis": "Nombre del diagnóstico más probable"
}

Reglas:
- Los porcentajes deben sumar exactamente 100.
- Incluir siempre entre 2 y 5 diagnósticos posibles.
- Si la planta parece sana, el diagnóstico principal es "Planta sana" con severity "healthy".
- Enfermedades comunes: oídio, roya, manchas foliares, podredumbre, plagas de insectos, deficiencias nutricionales, etc.
- severity: "healthy" para sano, "warning" para leve/moderado, "danger" para grave, "info" para inconclusivo.
- El verdict debe ser claro, empático y en español.
- Si la imagen no es de una planta, devuelve diagnoses con un único item: name "No es una planta", percentage 100, severity "info", y un verdict apropiado.`;

// ── Tab switching ──
function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'upload') || (i === 1 && tab === 'url'));
  });

  document.getElementById('uploadPanel').style.display = tab === 'upload' ? '' : 'none';

  const urlPanel = document.getElementById('urlPanel');
  urlPanel.style.display = tab === 'url' ? 'block' : 'none';
  urlPanel.classList.toggle('show', tab === 'url');

  hideError();
}

// ── File handling ──
function handleFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    currentImageBase64 = e.target.result.split(',')[1];
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('previewWrap').classList.add('show');
  };
  reader.readAsDataURL(file);
}

function clearFile() {
  currentImageBase64 = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('previewWrap').classList.remove('show');
  document.getElementById('previewImg').src = '';
}

// ── Drag & Drop ──
const dropzone = document.getElementById('dropzone');

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

// ── Error helpers ──
function showError(msg) {
  const el = document.getElementById('errorBox');
  el.textContent = msg;
  el.classList.add('show');
}

function hideError() {
  document.getElementById('errorBox').classList.remove('show');
}

// ── Panel switcher ──
function showPanel(id) {
  const panels = ['inputPanel', 'loadingCard', 'resultsCard'];
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (p === 'loadingCard' || p === 'resultsCard') {
      el.classList.toggle('show', p === id);
    } else {
      el.style.display = p === id ? '' : 'none';
    }
  });
}

// ── Reset ──
function reset() {
  clearFile();
  document.getElementById('urlInput').value = '';
  currentImageBase64 = null;
  currentImageUrl = null;
  hideError();
  showPanel('inputPanel');
}

// ── Analyze ──
async function analyze() {
  hideError();

  let imageContent = null;
  let thumbSrc = null;

  if (currentTab === 'upload') {
    if (!currentImageBase64) {
      showError('Por favor selecciona una imagen primero.');
      return;
    }
    imageContent = {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: currentImageBase64 }
    };
    thumbSrc = document.getElementById('previewImg').src;

  } else {
    const url = document.getElementById('urlInput').value.trim();
    if (!url) {
      showError('Por favor ingresa una URL de imagen.');
      return;
    }
    if (!url.startsWith('http')) {
      showError('La URL debe comenzar con http:// o https://');
      return;
    }
    imageContent = { type: 'image', source: { type: 'url', url } };
    thumbSrc = url;
    currentImageUrl = url;
  }

  showPanel('loadingCard');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              imageContent,
              { type: 'text', text: 'Analiza esta planta y devuelve el JSON de diagnóstico.' }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || 'Error en la API');
    }

    const rawText = data.content.map(b => b.text || '').join('').trim();
    const clean = rawText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    renderResults(result, thumbSrc);

  } catch (err) {
    showPanel('inputPanel');
    showError('Error al analizar: ' + (err.message || 'Intenta de nuevo.'));
  }
}

// ── Render results ──
function renderResults(result, thumbSrc) {
  // Thumbnail
  const thumb = document.getElementById('resultThumb');
  if (thumbSrc) {
    thumb.src = thumbSrc;
    thumb.classList.add('show');
    thumb.onerror = () => thumb.classList.remove('show');
  }

  // Build diagnosis bars
  const list = document.getElementById('diagnosisList');
  list.innerHTML = '';

  const colorMap = {
    healthy: 'bar-healthy',
    warning: 'bar-warning',
    danger:  'bar-danger',
    info:    'bar-info'
  };

  result.diagnoses.forEach((d, i) => {
    const item = document.createElement('div');
    item.className = 'diagnosis-item';
    item.style.animationDelay = `${i * 0.1}s`;

    const colorClass = colorMap[d.severity] || 'bar-info';

    item.innerHTML = `
      <div class="diagnosis-top">
        <div class="diagnosis-name">
          ${d.name}
          <span class="en">${d.nameEn || ''}</span>
        </div>
        <div class="diagnosis-pct">${d.percentage}%</div>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${colorClass}" data-pct="${d.percentage}"></div>
      </div>`;

    list.appendChild(item);
  });

  // Verdict
  document.getElementById('verdict').innerHTML =
    `<strong>💡 Recomendación:</strong> ${result.verdict}`;

  showPanel('resultsCard');

  // Animate bars after paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    });
  });
}

// ── Init ──
document.getElementById('urlPanel').style.display = 'none';