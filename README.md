# AquaFuzzy Analytics 2.0

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/D3.js-7-orange?style=for-the-badge&logo=d3.js" alt="D3.js" />
</p>

**AquaFuzzy Analytics 2.0** es un laboratorio de simulación interactivo y educativo que demuestra conceptos avanzados de computación blanda (Soft Computing) a través de dos módulos prácticos: tratamiento de agua con lógica difusa y diagnóstico industrial con clustering difuso.

---

## 🚀 Características Principales

### Módulo 1: Simulador de Tratamiento de Agua
- **Motor de Lógica Difusa** con 20 reglas expertas para el proceso de coagulación-floculación
- **Visualización Reactiva del Tanque** con color dinámico basado en la calidad del agua
- **Sistema de Partículas** animado que representa la turbidez visualmente
- **6 Escenarios de Simulación** predefinidos (Tormenta, Vertido Industrial, etc.)
- **Dashboard SCADA** con métricas en tiempo real y gráfico de historial

### Módulo 2: Diagnóstico Industrial
- **Algoritmo Fuzzy C-Means (FCM)** con animación de convergencia paso a paso
- **Visualización D3.js** con puntos coloreados por grados de membresía
- **Panel de Inspección** con Score de Riesgo y recomendaciones
- **Generador de Datos Sintéticos** para experimentación
- **Guía Educativa Interactiva** con tour y explicaciones contextuales

---

## 📦 Stack Tecnológico

| Categoría | Tecnología |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Frontend | React 19, TypeScript (strict) |
| State Management | Zustand |
| Estilos | Tailwind CSS |
| Componentes UI | ShadCN/UI (personalizado) |
| Visualización | D3.js, Recharts |
| Animaciones | Framer Motion |
| Parsing CSV | Papaparse |

---

## 🛠️ Instalación y Ejecución

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar o navegar al directorio
cd aquafuzzy-analytics

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Build de Producción

```bash
npm run build
npm start
```

---

## 📖 Estructura del Proyecto

```
src/
├── app/                    # Páginas (App Router)
│   ├── page.tsx           # Página de inicio
│   ├── water/page.tsx     # Simulador de agua
│   └── diagnostics/page.tsx # Diagnóstico industrial
├── components/
│   ├── ui/                # Componentes ShadCN base
│   ├── water/             # Componentes del simulador de agua
│   │   ├── water-visualization.tsx
│   │   ├── parameter-controls.tsx
│   │   ├── simulation-controls.tsx
│   │   └── scada-dashboard.tsx
│   └── diagnostics/       # Componentes de diagnóstico
│       ├── fcm-visualization.tsx
│       ├── educational-panel.tsx
│       ├── convergence-controls.tsx
│       ├── point-inspector.tsx
│       └── data-controls.tsx
├── lib/
│   ├── fuzzy-logic.ts     # Motor de lógica difusa (documentado)
│   ├── fcm.ts             # Algoritmo Fuzzy C-Means (documentado)
│   ├── scenarios.ts       # Escenarios de simulación
│   └── utils.ts           # Utilidades generales
└── stores/
    ├── water-store.ts     # Estado del simulador de agua
    └── diagnostics-store.ts # Estado del diagnóstico
```

---

## 🧠 Conceptos de Lógica Difusa

### ¿Qué es la Lógica Difusa?

La lógica difusa permite trabajar con conceptos imprecisos como "alto", "medio", "bajo" en lugar de valores exactos. Es especialmente útil en sistemas de control donde las reglas expertas son más naturales que ecuaciones matemáticas complejas.

### Variables Lingüísticas en el Simulador

**Entradas:**
- **Turbidez**: Muy Baja, Baja, Media, Alta, Muy Alta (0-1000 NTU)
- **pH**: Muy Ácido, Ácido, Neutro, Alcalino, Muy Alcalino (0-14)
- **Temperatura**: Fría, Normal, Cálida (0-40°C)

**Salidas:**
- **Dosis de Coagulante**: 0-100 mg/L
- **Tiempo de Floculación**: 0-60 minutos
- **Corrección de pH**: Ninguna, Leve, Moderada, Intensa

### Ejemplo de Regla Difusa

```
SI (Turbidez es Alta) Y (pH es Neutro)
ENTONCES (Dosis Coagulante es Alta) Y (Tiempo Floculación es Largo)
```

---

## 📊 Algoritmo Fuzzy C-Means

### ¿Por qué FCM en lugar de K-Means?

En K-Means, cada punto pertenece a **un solo** clúster. En FCM, cada punto tiene **grados de membresía** a todos los clústeres, permitiendo estados intermedios:

| Máquina | Normal | Alerta | Falla |
|---------|--------|--------|-------|
| M001 | 0.85 | 0.12 | 0.03 |
| M002 | 0.45 | 0.48 | 0.07 |
| M003 | 0.10 | 0.25 | 0.65 |

Esto refleja mejor la realidad: una máquina no pasa instantáneamente de "Normal" a "Falla".

### Parámetro de Fuzziness (m)

- **m = 1**: Comportamiento similar a K-Means (membresías duras)
- **m = 2**: Valor estándar, buen equilibrio (usado por defecto)
- **m > 2**: Clústeres muy difusos

---

## 🎮 Guía de Uso

### Simulador de Agua

1. **Ajusta los parámetros** usando los sliders (Turbidez, pH, Temperatura)
2. Observa cómo **cambia el color del agua** y las métricas del dashboard
3. **Selecciona un escenario** (ej: "Tormenta Súbita") y haz clic en él
4. **Pulsa Play** para iniciar la simulación automática
5. Observa la evolución en tiempo real del gráfico de calidad

### Diagnóstico Industrial

1. **Genera datos sintéticos** o importa un CSV con tus datos
2. Ajusta los **parámetros FCM** (clústeres, fuzziness)
3. **Ejecuta el algoritmo** y observa la animación de convergencia
4. **Haz clic en un punto** para ver sus membresías y score de riesgo
5. Explora el **panel educativo** para entender los conceptos

---

## 📄 Documentación Adicional

- [`docs/USER_GUIDE_STUDENT.md`](docs/USER_GUIDE_STUDENT.md) - Guía para estudiantes
- [`docs/USER_GUIDE_ENGINEER.md`](docs/USER_GUIDE_ENGINEER.md) - Guía para ingenieros
- [`src/lib/fuzzy-logic.ts`](src/lib/fuzzy-logic.ts) - Documentación inline del motor difuso
- [`src/lib/fcm.ts`](src/lib/fcm.ts) - Documentación inline del algoritmo FCM

---

## 📝 Licencia

MIT License - Libre para uso educativo y comercial.

---

<p align="center">
  Desarrollado con ❤️ para la educación en Soft Computing
</p>
