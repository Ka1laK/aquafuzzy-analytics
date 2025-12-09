# 📚 Guía para Estudiantes - AquaFuzzy Analytics 2.0

¡Bienvenido/a! Esta guía te ayudará a entender los conceptos fundamentales de **Lógica Difusa** y **Fuzzy C-Means** mientras experimentas con la plataforma.

---

## 🎯 Objetivos de Aprendizaje

Al completar esta guía, podrás:
1. Entender qué es la lógica difusa y por qué es útil
2. Crear e interpretar funciones de membresía
3. Comprender cómo funcionan las reglas difusas
4. Diferenciar FCM de K-Means tradicional
5. Interpretar grados de membresía en clustering

---

## 📖 Parte 1: Lógica Difusa (Módulo de Agua)

### ¿Qué problema resuelve?

Imagina que eres operador de una planta de tratamiento de agua. Un experto te dice:

> "Si el agua está **muy turbia** y el pH es **ácido**, necesitas agregar **mucho** coagulante y esperar **bastante** tiempo."

Estas instrucciones son **imprecisas** pero muy útiles. La lógica difusa permite que una computadora entienda y aplique estas reglas.

### Experimento 1: Funciones de Membresía

1. Abre el **Simulador de Agua** (`/water`)
2. Observa el slider de **Turbidez**
3. Muévelo lentamente de 0 a 1000
4. Fíjate en el indicador de "Nivel difuso" debajo del slider

**Pregunta para reflexionar:** ¿Por qué cuando la turbidez es 100 NTU puede ser "50% Baja, 50% Media" en lugar de pertenecer solo a una categoría?

### Experimento 2: Reglas Difusas en Acción

1. Configura: Turbidez = 50, pH = 7, Temperatura = 22
2. Anota las salidas: Dosis, Tiempo, Calidad
3. Ahora cambia solo la Turbidez a 500
4. Observa cómo cambian **todas** las salidas

**Pregunta:** ¿Por qué el costo operativo aumenta cuando aumenta la turbidez?

### Experimento 3: Simulación de Eventos

1. Selecciona el escenario "Tormenta Súbita"
2. Pulsa Play y observa:
   - ¿Cómo cambia el color del agua?
   - ¿Cómo reacciona la dosis de coagulante?
   - ¿El sistema logra recuperar la calidad?

---

## 📊 Parte 2: Fuzzy C-Means (Módulo de Diagnóstico)

### ¿Por qué FCM es mejor para diagnóstico?

En mantenimiento industrial, una máquina no pasa de "funcionando" a "rota" instantáneamente. Hay **estados intermedios**:

- Día 1: Funcionando normalmente
- Día 30: Un poco de vibración extra
- Día 60: Vibración preocupante, pero aún funciona
- Día 90: Falla inminente

FCM captura esta **transición gradual** con grados de membresía.

### Experimento 4: K-Means vs FCM

1. Abre el **Diagnóstico Industrial** (`/diagnostics`)
2. Genera datos sintéticos
3. Configura `fuzziness = 1.1` (casi como K-Means)
4. Ejecuta FCM y observa los colores de los puntos
5. Ahora configura `fuzziness = 2` y ejecuta de nuevo

**Pregunta:** ¿Los puntos en los bordes entre clústeres cambian de color? ¿Por qué?

### Experimento 5: Interpretando Membresías

1. Genera datos sintéticos
2. Ejecuta FCM con configuración por defecto
3. Haz clic en un punto que esté **entre dos clústeres**
4. Observa el panel de Inspector:
   - ¿Cuáles son sus membresías?
   - ¿Cuál es su Score de Riesgo?

### Experimento 6: Animación de Convergencia

1. Genera datos y ejecuta FCM
2. Usa el botón de "Play" en los controles de animación
3. Observa cómo:
   - Los centroides (✕) se mueven
   - Los colores de los puntos cambian
   - El error de convergencia disminuye

**Pregunta:** ¿Cuántas iteraciones necesita el algoritmo para converger? ¿Qué pasa si aumentas el parámetro de fuzziness?

---

## ✅ Autoevaluación

Intenta responder estas preguntas sin mirar las respuestas:

1. ¿Cuál es la diferencia entre lógica clásica y lógica difusa?
2. ¿Por qué usamos funciones trapezoidales en lugar de escalones?
3. ¿Qué significa que un punto tenga membresía 0.6 al clúster "Alerta"?
4. ¿Cómo afecta el parámetro m (fuzziness) al resultado del clustering?

<details>
<summary><b>Ver respuestas</b></summary>

1. En lógica clásica un elemento es verdadero o falso (0 o 1). En lógica difusa puede ser parcialmente verdadero (ej: 0.7).

2. Las funciones trapezoidales permiten transiciones suaves entre categorías, reflejando mejor la realidad donde los límites no son abruptos.

3. Significa que el punto tiene 60% de características del clúster "Alerta" y el resto distribuido en otros clústeres. No es completamente "Normal" ni completamente en "Falla".

4. Con m bajo (≈1), las membresías tienden a 0 o 1 (como K-Means). Con m alto (>2), las membresías se distribuyen más uniformemente entre clústeres.

</details>

---

## 📝 Ejercicios Propuestos

### Ejercicio 1: Diseñar tus propias reglas
¿Qué regla agregarías para manejar agua muy fría (< 10°C) con alta turbidez?

### Ejercicio 2: Datos reales
Busca un dataset de sensores industriales (vibración, temperatura) y cárgalo en el módulo de diagnóstico. ¿El FCM identifica correctamente los estados?

### Ejercicio 3: Comparación de algoritmos
Ejecuta FCM con 2, 3 y 4 clústeres sobre los mismos datos. ¿Cuál configuración tiene más sentido para diagnóstico industrial?

---

¡Buena suerte con tu aprendizaje! 🎓
