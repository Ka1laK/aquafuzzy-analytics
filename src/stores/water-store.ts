/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AQUAFUZZY ANALYTICS - WATER SIMULATION STORE
 * Estado global para el simulador de tratamiento de agua usando Zustand
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { WaterInputs, FuzzyOutputs, runFuzzyInference, getMembershipDegrees } from '@/lib/fuzzy-logic'
import { Scenario, interpolateKeyframes } from '@/lib/scenarios'

/**
 * Punto del historial de calidad
 */
export interface HistoryPoint {
    timestamp: number
    qualityScore: number
    turbidity: number
    ph: number
    temperature: number
    operationalCost: number
}

/**
 * Estado de membresía para visualización educativa
 */
export interface MembershipState {
    turbidity: Array<{ name: string; degree: number }>
    ph: Array<{ name: string; degree: number }>
    temperature: Array<{ name: string; degree: number }>
}

/**
 * Estado completo del simulador de agua
 */
interface WaterState {
    // ═══════════════════════════════════════════════════════════════
    // PARÁMETROS DE ENTRADA
    // ═══════════════════════════════════════════════════════════════
    turbidity: number
    ph: number
    temperature: number

    // ═══════════════════════════════════════════════════════════════
    // RESULTADOS DEL SISTEMA DIFUSO
    // ═══════════════════════════════════════════════════════════════
    fuzzyOutputs: FuzzyOutputs | null
    memberships: MembershipState | null

    // ═══════════════════════════════════════════════════════════════
    // ESTADO DE SIMULACIÓN
    // ═══════════════════════════════════════════════════════════════
    isSimulating: boolean
    currentScenario: Scenario | null
    simulationStartTime: number | null
    simulationElapsedTime: number
    simulationSpeed: number // 1 = normal, 2 = 2x, etc.

    // ═══════════════════════════════════════════════════════════════
    // HISTORIAL DE DATOS
    // ═══════════════════════════════════════════════════════════════
    history: HistoryPoint[]
    maxHistoryLength: number

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES
    // ═══════════════════════════════════════════════════════════════
    setTurbidity: (value: number) => void
    setPh: (value: number) => void
    setTemperature: (value: number) => void
    setParameters: (params: Partial<WaterInputs>) => void

    runInference: () => void

    startSimulation: (scenario: Scenario) => void
    stopSimulation: () => void
    pauseSimulation: () => void
    resumeSimulation: () => void
    updateSimulation: (deltaTime: number) => void
    setSimulationSpeed: (speed: number) => void

    reset: () => void
    clearHistory: () => void
}

/**
 * Valores iniciales por defecto (agua en condiciones normales)
 */
const DEFAULT_STATE = {
    turbidity: 50,
    ph: 7.0,
    temperature: 22,
    fuzzyOutputs: null,
    memberships: null,
    isSimulating: false,
    currentScenario: null,
    simulationStartTime: null,
    simulationElapsedTime: 0,
    simulationSpeed: 1,
    history: [] as HistoryPoint[],
    maxHistoryLength: 200
}

/**
 * Store de Zustand para el simulador de agua
 * 
 * Usa subscribeWithSelector para permitir suscripciones granulares
 * a partes específicas del estado.
 */
