/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AQUAFUZZY ANALYTICS - FUZZY C-MEANS (FCM) CLUSTERING
 * Algoritmo de Agrupamiento Difuso para Diagnóstico Industrial
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Este módulo implementa el algoritmo Fuzzy C-Means para diagnóstico predictivo
 * de equipos industriales. A diferencia del K-Means tradicional donde cada punto
 * pertenece a UN SOLO clúster, en FCM cada punto tiene un GRADO DE MEMBRESÍA
 * a todos los clústeres.
 * 
 * ¿POR QUÉ FUZZY C-MEANS PARA DIAGNÓSTICO?
 * =========================================
 * 
 * En el mundo real, las máquinas no pasan instantáneamente de "Normal" a "Falla".
 * Hay estados intermedios:
 * 
 * - Una máquina puede estar 80% Normal y 20% en Alerta
 * - A medida que se degrada: 50% Normal, 40% Alerta, 10% Falla
 * - Finalmente: 10% Normal, 20% Alerta, 70% Falla
 * 
 * Esta transición gradual es EXACTAMENTE lo que FCM captura y K-Means no puede.
 * 
 * CONCEPTOS CLAVE:
 * ================
 * 
 * 1. GRADO DE MEMBRESÍA (μij):
 *    Valor entre 0 y 1 que indica cuánto pertenece el punto i al clúster j.
 *    La suma de membresías de un punto a todos los clústeres = 1.
 *    
 *    Ejemplo: Punto Xi con membresías [0.7, 0.2, 0.1] significa:
 *    - 70% de pertenencia al clúster "Normal"
 *    - 20% de pertenencia al clúster "Alerta"  
 *    - 10% de pertenencia al clúster "Falla"
 * 
 * 2. PARÁMETRO DE FUZZINESS (m):
 *    Controla qué tan "difusos" son los clústeres:
 *    - m = 1: Comportamiento similar a K-Means (membresías casi 0 o 1)
 *    - m = 2: Valor estándar, buen balance
 *    - m > 2: Clústeres muy difusos (más superposición)
 * 
 * 3. CENTROIDES:
 *    Centro de cada clúster, calculado como promedio ponderado por membresía.
 *    Los centroides se mueven iterativamente hasta converger.
 * 
 * 4. CONVERGENCIA:
 *    El algoritmo termina cuando los cambios en las membresías son menores
 *    que un umbral (tolerancia) o se alcanza el máximo de iteraciones.
 * 
 * APLICACIÓN EN MANTENIMIENTO PREDICTIVO:
 * =======================================
 * 
 * Clústeres típicos:
 * - NORMAL: Equipo funcionando correctamente
 * - ALERTA: Señales tempranas de degradación, requiere monitoreo
 * - FALLA INMINENTE: Requiere mantenimiento urgente
 * 
 * Features típicas:
 * - Vibración (mm/s)
 * - Temperatura (°C)
 * - Consumo de corriente (A)
 * - Ruido (dB)
 * 
 * @author AquaFuzzy Analytics Team
 * @version 2.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Punto de datos en el espacio de características
 */
export interface DataPoint {
    /** Identificador único del punto (ej: ID de máquina) */
    id: string
    /** Valores de las características (features) */
    features: number[]
    /** Etiqueta opcional (para datos etiquetados) */
    label?: string
    /** Timestamp opcional (para análisis temporal) */
    timestamp?: Date
    /** Membresías calculadas después de ejecutar FCM */
    memberships?: number[]
    /** Color interpolado basado en membresías */
    color?: string
}

/**
 * Configuración del algoritmo FCM
 */
export interface FCMConfig {
    /** Número de clústeres a formar */
    clusterCount: number
    /** Parámetro de fuzziness (típicamente 2) */
    fuzziness: number
    /** Máximo número de iteraciones */
    maxIterations: number
    /** Tolerancia para convergencia (cambio máximo en membresías) */
    tolerance: number
    /** Si se debe guardar el historial de cada iteración (para animación) */
    trackHistory: boolean
}

/**
 * Estado de una iteración del algoritmo (para animación)
 */
