/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AQUAFUZZY ANALYTICS - FUZZY LOGIC ENGINE
 * Sistema de Inferencia Difusa para Tratamiento de Agua
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Este módulo implementa un sistema de lógica difusa para el control automático
 * de una planta de tratamiento de agua, específicamente para el proceso de
 * coagulación-floculación.
 * 
 * CONCEPTOS CLAVE:
 * ----------------
 * 
 * 1. VARIABLES LINGÜÍSTICAS:
 *    En lugar de usar valores numéricos exactos, usamos términos como "Alto",
 *    "Medio", "Bajo" que son más naturales para los operadores humanos.
 * 
 * 2. FUNCIONES DE MEMBRESÍA:
 *    Cada término lingüístico tiene una función que determina el "grado de
 *    pertenencia" de un valor numérico a ese término (0 = no pertenece, 1 = pertenece).
 *    Usamos funciones trapezoidales y triangulares.
 * 
 * 3. REGLAS DIFUSAS:
 *    SI (condición1 Y condición2) ENTONCES (conclusión)
 *    Estas reglas codifican el conocimiento experto del operador de la planta.
 * 
 * 4. DEFUZZIFICACIÓN:
 *    El proceso de convertir los resultados difusos de vuelta a valores numéricos
 *    concretos que la planta puede usar (ej: "Dosificar 45 mg/L de coagulante").
 * 
 * PROCESO DE TRATAMIENTO:
 * -----------------------
 * El agua cruda entra con cierta turbidez y pH. El sistema debe determinar:
 * 1. Dosis de coagulante (Sulfato de Aluminio típicamente) para aglomerar partículas
 * 2. Tiempo de floculación (agitación lenta para formar flóculos)
 * 3. Corrección de pH si está fuera del rango óptimo (6.5-8.5)
 * 
 * @author AquaFuzzy Analytics Team
 * @version 2.0
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Parámetros de entrada del agua cruda
 */
export interface WaterInputs {
    /** Turbidez en NTU (Nephelometric Turbidity Units). Rango típico: 0-1000 */
    turbidity: number
    /** pH del agua. Escala: 0-14 (7 = neutro) */
    ph: number
    /** Temperatura en °C. Afecta la eficiencia del proceso */
    temperature: number
}

/**
 * Resultados del sistema de control difuso
 */
export interface FuzzyOutputs {
    /** Dosis de coagulante recomendada en mg/L */
    coagulantDose: number
    /** Tiempo de floculación recomendado en minutos */
    flocculationTime: number
    /** Nivel de corrección de pH necesaria */
    phCorrection: 'none' | 'slight' | 'moderate' | 'intense'
    /** Cantidad de cal o ácido para corrección de pH en mg/L */
    phCorrectionAmount: number
    /** Costo operativo estimado en $/m³ */
    operationalCost: number
    /** Score de calidad del agua resultante (0-100) */
    qualityScore: number
    /** Nivel de riesgo del estado actual */
    riskLevel: 'optimal' | 'caution' | 'critical'
    /** Eficiencia estimada del proceso (0-100%) */
    efficiency: number
    /** Explicación textual de la decisión */
    explanation: string
    /** Grados de activación de cada regla (para debugging/educación) */
    ruleActivations: RuleActivation[]
}

/**
 * Registro de activación de una regla difusa
 */
export interface RuleActivation {
    id: number
    name: string
    firingStrength: number
    conditions: Record<string, string>
    outputs: Record<string, string>
}

/**
 * Definición de un conjunto difuso con función trapezoidal
 * Puntos: [a, b, c, d] donde:
 *   - Antes de 'a': membresía = 0
 *   - Entre 'a' y 'b': membresía crece linealmente de 0 a 1
 *   - Entre 'b' y 'c': membresía = 1 (plateau)
 *   - Entre 'c' y 'd': membresía decrece linealmente de 1 a 0
 *   - Después de 'd': membresía = 0
 */
