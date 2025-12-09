import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes with proper precedence
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Interpolates between two colors based on a ratio (0-1)
 * @param color1 - Start color in HSL format {h, s, l}
 * @param color2 - End color in HSL format {h, s, l}
 * @param ratio - Interpolation ratio (0 = color1, 1 = color2)
 */
export function interpolateHSL(
    color1: { h: number; s: number; l: number },
    color2: { h: number; s: number; l: number },
    ratio: number
): { h: number; s: number; l: number } {
    const clampedRatio = Math.max(0, Math.min(1, ratio))
    return {
        h: color1.h + (color2.h - color1.h) * clampedRatio,
        s: color1.s + (color2.s - color1.s) * clampedRatio,
        l: color1.l + (color2.l - color1.l) * clampedRatio,
    }
}

/**
 * Converts HSL color to CSS string
 */
export function hslToString(color: { h: number; s: number; l: number }): string {
    return `hsl(${Math.round(color.h)}, ${Math.round(color.s)}%, ${Math.round(color.l)}%)`
}

/**
 * Interpolates between multiple colors based on a value in a range
 * Used for water quality visualization
 */
export function getWaterColor(qualityScore: number): string {
    // Quality score: 0-100
    // 0-40: Critical (brown/murky)
    // 40-70: Caution (yellow-green)
    // 70-100: Optimal (crystal blue)

    const critical = { h: 30, s: 40, l: 30 }   // Murky brown
    const caution = { h: 55, s: 70, l: 45 }    // Yellow-green
    const optimal = { h: 195, s: 85, l: 55 }   // Crystal blue

    if (qualityScore <= 40) {
        const ratio = qualityScore / 40
        return hslToString(interpolateHSL(critical, caution, ratio))
    } else if (qualityScore <= 70) {
        const ratio = (qualityScore - 40) / 30
        return hslToString(interpolateHSL(caution, optimal, ratio))
    } else {
        const ratio = (qualityScore - 70) / 30
        const brightOptimal = { h: 195, s: 90, l: 60 }
        return hslToString(interpolateHSL(optimal, brightOptimal, ratio))
    }
}

/**
 * Formats a number for display with specified decimal places
 */
export function formatNumber(value: number, decimals: number = 2): string {
    return value.toFixed(decimals)
}

/**
 * Formats currency value in USD
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value)
}

/**
 * Generates a random number within a range with optional Gaussian distribution
 */
export function randomInRange(min: number, max: number, gaussian: boolean = false): number {
    if (!gaussian) {
        return min + Math.random() * (max - min)
    }

    // Box-Muller transform for Gaussian distribution
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

    const mean = (min + max) / 2
    const std = (max - min) / 6 // 99.7% of values within range
    const value = mean + normal * std

    return Math.max(min, Math.min(max, value))
}

/**
 * Creates a delay promise for animations
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Calculates Euclidean distance between two points
 */
export function euclideanDistance(p1: number[], p2: number[]): number {
    if (p1.length !== p2.length) {
        throw new Error('Points must have the same dimensions')
    }
    return Math.sqrt(
        p1.reduce((sum, val, i) => sum + Math.pow(val - p2[i], 2), 0)
    )
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
}

/**
 * Maps a value from one range to another
 */
export function mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
): number {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}