export interface IterationState {
    /** Número de iteración (0-indexed) */
    iteration: number
    /** Posiciones de los centroides */
    centroids: number[][]
    /** Matriz de membresías [punto][cluster] */
    membershipMatrix: number[][]
    /** Error de convergencia (max cambio en membresías) */
    convergenceError: number
    /** Función objetivo J (suma de distancias ponderadas) */
    objectiveFunction: number
}

/**
 * Resultado final del algoritmo FCM
 */
export interface FCMResult {
    /** Centroides finales de cada clúster */
    centroids: number[][]
    /** Matriz de membresías final [punto][cluster] */
    membershipMatrix: number[][]
    /** Historial de iteraciones (si trackHistory = true) */
    iterationHistory: IterationState[]
    /** Error de convergencia final */
    convergenceError: number
    /** Número total de iteraciones ejecutadas */
    iterationCount: number
    /** Etiquetas de clúster asignadas (el de mayor membresía) */
    clusterAssignments: number[]
    /** Si el algoritmo convergió antes del máximo de iteraciones */
    converged: boolean
}

/**
 * Definición de un clúster para generación de datos sintéticos
 */
export interface ClusterDefinition {
    /** Nombre del clúster (ej: "Normal", "Alerta", "Falla") */
    name: string
    /** Centro del clúster [x, y, ...] */
    center: number[]
    /** Desviación estándar para cada dimensión */
    stdDev: number[]
    /** Número de puntos a generar */
    count: number
    /** Color para visualización */
    color: string
}

/**
 * Resultado del análisis de riesgo de un punto
 */
export interface RiskAnalysis {
    /** Puntuación de riesgo (0-100, basada en membresía a clúster de falla) */
    riskScore: number
    /** Categoría de riesgo */
    riskCategory: 'low' | 'medium' | 'high' | 'critical'
    /** Clúster dominante */
    dominantCluster: number
    /** Descripción del estado */
    description: string
    /** Recomendación de acción */
    recommendation: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN POR DEFECTO
// ═══════════════════════════════════════════════════════════════════════════════

export const DEFAULT_FCM_CONFIG: FCMConfig = {
    clusterCount: 3,      // Normal, Alerta, Falla
    fuzziness: 2,         // Valor estándar en literatura
    maxIterations: 100,   // Suficiente para convergencia
    tolerance: 0.001,     // Cambio mínimo para considerar convergencia
    trackHistory: true    // Para animación
}

/**
 * Colores predefinidos para los clústeres de diagnóstico (hasta 5 estados de máquina)
 * Paleta diseñada para estados de salud de equipos industriales
 */
export const CLUSTER_COLORS = [
    'hsl(142, 76%, 45%)',  // Verde - Normal (operación óptima)
    'hsl(45, 93%, 47%)',   // Amarillo - Alerta (señales tempranas)
    'hsl(25, 95%, 53%)',   // Naranja - Precaución (degradación activa)
    'hsl(0, 84%, 60%)',    // Rojo - Degradación Severa
    'hsl(330, 80%, 50%)'   // Magenta - Falla Inminente
]

/**
 * Nombres descriptivos para los estados de máquina (hasta 5)
 * Usados en leyendas, inspector de punto y análisis de riesgo
 */
export const CLUSTER_NAMES = [
    'Normal',
    'Alerta',
    'Precaución',
    'Degradación',
    'Falla Inminente'
]

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula la distancia euclidiana entre dos puntos
 * 
 * @param p1 - Primer punto [x1, y1, ...]
 * @param p2 - Segundo punto [x2, y2, ...]
 * @returns Distancia euclidiana
 */
function euclideanDistance(p1: number[], p2: number[]): number {
    if (p1.length !== p2.length) {
        throw new Error(`Dimensiones no coinciden: ${p1.length} vs ${p2.length}`)
    }
    return Math.sqrt(
        p1.reduce((sum, val, i) => sum + Math.pow(val - p2[i], 2), 0)
    )
}

/**
 * Inicializa los centroides usando el método Forgy
 * (selección aleatoria de puntos existentes)
 * 
 * @param data - Array de puntos
 * @param k - Número de clústeres
 * @returns Centroides iniciales
 */
function initializeCentroids(data: DataPoint[], k: number): number[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, k).map(p => [...p.features])
}

