'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { useDiagnosticsStore } from '@/stores/diagnostics-store'
import { CLUSTER_COLORS } from '@/lib/fcm'
import { motion } from 'framer-motion'

/**
 * FCMVisualization - Visualización animada del algoritmo Fuzzy C-Means
 * 
 * Renderiza un scatter plot con D3.js que muestra:
 * - Puntos de datos con colores interpolados por membresía
 * - Centroides de cada clúster
 * - Animación de la convergencia del algoritmo
 */

export function FCMVisualization() {
    const svgRef = useRef<SVGSVGElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const dataPoints = useDiagnosticsStore(state => state.dataPoints)
    const processedPoints = useDiagnosticsStore(state => state.processedPoints)
    const result = useDiagnosticsStore(state => state.result)
    const animation = useDiagnosticsStore(state => state.animation)
    const selectedPoint = useDiagnosticsStore(state => state.selectedPoint)
    const featureNames = useDiagnosticsStore(state => state.featureNames)
    const clusterColors = useDiagnosticsStore(state => state.clusterColors)

    const selectPoint = useDiagnosticsStore(state => state.selectPoint)
    const setHoveredPoint = useDiagnosticsStore(state => state.setHoveredPoint)

    // Determinar qué datos mostrar según el estado de animación
    const getCurrentState = useCallback(() => {
        if (!result || result.iterationHistory.length === 0) {
            return null
        }

        const frameIndex = Math.min(
            animation.currentFrame,
            result.iterationHistory.length - 1
        )

        return result.iterationHistory[frameIndex]
    }, [result, animation.currentFrame])

    // Renderizar visualización D3
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return

        const container = containerRef.current
        const svg = d3.select(svgRef.current)
        const { width, height } = container.getBoundingClientRect()

        const margin = { top: 30, right: 30, bottom: 50, left: 60 }
        const innerWidth = width - margin.left - margin.right
        const innerHeight = height - margin.top - margin.bottom

        svg.selectAll('*').remove()

        // Determinar datos a mostrar
        const pointsToShow = processedPoints.length > 0 ? processedPoints : dataPoints
        if (pointsToShow.length === 0) {
            // Mostrar placeholder
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .attr('fill', '#64748b')
                .attr('font-size', '14px')
                .text('Importa datos o genera datos sintéticos para comenzar')
            return
        }

        // Obtener estado actual de la animación
        const currentState = getCurrentState()

        // Calcular dominios
        const xExtent = d3.extent(pointsToShow, d => d.features[0]) as [number, number]
        const yExtent = d3.extent(pointsToShow, d => d.features[1]) as [number, number]

        const xPadding = (xExtent[1] - xExtent[0]) * 0.1
        const yPadding = (yExtent[1] - yExtent[0]) * 0.1

        const xScale = d3.scaleLinear()
            .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
            .range([0, innerWidth])

        const yScale = d3.scaleLinear()
            .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
            .range([innerHeight, 0])

        // Grupo principal
        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Grid
        g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(
                d3.axisBottom(xScale)
                    .tickSize(innerHeight)
                    .tickFormat(() => '')
            )

        g.append('g')
            .attr('class', 'grid')
            .attr('opacity', 0.1)
            .call(
                d3.axisLeft(yScale)
                    .tickSize(-innerWidth)
                    .tickFormat(() => '')
            )

        // Ejes
        g.append('g')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')

        g.append('g')
            .call(d3.axisLeft(yScale).ticks(5))
            .selectAll('text')
            .attr('fill', '#94a3b8')
            .attr('font-size', '10px')

        // Labels de ejes
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '12px')
            .text(featureNames[0] || 'Feature X')

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .attr('font-size', '12px')
            .text(featureNames[1] || 'Feature Y')

        // Función para obtener color del punto
        const getPointColor = (point: typeof pointsToShow[0], index: number) => {
            // Si hay estado de animación, usar membresías de ese estado
            if (currentState && currentState.membershipMatrix[index]) {
                const memberships = currentState.membershipMatrix[index]
                return interpolateColor(memberships, clusterColors)
            }
            // Si el punto tiene color calculado
            if (point.color) return point.color
            // Si tiene etiqueta, usar color basado en ella
            if (point.label) {
                if (point.label.includes('Normal')) return clusterColors[0]
                if (point.label.includes('Alert')) return clusterColors[1]
                return clusterColors[2]
            }
            return '#64748b'
        }

        // Puntos de datos
        const points = g.selectAll('.data-point')
            .data(pointsToShow)
            .enter()
            .append('circle')
            .attr('class', 'data-point')
            .attr('cx', d => xScale(d.features[0]))
            .attr('cy', d => yScale(d.features[1]))
            .attr('r', 6)
            .attr('fill', (d, i) => getPointColor(d, i))
            .attr('stroke', d => selectedPoint?.id === d.id ? '#fff' : 'transparent')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8)
            .attr('cursor', 'pointer')
            .on('click', (event, d) => {
                event.stopPropagation()
                // Buscar el punto con membresías si existen
                const pointWithMemberships = processedPoints.find(p => p.id === d.id) || d
                selectPoint(pointWithMemberships)
            })
            .on('mouseenter', (event, d) => {
                d3.select(event.target)
                    .transition()
                    .duration(150)
                    .attr('r', 8)
                    .attr('opacity', 1)
                setHoveredPoint(d)
            })
            .on('mouseleave', (event) => {
                d3.select(event.target)
                    .transition()
                    .duration(150)
                    .attr('r', 6)
                    .attr('opacity', 0.8)
                setHoveredPoint(null)
            })

        // Animación de entrada
        points
            .attr('opacity', 0)
            .transition()
            .duration(300)
            .delay((d, i) => i * 5)
            .attr('opacity', 0.8)

        // Centroides (si hay resultado o estado de animación)
        const centroids = currentState?.centroids || (result?.centroids || [])

        if (centroids.length > 0) {
            // Líneas de conexión a centroides (opcional, comentado por limpieza visual)

            // Centroides
            g.selectAll('.centroid')
                .data(centroids)
                .enter()
                .append('g')
                .attr('class', 'centroid')
                .attr('transform', d => `translate(${xScale(d[0])},${yScale(d[1])})`)
                .each(function (d, i) {
                    const centroidG = d3.select(this)
                    // Extended color palette for any number of clusters
                    const defaultColors = [
                        'hsl(142, 76%, 45%)',
                        'hsl(45, 93%, 47%)',
                        'hsl(0, 84%, 60%)',
                        'hsl(200, 90%, 50%)',
                        'hsl(280, 80%, 55%)',
                        'hsl(320, 70%, 50%)',
                        'hsl(160, 70%, 45%)'
                    ]
                    const color = clusterColors[i] || defaultColors[i % defaultColors.length]

                    // Círculo exterior (aura)
                    centroidG.append('circle')
                        .attr('r', 20)
                        .attr('fill', color)
                        .attr('opacity', 0.2)

                    // Círculo principal
                    centroidG.append('circle')
                        .attr('r', 10)
                        .attr('fill', color)
                        .attr('stroke', '#fff')
                        .attr('stroke-width', 2)

                    // Cruz central
                    centroidG.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('fill', '#fff')
                        .attr('font-size', '12px')
                        .attr('font-weight', 'bold')
                        .text('✕')
                })
        }

        // Click en fondo para deseleccionar
        svg.on('click', () => {
            selectPoint(null)
        })

    }, [dataPoints, processedPoints, result, animation.currentFrame, selectedPoint,
        featureNames, clusterColors, selectPoint, setHoveredPoint, getCurrentState])

    return (
        <div className="relative h-full">
            <div
                ref={containerRef}
                className="w-full h-full min-h-[400px] bg-slate-900/50 rounded-lg overflow-hidden"
            >
                <svg
                    ref={svgRef}
                    className="w-full h-full"
                    style={{ minHeight: '400px' }}
                />
            </div>

            {/* Indicador de iteración */}
            {result && result.iterationHistory.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700"
                >
                    <div className="text-xs text-slate-400">Iteración</div>
                    <div className="text-2xl font-bold text-cyan-400">
                        {animation.currentFrame + 1}
                        <span className="text-sm text-slate-500">/{result.iterationHistory.length}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Error: {(getCurrentState()?.convergenceError || 0).toExponential(2)}
                    </div>
                </motion.div>
            )}

            {/* Leyenda de clústeres */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700"
                >
                    <div className="text-xs text-slate-400 mb-2">Clústeres ({result.centroids.length})</div>
                    {result.centroids.map((_, i) => {
                        const storeState = useDiagnosticsStore.getState()
                        const defaultColors = [
                            'hsl(142, 76%, 45%)',
                            'hsl(45, 93%, 47%)',
                            'hsl(0, 84%, 60%)',
                            'hsl(200, 90%, 50%)',
                            'hsl(280, 80%, 55%)',
                            'hsl(320, 70%, 50%)',
                            'hsl(160, 70%, 45%)'
                        ]
                        const color = storeState.clusterColors[i] || defaultColors[i % defaultColors.length]
                        const name = storeState.clusterNames[i] || `Clúster ${i + 1}`
                        return (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-slate-300">{name}</span>
                            </div>
                        )
                    })}
                </motion.div>
            )}
        </div>
    )
}

// Función auxiliar para interpolar colores basado en membresías
function interpolateColor(memberships: number[], colors: string[]): string {
    // Parsear colores HSL
    const parseHSL = (color: string) => {
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
            return { h: parseInt(match[1]), s: parseInt(match[2]), l: parseInt(match[3]) }
        }
        return { h: 0, s: 0, l: 50 }
    }

    let h = 0, s = 0, l = 0
    const parsedColors = colors.map(parseHSL)

    for (let i = 0; i < memberships.length && i < parsedColors.length; i++) {
        h += parsedColors[i].h * memberships[i]
        s += parsedColors[i].s * memberships[i]
        l += parsedColors[i].l * memberships[i]
    }

    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}
