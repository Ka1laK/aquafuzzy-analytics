'use client'

import { useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useWaterStore } from '@/stores/water-store'
import { getWaterColor } from '@/lib/utils'

/**
 * WaterVisualization - Componente Principal de Visualización del Tanque
 * 
 * Este componente renderiza un tanque de agua con:
 * - Color dinámico basado en la calidad del agua
 * - Sistema de partículas para visualizar la turbidez
 * - Animaciones fluidas de transición
 */

interface Particle {
    x: number
    y: number
    size: number
    opacity: number
    speed: number
    settled: boolean
}

export function WaterVisualization() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const animationRef = useRef<number | null>(null)

    const turbidity = useWaterStore(state => state.turbidity)
    const fuzzyOutputs = useWaterStore(state => state.fuzzyOutputs)
    const runInference = useWaterStore(state => state.runInference)

    // Run initial inference on mount
    useEffect(() => {
        if (!fuzzyOutputs) {
            runInference()
        }
    }, [fuzzyOutputs, runInference])

    const qualityScore = fuzzyOutputs?.qualityScore ?? 50
    const waterColor = getWaterColor(qualityScore)

    // Calcular número de partículas basado en turbidez
    const targetParticleCount = Math.floor((turbidity / 1000) * 150) + 5

    // Inicializar o ajustar partículas
    const updateParticles = useCallback(() => {
        const current = particlesRef.current

        // Añadir partículas si faltan
        while (current.length < targetParticleCount) {
            current.push({
                x: Math.random() * 100,
                y: Math.random() * 100,
                size: 2 + Math.random() * 4,
                opacity: 0.3 + Math.random() * 0.5,
                speed: 0.1 + Math.random() * 0.3,
                settled: false
            })
        }

        // Marcar partículas excedentes para "sedimentar"
        for (let i = targetParticleCount; i < current.length; i++) {
            current[i].settled = true
        }

        // Eliminar partículas que ya sedimentaron
        particlesRef.current = current.filter(p => !p.settled || p.y < 98)
    }, [targetParticleCount])

    // Animación del canvas
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const animate = () => {
            const { width, height } = canvas
            ctx.clearRect(0, 0, width, height)

            updateParticles()

            // Dibujar partículas
            particlesRef.current.forEach(particle => {
                // Movimiento browniano
                if (!particle.settled) {
                    particle.x += (Math.random() - 0.5) * 0.5
                    particle.y += (Math.random() - 0.5) * 0.3 + particle.speed * 0.1

                    // Mantener dentro de límites
                    particle.x = Math.max(5, Math.min(95, particle.x))
                    particle.y = Math.max(5, Math.min(95, particle.y))
                } else {
                    // Sedimentar hacia abajo
                    particle.y += 0.5
                    particle.opacity *= 0.98
                }

                // Dibujar partícula
                const x = (particle.x / 100) * width
                const y = (particle.y / 100) * height

                ctx.beginPath()
                ctx.arc(x, y, particle.size, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(30, 50%, 40%, ${particle.opacity})`
                ctx.fill()
            })

            animationRef.current = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [updateParticles])

    // Determinar estilo del borde basado en estado
    const getBorderStyle = () => {
        if (!fuzzyOutputs) return 'border-slate-600'
        switch (fuzzyOutputs.riskLevel) {
            case 'critical': return 'border-red-500 shadow-red-500/30'
            case 'caution': return 'border-yellow-500 shadow-yellow-500/30'
            default: return 'border-emerald-500 shadow-emerald-500/30'
        }
    }

    return (
        <div className="relative">
            {/* Etiqueta de estado */}
            <motion.div
                className="absolute -top-8 left-1/2 -translate-x-1/2 z-10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${fuzzyOutputs?.riskLevel === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : fuzzyOutputs?.riskLevel === 'caution'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    }`}>
                    {fuzzyOutputs?.riskLevel === 'critical' ? '⚠️ Estado Crítico'
                        : fuzzyOutputs?.riskLevel === 'caution' ? '⚡ Precaución'
                            : '✓ Óptimo'}
                </div>
            </motion.div>

            {/* Contenedor del tanque */}
            <motion.div
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden border-4 shadow-lg transition-all duration-500 ${getBorderStyle()}`}
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
            >
                {/* Fondo del agua con gradiente dinámico */}
                <motion.div
                    className="absolute inset-0"
                    animate={{ backgroundColor: waterColor }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: `linear-gradient(180deg, ${waterColor} 0%, ${waterColor}dd 50%, ${waterColor}aa 100%)`
                    }}
                />

                {/* Efecto de ondas en la superficie */}
                <div className="absolute top-0 left-0 right-0 h-8 overflow-hidden opacity-30">
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{
                            x: [-20, 20, -20],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 10 Q25 0 50 10 T100 10 V20 H0Z\' fill=\'white\' opacity=\'0.3\'/%3E%3C/svg%3E")',
                            backgroundRepeat: 'repeat-x',
                            backgroundSize: '100px 20px'
                        }}
                    />
                </div>

                {/* Canvas para partículas */}
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    width={400}
                    height={300}
                />

                {/* Indicador de turbidez */}
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="text-xs text-white/70">Turbidez</div>
                    <div className="text-lg font-bold text-white">{turbidity.toFixed(0)} NTU</div>
                </div>

                {/* Indicador de calidad */}
                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="text-xs text-white/70">Calidad</div>
                    <div className="text-lg font-bold text-white">{qualityScore}%</div>
                </div>

                {/* Marcas de nivel del tanque */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 text-white/50 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-px bg-white/30" />
                        100%
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                        <div className="w-4 h-px bg-white/30" />
                        75%
                    </div>
                    <div className="flex items-center gap-2 mt-8">
                        <div className="w-4 h-px bg-white/30" />
                        50%
                    </div>
                </div>

                {/* Efecto de brillo/reflejo */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
            </motion.div>

            {/* Etiqueta del tanque */}
            <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-slate-200">Tanque de Tratamiento</h3>
                <p className="text-sm text-slate-400">Proceso de Coagulación-Floculación</p>
            </div>
        </div>
    )
}
