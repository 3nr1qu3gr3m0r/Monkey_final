# 🐒 MonkeyMarket - Asistente de Compras Inteligente

Este proyecto es un Asistente de Compras Inteligente diseñado para combatir la sobrecarga de información mediante el uso de Inteligencia Artificial (NLP), un sistema de recomendaciones justificadas y un carrito unificado simulado.

## 📋 Requisitos Previos
Asegúrate de tener instalado lo siguiente en tu entorno local antes de iniciar:
* [Node.js](https://nodejs.org/) (v16 o superior)
* [MySQL](https://www.mysql.com/) (Servidor de base de datos en ejecución)
* Python 3.8+ (Para el microservicio de IA - *Próximamente*)

---

## ⚙️ 1. Configuración del Backend Core (Node.js)

1. Abre una terminal y navega a la carpeta del backend:
   ```bash
   cd backend
   
2. Instala las dependencias usando el package-lock.json
   npm ci
3.Crea un archivo llamado .env en la raíz ede la carpeta backend y agrega las siguientes variables
  PORT=3000
  FRONTEND_URL=http://localhost:5173
  # DB_HOST=localhost
  # DB_USER=tu_usuario
  # DB_PASSWORD=tu_password
  # DB_NAME=monkeymarket_db
4. Levanta el servidor en modo desarrollo
     npm run dev
   
Configuración del frontend 🪅
1. Abre una nueva terminal (manteniendo el backend corriendo) y navega a la carpeta del frontend:
   cd frontend
2. Instala las dependencias de la interfaz:
     npm ci
3. Crea un archivo llamado .env en la raíz de la carpeta frontend:
   VITE_BACKEND_URL=http://localhost:3000
4. Levanta el servidor de desarrollo:
  npm run dev
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
