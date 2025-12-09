'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useDiagnosticsStore } from '@/stores/diagnostics-store'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

/**
 * PointInspector - Panel de inspección de punto seleccionado
 * 
 * Muestra detalles del punto seleccionado:
 * - Valores de características
 * - Grados de pertenencia a cada clúster (dinámico)
 * - Score de riesgo
 * - Recomendaciones
 */

export function PointInspector() {
    const selectedPoint = useDiagnosticsStore(state => state.selectedPoint)
    const selectedPointRisk = useDiagnosticsStore(state => state.selectedPointRisk)
    const clusterNames = useDiagnosticsStore(state => state.clusterNames)
    const clusterColors = useDiagnosticsStore(state => state.clusterColors)
    const featureNames = useDiagnosticsStore(state => state.featureNames)
    const config = useDiagnosticsStore(state => state.config)

    const getRiskIcon = () => {
        if (!selectedPointRisk) return null
        switch (selectedPointRisk.riskCategory) {
            case 'low': return <CheckCircle className="w-5 h-5 text-emerald-400" />
            case 'medium': return <Info className="w-5 h-5 text-yellow-400" />
            case 'high': return <AlertTriangle className="w-5 h-5 text-orange-400" />
            case 'critical': return <XCircle className="w-5 h-5 text-red-400" />
        }
    }

    // Get cluster name for index, with fallback for dynamic clusters
    const getClusterName = (index: number) => {
        if (index < clusterNames.length) {
            return clusterNames[index]
        }
        return `Clúster ${index + 1}`
    }

    // Get cluster color for index, with fallback
    const getClusterColor = (index: number) => {
        const defaultColors = [
            'hsl(142, 76%, 45%)',
            'hsl(45, 93%, 47%)',
            'hsl(0, 84%, 60%)',
            'hsl(200, 90%, 50%)',
            'hsl(280, 80%, 55%)'
        ]
        if (index < clusterColors.length) {
            return clusterColors[index]
        }
        return defaultColors[index % defaultColors.length]
    }

    return (
        <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                    <Target className="w-4 h-4 text-cyan-400" />
                    Inspector de Punto
                </CardTitle>
            </CardHeader>
            <CardContent>
                <AnimatePresence mode="wait">
                    {selectedPoint ? (
                        <motion.div
                            key={selectedPoint.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-xs text-slate-500">ID de Máquina</div>
                                    <div className="text-lg font-bold text-slate-200">{selectedPoint.id}</div>
                                </div>
                                {selectedPoint.label && (
                                    <Badge variant="outline">{selectedPoint.label}</Badge>
                                )}
                            </div>

                            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <div className="text-xs text-slate-500 mb-2">Características</div>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedPoint.features.map((value, i) => (
                                        <div key={i}>
                                            <div className="text-[10px] text-slate-500">
                                                {featureNames[i] || `Feature ${i + 1}`}
                                            </div>
                                            <div className="text-sm font-medium text-slate-200">
                                                {value.toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedPoint.memberships && selectedPoint.memberships.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-slate-500">
                                        Grados de Pertenencia ({selectedPoint.memberships.length} clústeres)
                                    </div>
                                    {selectedPoint.memberships.map((m, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{ backgroundColor: getClusterColor(i) }}
                                                    />
                                                    <span className="text-slate-300">{getClusterName(i)}</span>
                                                </div>
                                                <span className="text-slate-200 font-medium">
                                                    {(m * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${m * 100}%` }}
                                                    style={{ backgroundColor: getClusterColor(i) }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedPointRisk && (
                                <div className={`p-4 rounded-lg border ${selectedPointRisk.riskCategory === 'low'
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : selectedPointRisk.riskCategory === 'medium'
                                            ? 'bg-yellow-500/10 border-yellow-500/30'
                                            : selectedPointRisk.riskCategory === 'high'
                                                ? 'bg-orange-500/10 border-orange-500/30'
                                                : 'bg-red-500/10 border-red-500/30'
                                    }`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        {getRiskIcon()}
                                        <div>
                                            <div className="text-xs text-slate-400">Score de Riesgo</div>
                                            <div className={`text-xl font-bold ${selectedPointRisk.riskCategory === 'low' ? 'text-emerald-400' :
                                                    selectedPointRisk.riskCategory === 'medium' ? 'text-yellow-400' :
                                                        selectedPointRisk.riskCategory === 'high' ? 'text-orange-400' :
                                                            'text-red-400'
                                                }`}>
                                                {selectedPointRisk.riskScore}
                                                <span className="text-sm text-slate-500">/100</span>
                                            </div>
                                        </div>
                                        <Badge
                                            className={`ml-auto ${selectedPointRisk.riskCategory === 'low'
                                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                                    : selectedPointRisk.riskCategory === 'medium'
                                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                                        : selectedPointRisk.riskCategory === 'high'
                                                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/50'
                                                            : 'bg-red-500/20 text-red-400 border-red-500/50'
                                                }`}
                                        >
                                            {selectedPointRisk.riskCategory === 'low' ? 'Bajo' :
                                                selectedPointRisk.riskCategory === 'medium' ? 'Medio' :
                                                    selectedPointRisk.riskCategory === 'high' ? 'Alto' : 'Crítico'}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        💡 {selectedPointRisk.recommendation}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <div className="text-center py-8">
                            <Target className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-sm text-slate-500">
                                Haz clic en un punto para ver sus grados de pertenencia
                            </p>
                        </div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    )
}
