'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Droplets, Activity, ArrowRight, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />

        <div className="container mx-auto px-4 py-20 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400 uppercase tracking-wider">
                Versión 2.0
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                AquaFuzzy
              </span>
              <br />
              <span className="text-slate-200">Analytics</span>
            </h1>

            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
              Laboratorio de simulación interactivo para explorar y entender la
              <span className="text-cyan-400 font-medium"> Lógica Difusa </span>
              y el algoritmo
              <span className="text-purple-400 font-medium"> Fuzzy C-Means</span>.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/water">
                <Button size="lg" className="gap-2">
                  <Droplets className="w-5 h-5" />
                  Simulador de Agua
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/diagnostics">
                <Button size="lg" variant="outline" className="gap-2">
                  <Activity className="w-5 h-5" />
                  Diagnóstico Industrial
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Modules Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Water Treatment Module */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/water">
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/50 transition-all h-full cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <Droplets className="w-6 h-6 text-cyan-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-200">
                    Simulador de Tratamiento de Agua
                  </CardTitle>
                  <CardDescription>
                    Control difuso de planta de tratamiento
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Sistema de 20 reglas difusas expertas
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Visualización reactiva del tanque
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Simulaciones de eventos ambientales
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Dashboard SCADA en tiempo real
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Industrial Diagnostics Module */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/diagnostics">
              <Card className="bg-slate-900/50 border-slate-700/50 hover:border-purple-500/50 transition-all h-full cursor-pointer group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-xl text-slate-200">
                    Diagnóstico Industrial
                  </CardTitle>
                  <CardDescription>
                    Clustering difuso para mantenimiento predictivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-slate-400">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      Algoritmo Fuzzy C-Means animado
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      Grados de membresía visualizados
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      Score de riesgo predictivo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      Guía educativa interactiva
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Concepts Section */}
      <section className="container mx-auto px-4 py-16 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-200 mb-4">
            ¿Qué aprenderás?
          </h2>
          <p className="text-slate-400 mb-8">
            Esta plataforma te permite experimentar con conceptos fundamentales de la
            computación blanda (Soft Computing), utilizados en sistemas de control
            inteligente y análisis de datos.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-2">🧠 Lógica Difusa</h3>
              <p className="text-sm text-slate-400">
                Sistemas de inferencia que trabajan con términos lingüísticos
                como &quot;Alto&quot;, &quot;Medio&quot;, &quot;Bajo&quot; en lugar de valores exactos.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <h3 className="font-semibold text-slate-200 mb-2">📊 Fuzzy C-Means</h3>
              <p className="text-sm text-slate-400">
                Algoritmo de clustering donde cada punto puede pertenecer a
                múltiples grupos con diferentes grados de membresía.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>AquaFuzzy Analytics 2.0 — Laboratorio de Simulación Interactivo</p>
          <p className="mt-1">Desarrollado con Next.js, React, D3.js y ❤️</p>
        </div>
      </footer>
    </div>
  )
}
