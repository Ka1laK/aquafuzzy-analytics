# 🔧 Guía para Ingenieros - AquaFuzzy Analytics 2.0

Esta guía técnica proporciona información detallada para ingenieros que deseen entender la implementación, extender las funcionalidades o integrar estos algoritmos en sistemas reales.

---

## 🏗️ Arquitectura del Sistema

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   /water     │  │ /diagnostics │  │   / (home)   │       │
│  │    Page      │  │    Page      │  │    Page      │       │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘       │
│         │                 │                                  │
│  ┌──────▼───────┐  ┌──────▼───────┐                         │
│  │  Zustand     │  │  Zustand     │                         │
│  │ water-store  │  │ diag-store   │                         │
│  └──────┬───────┘  └──────┬───────┘                         │
│         │                 │                                  │
│  ┌──────▼───────┐  ┌──────▼───────┐                         │
│  │ fuzzy-logic  │  │    fcm.ts    │                         │
│  │     .ts      │  │              │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

1. **Usuario** ajusta parámetros (sliders, botones)
2. **Componente** llama a una acción del **Zustand Store**
3. **Store** ejecuta la lógica de negocio (`fuzzy-logic.ts` o `fcm.ts`)
4. **Store** actualiza el estado
5. **Componentes** suscritos re-renderizan automáticamente

---

## 🧮 Motor de Lógica Difusa

### Configuración de Conjuntos Difusos

Los conjuntos difusos se definen en `src/lib/fuzzy-logic.ts` usando funciones trapezoidales:

```typescript
interface TrapezoidalSet {
  name: string
  points: [number, number, number, number] // [a, b, c, d]
}

// Función de membresía
//     ____
//    /    \
//   /      \
//  /        \
// a    b  c    d
```

### Añadir Nuevas Variables

Para añadir una nueva variable de entrada (ej: Sólidos Disueltos):

```typescript
// 1. Definir los conjuntos difusos
const TDS_SETS: TrapezoidalSet[] = [
  { name: 'bajo',    points: [0, 0, 200, 400] },
  { name: 'medio',   points: [300, 500, 700, 900] },
  { name: 'alto',    points: [800, 1000, 2000, 2000] }
]

// 2. Añadir al interface WaterInputs
interface WaterInputs {
  turbidity: number
  ph: number
  temperature: number
  tds: number  // Nueva
}

// 3. Actualizar runFuzzyInference para calcular membresías
const tdsMemberships = getMemberships(tds, TDS_SETS)

// 4. Añadir reglas que usen la nueva variable
```

### Añadir Nuevas Reglas

```typescript
const FUZZY_RULES: FuzzyRule[] = [
  // ... reglas existentes ...
  {
    id: 21,
    name: "Alta TDS con turbidez media",
    conditions: { turbidity: 'media', tds: 'alto' },
    outputs: { dose: 'alta', time: 'largo', phCorrection: 'moderate' },
    baseCost: 0.35
  }
]
```

---

## 📈 Algoritmo Fuzzy C-Means

### Parámetros Configurables

```typescript
interface FCMConfig {
  clusterCount: number      // Número de clústeres (k)
  fuzziness: number         // Parámetro m (típico: 2)
  maxIterations: number     // Límite de iteraciones
  tolerance: number         // Umbral de convergencia
  trackHistory: boolean     // Guardar historial para animación
}
```

### Fórmulas Matemáticas

**Actualización de membresías:**
```
μᵢⱼ = 1 / Σₖ (dᵢⱼ/dᵢₖ)^(2/(m-1))
```

**Actualización de centroides:**
```
cⱼ = Σᵢ (μᵢⱼ)ᵐ × xᵢ / Σᵢ (μᵢⱼ)ᵐ
```

**Criterio de convergencia:**
```
max(|μᵢⱼ(t) - μᵢⱼ(t-1)|) < tolerance
```

### Extensión para más Dimensiones

El algoritmo soporta n dimensiones. Para usar más de 2 features:

```typescript
// Generar datos con 3 dimensiones
const data = generateSyntheticData([
  {
    name: 'Normal',
    center: [25, 45, 100],      // [vibración, temperatura, corriente]
    stdDev: [5, 5, 10],
    count: 60,
    color: CLUSTER_COLORS[0]
  },
  // ... más clústeres
])
```

