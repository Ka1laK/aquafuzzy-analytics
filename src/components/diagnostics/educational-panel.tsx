'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDiagnosticsStore } from '@/stores/diagnostics-store'
import { motion, AnimatePresence } from 'framer-motion'
import {
    BookOpen, ChevronRight, ChevronLeft, X, Lightbulb,
    HelpCircle, Sparkles, Target
} from 'lucide-react'

/**
 * EducationalPanel - Panel educativo con explicaciones de FCM
 * 
 * Proporciona:
 * - Explicación del propósito de la simulación
 * - Tour guiado interactivo
 * - Explicaciones de conceptos clave
 * - Comparación FCM vs K-Means (mejorada)
 */

const EDUCATIONAL_CONTENT = [
    {
        id: 'purpose',
        title: '¿Para qué sirve esta simulación?',
        icon: '🎯',
        content: `
      Esta herramienta permite **analizar y predecir el estado de máquinas industriales** usando 
      el algoritmo Fuzzy C-Means (FCM).
      
      **Aplicaciones reales:**
      - Detectar máquinas que están empezando a fallar
      - Planificar mantenimiento ANTES de que ocurra la falla
      - Clasificar equipos por nivel de riesgo
      - Optimizar recursos de mantenimiento
      
      **Ventaja clave:**
      A diferencia de sistemas tradicionales, FCM detecta **estados intermedios**, 
      permitiendo intervenir cuando una máquina está "empezando" a degradarse, 
      no cuando ya falló.
    `
    },
    {
        id: 'what-is-fcm',
        title: '¿Qué es Fuzzy C-Means?',
        icon: '🧠',
        content: `
      **Fuzzy C-Means (FCM)** es un algoritmo de clustering que, a diferencia de K-Means,
      permite que cada punto pertenezca a **múltiples clústeres simultáneamente** con
      diferentes grados de pertenencia.
      
      Por ejemplo, una máquina puede estar:
      - 70% en estado "Normal"
      - 25% en estado "Alerta"
      - 5% en estado "Falla"
      
      Esto refleja mejor la realidad: las transiciones entre estados son graduales,
      no abruptas.
    `
    },
    {
        id: 'membership',
        title: 'Grados de Pertenencia',
        icon: '📊',
        content: `
      El **grado de pertenencia** (μ) es un valor entre 0 y 1 que indica cuánto
      pertenece un punto a cada clúster.
      
      **Propiedades clave:**
      - La suma de pertenencias de un punto = 1
      - μ = 0 significa "no pertenece"
      - μ = 1 significa "pertenece completamente"
      
      **En el gráfico:**
      El color de cada punto es una mezcla de los colores de los clústeres,
      proporcional a sus pertenencias. Un punto amarillo-verdoso está entre
      "Normal" (verde) y "Alerta" (amarillo).
    `
    },
    {
        id: 'fuzziness',
        title: 'Parámetro de Fuzziness (m)',
        icon: '🎚️',
        content: `
      El parámetro **m** (fuzziness) controla qué tan "difusos" son los clústeres:
      
      - **m = 1**: Comportamiento similar a K-Means (pertenencias casi 0 o 1)
      - **m = 2**: Valor estándar, buen equilibrio
      - **m > 2**: Clústeres muy difusos, más superposición
      
      En mantenimiento predictivo, m = 2 es ideal porque captura las
      transiciones graduales entre estados operativos.
    `
    },
    {
        id: 'convergence',
        title: 'Proceso de Convergencia',
        icon: '🔄',
        content: `
      El algoritmo FCM converge iterativamente:
      
      1. **Inicializar** centroides aleatoriamente
      2. **Calcular pertenencias** de cada punto a cada centroide
      3. **Actualizar centroides** usando promedios ponderados
      4. **Repetir** hasta que los cambios sean menores que la tolerancia
      
      **En la animación:**
      Puedes ver cómo los centroides (✕) se mueven y los colores de los
      puntos cambian a medida que el algoritmo "aprende" la estructura.
    `
    },
    {
        id: 'vs-kmeans',
        title: 'FCM vs K-Means',
        icon: '⚔️',
        isComparison: true,
        content: '' // Handled specially below
    },
    {
        id: 'risk-score',
        title: 'Score de Riesgo',
        icon: '⚠️',
        content: `
      El **Score de Riesgo** (0-100) se calcula a partir de las pertenencias:
      
      riskScore = μ_alerta × 40 + μ_falla × 100
      
      **Interpretación:**
      - 0-20: Bajo riesgo, operación normal
      - 20-45: Riesgo medio, programar inspección
      - 45-70: Riesgo alto, inspección urgente
      - 70+: Crítico, mantenimiento inmediato
      
      Esto permite **mantenimiento predictivo**: actuar ANTES de la falla.
    `
    }
]

