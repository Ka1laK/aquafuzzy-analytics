'use client'

import { useWaterStore } from '@/stores/water-store'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { motion } from 'framer-motion'
import { Droplets, FlaskConical, Thermometer, HelpCircle } from 'lucide-react'

/**
 * ParameterControls - Controles de entrada de parámetros del agua
 * 
 * Permite al usuario ajustar:
 * - Turbidez (NTU)
 * - pH
 * - Temperatura (°C)
 * 
 * Cada control muestra el grado de membresía difusa actual.
 */

export function ParameterControls() {
    const turbidity = useWaterStore(state => state.turbidity)
    const ph = useWaterStore(state => state.ph)
    const temperature = useWaterStore(state => state.temperature)
    const memberships = useWaterStore(state => state.memberships)
    const isSimulating = useWaterStore(state => state.isSimulating)

    const setTurbidity = useWaterStore(state => state.setTurbidity)
    const setPh = useWaterStore(state => state.setPh)
    const setTemperature = useWaterStore(state => state.setTemperature)

    // Obtener la membresía dominante para cada variable
    const getDominantMembership = (entries: Array<{ name: string; degree: number }>) => {
        if (!entries || entries.length === 0) return null
        const sorted = [...entries].sort((a, b) => b.degree - a.degree)
        return sorted[0].degree > 0 ? sorted[0] : null
    }

    const turbidityMembership = memberships?.turbidity
        ? getDominantMembership(memberships.turbidity)
        : null

    const phMembership = memberships?.ph
        ? getDominantMembership(memberships.ph)
        : null

    const tempMembership = memberships?.temperature
        ? getDominantMembership(memberships.temperature)
        : null

    // Color para indicador de pH
    const getPhColor = () => {
        if (ph < 6) return 'text-orange-400'
        if (ph < 7) return 'text-yellow-400'
        if (ph <= 8) return 'text-emerald-400'
        if (ph <= 9) return 'text-blue-400'
        return 'text-purple-400'
    }

    // Color para indicador de turbidez
    const getTurbidityColor = () => {
        if (turbidity < 50) return 'text-emerald-400'
        if (turbidity < 200) return 'text-yellow-400'
        if (turbidity < 500) return 'text-orange-400'
        return 'text-red-400'
    }

    return (
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-200">
                    <FlaskConical className="w-5 h-5 text-cyan-400" />
                    Parámetros del Agua Cruda
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Turbidez */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Droplets className={`w-4 h-4 ${getTurbidityColor()}`} />
                            <span className="text-sm font-medium text-slate-300">Turbidez</span>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        La turbidez mide las partículas suspendidas en el agua (NTU).
                                        A mayor turbidez, más coagulante se necesita.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getTurbidityColor()}`}>
                                {turbidity.toFixed(0)}
                            </span>
                            <span className="text-xs text-slate-500">NTU</span>
                        </div>
                    </div>

                    <Slider
                        value={[turbidity]}
                        onValueChange={([v]) => setTurbidity(v)}
                        min={0}
                        max={1000}
                        step={1}
                        disabled={isSimulating}
                        className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-emerald-500 [&_[data-slot=slider-range]]:via-yellow-500 [&_[data-slot=slider-range]]:to-red-500"
                    />

                    {/* Membresía difusa */}
                    {turbidityMembership && (
                        <motion.div
                            className="flex items-center gap-2 text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span className="text-slate-500">Nivel difuso:</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 capitalize">
                                {turbidityMembership.name.replace('_', ' ')}
                            </span>
                            <span className="text-slate-600">
                                ({(turbidityMembership.degree * 100).toFixed(0)}%)
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* pH */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${getPhColor()} bg-current opacity-60`} />
                            <span className="text-sm font-medium text-slate-300">pH</span>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        El pH indica acidez (0-7) o alcalinidad (7-14).
                                        El rango óptimo para coagulación es 6.5-8.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-lg font-bold ${getPhColor()}`}>
                                {ph.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500">
                                {ph < 7 ? 'Ácido' : ph > 7 ? 'Alcalino' : 'Neutro'}
                            </span>
                        </div>
                    </div>

                    <Slider
                        value={[ph]}
                        onValueChange={([v]) => setPh(v)}
                        min={0}
                        max={14}
                        step={0.1}
                        disabled={isSimulating}
                        className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-orange-500 [&_[data-slot=slider-range]]:via-emerald-500 [&_[data-slot=slider-range]]:to-purple-500"
                    />

                    {/* Escala de pH visual */}
                    <div className="flex justify-between text-[10px] text-slate-600 px-1">
                        <span>Ácido</span>
                        <span>Neutro</span>
                        <span>Alcalino</span>
                    </div>

                    {phMembership && (
                        <motion.div
                            className="flex items-center gap-2 text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span className="text-slate-500">Nivel difuso:</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 capitalize">
                                {phMembership.name.replace('_', ' ')}
                            </span>
                            <span className="text-slate-600">
                                ({(phMembership.degree * 100).toFixed(0)}%)
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Temperatura */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-medium text-slate-300">Temperatura</span>
                            <Tooltip>
                                <TooltipTrigger>
                                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        La temperatura afecta la velocidad de reacción.
                                        Agua fría requiere más tiempo de floculación.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-orange-400">
                                {temperature.toFixed(0)}
                            </span>
                            <span className="text-xs text-slate-500">°C</span>
                        </div>
                    </div>

                    <Slider
                        value={[temperature]}
                        onValueChange={([v]) => setTemperature(v)}
                        min={0}
                        max={40}
                        step={1}
                        disabled={isSimulating}
                        className="[&_[data-slot=slider-range]]:bg-gradient-to-r [&_[data-slot=slider-range]]:from-blue-500 [&_[data-slot=slider-range]]:via-green-500 [&_[data-slot=slider-range]]:to-red-500"
                    />

                    {tempMembership && (
                        <motion.div
                            className="flex items-center gap-2 text-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <span className="text-slate-500">Nivel difuso:</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 capitalize">
                                {tempMembership.name.replace('_', ' ')}
                            </span>
                            <span className="text-slate-600">
                                ({(tempMembership.degree * 100).toFixed(0)}%)
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Mensaje de simulación activa */}
                {isSimulating && (
                    <motion.div
                        className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-xs text-cyan-400 text-center">
                            ⚡ Simulación en progreso - Controles bloqueados
                        </p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    )
}
