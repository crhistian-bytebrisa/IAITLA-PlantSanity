let currentImageBase64 = null;


// Muestra el archivo si no es nulo
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

// Limpiar archivo
function clearFile() {
  currentImageBase64 = null;
  document.getElementById('fileInput').value = '';
  document.getElementById('previewWrap').classList.remove('show');
  document.getElementById('previewImg').src = '';
}

//Obtener el Div donde se suelten las fotos
const dropzone = document.getElementById('dropzone');

//Al soltar una foto, se muestra en la pagina.
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});



//Mostrar error en el div
function showError(msg) {
  const el = document.getElementById('errorBox');
  el.textContent = msg;
  el.classList.add('show');
}

//Ocultarlo
function hideError() {
  document.getElementById('errorBox').classList.remove('show');
}

//Cambia la visibilidad de la carta, dependiendo del proceso
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
  currentImageBase64 = null;
  hideError();
  showPanel('inputPanel');
}

//Moldeo de datos de la API para el Front
function transformAzureResponse(data) {
  //Ordenar la probabilidad de mas alta a mas baja
  const sorted = data.predictions.sort((a, b) => b.probability - a.probability);

  //Hacer el mapeo, retornando los datos necesarios
  const diagnoses = sorted.map(p => {
    let severity = 'info';

    //Dependiendo de que tan sana este la info es diferente.
    if (p.tagName === 'sana') severity = 'healthy';
    else if (p.probability > 0.6) severity = 'danger';
    else if (p.probability > 0.3) severity = 'warning';

    //Retorna los datos
    return {
      name: p.tagName.replaceAll('_', ' '),
      nameEn: p.tagName,
      percentage: (p.probability * 100).toFixed(1),
      severity
    };
  });

  //La probabilidad mas alta
  const top = sorted[0];

  //Veredicto
  let verdict = '';

  //Sana
  if (top.tagName === 'sana') {
    verdict = 'La planta parece estar saludable.';
  } 
  
  //Tiene alguna de las enfermedades
  else {
    verdict = `Posible problema detectado: ${top.tagName.replaceAll('_', ' ')}. Se recomienda revisar la planta.`;
  }

  return { diagnoses, verdict };
}

//Proceso de peticiones y verificaciones
async function analyze() {
  //Tapar cualquier error pasado
  hideError();

  //Verificar imagen
  if (!currentImageBase64) {
    showError('Por favor selecciona una imagen primero.');
    return;
  }


  //
  const thumbSrc = document.getElementById('previewImg').src;

  //Renderizar la carga
  showPanel('loadingCard');

  try {
    //Hacer la peticion a la API (la API intermedia que tenemos no la de Azure)
    const response = await fetch("/analyze", {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        imageBase64: currentImageBase64
      })
    });

    //Retornar error
    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    //Recibir data
    const data = await response.json();

    //tranformarla
    const result = transformAzureResponse(data);

    //
    renderResults(result, thumbSrc);

  } catch (err) {
    showPanel('inputPanel');
    showError('Error al analizar: ' + (err.message || 'Intenta de nuevo.'));
  }
}

//Renderizar resultados
function renderResults(result, thumbSrc) {
  // Thumbnail (imagen en miniatura)
  const thumb = document.getElementById('resultThumb');
  if (thumbSrc) {
    thumb.src = thumbSrc;
    thumb.classList.add('show');
    thumb.onerror = () => thumb.classList.remove('show');
  }

  //Crear las barritas de porcentaje
  const list = document.getElementById('diagnosisList');
  list.innerHTML = '';

  const colorMap = {
    healthy: 'bar-healthy',
    warning: 'bar-warning',
    danger:  'bar-danger',
    info:    'bar-info'
  };

  result.diagnoses.forEach((d, i) => {
    //Creacion de los items
    const item = document.createElement('div');
    item.className = 'diagnosis-item';
    item.style.animationDelay = `${i * 0.1}s`;

    //Toma la clase dependiendo su severidad
    const colorClass = colorMap[d.severity] || 'bar-info';

    //El HTML de cada Item (barrita)
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

    //Se agrean a la lista que ira luego a la carta
    list.appendChild(item);
  });

  //Mostrar recomendacion final
  document.getElementById('verdict').innerHTML =
    `<strong>💡 Recomendación:</strong> ${result.verdict}`;

  //Mostrar los resultados en la Card
  showPanel('resultsCard');

  //Animarlas en lo que van mostrandose
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll('.bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.pct + '%';
      });
    });
  });
}