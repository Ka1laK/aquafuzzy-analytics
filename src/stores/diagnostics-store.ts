/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AQUAFUZZY ANALYTICS - DIAGNOSTICS STORE
 * Estado global para el módulo de diagnóstico industrial con FCM
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import {
    DataPoint,
    FCMConfig,
    FCMResult,
    RiskAnalysis,
    DEFAULT_FCM_CONFIG,
    runFCM,
    analyzeRisk,
    interpolateClusterColor,
    generateSyntheticData,
    DEFAULT_CLUSTER_DEFINITIONS,
    ClusterDefinition,
    CLUSTER_COLORS,
    CLUSTER_NAMES
} from '@/lib/fcm'
import Papa from 'papaparse'

/**
 * Estado del proceso de animación FCM
 */
interface AnimationState {
    isPlaying: boolean
    currentFrame: number
    totalFrames: number
    playbackSpeed: number // frames por segundo
}

/**
 * Estado de la guía educativa
 */
interface TourState {
    isActive: boolean
    currentStep: number
    totalSteps: number
    hasCompletedTour: boolean
}

/**
 * Estado completo del módulo de diagnóstico
 */
interface DiagnosticsState {
    // ═══════════════════════════════════════════════════════════════
    // DATOS
    // ═══════════════════════════════════════════════════════════════
    dataPoints: DataPoint[]
    isLoadingData: boolean
    dataSource: 'synthetic' | 'imported' | null
    featureNames: string[]

    // ═══════════════════════════════════════════════════════════════
    // CONFIGURACIÓN FCM
    // ═══════════════════════════════════════════════════════════════
    config: FCMConfig
    clusterNames: string[]
    clusterColors: string[]

    // ═══════════════════════════════════════════════════════════════
    // RESULTADOS FCM
    // ═══════════════════════════════════════════════════════════════
    result: FCMResult | null
    isRunning: boolean
    processedPoints: DataPoint[] // Puntos con membresías y colores asignados

    // ═══════════════════════════════════════════════════════════════
    // ANIMACIÓN
    // ═══════════════════════════════════════════════════════════════
    animation: AnimationState

    // ═══════════════════════════════════════════════════════════════
    // SELECCIÓN E INSPECCIÓN
    // ═══════════════════════════════════════════════════════════════
    selectedPoint: DataPoint | null
    selectedPointRisk: RiskAnalysis | null
    hoveredPoint: DataPoint | null

    // ═══════════════════════════════════════════════════════════════
    // GUÍA EDUCATIVA
    // ═══════════════════════════════════════════════════════════════
    tour: TourState
    showEducationalPanel: boolean

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - DATOS
    // ═══════════════════════════════════════════════════════════════
    importCSV: (file: File) => Promise<void>
    generateSynthetic: (definitions?: ClusterDefinition[]) => void
    clearData: () => void

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - FCM
    // ═══════════════════════════════════════════════════════════════
    updateConfig: (config: Partial<FCMConfig>) => void
    runClustering: () => void
    resetClustering: () => void

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - ANIMACIÓN
    // ═══════════════════════════════════════════════════════════════
    playAnimation: () => void
    pauseAnimation: () => void
    stopAnimation: () => void
    stepForward: () => void
    stepBackward: () => void
    setAnimationFrame: (frame: number) => void
    setPlaybackSpeed: (fps: number) => void

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - SELECCIÓN
    // ═══════════════════════════════════════════════════════════════
    selectPoint: (point: DataPoint | null) => void
    setHoveredPoint: (point: DataPoint | null) => void

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - TOUR
    // ═══════════════════════════════════════════════════════════════
    startTour: () => void
    nextTourStep: () => void
    prevTourStep: () => void
    skipTour: () => void
    toggleEducationalPanel: () => void

    // ═══════════════════════════════════════════════════════════════
    // ACCIONES - CLUSTER NAMES
    // ═══════════════════════════════════════════════════════════════
    setClusterName: (index: number, name: string) => void
}