/**
 * Calcula la función objetivo J (suma de distancias ponderadas)
 * Esta función mide qué tan bien los clústeres representan los datos
 * 
 * J = Σᵢ Σⱼ (μᵢⱼ)ᵐ × ||xᵢ - cⱼ||²
 * 
 * @param data - Puntos de datos
 * @param centroids - Centroides actuales
 * @param memberships - Matriz de membresías
 * @param m - Parámetro de fuzziness
 * @returns Valor de la función objetivo
 */
function calculateObjectiveFunction(
    data: DataPoint[],
    centroids: number[][],
    memberships: number[][],
    m: number
): number {
    let J = 0

    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < centroids.length; j++) {
            const distance = euclideanDistance(data[i].features, centroids[j])
            J += Math.pow(memberships[i][j], m) * Math.pow(distance, 2)
        }
    }

    return J
}

// ═══════════════════════════════════════════════════════════════════════════════
// ALGORITMO FUZZY C-MEANS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ejecuta el algoritmo Fuzzy C-Means
 * 
 * El algoritmo sigue estos pasos:
 * 1. Inicializar centroides aleatoriamente
 * 2. Calcular membresías de cada punto a cada clúster
 * 3. Actualizar centroides basándose en membresías
 * 4. Repetir hasta convergencia o max iteraciones
 * 
 * @param data - Array de puntos de datos
 * @param config - Configuración del algoritmo
 * @returns Resultado del clustering
 */
