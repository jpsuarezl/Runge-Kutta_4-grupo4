# Grupo 4: Método de Runge-Kutta de Cuarto Orden (RK4)
## Integrantes y Roles
* **[Dhamar Sofia Patiño Cortina]:** Desarrollo de todos los ejercicios
* **[Santiago Florez Muñoz]:** Contexto, introducción y fundamento 
* **[Johan Esteban Valero Hernandez]:** Aplicaciones
* **[Jean Paul Suarez Luna]:** Explicacion pagina web

---

## Objetivo
Implementar una herramienta web de código propio que aproxime la solución de ecuaciones diferenciales ordinarias (EDO) de primer orden utilizando el método **RK4**, permitiendo visualizar paso a paso las pendientes intermedias ($k_1, k_2, k_3, k_4$), el comportamiento gráfico de la curva y el análisis del error según el tamaño de paso $h$.

---

## Fundamento y Fórmula Implementada
El método RK4 mejora la estimación del cambio en $y$ calculando cuatro pendientes por cada paso $h$: una al inicio del intervalo, dos en el punto medio y una al final, combinándolas mediante un promedio ponderado:

$$k_1 = f(x_n, y_n)$$
$$k_2 = f\left(x_n + \frac{h}{2}, y_n + \frac{h}{2}k_1\right)$$
$$k_3 = f\left(x_n + \frac{h}{2}, y_n + \frac{h}{2}k_2\right)$$
$$k_4 = f\left(x_n + h, y_n + h k_3\right)$$

$$y_{n+1} = y_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$$

$$x_{n+1} = x_n + h$$

* **Orden de error:** El error de truncamiento global es de orden $O(h^4)$ para problemas suficientemente regulares.

---

## Enlaces del Proyecto
* **Aplicación web (GitHub Pages):** `https://[TU-USUARIO].github.io/[NOMBRE-REPOSITORIO]/`
* **Repositorio de código fuente:** `https://github.com/[TU-USUARIO]/[NOMBRE-REPOSITORIO]`

---

## Instrucciones de Uso
1. Ingresar al enlace de **GitHub Pages** indicado arriba.
2. Escribir la función $f(x,y)$ en el campo correspondiente.
3. Ingresar los valores numéricos para el punto inicial ($x_0, y_0$), el valor final ($x_f$) y el tamaño de paso ($h$).
4. Hacer clic en el botón **Calcular** para generar la tabla de iteraciones (con despliegue de pendientes $k_1, k_2, k_3, k_4$) y la gráfica aproximada.
5. Modificar el valor de $h$ para comparar la precisión y el comportamiento del error.

### Formato permitido para $f(x,y)$
* **Analizador utilizado:** `math.js` (única librería externa empleada, dedicada exclusivamente a analizar y evaluar expresiones matemáticas de forma segura sin recurrir a `eval()`). El algoritmo iterativo RK4 y el trazado gráfico están implementados de forma nativa.
* **Variables admitidas:** `x` y `y` (en minúsculas).
* **Operadores básicos:** `+`, `-`, `*`, `/`, `^` (potencias).
* **Funciones elementales:** `sin(x)`, `cos(x)`, `tan(x)`, `exp(x)`, `sqrt(x)`, `log(x)`, `abs(x)`.
* **Ejemplo válido:** `y - x^2 + 1`.

---

## Pruebas de Referencia y Resultados

### 1. Problema de prueba común
* **Ecuación:** $y' = y - x^2 + 1$, con $y(0) = 0.5$ en el intervalo $[0, 2]$ y paso $h = 0.2$.
* **Solución exacta:** $y(x) = (x+1)^2 - \frac{1}{2}e^x$.

| Iteración ($n$) | $x_n$ | $y_n$ (RK4) | Valor Exacto | Error Absoluto |
| :---: | :---: | :---: | :---: | :---: |
| 0 | 0.0 | 0.500000 | 0.500000 | 0.000000 |
| 1 | 0.2 | 0.829293 | 0.829299 | 0.000006 |
| 2 | 0.4 | 1.214076 | 1.214088 | 0.000012 |
| 10 | 2.0 | 5.305363 | 5.305472 | 0.000109 |

### 2. Aplicación real: Caída vertical con resistencia proporcional a la velocidad
* **Modelo:** $v'(t) = 9.81 - 0.18v(t)$, con condición inicial $v(0) = 0$.
* **Variables y unidades:** $t$ en segundos ($\text{s}$), $v$ en metros por segundo ($\text{m/s}$).
* **Solución analítica de referencia:** $v(t) = \frac{9.81}{0.18}(1 - e^{-0.18t})$.
* **Intervalo y pasos probados:** $t \in [0, 20]\text{ s}$, comparando $h_1 = [VALOR_1]$ y $h_2 = [VALOR_2]$.

---

## Evidencias de Ejecución
*(Asegúrate de subir estas imágenes a una carpeta `capturas/` en tu repositorio)*

* **Caso de prueba común:**
  ![Prueba común RK4](capturas/prueba-comun.png)

* **Aplicación real (Caída con rozamiento):**
  ![Aplicación real RK4](capturas/aplicacion-real.png)

---

## Limitaciones y Tratamiento de Errores
* Solo resuelve ecuaciones diferenciales ordinarias de primer orden explícitas de la forma $y' = f(x,y)$ (no soporta sistemas de EDO ni orden superior).
* La aplicación valida y rechaza entradas vacías, sintaxis matemática inválida, pasos $h \le 0$, intervalos donde $x_f \le x_0$, exceso de iteraciones o desbordamientos numéricos (`NaN` / `Infinity`).
* Cuando $(x_f - x_0)/h$ no es un número entero, la aplicación [indicar si rechaza el paso con alerta o ajusta el último paso].

---

## Referencias Bibliográficas
* Chapra, S. C., & Canale, R. P. *Métodos numéricos para ingenieros*. McGraw-Hill.
* Burden, R. L., & Faires, J. D. *Análisis numérico*. Cengage Learning.
* De Jong, J. *Math.js: An extensive math library for JavaScript and Node.js*. Disponible en: https://mathjs.org/
