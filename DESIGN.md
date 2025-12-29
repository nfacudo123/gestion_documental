# Diseño de Arquitectura - Gestor Documental (NestJS)

## 1. Modelo de Datos (MongoDB + Mongoose)
Se ha optado por un diseño de esquema referenciado para garantizar la integridad y el cumplimiento de la normativa de retención legal, esquematizando el diseño basado en tres colecciones principales para garantizar escalabilidad y trazabilidad.

* **Documents**: Almacena metadatos globales, taxonomía y el estado de acceso (ACL); se incluyó el campo `customerId` como eje del aislamiento multi-tenant.
* **DocumentVersions**: Implementa inmutabilidad, dentro de cada carga de archivo genera un nuevo registro con metadatos técnicos tales como (`size`, `mimeType`, `storageKey`), permitiendo auditoría y recuperación de versiones previas.
* **AuditLogs**: Registra cada interacción (creación, lectura, borrado, cambios de ACL) para garantizar la trazabilidad exigida por el sistema.

**Índices y Justificación:**
* `{ tenantId: 1 }`: Obligatorio para asegurar que las consultas no crucen datos entre empresas haciendo de esto un esquema Multi-tenant.
* `{ documentId: 1, version: 1 } (Unique)`: Evita colisiones en el historial de versiones.
* `{ "retention.deleteAt": 1 }`: Permite que el proceso **Cron Job** localice documentos expirados sin realizar un "Full Collection Scan", protegiendo el rendimiento del servidor.

## 2. Seguridad y ACL por Documento
A diferencia de los sistemas basados en tokens (JWT), esta implementación utiliza un **Modelo de Sesión Activa en Memoria** para garantizar un control estricto de acceso y concurrencia:

1. **Control de Concurrencia**: El sistema impide que un nuevo tenant inicie sesión si ya existe una sesión activa en el servidor, devolviendo una `BadRequestException`.
2. **Aislamiento Nativo**: El `tenantId` y el `role` se extraen directamente del objeto global `activeSession`. Esto elimina el riesgo de suplantación de identidad, ya que el sistema ignora cualquier ID enviado por el cliente en el cuerpo de las peticiones de documentos.
3. **Validación Estricta**: Se utiliza `ValidationPipe` con `forbidNonWhitelisted` para asegurar que los DTOs reciban únicamente los campos `role` y `tenantId` debidamente decorados.

## 3. Visualización Segura
Para evitar la exposición directa del almacenamiento local, se implementó el siguiente patrón:

* **Endpoint Protegido**: El contenido no se sirve desde una carpeta pública, sino mediante `GET /documents/:id/content`.
* **Headers de Control**: Se inyectan headers `Content-Disposition: inline` y `Content-Security-Policy` para permitir la previsualización segura en navegador.
* **Servido por Stream**: El backend lee el archivo físico y lo transmite directamente al cliente, evitando exponer la ruta real (`storageKey`) en el frontend.

## 4. Política de Retención y Borrado
El ciclo de vida del documento está automatizado y protegido legalmente:

* **Facilidad y Seguridad (retentionYears)**: Para simplificar la experiencia del usuario, el sistema solicita el número de años de retención (`retentionYears`). Internamente, el backend calcula el `deleteAt`; por motivos de seguridad, el valor exacto de `deleteAt` no se expone directamente al usuario final para evitar la manipulación de metadatos críticos de expiración.
* **Inviolabilidad Legal**: Bajo la normativa implementada, si un documento tiene una política de retención activa, el sistema **bloquea cualquier intento de eliminación manual**. El documento está protegido por ley hasta que se cumpla su periodo de vigencia.
* **Cron Job Automatizado**: 
    * **Soft Delete**: Al expirar, el documento se oculta de las búsquedas pero se mantiene para fines de auditoría legal.
    * **Hard Delete**: Tras el periodo de gracia post-expiración, el proceso automático elimina el registro y el binario físico.




    ## 35. Endpoints del Sistema y Funcionalidad

### **Módulo de Autenticación (`Auth`)**
Controla el estado de acceso global del sistema.

* **`POST /auth/register`**:
    * **Función**: Registra un par Rol + Tenant en el repositorio de memoria.
    * **Validación**: Valida mediante `AuthDto` que los campos no sean nulos y cumplan con el formato de cadena.
* **`POST /auth/login`**:
    * **Función**: Verifica la existencia del registro y activa la sesión en el servidor.
    * **Lógica**: Genera un token de sesión aleatorio y bloquea el acceso a otros usuarios hasta que se cierre la sesión actual.
* **`DELETE /auth/logout`**:
    * **Función**: Limpia el objeto `activeSession`.
    * **Mensaje**: Notifica específicamente qué rol y qué tenant han finalizado su actividad.

### **Módulo de Documentos (`Documents`)**
Gestiona el ciclo de vida de los archivos vinculados al tenant activo.

* **`POST /documents/upload`**:
    * **Función**: Almacena archivos en el sistema local y crea el registro en MongoDB vinculado al `tenantId` de la sesión.
* **`GET /documents/:id/content`**:
    * **Función**: Streaming seguro de archivos desde el almacenamiento local.
    * **Seguridad**: El archivo se transmite directamente al flujo de respuesta sin exponer la ruta física en el servidor.
* **`PATCH /documents/:id/retention`**:
    * **Función**: Define el tiempo de vida legal del documento mediante `retentionYears`.
* **`DELETE /documents/:id`**:
    * **Función**: Borrado manual protegido.
    * **Validación**: Si la fecha actual es menor a la fecha de retención, el sistema lanza una excepción de conflicto (409).
