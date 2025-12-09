'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useWaterStore } from '@/stores/water-store'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, ChevronRight } from 'lucide-react'

/**
 * ActiveRulesModal - Modal que muestra las reglas difusas activas
 * 
 * Permite al usuario ver qué reglas del sistema de inferencia
 * están contribuyendo al resultado actual.
 */
export function ActiveRulesModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const fuzzyOutputs = useWaterStore(state => state.fuzzyOutputs)

    const activeRules = fuzzyOutputs?.ruleActivations || []

    // Only render portal on client side
    useEffect(() => {
        setMounted(true)
    }, [])

    // Modal content to be portaled
    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - covers entire screen */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        style={{ zIndex: 9998 }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal container - truly centered on screen */}
                    <div
                        className="fixed inset-0 flex items-center justify-center p-4"
                        style={{ zIndex: 9999 }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-200">
                                            Reglas Difusas Activas
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            {activeRules.length} reglas contribuyendo al resultado actual
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setIsOpen(false)}
                                    className="hover:bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Content */}
                            <div className="p-4 overflow-y-auto max-h-[55vh]">
                                {activeRules.length === 0 ? (
                                    <div className="text-center py-8 text-slate-500">
                                        <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No hay reglas activas actualmente.</p>
                                        <p className="text-sm mt-1">Ajusta los parámetros para activar reglas.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeRules.map((rule, index) => (
                                            <motion.div
                                                key={rule.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
                                            >
                                                {/* Rule header */}
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono text-slate-500">R{rule.id}</span>
                                                        <span className="font-medium text-slate-200">{rule.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-500">Activación:</span>
                                                        <span className={`font-bold ${rule.firingStrength > 0.7 ? 'text-emerald-400' :
                                                            rule.firingStrength > 0.4 ? 'text-yellow-400' : 'text-slate-400'
                                                            }`}>
                                                            {(rule.firingStrength * 100).toFixed(0)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Rule content */}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="flex-1">
                                                        <span className="text-cyan-400 font-medium">SI </span>
                                                        {Object.entries(rule.conditions).map(([key, value], i, arr) => (
                                                            <span key={key}>
                                                                <span className="text-slate-400">{formatConditionKey(key)}</span>
                                                                <span className="text-slate-200"> es </span>
                                                                <span className="text-purple-400">{formatConditionValue(value as string)}</span>
                                                                {i < arr.length - 1 && <span className="text-slate-500"> Y </span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm mt-2">
                                                    <ChevronRight className="w-4 h-4 text-slate-600" />
                                                    <div className="flex-1">
                                                        <span className="text-orange-400 font-medium">ENTONCES </span>
                                                        {Object.entries(rule.outputs).map(([key, value], i, arr) => (
                                                            <span key={key}>
                                                                <span className="text-slate-400">{formatOutputKey(key)}</span>
                                                                <span className="text-slate-200"> = </span>
                                                                <span className="text-emerald-400">{formatOutputValue(value as string)}</span>
                                                                {i < arr.length - 1 && <span className="text-slate-500">, </span>}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Activation bar */}
                                                <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${rule.firingStrength * 100}%` }}
                                                        style={{
                                                            background: rule.firingStrength > 0.7
                                                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                                : rule.firingStrength > 0.4
                                                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                                    : 'linear-gradient(90deg, #64748b, #94a3b8)'
                                                        }}
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer with close button */}
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    💡 Las reglas con mayor activación tienen más influencia en el resultado.
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )

    return (
        <>
            {/* Botón trigger */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="gap-2"
            >
                <Zap className="w-4 h-4 text-yellow-400" />
                Ver Reglas Activas
                {activeRules.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                        {activeRules.length}
                    </span>
                )}
            </Button>

            {/* Portal modal to document.body to avoid any parent overflow constraints */}
            {mounted && createPortal(modalContent, document.body)}
        </>
    )
}

// Helpers para formatear condiciones y outputs
function formatConditionKey(key: string): string {
    const map: Record<string, string> = {
        turbidity: 'Turbidez',
        ph: 'pH',
        temperature: 'Temperatura'
    }
    return map[key] || key
}

function formatConditionValue(value: string): string {
    const map: Record<string, string> = {
        very_low: 'Muy Baja',
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        very_high: 'Muy Alta',
        very_acidic: 'Muy Ácido',
        acidic: 'Ácido',
        neutral: 'Neutro',
        alkaline: 'Alcalino',
        very_alkaline: 'Muy Alcalino',
        cold: 'Fría',
        normal: 'Normal',
        warm: 'Cálida'
    }
    return map[value] || value
}

function formatOutputKey(key: string): string {
    const map: Record<string, string> = {
        dose: 'Dosis',
        time: 'Tiempo',
        phCorrection: 'Corrección pH'
    }
    return map[key] || key
}

function formatOutputValue(value: string): string {
    const map: Record<string, string> = {
        very_low: 'Muy Baja',
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        very_high: 'Muy Alta',
        very_short: 'Muy Corto',
        short: 'Corto',
        long: 'Largo',
        very_long: 'Muy Largo',
        none: 'Ninguna',
        slight: 'Leve',
        moderate: 'Moderada',
        intense: 'Intensa'
    }
    return map[value] || value
}