export function runFCM(data: DataPoint[], config: FCMConfig = DEFAULT_FCM_CONFIG): FCMResult {
    const { clusterCount: k, fuzziness: m, maxIterations, tolerance, trackHistory } = config

    if (data.length === 0) {
        throw new Error('No hay datos para procesar')
    }

    if (k > data.length) {
        throw new Error(`No se pueden crear ${k} clústeres con solo ${data.length} puntos`)
    }

    // Paso 1: Inicializar centroides
    let centroids = initializeCentroids(data, k)

    // Inicializar matriz de membresías
    let memberships: number[][] = data.map(() => Array(k).fill(1 / k))

    const iterationHistory: IterationState[] = []
    let converged = false
    let iteration = 0
    let prevMemberships = memberships.map(row => [...row])

    // Bucle principal del algoritmo
    while (iteration < maxIterations && !converged) {

        // ═══════════════════════════════════════════════════════════════
        // Paso 2: ACTUALIZAR MEMBRESÍAS
        // ═══════════════════════════════════════════════════════════════
        // 
        // La fórmula de membresía es:
        // 
        //              1
        // μᵢⱼ = ─────────────────────
        //       Σₖ (dᵢⱼ/dᵢₖ)^(2/(m-1))
        // 
        // Donde dᵢⱼ es la distancia del punto i al centroide j
        // 
        for (let i = 0; i < data.length; i++) {
            const distances = centroids.map(c => euclideanDistance(data[i].features, c))

            for (let j = 0; j < k; j++) {
                // Manejar caso cuando punto está exactamente en el centroide
                if (distances[j] === 0) {
                    memberships[i] = Array(k).fill(0)
                    memberships[i][j] = 1
                    break
                }

                // Calcular membresía usando la fórmula FCM
                let sumRatios = 0
                for (let l = 0; l < k; l++) {
                    if (distances[l] === 0) {
                        sumRatios = Infinity
                        break
                    }
                    sumRatios += Math.pow(distances[j] / distances[l], 2 / (m - 1))
                }

                memberships[i][j] = sumRatios === Infinity ? 0 : 1 / sumRatios
            }

            // Normalizar para asegurar que suman 1
            const sum = memberships[i].reduce((a, b) => a + b, 0)
            if (sum > 0) {
                memberships[i] = memberships[i].map(v => v / sum)
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // Paso 3: ACTUALIZAR CENTROIDES
        // ═══════════════════════════════════════════════════════════════
        // 
        // El nuevo centroide es el promedio ponderado por membresía:
        // 
        //       Σᵢ (μᵢⱼ)ᵐ × xᵢ
        // cⱼ = ─────────────────
        //       Σᵢ (μᵢⱼ)ᵐ
        // 
        const dimensionCount = data[0].features.length
        centroids = Array(k).fill(null).map((_, j) => {
            const newCentroid = Array(dimensionCount).fill(0)
            let weightSum = 0

            for (let i = 0; i < data.length; i++) {
                const weight = Math.pow(memberships[i][j], m)
                weightSum += weight
                for (let d = 0; d < dimensionCount; d++) {
                    newCentroid[d] += weight * data[i].features[d]
                }
            }

            return newCentroid.map(v => weightSum > 0 ? v / weightSum : v)
        })

        // ═══════════════════════════════════════════════════════════════
        // Paso 4: VERIFICAR CONVERGENCIA
        // ═══════════════════════════════════════════════════════════════
        // 
        // El algoritmo converge cuando el cambio máximo en las membresías
        // es menor que la tolerancia especificada
        // 
        let maxChange = 0
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < k; j++) {
                const change = Math.abs(memberships[i][j] - prevMemberships[i][j])
                maxChange = Math.max(maxChange, change)
            }
        }

        converged = maxChange < tolerance

        // Guardar historial si está habilitado (para animación)
        if (trackHistory) {
            const objectiveFunction = calculateObjectiveFunction(data, centroids, memberships, m)

            iterationHistory.push({
                iteration,
                centroids: centroids.map(c => [...c]),
                membershipMatrix: memberships.map(row => [...row]),
                convergenceError: maxChange,
                objectiveFunction
            })
        }

        // Preparar para siguiente iteración
        prevMemberships = memberships.map(row => [...row])
        iteration++
    }

    // Determinar asignaciones de clúster (el de mayor membresía)
    const clusterAssignments = memberships.map(row =>
        row.indexOf(Math.max(...row))
    )

    // Calcular error final
    const finalError = trackHistory && iterationHistory.length > 0
        ? iterationHistory[iterationHistory.length - 1].convergenceError
        : 0

    return {
        centroids,
        membershipMatrix: memberships,
        iterationHistory,
        convergenceError: finalError,
        iterationCount: iteration,
        clusterAssignments,
        converged
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE ANÁLISIS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el análisis de riesgo para un punto específico
 * 
 * En el contexto de mantenimiento predictivo:
 * - Clúster 0: Normal (bajo riesgo)
 * - Clúster 1: Alerta (riesgo medio)
 * - Clúster 2: Falla Inminente (alto riesgo)
 * 
 * @param memberships - Membresías del punto [normal, alerta, falla]
 * @param clusterNames - Nombres de los clústeres
 * @returns Análisis de riesgo detallado
 */
export function analyzeRisk(
    memberships: number[],
    clusterNames: string[] = CLUSTER_NAMES
): RiskAnalysis {
    // Asumiendo que el último clúster es el de "Falla"
    const failureIndex = memberships.length - 1
    const alertIndex = memberships.length > 2 ? memberships.length - 2 : 0

    // Score de riesgo: combinación ponderada de membresías problemáticas
    const riskScore = Math.round(
        (memberships[alertIndex] || 0) * 40 +
        (memberships[failureIndex] || 0) * 100
    )

    // Determinar categoría de riesgo
    let riskCategory: 'low' | 'medium' | 'high' | 'critical'
    let recommendation: string

    if (riskScore < 20) {
        riskCategory = 'low'
        recommendation = 'Operación normal. Continuar monitoreo estándar.'
    } else if (riskScore < 45) {
        riskCategory = 'medium'
        recommendation = 'Programar inspección preventiva en las próximas semanas.'
    } else if (riskScore < 70) {
        riskCategory = 'high'
        recommendation = 'Requiere inspección urgente. Considerar reducir carga operativa.'
    } else {
        riskCategory = 'critical'
        recommendation = '⚠️ ACCIÓN INMEDIATA: Programar mantenimiento correctivo antes de falla.'
    }

    // Encontrar clúster dominante
    const maxMembership = Math.max(...memberships)
    const dominantCluster = memberships.indexOf(maxMembership)

    // Generar descripción
    const description = `Membresía: ${memberships.map((m, i) =>
        `${clusterNames[i] || `C${i}`}: ${(m * 100).toFixed(1)}%`
    ).join(', ')}`

    return {
        riskScore: Math.min(100, riskScore),
        riskCategory,
        dominantCluster,
        description,
        recommendation
    }
}

/**
 * Interpola color basado en membresías a múltiples clústeres
 * 
 * @param memberships - Grados de membresía a cada clúster
 * @param colors - Colores HSL de cada clúster
 * @returns Color interpolado como string HSL
 */
export function interpolateClusterColor(
    memberships: number[],
    colors: string[] = CLUSTER_COLORS
): string {
    // Parsear colores HSL
    const parsedColors = colors.map(c => {
        const match = c.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
            return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) }
        }
        return { h: 0, s: 0, l: 50 }
    })

    // Interpolar basado en membresías
    let h = 0, s = 0, l = 0
    for (let i = 0; i < memberships.length && i < parsedColors.length; i++) {
        h += parsedColors[i].h * memberships[i]
        s += parsedColors[i].s * memberships[i]
        l += parsedColors[i].l * memberships[i]
    }

    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