interface TrapezoidalSet {
    name: string
    points: [number, number, number, number]
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONJUNTOS DIFUSOS - VARIABLES DE ENTRADA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * TURBIDEZ (NTU)
 * La turbidez mide la cantidad de partículas suspendidas en el agua.
 * Rangos basados en estándares de la OMS y EPA:
 * - < 5 NTU: Agua potable aceptable
 * - 5-50 NTU: Agua superficial típica
 * - 50-500 NTU: Agua turbia (después de lluvias)
 * - > 500 NTU: Agua muy turbia (eventos extremos)
 */
const TURBIDITY_SETS: TrapezoidalSet[] = [
    { name: 'muy_baja', points: [0, 0, 5, 15] },      // 0-15 NTU
    { name: 'baja', points: [10, 20, 40, 60] },   // 10-60 NTU
    { name: 'media', points: [50, 80, 150, 200] }, // 50-200 NTU
    { name: 'alta', points: [150, 250, 400, 500] }, // 150-500 NTU
    { name: 'muy_alta', points: [400, 600, 1000, 1000] } // 400+ NTU
]

/**
 * pH (Escala 0-14)
 * El pH afecta la eficiencia del coagulante:
 * - Muy ácido (< 6): Corrosivo, requiere neutralización
 * - Ácido (6-6.5): Subóptimo para coagulación
 * - Neutro (6.5-8): Rango óptimo para Al2(SO4)3
 * - Alcalino (8-9): Subóptimo, puede requerir ajuste
 * - Muy alcalino (> 9): Ineficiente, requiere corrección
 */
const PH_SETS: TrapezoidalSet[] = [
    { name: 'muy_acido', points: [0, 0, 4, 5.5] },
    { name: 'acido', points: [5, 5.5, 6, 6.5] },
    { name: 'neutro', points: [6.2, 6.8, 7.5, 8.2] },
    { name: 'alcalino', points: [7.8, 8.5, 9, 9.5] },
    { name: 'muy_alcalino', points: [9, 10, 14, 14] }
]

/**
 * TEMPERATURA (°C)
 * La temperatura afecta la viscosidad del agua y la cinética de reacción:
 * - Fría (< 15°C): Coagulación más lenta, requiere más tiempo
 * - Normal (15-25°C): Condiciones óptimas
 * - Cálida (> 25°C): Reacciones más rápidas, cuidar sobredosificación
 */
const TEMPERATURE_SETS: TrapezoidalSet[] = [
    { name: 'fria', points: [0, 0, 10, 18] },
    { name: 'normal', points: [15, 20, 25, 28] },
    { name: 'calida', points: [25, 30, 40, 40] }
]

// ═══════════════════════════════════════════════════════════════════════════════
// CONJUNTOS DIFUSOS - VARIABLES DE SALIDA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * DOSIS DE COAGULANTE (mg/L de Sulfato de Aluminio)
 * Dosificación típica en plantas de tratamiento:
 * - 5-15 mg/L: Agua casi limpia
 * - 15-30 mg/L: Turbidez moderada
 * - 30-60 mg/L: Turbidez alta
 * - 60-100 mg/L: Eventos extremos (tormentas)
 */
const DOSE_SETS: TrapezoidalSet[] = [
    { name: 'muy_baja', points: [0, 0, 5, 12] },
    { name: 'baja', points: [8, 15, 22, 28] },
    { name: 'media', points: [25, 35, 45, 55] },
    { name: 'alta', points: [50, 60, 75, 85] },
    { name: 'muy_alta', points: [80, 90, 100, 100] }
]

/**
 * TIEMPO DE FLOCULACIÓN (minutos)
 * Tiempo de agitación lenta para formación de flóculos:
 * - 10-15 min: Agua limpia, flóculos rápidos
 * - 15-25 min: Condiciones normales
 * - 25-40 min: Alta turbidez, requiere más tiempo
 * - 40-60 min: Condiciones extremas
 */
const TIME_SETS: TrapezoidalSet[] = [
    { name: 'muy_corto', points: [0, 0, 8, 12] },
    { name: 'corto', points: [10, 14, 18, 22] },
    { name: 'medio', points: [20, 25, 32, 38] },
    { name: 'largo', points: [35, 42, 50, 55] },
    { name: 'muy_largo', points: [50, 55, 60, 60] }
]

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONES DE MEMBRESÍA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calcula el grado de membresía de un valor a un conjunto trapezoidal
 * 
 * @param value - Valor numérico a evaluar
 * @param set - Conjunto difuso trapezoidal
 * @returns Grado de membresía entre 0 y 1
 * 
 * @example
 * // Para turbidez = 100 NTU y conjunto 'media' [50, 80, 150, 200]
 * // 100 está en el plateau (entre 80 y 150), retorna 1.0
 * calculateMembership(100, TURBIDITY_SETS[2]) // => 1.0
 */
function calculateMembership(value: number, set: TrapezoidalSet): number {
    const [a, b, c, d] = set.points

    if (value <= a || value >= d) return 0
    if (value >= b && value <= c) return 1
    if (value > a && value < b) return (value - a) / (b - a)
    if (value > c && value < d) return (d - value) / (d - c)

    return 0
}

/**
 * Obtiene todos los grados de membresía de un valor para un conjunto de sets
 */
function getMemberships(value: number, sets: TrapezoidalSet[]): Map<string, number> {
    const memberships = new Map<string, number>()
    for (const set of sets) {
        memberships.set(set.name, calculateMembership(value, set))
    }
    return memberships
}

// ═══════════════════════════════════════════════════════════════════════════════
// BASE DE REGLAS DIFUSAS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Las reglas difusas codifican el conocimiento experto de un operador de planta.
 * Cada regla tiene:
 * - Condiciones (antecedentes): combinaciones de estados de las variables de entrada
 * - Conclusiones (consecuentes): acciones recomendadas
 * 
 * El grado de activación de una regla es el MÍNIMO de los grados de membresía
 * de todas sus condiciones (operador AND difuso de Mamdani).
 */

interface FuzzyRule {
    id: number
    name: string
    conditions: {
        turbidity?: string
        ph?: string
        temperature?: string
    }
    outputs: {
        dose: string
        time: string
        phCorrection: 'none' | 'slight' | 'moderate' | 'intense'
    }
    baseCost: number // Costo base asociado a esta regla ($/m³)
}

const FUZZY_RULES: FuzzyRule[] = [
    // ═══════════════════════════════════════════════════════════════
    // REGLAS PARA AGUA LIMPIA (Turbidez muy baja o baja)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 1,
        name: "Agua cristalina - Condiciones óptimas",
        conditions: { turbidity: 'muy_baja', ph: 'neutro' },
        outputs: { dose: 'muy_baja', time: 'muy_corto', phCorrection: 'none' },
        baseCost: 0.05
    },
    {
        id: 2,
        name: "Agua limpia - pH ácido leve",
        conditions: { turbidity: 'muy_baja', ph: 'acido' },
        outputs: { dose: 'baja', time: 'corto', phCorrection: 'slight' },
        baseCost: 0.08
    },
    {
        id: 3,
        name: "Agua limpia - pH alcalino leve",
        conditions: { turbidity: 'muy_baja', ph: 'alcalino' },
        outputs: { dose: 'baja', time: 'corto', phCorrection: 'slight' },
        baseCost: 0.08
    },
    {
        id: 4,
        name: "Agua baja turbidez - Condiciones normales",
        conditions: { turbidity: 'baja', ph: 'neutro' },
        outputs: { dose: 'baja', time: 'corto', phCorrection: 'none' },
        baseCost: 0.10
    },

