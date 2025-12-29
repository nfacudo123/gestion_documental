# 📂 Gestor Documental API (NestJS)

Este repositorio contiene la implementación del backend para un sistema de gestión documental **multi-tenant**, diseñado para cumplir con normativas de retención legal, auditoría y control de versiones.

## 📋 Descripción General
El sistema permite a las organizaciones cargar, versionar y gestionar documentos de forma aislada. Implementa un motor de políticas de retención que automatiza el ciclo de vida del documento (borrado lógico y físico) mediante tareas programadas.

## 🛠️ Requisitos Previos
Asegúrate de tener instalado lo siguiente en tu entorno local:
* **Node.js**: v18 o superior.
* **MongoDB**: Instancia local corriendo en puerto 27017 o un cluster de MongoDB Atlas.
* **NPM**: Gestor de paquetes incluido con Node.js.

## 🚀 Instalación y Configuración

1.  **Clonar el repositorio e instalar dependencias:**
    ```bash
    npm install
    ```

2.  **Configurar Variables de Entorno:**
    El proyecto incluye un archivo de plantilla. Crea tu archivo `.env`:
    ```bash
    cp .env.example .env
    ```
    *Abre el archivo `.env` y verifica que `MONGODB_URI` apunte a tu base de datos.*.

3.  **Iniciar el Servidor:**
    ```bash
    # Modo desarrollo (Watch mode)
    npm run start:dev
    ```
    El servidor iniciará por defecto en `http://localhost:3000`.

## 📖 Documentación (Swagger)
La API cuenta con documentación interactiva generada automáticamente. Una vez encendido el servidor, accede a:
* 👉 **http://localhost:3000/api/docs**

Desde allí puedes probar todos los endpoints, ver los esquemas DTO y los códigos de respuesta.

## ⚡ Endpoints Principales y Flujo de Uso

### 1. Gestión de Documentos
* `POST /documents`: Registra el metadato inicial (Taxonomía, Tenant).
* `GET /documents`: Lista documentos con paginación y filtros.

### 2. Versionado y Carga (Localhost)
* `POST /documents/:id/versions`: Sube un archivo físico (`multipart/form-data`).
    * **Nota:** El archivo se guarda localmente en la carpeta `/uploads` del servidor.
* `GET /documents/:id/versions`: Historial de cambios del archivo.

### 3. Visualización Segura (Streaming)
* `GET /documents/:id/content`: **Descarga segura**.
    * Este endpoint valida el Token y los permisos ACL.
    * Si es autorizado, **realiza un stream del archivo desde el disco local al cliente**.
    * No expone la ruta física ni URLs públicas; todo el tráfico pasa por el backend.

### 4. Retención y Seguridad
* `PATCH /documents/:id/retention`: Define los años de retención. El sistema calcula automáticamente la fecha de bloqueo (`deleteAt`)..
* `PATCH /documents/:id/acl`: Modifica quién puede leer o editar el documento.

## 🔒 Supuestos Técnicos y Stubs (Decisiones de Diseño)
Para esta prueba técnica ("Repositorio Mínimo Ejecutable"), se tomaron las siguientes decisiones:

1.  **Almacenamiento Local (No AWS S3):**
    Para evitar dependencias de infraestructura en la evaluación, se implementó un `LocalStorageService`. Los archivos se almacenan en el sistema de ficheros del servidor (`./uploads`) y se sirven mediante el endpoint de contenido seguro, simulando el comportamiento de un gestor documental privado.

2.  **Autenticación Simplificada:**
    Se asume que el Token JWT entrante ya contiene el `customerId` (Tenant ID) validado previamente por un Gateway o servicio de identidad.

3.  **Cron Job de Retención:**
    Se implementó un servicio (`RetentionTaskService`) que corre cada medianoche para ejecutar **Soft Deletes** o **Hard Deletes** según la caducidad de los documentos.

4.  **Uso de IA:**
    Se incluye la carpeta `/ai-notes` con el registro de prompts y validaciones realizadas durante el desarrollo, conforme a los requisitos de entrega.

## 🧪 Tests
Para ejecutar las pruebas unitarias (si aplica):
```bash
npm run test