// ═══════════════════════════════════════════════════════════════════════════════
// GENERACIÓN DE DATOS SINTÉTICOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Genera datos sintéticos para demostración del algoritmo
 * 
 * @param clusters - Definiciones de los clústeres a generar
 * @returns Array de puntos de datos sintéticos
 */
export function generateSyntheticData(clusters: ClusterDefinition[]): DataPoint[] {
    const data: DataPoint[] = []
    let id = 0

    for (const cluster of clusters) {
        for (let i = 0; i < cluster.count; i++) {
            // Generar punto con distribución gaussiana alrededor del centro
            const features = cluster.center.map((c, dim) => {
                // Box-Muller transform para distribución normal
                const u1 = Math.random()
                const u2 = Math.random()
                const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
                return c + normal * (cluster.stdDev[dim] || cluster.stdDev[0])
            })

            data.push({
                id: `M${String(id++).padStart(4, '0')}`,
                features,
                label: cluster.name,
                timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
            })
        }
    }

    // Mezclar datos
    return data.sort(() => Math.random() - 0.5)
}

/**
 * Configuración predeterminada para datos de demostración
 * Simula sensores de vibración (eje X) y temperatura (eje Y)
 */
export const DEFAULT_CLUSTER_DEFINITIONS: ClusterDefinition[] = [
    {
        name: 'Normal',
        center: [25, 45],      // Baja vibración, temperatura moderada
        stdDev: [5, 5],
        count: 60,
        color: CLUSTER_COLORS[0]
    },
    {
        name: 'Alerta',
        center: [55, 60],      // Vibración media-alta, temperatura elevada
        stdDev: [8, 8],
        count: 30,
        color: CLUSTER_COLORS[1]
    },
    {
        name: 'Falla Inminente',
        center: [85, 80],      // Alta vibración, alta temperatura
        stdDev: [6, 6],
        count: 15,
        color: CLUSTER_COLORS[2]
    }
]

/**
 * Añade datos con degradación temporal (para simulación)
 * Simula una máquina que se degrada gradualmente
 * 
 * @param baseData - Datos existentes
 * @param degradationSteps - Número de pasos de degradación
 * @returns Datos con serie temporal de degradación
 */
export function generateDegradationData(
    startPoint: number[],
    endPoint: number[],
    steps: number,
    machineId: string = 'DEG001'
): DataPoint[] {
    const data: DataPoint[] = []
    const now = Date.now()

    for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1)
        const features = startPoint.map((start, dim) => {
            const end = endPoint[dim]
            // Interpolación con algo de ruido
            const base = start + (end - start) * progress
            const noise = (Math.random() - 0.5) * 3
            return base + noise
        })

        data.push({
            id: `${machineId}_T${String(i).padStart(3, '0')}`,
            features,
            label: 'Degradation',
            timestamp: new Date(now - (steps - i) * 24 * 60 * 60 * 1000) // Un punto por día
        })
    }

    return data
}