const DEFAULT_STATE = {
    dataPoints: [],
    isLoadingData: false,
    dataSource: null as 'synthetic' | 'imported' | null,
    featureNames: ['Vibración (mm/s)', 'Temperatura (°C)'],

    config: { ...DEFAULT_FCM_CONFIG },
    clusterNames: [...CLUSTER_NAMES],
    clusterColors: [...CLUSTER_COLORS],

    result: null,
    isRunning: false,
    processedPoints: [],

    animation: {
        isPlaying: false,
        currentFrame: 0,
        totalFrames: 0,
        playbackSpeed: 2 // 2 FPS por defecto
    },

    selectedPoint: null,
    selectedPointRisk: null,
    hoveredPoint: null,

    tour: {
        isActive: false,
        currentStep: 0,
        totalSteps: 5,
        hasCompletedTour: false
    },
    showEducationalPanel: true
}

export const useDiagnosticsStore = create<DiagnosticsState>()(
    subscribeWithSelector((set, get) => ({
        ...DEFAULT_STATE,

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - DATOS
        // ═══════════════════════════════════════════════════════════════

        importCSV: async (file: File) => {
            set({ isLoadingData: true })

            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const data = results.data as Record<string, unknown>[]

                        if (data.length === 0) {
                            set({ isLoadingData: false })
                            reject(new Error('El archivo CSV está vacío'))
                            return
                        }

                        // Intentar detectar columnas numéricas para usar como features
                        const firstRow = data[0]
                        const numericColumns = Object.keys(firstRow).filter(
                            key => typeof firstRow[key] === 'number'
                        )

                        if (numericColumns.length < 2) {
                            set({ isLoadingData: false })
                            reject(new Error('El CSV debe tener al menos 2 columnas numéricas'))
                            return
                        }

                        // Usar las primeras dos columnas numéricas como features
                        const featureCols = numericColumns.slice(0, 2)

                        const dataPoints: DataPoint[] = data.map((row, index) => ({
                            id: String(row['id'] || row['ID'] || `P${index}`),
                            features: featureCols.map(col => Number(row[col]) || 0),
                            label: row['label'] ? String(row['label']) : undefined,
                            timestamp: row['timestamp'] ? new Date(String(row['timestamp'])) : undefined
                        }))

                        set({
                            dataPoints,
                            isLoadingData: false,
                            dataSource: 'imported',
                            featureNames: featureCols,
                            result: null,
                            processedPoints: [],
                            selectedPoint: null
                        })

                        resolve()
                    },
                    error: (error) => {
                        set({ isLoadingData: false })
                        reject(error)
                    }
                })
            })
        },

        generateSynthetic: (definitions?: ClusterDefinition[]) => {
            const clusterDefs = definitions || DEFAULT_CLUSTER_DEFINITIONS
            const dataPoints = generateSyntheticData(clusterDefs)

            set({
                dataPoints,
                dataSource: 'synthetic',
                featureNames: ['Vibración (mm/s)', 'Temperatura (°C)'],
                result: null,
                processedPoints: [],
                selectedPoint: null
            })
        },

        clearData: () => {
            set({
                dataPoints: [],
                dataSource: null,
                result: null,
                processedPoints: [],
                selectedPoint: null,
                selectedPointRisk: null,
                animation: { ...DEFAULT_STATE.animation }
            })
        },

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - FCM
        // ═══════════════════════════════════════════════════════════════

        updateConfig: (newConfig: Partial<FCMConfig>) => {
            set(state => ({
                config: { ...state.config, ...newConfig }
            }))
        },

        runClustering: () => {
            const { dataPoints, config, clusterColors } = get()

            if (dataPoints.length === 0) return

            set({ isRunning: true })

            // Ejecutar en el siguiente tick para no bloquear UI
            setTimeout(() => {
                try {
                    const result = runFCM(dataPoints, { ...config, trackHistory: true })

                    // Procesar puntos con membresías y colores
                    const processedPoints = dataPoints.map((point, i) => ({
                        ...point,
                        memberships: result.membershipMatrix[i],
                        color: interpolateClusterColor(result.membershipMatrix[i], clusterColors)
                    }))

                    set({
                        result,
                        processedPoints,
                        isRunning: false,
                        animation: {
                            ...get().animation,
                            currentFrame: result.iterationHistory.length - 1,
                            totalFrames: result.iterationHistory.length
                        }
                    })
                } catch (error) {
                    console.error('Error en FCM:', error)
                    set({ isRunning: false })
                }
            }, 10)
        },

        resetClustering: () => {
            set({
                result: null,
                processedPoints: [],
                animation: { ...DEFAULT_STATE.animation },
                selectedPoint: null,
                selectedPointRisk: null
            })
        },

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - ANIMACIÓN
        // ═══════════════════════════════════════════════════════════════

        playAnimation: () => {
            const { result } = get()
            if (!result || result.iterationHistory.length === 0) return

            set(state => ({
                animation: {
                    ...state.animation,
                    isPlaying: true,
                    currentFrame: 0 // Empezar desde el inicio
                }
            }))
        },

        pauseAnimation: () => {
            set(state => ({
                animation: { ...state.animation, isPlaying: false }
            }))
        },

        stopAnimation: () => {
            const { result } = get()
            set(state => ({
                animation: {
                    ...state.animation,
                    isPlaying: false,
                    currentFrame: result ? result.iterationHistory.length - 1 : 0
                }
            }))
        },

        stepForward: () => {
            set(state => {
                const newFrame = Math.min(
                    state.animation.currentFrame + 1,
                    state.animation.totalFrames - 1
                )
                return {
                    animation: { ...state.animation, currentFrame: newFrame, isPlaying: false }
                }
            })
        },

        stepBackward: () => {
            set(state => ({
                animation: {
                    ...state.animation,
                    currentFrame: Math.max(0, state.animation.currentFrame - 1),
                    isPlaying: false
                }
            }))
        },

        setAnimationFrame: (frame: number) => {
            set(state => ({
                animation: {
                    ...state.animation,
                    currentFrame: Math.max(0, Math.min(frame, state.animation.totalFrames - 1))
                }
            }))
        },

        setPlaybackSpeed: (fps: number) => {
            set(state => ({
                animation: { ...state.animation, playbackSpeed: Math.max(0.5, Math.min(10, fps)) }
            }))
        },

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - SELECCIÓN
        // ═══════════════════════════════════════════════════════════════

        selectPoint: (point: DataPoint | null) => {
            if (!point) {
                set({ selectedPoint: null, selectedPointRisk: null })
                return
            }

            const { clusterNames } = get()
            const risk = point.memberships
                ? analyzeRisk(point.memberships, clusterNames)
                : null

            set({
                selectedPoint: point,
                selectedPointRisk: risk
            })
        },

        setHoveredPoint: (point: DataPoint | null) => {
            set({ hoveredPoint: point })
        },

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - TOUR
        // ═══════════════════════════════════════════════════════════════

        startTour: () => {
            set(state => ({
                tour: { ...state.tour, isActive: true, currentStep: 0 }
            }))
        },

        nextTourStep: () => {
            set(state => {
                const newStep = state.tour.currentStep + 1
                if (newStep >= state.tour.totalSteps) {
                    return {
                        tour: { ...state.tour, isActive: false, hasCompletedTour: true, currentStep: 0 }
                    }
                }
                return {
                    tour: { ...state.tour, currentStep: newStep }
                }
            })
        },

        prevTourStep: () => {
            set(state => ({
                tour: {
                    ...state.tour,
                    currentStep: Math.max(0, state.tour.currentStep - 1)
                }
            }))
        },

        skipTour: () => {
            set(state => ({
                tour: { ...state.tour, isActive: false, hasCompletedTour: true }
            }))
        },

        toggleEducationalPanel: () => {
            set(state => ({ showEducationalPanel: !state.showEducationalPanel }))
        },

        // ═══════════════════════════════════════════════════════════════
        // ACCIONES - CLUSTER NAMES
        // ═══════════════════════════════════════════════════════════════

        setClusterName: (index: number, name: string) => {
            set(state => {
                const newNames = [...state.clusterNames]
                newNames[index] = name
                return { clusterNames: newNames }
            })
        }
    }))
)
