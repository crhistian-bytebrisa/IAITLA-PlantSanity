# 🌿 PlantSanity — Diagnóstico de Plantas con IA

PlantSanity es una aplicación web que permite analizar el estado de salud de una planta a partir de una imagen, utilizando inteligencia artificial (Azure Custom Vision).

---

## 🚀 Demo

👉 Próximamente disponible en producción (Render)

---

## 🧠 ¿Cómo funciona?

1. El usuario sube una imagen de una planta.
2. La imagen se convierte a formato Base64 en el navegador.
3. Se envía al backend (Express).
4. El backend convierte la imagen a binario.
5. Se envía a Azure Custom Vision.
6. Se recibe la predicción.
7. Se transforma y se muestra visualmente al usuario.

---

## 🏗️ Arquitectura

```
Frontend (HTML + JS)
        │
        ▼
Backend (Express API)
        │
        ▼
Azure Custom Vision
```

---

## 📁 Estructura del proyecto

```
PlantSanity/
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── server.js
├── package.json
└── .env (NO incluido)
```

---

## ⚙️ Tecnologías utilizadas

* Node.js
* Express
* JavaScript (Vanilla)
* Azure Custom Vision
* HTML5 / CSS3

---

## 🔐 Variables de entorno

Crea un archivo `.env` en la raíz:

```
AZURE_KEY=tu_api_key
AZURE_URL=tu_endpoint_de_prediccion
PORT=3000
```

⚠️ **Nunca subas este archivo a GitHub**

---

## 📦 Instalación local

```bash
git clone https://github.com/tu-usuario/PlantSanity.git
cd PlantSanity
npm install
```

---

## ▶️ Ejecutar el proyecto

```bash
node server.js
```

Luego abre:

```
http://localhost:3000
```

---

## ☁️ Deploy en Render

1. Crear un **Web Service**
2. Configurar:

```
Build Command: npm install
Start Command: node server.js
```

3. Agregar variables de entorno:

   * AZURE_KEY
   * AZURE_URL

---

## 📸 Características

* Drag & Drop de imágenes
* Previsualización (thumbnail)
* Barras de probabilidad
* Recomendación automática

---

## ⚠️ Limitaciones

* Dependencia de Azure Custom Vision
* Precisión depende del modelo entrenado
* No reemplaza diagnóstico profesional
* Faltan datos para ciertas verificaciones

---

## 🛡️ Seguridad

* API Key protegida en backend
* Uso de variables de entorno
* No exposición de credenciales en frontend

---

## 🚀 Posibles mejoras

* Compresión de imágenes
* Soporte para múltiples imágenes
* Historial de análisis
* Autenticación de usuarios
* Mejor UX/UI

---

## 📄 Licencia

Este proyecto es de uso educativo.
