'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useDiagnosticsStore } from '@/stores/diagnostics-store'
import { motion } from 'framer-motion'
import {
    Play, Pause, Square, SkipForward, SkipBack,
    Settings, Zap, RefreshCw
} from 'lucide-react'

/**
 * ConvergenceControls - Controles de animación y configuración FCM
 * 
 * Permite:
 * - Reproducir la convergencia del algoritmo paso a paso
 * - Ajustar parámetros del FCM
 * - Controlar la velocidad de animación
 */

export function ConvergenceControls() {
    const animation = useDiagnosticsStore(state => state.animation)
    const config = useDiagnosticsStore(state => state.config)
    const result = useDiagnosticsStore(state => state.result)
    const isRunning = useDiagnosticsStore(state => state.isRunning)
    const dataPoints = useDiagnosticsStore(state => state.dataPoints)

    const playAnimation = useDiagnosticsStore(state => state.playAnimation)
    const pauseAnimation = useDiagnosticsStore(state => state.pauseAnimation)
    const stopAnimation = useDiagnosticsStore(state => state.stopAnimation)
    const stepForward = useDiagnosticsStore(state => state.stepForward)
    const stepBackward = useDiagnosticsStore(state => state.stepBackward)
    const setAnimationFrame = useDiagnosticsStore(state => state.setAnimationFrame)
    const setPlaybackSpeed = useDiagnosticsStore(state => state.setPlaybackSpeed)
    const updateConfig = useDiagnosticsStore(state => state.updateConfig)
    const runClustering = useDiagnosticsStore(state => state.runClustering)
    const resetClustering = useDiagnosticsStore(state => state.resetClustering)

    // Referencia para el intervalo de animación
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    // Loop de animación
    useEffect(() => {
        if (animation.isPlaying && result) {
            intervalRef.current = setInterval(() => {
                const nextFrame = animation.currentFrame + 1
                if (nextFrame >= animation.totalFrames) {
                    pauseAnimation()
                } else {
                    setAnimationFrame(nextFrame)
                }
            }, 1000 / animation.playbackSpeed)

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                }
            }
        }
    }, [animation.isPlaying, animation.currentFrame, animation.totalFrames,
    animation.playbackSpeed, result, pauseAnimation, setAnimationFrame])

    const canAnimate = result && result.iterationHistory.length > 0

    return (
        <div className="space-y-4">
            {/* Configuración FCM */}
            <Card className="bg-slate-900/80 border-slate-700/50" data-tour="fcm-config">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                        <Settings className="w-4 h-4 text-purple-400" />
                        Configuración FCM
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Número de clústeres */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Clústeres (k)</span>
                            <span className="text-slate-200 font-medium">{config.clusterCount}</span>
                        </div>
                        <Slider
                            value={[config.clusterCount]}
                            onValueChange={([v]) => updateConfig({ clusterCount: v })}
                            min={2}
                            max={5}
                            step={1}
                            disabled={isRunning}
                        />
                    </div>

                    {/* Fuzziness */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Fuzziness (m)</span>
                            <span className="text-slate-200 font-medium">{config.fuzziness.toFixed(1)}</span>
                        </div>
                        <Slider
                            value={[config.fuzziness]}
                            onValueChange={([v]) => updateConfig({ fuzziness: v })}
                            min={1.1}
                            max={3}
                            step={0.1}
                            disabled={isRunning}
                        />
                        <p className="text-[10px] text-slate-500">
                            m=1 → duro (K-Means), m=2 → estándar, m{'>'}2 → muy difuso
                        </p>
                    </div>

                    {/* Máx iteraciones */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Máx. Iteraciones</span>
                            <span className="text-slate-200 font-medium">{config.maxIterations}</span>
                        </div>
                        <Slider
                            value={[config.maxIterations]}
                            onValueChange={([v]) => updateConfig({ maxIterations: v })}
                            min={10}
                            max={200}
                            step={10}
                            disabled={isRunning}
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={runClustering}
                            disabled={isRunning || dataPoints.length === 0}
                            className="flex-1"
                        >
                            {isRunning ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Ejecutar FCM
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={resetClustering}
                            disabled={isRunning || !result}
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Indicador de resultados */}
                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
                        >
                            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                {result.converged ? 'Convergencia alcanzada' : 'Máx. iteraciones alcanzadas'}
                            </div>
                            <div className="text-xs text-slate-400">
                                {result.iterationCount} iteraciones, error: {result.convergenceError.toExponential(2)}
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            {/* Controles de animación */}
            <Card className="bg-slate-900/80 border-slate-700/50" data-tour="animation-controls">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                        <Play className="w-4 h-4 text-cyan-400" />
                        Animación de Convergencia
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Controles de reproducción */}
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={stepBackward}
                            disabled={!canAnimate || animation.currentFrame === 0}
                            className="h-10 w-10"
                        >
                            <SkipBack className="w-4 h-4" />
                        </Button>

                        <Button
                            size="icon"
                            onClick={() => animation.isPlaying ? pauseAnimation() : playAnimation()}
                            disabled={!canAnimate}
                            className="h-12 w-12"
                        >
                            {animation.isPlaying ? (
                                <Pause className="w-5 h-5" />
                            ) : (
                                <Play className="w-5 h-5" />
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={stopAnimation}
                            disabled={!canAnimate}
                            className="h-10 w-10"
                        >
                            <Square className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={stepForward}
                            disabled={!canAnimate || animation.currentFrame >= animation.totalFrames - 1}
                            className="h-10 w-10"
                        >
                            <SkipForward className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Timeline */}
                    {canAnimate && (
                        <div className="space-y-2">
                            <Slider
                                value={[animation.currentFrame]}
                                onValueChange={([v]) => setAnimationFrame(v)}
                                min={0}
                                max={animation.totalFrames - 1}
                                step={1}
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>Iteración 1</span>
                                <span>Iteración {animation.totalFrames}</span>
                            </div>
                        </div>
                    )}

                    {/* Velocidad */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Velocidad</span>
                            <span className="text-slate-200 font-medium">{animation.playbackSpeed} FPS</span>
                        </div>
                        <Slider
                            value={[animation.playbackSpeed]}
                            onValueChange={([v]) => setPlaybackSpeed(v)}
                            min={0.5}
                            max={10}
                            step={0.5}
                        />
                    </div>

                    {!canAnimate && (
                        <div className="text-center p-4 border border-dashed border-slate-700 rounded-lg">
                            <p className="text-sm text-slate-500">
                                Ejecuta el algoritmo FCM para ver la animación de convergencia
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
