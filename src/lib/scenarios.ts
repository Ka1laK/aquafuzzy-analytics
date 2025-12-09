/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AQUAFUZZY ANALYTICS - ESCENARIOS DE SIMULACIÓN
 * Definiciones de eventos ambientales para el simulador de tratamiento de agua
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * Un keyframe define el estado de los parámetros en un momento específico
 */
export interface ScenarioKeyframe {
    /** Tiempo en milisegundos desde el inicio del escenario */
    time: number
    /** Turbidez objetivo en NTU */
    turbidity: number
    /** pH objetivo */
    ph: number
    /** Temperatura objetivo en °C */
    temperature: number
}

/**
 * Escenario de simulación ambiental
 */
export interface Scenario {
    /** Identificador único */
    id: string
    /** Nombre para mostrar */
    name: string
    /** Descripción del evento */
    description: string
    /** Icono (emoji) representativo */
    icon: string
    /** Duración total en milisegundos */
    duration: number
    /** Keyframes que definen la evolución de parámetros */
    keyframes: ScenarioKeyframe[]
    /** Color temático del escenario */
    themeColor: string
}

/**
 * Interpola valores entre dos keyframes
 */
export function interpolateKeyframes(
    keyframes: ScenarioKeyframe[],
    currentTime: number
): { turbidity: number; ph: number; temperature: number } {
    // Encontrar keyframes anterior y siguiente
    let prevKeyframe = keyframes[0]
    let nextKeyframe = keyframes[keyframes.length - 1]

    for (let i = 0; i < keyframes.length - 1; i++) {
        if (currentTime >= keyframes[i].time && currentTime <= keyframes[i + 1].time) {
            prevKeyframe = keyframes[i]
            nextKeyframe = keyframes[i + 1]
            break
        }
    }

    // Calcular progreso entre keyframes
    const duration = nextKeyframe.time - prevKeyframe.time
    const progress = duration > 0
        ? (currentTime - prevKeyframe.time) / duration
        : 1

    // Interpolar con easing suave
    const eased = easeInOutCubic(Math.max(0, Math.min(1, progress)))

    return {
        turbidity: prevKeyframe.turbidity + (nextKeyframe.turbidity - prevKeyframe.turbidity) * eased,
        ph: prevKeyframe.ph + (nextKeyframe.ph - prevKeyframe.ph) * eased,
        temperature: prevKeyframe.temperature + (nextKeyframe.temperature - prevKeyframe.temperature) * eased
    }
}

/**
 * Función de easing cúbica para transiciones suaves
 */
