'use client'

import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDiagnosticsStore } from '@/stores/diagnostics-store'
import { motion } from 'framer-motion'
import { Upload, Sparkles, Trash2, Database } from 'lucide-react'

export function DataControls() {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const dataPoints = useDiagnosticsStore(state => state.dataPoints)
    const dataSource = useDiagnosticsStore(state => state.dataSource)
    const isLoadingData = useDiagnosticsStore(state => state.isLoadingData)

    const importCSV = useDiagnosticsStore(state => state.importCSV)
    const generateSynthetic = useDiagnosticsStore(state => state.generateSynthetic)
    const clearData = useDiagnosticsStore(state => state.clearData)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            try {
                await importCSV(file)
            } catch (error) {
                console.error('Error importing CSV:', error)
            }
        }
        e.target.value = ''
    }

    return (
        <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm text-slate-200">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Datos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoadingData}
                        className="h-auto py-3 flex-col gap-1"
                    >
                        <Upload className="w-4 h-4" />
                        <span className="text-xs">Importar CSV</span>
                    </Button>

                    <Button
                        variant="outline"
                        onClick={() => generateSynthetic()}
                        disabled={isLoadingData}
                        className="h-auto py-3 flex-col gap-1"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs">Generar Datos</span>
                    </Button>
                </div>

                {dataPoints.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-between p-2 rounded bg-slate-800/50"
                    >
                        <div className="text-xs">
                            <span className="text-slate-400">Puntos: </span>
                            <span className="text-slate-200 font-medium">{dataPoints.length}</span>
                            {dataSource && (
                                <span className="text-slate-500 ml-2">
                                    ({dataSource === 'synthetic' ? 'Sintéticos' : 'Importados'})
                                </span>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={clearData} className="h-6 w-6">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    )
}
