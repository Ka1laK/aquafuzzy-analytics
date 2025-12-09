'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WaterVisualization } from '@/components/water/water-visualization'
import { ParameterControls } from '@/components/water/parameter-controls'
import { SimulationControls } from '@/components/water/simulation-controls'
import { ScadaDashboard } from '@/components/water/scada-dashboard'
import { ActiveRulesModal } from '@/components/water/active-rules-modal'

export default function WaterPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                                <Droplets className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-200">
                                    Simulador de Tratamiento de Agua
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Sistema de Control Difuso para Coagulación-Floculación
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* Active Rules Button */}
                    <ActiveRulesModal />
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Visualization */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2"
                    >
                        <div className="mb-6">
                            <WaterVisualization />
                        </div>
                        <ScadaDashboard />
                    </motion.div>

                    {/* Right Column - Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        <ParameterControls />
                        <SimulationControls />
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
