'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FCMVisualization } from '@/components/diagnostics/fcm-visualization'
import { EducationalPanel } from '@/components/diagnostics/educational-panel'
import { ConvergenceControls } from '@/components/diagnostics/convergence-controls'
import { PointInspector } from '@/components/diagnostics/point-inspector'
import { DataControls } from '@/components/diagnostics/data-controls'

export default function DiagnosticsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-200">
                                    Diagnóstico Industrial
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Fuzzy C-Means para Mantenimiento Predictivo
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
                    {/* Left Sidebar - Controls */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4 overflow-y-auto"
                    >
                        <DataControls />
                        <ConvergenceControls />
                    </motion.div>

                    {/* Center - Visualization */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-2"
                    >
                        <FCMVisualization />
                    </motion.div>

                    {/* Right Sidebar - Inspector & Education */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-4 overflow-hidden"
                    >
                        <PointInspector />
                        <div className="flex-1 overflow-hidden">
                            <EducationalPanel />
                        </div>
                    </motion.div>
                </div>
            </main>
        </div>
    )
}
