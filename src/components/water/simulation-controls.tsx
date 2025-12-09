'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useWaterStore } from '@/stores/water-store'
import { ALL_SCENARIOS, Scenario } from '@/lib/scenarios'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Gauge } from 'lucide-react'

/**
 * SimulationControls - Panel de control de simulaciones ambientales
 * 
 * Permite ejecutar escenarios predefinidos que modifican los parámetros
 * del agua automáticamente para demostrar la respuesta del sistema difuso.
 */

export function SimulationControls() {
    const isSimulating = useWaterStore(state => state.isSimulating)
    const currentScenario = useWaterStore(state => state.currentScenario)
    const simulationElapsedTime = useWaterStore(state => state.simulationElapsedTime)
    const simulationSpeed = useWaterStore(state => state.simulationSpeed)

    const startSimulation = useWaterStore(state => state.startSimulation)
    const stopSimulation = useWaterStore(state => state.stopSimulation)
    const pauseSimulation = useWaterStore(state => state.pauseSimulation)
    const resumeSimulation = useWaterStore(state => state.resumeSimulation)
    const updateSimulation = useWaterStore(state => state.updateSimulation)
    const setSimulationSpeed = useWaterStore(state => state.setSimulationSpeed)

    // Referencia para el loop de animación
    const lastTimeRef = useRef<number>(0)
    const animationRef = useRef<number | null>(null)

    // Loop de simulación
    useEffect(() => {
        if (!isSimulating) {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
                animationRef.current = null
            }
            return
        }

        const animate = (time: number) => {
            if (lastTimeRef.current === 0) {
                lastTimeRef.current = time
            }

            const deltaTime = time - lastTimeRef.current
            lastTimeRef.current = time

            updateSimulation(deltaTime)

            animationRef.current = requestAnimationFrame(animate)
        }

        lastTimeRef.current = 0
        animationRef.current = requestAnimationFrame(animate)

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isSimulating, updateSimulation])

    const handleScenarioClick = (scenario: Scenario) => {
        if (isSimulating && currentScenario?.id === scenario.id) {
            pauseSimulation()
        } else if (!isSimulating && currentScenario?.id === scenario.id) {
            resumeSimulation()
        } else {
            startSimulation(scenario)
        }
    }

    // Calcular progreso de la simulación
    const progress = currentScenario
        ? (simulationElapsedTime / currentScenario.duration) * 100
        : 0

    return (
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-200">
                    <Gauge className="w-5 h-5 text-purple-400" />
                    Simulador de Eventos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Grid de escenarios */}
                <div className="grid grid-cols-2 gap-2">
                    {ALL_SCENARIOS.map((scenario) => (
                        <motion.button
                            key={scenario.id}
                            onClick={() => handleScenarioClick(scenario)}
                            className={`relative p-3 rounded-lg border text-left transition-all ${currentScenario?.id === scenario.id
                                    ? 'border-purple-500 bg-purple-500/10'
                                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                                }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-start gap-2">
                                <span className="text-xl">{scenario.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-slate-200 truncate">
                                        {scenario.name}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                                        {scenario.description}
                                    </p>
                                </div>
                            </div>

                            {/* Indicador de selección */}
                            {currentScenario?.id === scenario.id && (
                                <motion.div
                                    className="absolute inset-0 border-2 border-purple-500 rounded-lg pointer-events-none"
                                    layoutId="scenario-selection"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.button>
                    ))}
                </div>

                {/* Controles de reproducción */}
                <AnimatePresence>
                    {currentScenario && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                        >
                            <div className="flex items-center gap-2">
                                <Button
                                    size="icon"
                                    variant={isSimulating ? 'default' : 'outline'}
                                    onClick={() => isSimulating ? pauseSimulation() : resumeSimulation()}
                                    className="h-10 w-10"
                                >
                                    {isSimulating ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                </Button>

                                <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={stopSimulation}
                                    className="h-10 w-10"
                                >
                                    <Square className="w-4 h-4" />
                                </Button>

                                <div className="flex-1">
                                    {/* Barra de progreso */}
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{
                                                backgroundColor: currentScenario.themeColor,
                                                width: `${progress}%`
                                            }}
                                            transition={{ duration: 0.1 }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                                        <span>{(simulationElapsedTime / 1000).toFixed(1)}s</span>
                                        <span>{(currentScenario.duration / 1000).toFixed(0)}s</span>
                                    </div>
                                </div>
                            </div>

                            {/* Control de velocidad */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 w-16">Velocidad:</span>
                                <Slider
                                    value={[simulationSpeed]}
                                    onValueChange={([v]) => setSimulationSpeed(v)}
                                    min={0.25}
                                    max={4}
                                    step={0.25}
                                    className="flex-1"
                                />
                                <span className="text-xs text-slate-400 w-10 text-right">
                                    {simulationSpeed}x
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Descripción del escenario actual */}
                {currentScenario && (
                    <motion.div
                        key={currentScenario.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 rounded-lg border border-slate-700 bg-slate-800/30"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span>{currentScenario.icon}</span>
                            <span className="font-medium text-sm text-slate-200">
                                {currentScenario.name}
                            </span>
                            {isSimulating && (
                                <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    En curso
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400">
                            {currentScenario.description}
                        </p>
                    </motion.div>
                )}

                {!currentScenario && (
                    <div className="p-4 rounded-lg border border-dashed border-slate-700 text-center">
                        <p className="text-sm text-slate-500">
                            Selecciona un escenario para simular
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