export const useWaterStore = create<WaterState>()(
    subscribeWithSelector((set, get) => ({
        ...DEFAULT_STATE,

        // ═══════════════════════════════════════════════════════════════
        // SETTERS DE PARÁMETROS
        // ═══════════════════════════════════════════════════════════════

        setTurbidity: (value: number) => {
            set({ turbidity: Math.max(0, Math.min(1000, value)) })
            get().runInference()
        },

        setPh: (value: number) => {
            set({ ph: Math.max(0, Math.min(14, value)) })
            get().runInference()
        },

        setTemperature: (value: number) => {
            set({ temperature: Math.max(0, Math.min(40, value)) })
            get().runInference()
        },

        setParameters: (params: Partial<WaterInputs>) => {
            set({
                turbidity: params.turbidity !== undefined
                    ? Math.max(0, Math.min(1000, params.turbidity))
                    : get().turbidity,
                ph: params.ph !== undefined
                    ? Math.max(0, Math.min(14, params.ph))
                    : get().ph,
                temperature: params.temperature !== undefined
                    ? Math.max(0, Math.min(40, params.temperature))
                    : get().temperature
            })
            get().runInference()
        },

        // ═══════════════════════════════════════════════════════════════
        // INFERENCIA DIFUSA
        // ═══════════════════════════════════════════════════════════════

        runInference: () => {
            const { turbidity, ph, temperature, history, maxHistoryLength } = get()

            const inputs: WaterInputs = { turbidity, ph, temperature }
            const outputs = runFuzzyInference(inputs)
            const memberships = getMembershipDegrees(inputs)

            // Añadir al historial
            const newPoint: HistoryPoint = {
                timestamp: Date.now(),
                qualityScore: outputs.qualityScore,
                turbidity,
                ph,
                temperature,
                operationalCost: outputs.operationalCost
            }

            const newHistory = [...history, newPoint]
            if (newHistory.length > maxHistoryLength) {
                newHistory.shift()
            }

            set({
                fuzzyOutputs: outputs,
                memberships,
                history: newHistory
            })
        },

        // ═══════════════════════════════════════════════════════════════
        // CONTROL DE SIMULACIÓN
        // ═══════════════════════════════════════════════════════════════

        startSimulation: (scenario: Scenario) => {
            set({
                isSimulating: true,
                currentScenario: scenario,
                simulationStartTime: Date.now(),
                simulationElapsedTime: 0
            })

            // Aplicar primer keyframe inmediatamente
            const { turbidity, ph, temperature } = interpolateKeyframes(scenario.keyframes, 0)
            get().setParameters({ turbidity, ph, temperature })
        },

        stopSimulation: () => {
            set({
                isSimulating: false,
                currentScenario: null,
                simulationStartTime: null,
                simulationElapsedTime: 0
            })
        },

        pauseSimulation: () => {
            set({ isSimulating: false })
        },

        resumeSimulation: () => {
            const { currentScenario } = get()
            if (currentScenario) {
                set({ isSimulating: true })
            }
        },

        updateSimulation: (deltaTime: number) => {
            const { isSimulating, currentScenario, simulationElapsedTime, simulationSpeed } = get()

            if (!isSimulating || !currentScenario) return

            const newElapsedTime = simulationElapsedTime + deltaTime * simulationSpeed

            // Verificar si la simulación terminó
            if (newElapsedTime >= currentScenario.duration) {
                // Aplicar estado final y detener
                const finalKeyframe = currentScenario.keyframes[currentScenario.keyframes.length - 1]
                get().setParameters({
                    turbidity: finalKeyframe.turbidity,
                    ph: finalKeyframe.ph,
                    temperature: finalKeyframe.temperature
                })
                get().stopSimulation()
                return
            }

            // Interpolar y aplicar parámetros
            const { turbidity, ph, temperature } = interpolateKeyframes(
                currentScenario.keyframes,
                newElapsedTime
            )

            set({ simulationElapsedTime: newElapsedTime })
            get().setParameters({ turbidity, ph, temperature })
        },

        setSimulationSpeed: (speed: number) => {
            set({ simulationSpeed: Math.max(0.25, Math.min(4, speed)) })
        },

        // ═══════════════════════════════════════════════════════════════
        // UTILIDADES
        // ═══════════════════════════════════════════════════════════════

        reset: () => {
            set({
                ...DEFAULT_STATE,
                history: get().history // Mantener historial
            })
            get().runInference()
        },

        clearHistory: () => {
            set({ history: [] })
        }
    }))
)

// Note: Initial inference is triggered by components on mount