La visualización actual es 2D, pero los cálculos son n-dimensionales.

---

## 🔌 Integración con Sistemas Reales

### Importar Datos desde CSV

El formato esperado es:

```csv
id,feature1,feature2,label
M001,25.3,45.2,Normal
M002,55.8,62.1,Alerta
M003,82.5,78.3,Falla
```

### API de Exportación

Para integrar los resultados en otros sistemas:

```typescript
// En tu código
const result = runFCM(dataPoints, config)

// Exportar resultados
const exportData = dataPoints.map((point, i) => ({
  id: point.id,
  features: point.features,
  memberships: result.membershipMatrix[i],
  cluster: result.clusterAssignments[i],
  riskScore: analyzeRisk(result.membershipMatrix[i]).riskScore
}))

// Convertir a JSON o CSV según necesidad
```

### Conexión a SCADA Real

Para conectar con un sistema SCADA:

1. Crear un endpoint API que reciba datos de sensores
2. Llamar a `runFuzzyInference()` con los datos recibidos
3. Retornar las acciones recomendadas

```typescript
// app/api/inference/route.ts
import { runFuzzyInference } from '@/lib/fuzzy-logic'

export async function POST(request: Request) {
  const { turbidity, ph, temperature } = await request.json()
  
  const result = runFuzzyInference({ turbidity, ph, temperature })
  
  return Response.json({
    coagulantDose: result.coagulantDose,
    flocculationTime: result.flocculationTime,
    phCorrection: result.phCorrection,
    qualityScore: result.qualityScore
  })
}
```

---

## ⚙️ Personalización

### Colores de Clústeres

```typescript
// src/lib/fcm.ts
export const CLUSTER_COLORS = [
  'hsl(142, 76%, 45%)',  // Verde - Normal
  'hsl(45, 93%, 47%)',   // Amarillo - Alerta
  'hsl(0, 84%, 60%)'     // Rojo - Falla
]
```

### Nombres de Clústeres

Los nombres se pueden personalizar desde el store:

```typescript
const { setClusterName } = useDiagnosticsStore()
setClusterName(0, 'Operación Normal')
setClusterName(1, 'Mantenimiento Preventivo')
setClusterName(2, 'Parada de Emergencia')
```

### Escenarios de Simulación

Añadir nuevos escenarios en `src/lib/scenarios.ts`:

```typescript
export const MY_SCENARIO: Scenario = {
  id: 'my_scenario',
  name: 'Mi Escenario',
  description: 'Descripción del evento',
  icon: '🔧',
  duration: 20000, // ms
  themeColor: 'hsl(180, 50%, 50%)',
  keyframes: [
    { time: 0,     turbidity: 50,  ph: 7.0, temperature: 22 },
    { time: 10000, turbidity: 300, ph: 6.5, temperature: 25 },
    { time: 20000, turbidity: 50,  ph: 7.0, temperature: 22 }
  ]
}

// Añadir al array de todos los escenarios
export const ALL_SCENARIOS: Scenario[] = [
  // ... existentes ...
  MY_SCENARIO
]
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
npm run test
```

### Tests Unitarios Recomendados

```typescript
// fuzzy-logic.test.ts
describe('Fuzzy Inference', () => {
  it('should return high dose for high turbidity', () => {
    const result = runFuzzyInference({
      turbidity: 800,
      ph: 7,
      temperature: 22
    })
    expect(result.coagulantDose).toBeGreaterThan(70)
  })
})

// fcm.test.ts
describe('FCM Algorithm', () => {
  it('should converge in less than 100 iterations', () => {
    const data = generateSyntheticData(DEFAULT_CLUSTER_DEFINITIONS)
    const result = runFCM(data, { ...DEFAULT_FCM_CONFIG, maxIterations: 100 })
    expect(result.converged).toBe(true)
  })
})
```

---

## 📚 Referencias

- Zadeh, L.A. (1965). "Fuzzy Sets". Information and Control.
- Bezdek, J.C. (1981). "Pattern Recognition with Fuzzy Objective Function Algorithms".
- Mamdani, E.H. (1974). "Application of Fuzzy Algorithms for Control of Simple Dynamic Plant".

---

¿Preguntas técnicas? Revisa los comentarios extensos en `fuzzy-logic.ts` y `fcm.ts`.
