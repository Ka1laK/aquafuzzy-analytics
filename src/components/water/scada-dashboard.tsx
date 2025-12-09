'use client'

import { useWaterStore, HistoryPoint } from '@/stores/water-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
    LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
    ResponsiveContainer, Area, ComposedChart
} from 'recharts'
import {
    Activity, DollarSign, Zap, Gauge, Clock, Beaker,
    TrendingUp, TrendingDown, Minus
} from 'lucide-react'

/**
 * ScadaDashboard - Panel de control estilo SCADA
 * 
 * Muestra métricas en tiempo real del proceso de tratamiento:
 * - Gráfico de historial de calidad
 * - Costo operativo
 * - Eficiencia del proceso
 * - Estado general
 * - Salidas del sistema difuso
 */

export function ScadaDashboard() {
    const fuzzyOutputs = useWaterStore(state => state.fuzzyOutputs)
    const history = useWaterStore(state => state.history)

    // Preparar datos para el gráfico
    const chartData = history.slice(-50).map((point: HistoryPoint, index: number) => ({
        index,
        quality: point.qualityScore,
        cost: point.operationalCost * 100, // Escalar para visualización
        turbidity: point.turbidity / 10 // Escalar
    }))

    // Calcular tendencia
    const getTrend = () => {
        if (history.length < 2) return 'stable'
        const recent = history.slice(-5)
        const avgRecent = recent.reduce((sum, p) => sum + p.qualityScore, 0) / recent.length
        const older = history.slice(-10, -5)
        if (older.length === 0) return 'stable'
        const avgOlder = older.reduce((sum, p) => sum + p.qualityScore, 0) / older.length
        if (avgRecent > avgOlder + 5) return 'up'
        if (avgRecent < avgOlder - 5) return 'down'
        return 'stable'
    }

    const trend = getTrend()

    // Formatear corrección de pH
    const getPhCorrectionLabel = () => {
        if (!fuzzyOutputs) return 'N/A'
        switch (fuzzyOutputs.phCorrection) {
            case 'none': return 'No requerida'
            case 'slight': return 'Leve'
            case 'moderate': return 'Moderada'
            case 'intense': return 'Intensa'
            default: return 'N/A'
        }
    }

    return (
        <div className="space-y-4">
            {/* Fila de métricas principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Calidad del agua */}
                <MetricCard
                    icon={<Activity className="w-5 h-5" />}
                    label="Calidad del Agua"
                    value={fuzzyOutputs?.qualityScore ?? 0}
                    unit="%"
                    color={
                        (fuzzyOutputs?.qualityScore ?? 0) >= 70 ? 'emerald' :
                            (fuzzyOutputs?.qualityScore ?? 0) >= 40 ? 'yellow' : 'red'
                    }
                    trend={trend}
                />

                {/* Costo operativo */}
                <MetricCard
                    icon={<DollarSign className="w-5 h-5" />}
                    label="Costo por m³"
                    value={fuzzyOutputs?.operationalCost ?? 0}
                    unit="USD"
                    decimals={3}
                    color="blue"
                />

                {/* Eficiencia */}
                <MetricCard
                    icon={<Zap className="w-5 h-5" />}
                    label="Eficiencia"
                    value={fuzzyOutputs?.efficiency ?? 0}
                    unit="%"
                    color={
                        (fuzzyOutputs?.efficiency ?? 0) >= 80 ? 'emerald' :
                            (fuzzyOutputs?.efficiency ?? 0) >= 50 ? 'yellow' : 'red'
                    }
                />

                {/* Estado general */}
                <Card className="bg-slate-900/80 border-slate-700/50">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Gauge className="w-4 h-4" />
                            <span className="text-xs">Estado</span>
                        </div>
                        <Badge
                            variant={
                                fuzzyOutputs?.riskLevel === 'optimal' ? 'default' :
                                    fuzzyOutputs?.riskLevel === 'caution' ? 'secondary' : 'destructive'
                            }
                            className={`text-sm font-semibold ${fuzzyOutputs?.riskLevel === 'optimal'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                                : fuzzyOutputs?.riskLevel === 'caution'
                                    ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                    : 'bg-red-500/20 text-red-400 border-red-500/50'
                                }`}
                        >
                            {fuzzyOutputs?.riskLevel === 'optimal' ? '✓ Óptimo' :
                                fuzzyOutputs?.riskLevel === 'caution' ? '⚡ Precaución' : '⚠️ Crítico'}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de historial */}
            <Card className="bg-slate-900/80 border-slate-700/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Historial de Calidad del Agua
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData}>
                                <defs>
                                    <linearGradient id="qualityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="index"
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 100]}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value: number, name: string) => {
                                        if (name === 'quality') return [`${value.toFixed(0)}%`, 'Calidad']
                                        return [value, name]
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="quality"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    fill="url(#qualityGradient)"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="quality"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#06b6d4' }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Salidas del sistema difuso */}
            <Card className="bg-slate-900/80 border-slate-700/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                        <Beaker className="w-4 h-4 text-purple-400" />
                        Salidas del Sistema Difuso
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Dosis de coagulante */}
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Beaker className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wide">Dosis Coagulante</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-purple-400">
                                    {fuzzyOutputs?.coagulantDose?.toFixed(1) ?? '0.0'}
                                </span>
                                <span className="text-xs text-slate-500">mg/L</span>
                            </div>
                        </div>

                        {/* Tiempo de floculación */}
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Clock className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wide">Tiempo Floculación</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-orange-400">
                                    {fuzzyOutputs?.flocculationTime?.toFixed(0) ?? '0'}
                                </span>
                                <span className="text-xs text-slate-500">min</span>
                            </div>
                        </div>

                        {/* Corrección de pH */}
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Activity className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wide">Corrección pH</span>
                            </div>
                            <div className="text-sm font-semibold text-cyan-400">
                                {getPhCorrectionLabel()}
                            </div>
                            {(fuzzyOutputs?.phCorrectionAmount ?? 0) > 0 && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {fuzzyOutputs?.phCorrectionAmount?.toFixed(1)} mg/L
                                </div>
                            )}
                        </div>

                        {/* Reglas activas */}
                        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Zap className="w-3 h-3" />
                                <span className="text-[10px] uppercase tracking-wide">Reglas Activas</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-emerald-400">
                                    {fuzzyOutputs?.ruleActivations?.length ?? 0}
                                </span>
                                <span className="text-xs text-slate-500">de 20</span>
                            </div>
                        </div>
                    </div>

                    {/* Explicación del sistema */}
                    {fuzzyOutputs?.explanation && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                        >
                            <p className="text-xs text-slate-400 leading-relaxed">
                                💡 {fuzzyOutputs.explanation}
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Componente auxiliar para métricas
interface MetricCardProps {
    icon: React.ReactNode
    label: string
    value: number
    unit: string
    color: 'emerald' | 'yellow' | 'red' | 'blue' | 'purple'
    decimals?: number
    trend?: 'up' | 'down' | 'stable'
}

function MetricCard({ icon, label, value, unit, color, decimals = 0, trend }: MetricCardProps) {
    const colorClasses = {
        emerald: 'text-emerald-400',
        yellow: 'text-yellow-400',
        red: 'text-red-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400'
    }

    return (
        <Card className="bg-slate-900/80 border-slate-700/50">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-slate-400">
                        {icon}
                        <span className="text-xs">{label}</span>
                    </div>
                    {trend && (
                        <div className={`${trend === 'up' ? 'text-emerald-400' :
                            trend === 'down' ? 'text-red-400' : 'text-slate-500'
                            }`}>
                            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                                trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                                    <Minus className="w-4 h-4" />}
                        </div>
                    )}
                </div>
                <div className="flex items-baseline gap-1">
                    <motion.span
                        key={value}
                        initial={{ opacity: 0.5, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`text-2xl font-bold ${colorClasses[color]}`}
                    >
                        {value.toFixed(decimals)}
                    </motion.span>
                    <span className="text-xs text-slate-500">{unit}</span>
                </div>
            </CardContent>
        </Card>
    )
}