    // ═══════════════════════════════════════════════════════════════
    // REGLAS PARA TURBIDEZ MEDIA (Condiciones típicas)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 5,
        name: "Turbidez media - pH neutro óptimo",
        conditions: { turbidity: 'media', ph: 'neutro' },
        outputs: { dose: 'media', time: 'medio', phCorrection: 'none' },
        baseCost: 0.18
    },
    {
        id: 6,
        name: "Turbidez media - pH ácido",
        conditions: { turbidity: 'media', ph: 'acido' },
        outputs: { dose: 'media', time: 'medio', phCorrection: 'moderate' },
        baseCost: 0.22
    },
    {
        id: 7,
        name: "Turbidez media - pH alcalino",
        conditions: { turbidity: 'media', ph: 'alcalino' },
        outputs: { dose: 'alta', time: 'medio', phCorrection: 'slight' },
        baseCost: 0.24
    },
    {
        id: 8,
        name: "Turbidez media - Agua fría",
        conditions: { turbidity: 'media', temperature: 'fria' },
        outputs: { dose: 'alta', time: 'largo', phCorrection: 'none' },
        baseCost: 0.25
    },

    // ═══════════════════════════════════════════════════════════════
    // REGLAS PARA TURBIDEZ ALTA (Post-lluvia típico)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 9,
        name: "Alta turbidez - pH neutro",
        conditions: { turbidity: 'alta', ph: 'neutro' },
        outputs: { dose: 'alta', time: 'largo', phCorrection: 'none' },
        baseCost: 0.35
    },
    {
        id: 10,
        name: "Alta turbidez - pH ácido",
        conditions: { turbidity: 'alta', ph: 'acido' },
        outputs: { dose: 'alta', time: 'largo', phCorrection: 'moderate' },
        baseCost: 0.42
    },
    {
        id: 11,
        name: "Alta turbidez - pH alcalino",
        conditions: { turbidity: 'alta', ph: 'alcalino' },
        outputs: { dose: 'muy_alta', time: 'largo', phCorrection: 'moderate' },
        baseCost: 0.45
    },
    {
        id: 12,
        name: "Alta turbidez - Agua fría",
        conditions: { turbidity: 'alta', temperature: 'fria' },
        outputs: { dose: 'muy_alta', time: 'muy_largo', phCorrection: 'none' },
        baseCost: 0.48
    },

    // ═══════════════════════════════════════════════════════════════
    // REGLAS PARA TURBIDEZ MUY ALTA (Emergencia - Tormentas)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 13,
        name: "Emergencia - Turbidez extrema, pH neutro",
        conditions: { turbidity: 'muy_alta', ph: 'neutro' },
        outputs: { dose: 'muy_alta', time: 'muy_largo', phCorrection: 'none' },
        baseCost: 0.55
    },
    {
        id: 14,
        name: "Emergencia - Turbidez extrema, pH ácido severo",
        conditions: { turbidity: 'muy_alta', ph: 'muy_acido' },
        outputs: { dose: 'muy_alta', time: 'muy_largo', phCorrection: 'intense' },
        baseCost: 0.75
    },
    {
        id: 15,
        name: "Emergencia - Turbidez extrema, pH alcalino severo",
        conditions: { turbidity: 'muy_alta', ph: 'muy_alcalino' },
        outputs: { dose: 'muy_alta', time: 'muy_largo', phCorrection: 'intense' },
        baseCost: 0.72
    },

    // ═══════════════════════════════════════════════════════════════
    // REGLAS PARA pH EXTREMO (Vertidos industriales)
    // ═══════════════════════════════════════════════════════════════
    {
        id: 16,
        name: "Vertido ácido - Turbidez baja",
        conditions: { turbidity: 'baja', ph: 'muy_acido' },
        outputs: { dose: 'media', time: 'medio', phCorrection: 'intense' },
        baseCost: 0.38
    },
    {
        id: 17,
        name: "Vertido alcalino - Turbidez baja",
        conditions: { turbidity: 'baja', ph: 'muy_alcalino' },
        outputs: { dose: 'media', time: 'medio', phCorrection: 'intense' },
        baseCost: 0.35
    },
    {
        id: 18,
        name: "Vertido ácido - Turbidez media",
        conditions: { turbidity: 'media', ph: 'muy_acido' },
        outputs: { dose: 'alta', time: 'largo', phCorrection: 'intense' },
        baseCost: 0.52
    },

    // ═══════════════════════════════════════════════════════════════
    // REGLAS CON TEMPERATURA
    // ═══════════════════════════════════════════════════════════════
    {
        id: 19,
        name: "Agua caliente - Turbidez baja",
        conditions: { turbidity: 'baja', temperature: 'calida' },
        outputs: { dose: 'baja', time: 'muy_corto', phCorrection: 'none' },
        baseCost: 0.08
    },
    {
        id: 20,
        name: "Agua caliente - Turbidez alta",
        conditions: { turbidity: 'alta', temperature: 'calida' },
        outputs: { dose: 'media', time: 'medio', phCorrection: 'none' },
        baseCost: 0.28
    }
]

