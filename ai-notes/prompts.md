# 🤖 Bitácora de Uso de IA - Gestor Documental (Prueba Técnica)

Este documento describe el proceso de colaboración con la IA para asegurar que el sistema cumpla con los requisitos técnicos y de seguridad.

## 1. Prompts Principales y Evolución de la Ayuda

### Fase 1: Resolución de Errores Críticos de Configuración
* **Prompt inicial:** "ERROR [ExceptionHandler] Error: La variable MONGODB_URI no está definida en el archivo .env".
* **Evolución:** Tras varios intentos fallidos, se solicitó a la IA forzar la ruta absoluta del archivo utilizando `path.join(process.cwd(), '.env')` para asegurar la lectura en entornos locales de Windows (Sistema operativo utilizado para hacer el ejercicio).

### Fase 2: Depuración de DTOs y Validación Global
* **Problema:** El sistema arrojaba un error 400 indicando que las propiedades `role` y `tenantId` "no deberían existir".
* **Consulta:** "¿Por qué sale esto en register si necesito esos campos?".
* **Solución IA:** Se identificó que el `ValidationPipe` en `main.ts` tenía activado `forbidNonWhitelisted: true`, lo que requería decoradores de `class-validator` en el DTO para permitir el paso de datos.

### Fase 3: Ajuste de Diseño de Arquitectura
* **Prompt:** "Revisa este DESIGN.md y agrega los endpoints con el código ACTUAL".
* **Contexto:** Se pidió a la IA que dejara de sugerir JWT/Bearer y se ajustara estrictamente a la lógica de sesión en memoria (`activeSession`) programada en el controlador.

## 2. Ajustes y Decisiones Técnicas (Humano vs IA)

| Sugerencia de la IA | Decisión del Desarrollador | Justificación |
| :--- | :--- | :--- |
| **Uso de JWT (Bearer Auth)** | **Rechazado** | Se decidió mantener una sesión *stateful* en memoria para cumplir con el requisito de "bloqueo de sesión única" de forma más sencilla y directa para que la plataforma pudiera ser testeada. |
| **Middleware de Auth** | **Ajustado** | Se prefirió manejar la validación de sesión directamente en el controlador para tener control total sobre los mensajes de error personalizados. |
| **Whitelist en ValidationPipe** | **Aceptado** | Se mantuvo la validación estricta sugerida para cumplir con los estándares de seguridad y evitar inyección de datos. |
| **Streaming de archivos** | **Aceptado** | Se adoptó la sugerencia de usar `fs.createReadStream` para no exponer rutas físicas del servidor en localhost. |

## 3. Proceso de Verificación Manual
La IA ayudó a diseñar las pruebas de caja negra para validar la robustez del sistema:

1.  **Prueba de Sesión Bloqueada:** Se verificó que al intentar un segundo login con un tenant distinto sin hacer logout previo, el servidor respondiera con un error de conflicto de sesión.
2.  **Prueba de Retención:** Se intentó eliminar un documento con `deleteAt` a futuro, confirmando que el backend lanzara una excepción 409, tal como se documentó en el `DESIGN.md`.
3.  **Prueba de Inyección de Campos:** Se envió un JSON con campos extra (ej. `isAdmin: true`) para confirmar que el sistema los filtrara y rechazara.

## 4. Conclusión de Ayuda de IA
La IA actuó como un revisor de funciones de código en snippets específicos y como documentador técnico, bajo una supervisión humana constante y crítica, la colaboración se centró en los siguientes pilares:

1.  **Revisión de Estándares NestJS:** Se utilizó la IA para validar que la estructura de los módulos, controladores y servicios cumpliera con los patrones de diseño de NestJS, asegurando un código limpio y mantenible.

2.  **Optimización de Esquemas y DTOs:** La intervención de la IA fue clave para auditar la correcta implementación de decoradores de class-validator y swagger, garantizando que la validación de tipos y la documentación de la API fueran consistentes con los requisitos de seguridad.

3.  **Auditoría de Lógica de Negocio:** La IA funcionó como un "Code Reviewer" para verificar la coherencia de las funciones de cálculo de retención y el flujo de los endpoints de documentos.

4.  **Curaduría Técnica Humana:** El factor humano fue determinante para ajustar las sugerencias de la IA a las restricciones reales de la prueba, se corrigieron propuestas del modelo (como el uso de arquitecturas JWT genéricas) para alinearlas con la implementación específica de sesión en memoria y el aislamiento de datos solicitado, asegurando que la solución final fuera auténtica y funcional.