const TOUR_STEPS = [
    {
        title: 'Bienvenido al Diagnóstico Industrial',
        content: 'Este módulo usa FCM para analizar el estado de máquinas industriales y predecir fallas antes de que ocurran.',
        highlight: null
    },
    {
        title: 'Genera o importa datos',
        content: 'Primero, genera datos sintéticos para experimentar o importa un CSV con tus propios datos de sensores.',
        highlight: 'data-controls'
    },
    {
        title: 'Configura el algoritmo',
        content: 'Ajusta el número de clústeres, el parámetro de fuzziness y ejecuta el clustering.',
        highlight: 'fcm-config'
    },
    {
        title: 'Visualiza la convergencia',
        content: 'Usa los controles de animación para ver cómo el algoritmo encuentra los clústeres iterativamente.',
        highlight: 'animation-controls'
    },
    {
        title: 'Inspecciona los resultados',
        content: 'Haz clic en cualquier punto para ver sus grados de pertenencia y score de riesgo.',
        highlight: 'point-inspector'
    }
]

export function EducationalPanel() {
    const showPanel = useDiagnosticsStore(state => state.showEducationalPanel)
    const tour = useDiagnosticsStore(state => state.tour)

    const toggleEducationalPanel = useDiagnosticsStore(state => state.toggleEducationalPanel)
    const startTour = useDiagnosticsStore(state => state.startTour)
    const nextTourStep = useDiagnosticsStore(state => state.nextTourStep)
    const prevTourStep = useDiagnosticsStore(state => state.prevTourStep)
    const skipTour = useDiagnosticsStore(state => state.skipTour)

    if (!showPanel) {
        return (
            <Button
                variant="outline"
                size="icon"
                onClick={toggleEducationalPanel}
                className="fixed bottom-4 right-4 z-50 bg-slate-800 border-slate-700"
            >
                <BookOpen className="w-4 h-4" />
            </Button>
        )
    }

    return (
        <>
            {/* Tour overlay */}
            <AnimatePresence>
                {tour.isActive && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                        onClick={skipTour}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700 shadow-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-200">
                                        {TOUR_STEPS[tour.currentStep].title}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Paso {tour.currentStep + 1} de {TOUR_STEPS.length}
                                    </p>
                                </div>
                            </div>

                            <p className="text-slate-300 text-sm mb-6">
                                {TOUR_STEPS[tour.currentStep].content}
                            </p>

                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={skipTour}
                                    className="text-slate-400"
                                >
                                    Saltar tour
                                </Button>

                                <div className="flex gap-2">
                                    {tour.currentStep > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={prevTourStep}
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        onClick={nextTourStep}
                                    >
                                        {tour.currentStep === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
                                        {tour.currentStep < TOUR_STEPS.length - 1 && (
                                            <ChevronRight className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Panel lateral */}
            <Card className="bg-slate-900/95 border-slate-700/50 backdrop-blur h-full overflow-hidden flex flex-col">
                <CardHeader className="pb-2 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-slate-200 text-base">
                            <BookOpen className="w-4 h-4 text-cyan-400" />
                            Centro de Aprendizaje
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleEducationalPanel}
                            className="h-8 w-8"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto space-y-4 pb-4">
                    {/* Propósito destacado */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-medium text-slate-200">Propósito</span>
                        </div>
                        <p className="text-xs text-slate-400">
                            Detectar y clasificar el estado de máquinas industriales para
                            <span className="text-purple-400 font-medium"> predecir fallas </span>
                            antes de que ocurran.
                        </p>
                    </div>

                    {/* Botón de tour */}
                    {!tour.hasCompletedTour && (
                        <motion.button
                            onClick={startTour}
                            className="w-full p-4 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-left hover:border-cyan-500/50 transition-colors"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="flex items-center gap-3">
                                <Lightbulb className="w-5 h-5 text-cyan-400" />
                                <div>
                                    <h4 className="font-medium text-slate-200">Tour guiado</h4>
                                    <p className="text-xs text-slate-400">Aprende a usar el diagnóstico paso a paso</p>
                                </div>
                            </div>
                        </motion.button>
                    )}

                    {/* Artículos educativos */}
                    <div className="space-y-3">
                        {EDUCATIONAL_CONTENT.map((item, index) => (
                            <EducationalArticle key={item.id} item={item} index={index} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}

interface EducationalArticleProps {
    item: typeof EDUCATIONAL_CONTENT[0]
    index: number
}

function EducationalArticle({ item, index }: EducationalArticleProps) {
    // Special handling for FCM vs K-Means comparison
    if (item.id === 'vs-kmeans') {
        return (
            <motion.details
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
            >
                <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800 transition-colors list-none">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm font-medium text-slate-200 flex-1">{item.title}</span>
                    <HelpCircle className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-3 pb-4 pt-2 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-3">
                        Comparación entre los dos algoritmos de clustering:
                    </p>
                    {/* Tabla de comparación renderizada */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="text-left py-2 px-2 text-slate-400 font-medium">Característica</th>
                                    <th className="text-left py-2 px-2 text-blue-400 font-medium">K-Means</th>
                                    <th className="text-left py-2 px-2 text-purple-400 font-medium">FCM</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-300">
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2 text-slate-400">Pertenencia</td>
                                    <td className="py-2 px-2">Dura (0 o 1)</td>
                                    <td className="py-2 px-2 text-emerald-400">Suave (0 a 1)</td>
                                </tr>
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2 text-slate-400">Transiciones</td>
                                    <td className="py-2 px-2">Abruptas</td>
                                    <td className="py-2 px-2 text-emerald-400">Graduales</td>
                                </tr>
                                <tr className="border-b border-slate-700/50">
                                    <td className="py-2 px-2 text-slate-400">Sensibilidad a ruido</td>
                                    <td className="py-2 px-2">Alta</td>
                                    <td className="py-2 px-2 text-emerald-400">Baja</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-2 text-slate-400">Interpretación</td>
                                    <td className="py-2 px-2">&quot;Es A&quot;</td>
                                    <td className="py-2 px-2 text-emerald-400">&quot;Es 70% A, 30% B&quot;</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 italic">
                        ✓ FCM es superior para diagnóstico porque las máquinas no pasan instantáneamente de &quot;Normal&quot; a &quot;Falla&quot;.
                    </p>
                </div>
            </motion.details>
        )
    }

    return (
        <motion.details
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="group bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden"
        >
            <summary className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-800 transition-colors list-none">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium text-slate-200 flex-1">{item.title}</span>
                <HelpCircle className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                <div className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                    {formatContent(item.content)}
                </div>
            </div>
        </motion.details>
    )
}

// Función para formatear contenido con markdown básico
function formatContent(content: string): React.ReactNode {
    const cleanContent = content.split('\n').map(line => line.trim()).join('\n').trim()

    return cleanContent.split('\n').map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
            return (
                <p key={i} className="font-semibold text-slate-300 mt-2 mb-1">
                    {line.replace(/\*\*/g, '')}
                </p>
            )
        }

        if (line.startsWith('- ')) {
            return (
                <p key={i} className="ml-2 before:content-['•'] before:mr-2 before:text-cyan-400">
                    {line.substring(2)}
                </p>
            )
        }

        if (line.includes('**')) {
            const parts = line.split(/\*\*(.*?)\*\*/)
            return (
                <p key={i} className="my-0.5">
                    {parts.map((part, j) =>
                        j % 2 === 1 ? (
                            <span key={j} className="font-semibold text-slate-300">{part}</span>
                        ) : part
                    )}
                </p>
            )
        }

        if (line.length > 0) {
            return <p key={i} className="my-0.5">{line}</p>
        }

        return <br key={i} />
    })
}