// ═══════════════════════════════════════════════════════════════════════════════
// SISTEMA DE INFERENCIA DIFUSA
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Defuzzifica un conjunto de salidas difusas usando el método del centroide
 * (Center of Area - COA)
 * 
 * @param activations - Mapa de (nombre_conjunto -> grado_activación)
 * @param sets - Conjuntos difusos de la variable de salida
 * @returns Valor numérico defuzzificado
 */
function defuzzify(activations: Map<string, number>, sets: TrapezoidalSet[]): number {
    let numerator = 0
    let denominator = 0

    for (const set of sets) {
        const activation = activations.get(set.name) || 0
        if (activation > 0) {
            // Centro del trapecio
            const center = (set.points[1] + set.points[2]) / 2
            numerator += center * activation
            denominator += activation
        }
    }

    return denominator > 0 ? numerator / denominator : 0
}

/**
 * FUNCIÓN PRINCIPAL: Ejecuta el sistema de inferencia difusa completo
 * 
 * @param inputs - Parámetros del agua cruda
 * @returns Resultados del sistema de control con explicaciones
 */
export function runFuzzyInference(inputs: WaterInputs): FuzzyOutputs {
    const { turbidity, ph, temperature } = inputs

    // Paso 1: FUZZIFICACIÓN - Calcular grados de membresía de las entradas
    const turbidityMemberships = getMemberships(turbidity, TURBIDITY_SETS)
    const phMemberships = getMemberships(ph, PH_SETS)
    const tempMemberships = getMemberships(temperature, TEMPERATURE_SETS)

    // Paso 2: EVALUACIÓN DE REGLAS - Determinar activación de cada regla
    const doseActivations = new Map<string, number>()
    const timeActivations = new Map<string, number>()
    const ruleActivations: RuleActivation[] = []
    let totalCost = 0
    let totalWeight = 0
    let phCorrectionLevel: 'none' | 'slight' | 'moderate' | 'intense' = 'none'
    let maxPhCorrectionWeight = 0

    for (const rule of FUZZY_RULES) {
        // Calcular grado de activación de la regla (AND = mínimo)
        const conditions: number[] = []

        if (rule.conditions.turbidity) {
            conditions.push(turbidityMemberships.get(rule.conditions.turbidity) || 0)
        }
        if (rule.conditions.ph) {
            conditions.push(phMemberships.get(rule.conditions.ph) || 0)
        }
        if (rule.conditions.temperature) {
            conditions.push(tempMemberships.get(rule.conditions.temperature) || 0)
        }

        // Grado de activación = mínimo de todas las condiciones
        const activation = conditions.length > 0 ? Math.min(...conditions) : 0

        if (activation > 0) {
            // Acumular activaciones de salida (OR = máximo)
            const currentDose = doseActivations.get(rule.outputs.dose) || 0
            doseActivations.set(rule.outputs.dose, Math.max(currentDose, activation))

            const currentTime = timeActivations.get(rule.outputs.time) || 0
            timeActivations.set(rule.outputs.time, Math.max(currentTime, activation))

            // Acumular costo ponderado
            totalCost += rule.baseCost * activation
            totalWeight += activation

            // Determinar corrección de pH dominante
            if (activation > maxPhCorrectionWeight) {
                maxPhCorrectionWeight = activation
                phCorrectionLevel = rule.outputs.phCorrection
            }

            // Registrar activación para explicación
            ruleActivations.push({
                id: rule.id,
                name: rule.name,
                firingStrength: activation,
                conditions: rule.conditions as Record<string, string>,
                outputs: rule.outputs as Record<string, string>
            })
        }
    }

    // Paso 3: DEFUZZIFICACIÓN - Convertir a valores concretos
    const coagulantDose = defuzzify(doseActivations, DOSE_SETS)
    const flocculationTime = defuzzify(timeActivations, TIME_SETS)
    const operationalCost = totalWeight > 0 ? totalCost / totalWeight : 0.10

    // Calcular cantidad de corrección de pH
    let phCorrectionAmount = 0
    if (phCorrectionLevel !== 'none') {
        const phDeviation = Math.abs(ph - 7.0)
        switch (phCorrectionLevel) {
            case 'slight': phCorrectionAmount = phDeviation * 5; break
            case 'moderate': phCorrectionAmount = phDeviation * 12; break
            case 'intense': phCorrectionAmount = phDeviation * 25; break
        }
    }

    // Paso 4: CÁLCULO DE MÉTRICAS DERIVADAS

    // Score de calidad: inversamente proporcional a turbidez y desviación de pH
    const turbidityFactor = Math.max(0, 100 - (turbidity / 10))
    const phFactor = Math.max(0, 100 - Math.abs(ph - 7) * 15)
    const processFactor = coagulantDose > 0 ? Math.min(100, (coagulantDose / turbidity) * 500) : 50
    const qualityScore = Math.round((turbidityFactor * 0.5 + phFactor * 0.3 + processFactor * 0.2))

    // Determinar nivel de riesgo
    let riskLevel: 'optimal' | 'caution' | 'critical' = 'optimal'
    if (turbidity > 400 || ph < 5.5 || ph > 9.5) {
        riskLevel = 'critical'
    } else if (turbidity > 150 || ph < 6.2 || ph > 8.5) {
        riskLevel = 'caution'
    }

    // Calcular eficiencia del proceso
    const efficiency = Math.min(100, Math.max(20,
        100 - (turbidity / 20) + (ph >= 6.5 && ph <= 8.0 ? 20 : 0) - (temperature < 15 ? 10 : 0)
    ))

    // Generar explicación textual
    const explanation = generateExplanation(inputs, coagulantDose, flocculationTime, riskLevel, ruleActivations)

    return {
        coagulantDose: Math.round(coagulantDose * 10) / 10,
        flocculationTime: Math.round(flocculationTime),
        phCorrection: phCorrectionLevel,
        phCorrectionAmount: Math.round(phCorrectionAmount * 10) / 10,
        operationalCost: Math.round(operationalCost * 1000) / 1000,
        qualityScore: Math.max(0, Math.min(100, qualityScore)),
        riskLevel,
        efficiency: Math.round(efficiency),
        explanation,
        ruleActivations: ruleActivations.sort((a, b) => b.firingStrength - a.firingStrength)
    }
}