function easeInOutCubic(t: number): number {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESCENARIOS PREDEFINIDOS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TORMENTA SÚBITA
 * 
 * Simula una tormenta intensa que incrementa drásticamente la turbidez
 * debido al arrastre de sedimentos. El pH desciende ligeramente por
 * la lluvia ácida típica de zonas urbanas/industriales.
 */
export const STORM_SCENARIO: Scenario = {
    id: 'storm',
    name: 'Tormenta Súbita',
    description: 'Simula una tormenta intensa que arrastra sedimentos al agua cruda, aumentando drásticamente la turbidez y acidificando ligeramente el pH.',
    icon: '⛈️',
    duration: 30000, // 30 segundos
    themeColor: 'hsl(220, 70%, 50%)',
    keyframes: [
        { time: 0, turbidity: 50, ph: 7.0, temperature: 22 },   // Estado inicial normal
        { time: 3000, turbidity: 200, ph: 6.8, temperature: 20 },   // Inicio de tormenta
        { time: 6000, turbidity: 650, ph: 6.5, temperature: 18 },   // Pico de turbidez
        { time: 10000, turbidity: 800, ph: 6.3, temperature: 17 },   // Máxima intensidad
        { time: 15000, turbidity: 500, ph: 6.5, temperature: 18 },   // Tormenta amainando
        { time: 20000, turbidity: 250, ph: 6.7, temperature: 19 },   // Recuperación
        { time: 25000, turbidity: 120, ph: 6.9, temperature: 21 },   // Casi normal
        { time: 30000, turbidity: 60, ph: 7.0, temperature: 22 }    // Estado final estable
    ]
}

/**
 * VERTIDO INDUSTRIAL ÁCIDO
 * 
 * Simula un vertido accidental de sustancias ácidas de origen industrial.
 * La turbidez aumenta moderadamente, pero el pH cae drásticamente,
 * requiriendo corrección intensiva.
 */
export const INDUSTRIAL_ACID_SPILL: Scenario = {
    id: 'acid_spill',
    name: 'Vertido Industrial Ácido',
    description: 'Simula un vertido accidental de sustancias ácidas. El pH cae drásticamente requiriendo neutralización de emergencia.',
    icon: '🏭',
    duration: 25000,
    themeColor: 'hsl(45, 90%, 50%)',
    keyframes: [
        { time: 0, turbidity: 40, ph: 7.2, temperature: 23 },   // Normal
        { time: 2000, turbidity: 80, ph: 6.0, temperature: 24 },   // Inicio vertido
        { time: 5000, turbidity: 150, ph: 4.5, temperature: 26 },   // Pico ácido
        { time: 8000, turbidity: 200, ph: 3.8, temperature: 28 },   // Máximo impacto
        { time: 12000, turbidity: 180, ph: 4.2, temperature: 27 },   // Dilución iniciando
        { time: 16000, turbidity: 120, ph: 5.5, temperature: 25 },   // Recuperándose
        { time: 20000, turbidity: 80, ph: 6.5, temperature: 24 },   // Casi normal
        { time: 25000, turbidity: 45, ph: 7.0, temperature: 23 }    // Recuperado
    ]
}

/**
 * VERTIDO INDUSTRIAL ALCALINO
 * 
 * Simula un vertido de sustancias alcalinas (ej: lavandería industrial,
 * industria papelera). El pH sube significativamente.
 */
export const INDUSTRIAL_ALKALINE_SPILL: Scenario = {
    id: 'alkaline_spill',
    name: 'Vertido Industrial Alcalino',
    description: 'Simula un vertido de sustancias alcalinas típico de industrias papeleras o de lavandería. El pH sube requiriendo acidificación.',
    icon: '🧪',
    duration: 25000,
    themeColor: 'hsl(280, 70%, 50%)',
    keyframes: [
        { time: 0, turbidity: 35, ph: 7.0, temperature: 22 },
        { time: 2000, turbidity: 60, ph: 8.5, temperature: 23 },
        { time: 5000, turbidity: 100, ph: 10.0, temperature: 25 },
        { time: 8000, turbidity: 130, ph: 11.2, temperature: 28 },   // Máximo impacto
        { time: 12000, turbidity: 110, ph: 10.5, temperature: 26 },
        { time: 16000, turbidity: 80, ph: 9.0, temperature: 24 },
        { time: 20000, turbidity: 50, ph: 8.0, temperature: 23 },
        { time: 25000, turbidity: 40, ph: 7.2, temperature: 22 }
    ]
}

/**
 * RECUPERACIÓN DEL SISTEMA
 * 
 * Simula la normalización gradual desde un estado crítico hacia
 * condiciones óptimas. Útil para demostrar cómo el sistema
 * responde durante la fase de estabilización.
 */
export const RECOVERY_SCENARIO: Scenario = {
    id: 'recovery',
    name: 'Recuperación del Sistema',
    description: 'Simula la vuelta gradual a condiciones óptimas desde un estado crítico. Demuestra la respuesta del sistema durante la normalización.',
    icon: '🔄',
    duration: 20000,
    themeColor: 'hsl(142, 70%, 45%)',
    keyframes: [
        { time: 0, turbidity: 600, ph: 5.0, temperature: 30 },   // Estado crítico
        { time: 4000, turbidity: 400, ph: 5.8, temperature: 28 },
        { time: 8000, turbidity: 200, ph: 6.5, temperature: 26 },
        { time: 12000, turbidity: 100, ph: 6.9, temperature: 24 },
        { time: 16000, turbidity: 50, ph: 7.0, temperature: 22 },
        { time: 20000, turbidity: 25, ph: 7.1, temperature: 21 }    // Óptimo
    ]
}

/**
 * FLUCTUACIÓN DIURNA
 * 
 * Simula las variaciones típicas de un día en una fuente de agua
 * superficial, con cambios de temperatura y ligeras fluctuaciones
 * de turbidez.
 */
export const DIURNAL_FLUCTUATION: Scenario = {
    id: 'diurnal',
    name: 'Fluctuación Diurna',
    description: 'Simula variaciones típicas a lo largo de un día: cambios de temperatura, pequeñas fluctuaciones de turbidez por actividad biológica.',
    icon: '🌅',
    duration: 35000,
    themeColor: 'hsl(35, 80%, 55%)',
    keyframes: [
        { time: 0, turbidity: 30, ph: 7.0, temperature: 18 },   // Madrugada
        { time: 7000, turbidity: 45, ph: 7.1, temperature: 20 },   // Amanecer
        { time: 14000, turbidity: 70, ph: 7.3, temperature: 26 },   // Mediodía
        { time: 21000, turbidity: 55, ph: 7.2, temperature: 28 },   // Tarde
        { time: 28000, turbidity: 40, ph: 7.1, temperature: 24 },   // Atardecer
        { time: 35000, turbidity: 30, ph: 7.0, temperature: 19 }    // Noche
    ]
}

/**
 * CONDICIONES EXTREMAS
 * 
 * Escenario de prueba que lleva todos los parámetros a valores
 * extremos para probar los límites del sistema de control.
 */
export const EXTREME_CONDITIONS: Scenario = {
    id: 'extreme',
    name: 'Condiciones Extremas',
    description: 'Escenario de prueba de estrés: lleva todos los parámetros a valores extremos para evaluar la respuesta del sistema en límites operativos.',
    icon: '⚠️',
    duration: 20000,
    themeColor: 'hsl(0, 80%, 50%)',
    keyframes: [
        { time: 0, turbidity: 100, ph: 7.0, temperature: 22 },
        { time: 5000, turbidity: 950, ph: 3.5, temperature: 38 },  // Todo extremo
        { time: 10000, turbidity: 900, ph: 12.0, temperature: 5 },  // Extremo opuesto
        { time: 15000, turbidity: 500, ph: 7.0, temperature: 22 },  // Recuperando
        { time: 20000, turbidity: 80, ph: 7.0, temperature: 22 }   // Normal
    ]
}

/**
 * Lista de todos los escenarios disponibles
 */
export const ALL_SCENARIOS: Scenario[] = [
    STORM_SCENARIO,
    INDUSTRIAL_ACID_SPILL,
    INDUSTRIAL_ALKALINE_SPILL,
    RECOVERY_SCENARIO,
    DIURNAL_FLUCTUATION,
    EXTREME_CONDITIONS
]

/**
 * Obtiene un escenario por su ID
 */
export function getScenarioById(id: string): Scenario | undefined {
    return ALL_SCENARIOS.find(s => s.id === id)
}