/**
 * Genera una explicación textual de la decisión del sistema
 */
function generateExplanation(
    inputs: WaterInputs,
    dose: number,
    time: number,
    risk: string,
    activations: RuleActivation[]
): string {
    const parts: string[] = []

    // Describir el estado del agua
    if (inputs.turbidity < 20) {
        parts.push("El agua presenta baja turbidez")
    } else if (inputs.turbidity < 150) {
        parts.push("La turbidez del agua está en niveles moderados")
    } else if (inputs.turbidity < 400) {
        parts.push("Se detecta alta turbidez en el agua")
    } else {
        parts.push("⚠️ ALERTA: Turbidez extremadamente alta detectada")
    }

    // Describir el pH
    if (inputs.ph < 6) {
        parts.push("y el pH es ácido, requiriendo neutralización")
    } else if (inputs.ph > 8.5) {
        parts.push("y el pH es alcalino, afectando la eficiencia del coagulante")
    } else {
        parts.push("con pH en rango óptimo para coagulación")
    }

    // Describir la decisión
    parts.push(`. Se recomienda dosificar ${dose.toFixed(1)} mg/L de coagulante con ${time} minutos de floculación.`)

    // Añadir la regla más activa
    if (activations.length > 0) {
        const topRule = activations[0]
        parts.push(` Regla principal: "${topRule.name}" (activación: ${(topRule.firingStrength * 100).toFixed(0)}%).`)
    }

    return parts.join('')
}

/**
 * Obtiene las membresías actuales para visualización educativa
 */
export function getMembershipDegrees(inputs: WaterInputs): {
    turbidity: Array<{ name: string; degree: number }>
    ph: Array<{ name: string; degree: number }>
    temperature: Array<{ name: string; degree: number }>
} {
    const turbidityMemberships = getMemberships(inputs.turbidity, TURBIDITY_SETS)
    const phMemberships = getMemberships(inputs.ph, PH_SETS)
    const tempMemberships = getMemberships(inputs.temperature, TEMPERATURE_SETS)

    return {
        turbidity: Array.from(turbidityMemberships.entries()).map(([name, degree]) => ({ name, degree })),
        ph: Array.from(phMemberships.entries()).map(([name, degree]) => ({ name, degree })),
        temperature: Array.from(tempMemberships.entries()).map(([name, degree]) => ({ name, degree }))
    }
}
