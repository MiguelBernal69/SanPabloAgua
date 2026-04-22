# 💧 Sistema de Gestión de Agua - Backend API

API REST desarrollada en Go para la gestión de un sistema de agua potable de barrio.

## 🚀 Características

- ✅ Autenticación JWT con roles (Admin, Lector, Usuario)
- ✅ Gestión de usuarios y clientes
- ✅ Registro de lecturas mensuales de medidores
- ✅ Cálculo automático de consumo y tarifas escalonadas
- ✅ Sistema de pagos con recibos
- ✅ Reportes mensuales y de morosos
- ✅ API RESTful con Fiber (framework ultra-rápido)
- ✅ PostgreSQL con GORM
- ✅ Validaciones y manejo de errores

## 📋 Requisitos

- Go 1.21+
- PostgreSQL 14+
- Git

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd water-management-api
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=water_management

JWT_SECRET=tu_clave_secreta_muy_segura

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASSWORD=tu_password_de_aplicacion
```

### 3. Crear la base de datos

```bash
psql -U postgres
CREATE DATABASE water_management;
\q
```

### 4. Instalar dependencias

```bash
go mod download
```

### 5. Ejecutar migraciones y servidor

```bash
go run cmd/api/main.go
```

El servidor estará corriendo en `http://localhost:8080`

## 📊 Modelo de Datos

### Tarifas de Agua (en Bolivianos)

- **0-10 m³**: 37 Bs (consumo mínimo fijo)
- **11-25 m³**: 3 Bs por cada m³ adicional
- **26+ m³**: 8 Bs por cada m³ adicional

### Ejemplo de Cálculo:

- 8 m³ → 37 Bs
- 15 m³ → 37 + (5 × 3) = 52 Bs
- 30 m³ → 37 + (15 × 3) + (5 × 8) = 122 Bs

## 🔐 Roles y Permisos

### Usuario (Cliente)

- Ver sus propias lecturas
- Ver su historial de pagos
- Ver sus deudas

### Lector

- Crear lecturas mensuales
- Ver lista de clientes
- Editar fotos de casas

### Administrador

- Todo lo de Lector +
- Crear/editar usuarios
- Registrar pagos
- Generar reportes
- Gestionar todo el sistema

## 📡 Endpoints Principales

### Autenticación

```http
POST /api/v1/auth/login
```

### Usuarios

```http
GET    /api/v1/users/me           # Perfil actual
PUT    /api/v1/users/me           # Actualizar perfil
GET    /api/v1/admin/users        # Listar todos (Admin)
POST   /api/v1/admin/users        # Crear usuario (Admin)
```

### Lecturas

```http
POST   /api/v1/readings                    # Crear lectura (Lector/Admin)
GET    /api/v1/readings                    # Listar lecturas
GET    /api/v1/readings/customer/:id       # Lecturas por cliente
```

### Pagos

```http
POST   /api/v1/payments                    # Registrar pago (Admin)
GET    /api/v1/payments                    # Listar pagos (Admin)
GET    /api/v1/payments/customer/:id       # Pagos por cliente (Admin)
```

### Reportes

```http
GET    /api/v1/reports/monthly?month=3&year=2024    # Reporte mensual (Admin)
GET    /api/v1/reports/debtors                      # Lista de morosos (Admin)
```

## 📝 Ejemplos de Uso

### Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "77777777",
    "password": "admin123"
  }'
```

### Crear Lectura

```bash
curl -X POST http://localhost:8080/api/v1/readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "customer_id": "uuid-del-cliente",
    "current_reading": 45.5,
    "month": 3,
    "year": 2024
  }'
```

## 🏗️ Estructura del Proyecto

```
water-management-api/
├── cmd/
│   └── api/
│       └── main.go              # Punto de entrada
├── config/
│   └── config.go                # Configuración
├── internal/
│   ├── auth/
│   │   └── jwt.go               # Manejo de JWT
│   ├── database/
│   │   └── database.go          # Conexión DB
│   ├── handlers/
│   │   ├── auth.go              # Handlers de auth
│   │   ├── readings.go          # Handlers de lecturas
│   │   ├── payments.go          # Handlers de pagos
│   │   ├── customers.go         # Handlers de clientes
│   │   └── reports.go           # Handlers de reportes
│   ├── middleware/
│   │   └── auth.go              # Middleware de autenticación
│   ├── models/
│   │   └── models.go            # Modelos GORM
│   ├── services/
│   │   └── billing.go           # Lógica de facturación
│   └── utils/
│       └── password.go          # Utilidades de password
├── .env.example
├── go.mod
└── README.md
```

## 🔄 Próximas Funcionalidades

- [ ] Servicio de envío de emails
- [ ] Upload de fotos de casas
- [ ] WebSockets para notificaciones en tiempo real
- [ ] Exportar reportes a PDF
- [ ] Dashboard con estadísticas
- [ ] API para app móvil Flutter

## 🐛 Debugging

Ver logs de la base de datos:

```bash
# El modo logger.Info ya está activado por defecto
```

## 📞 Soporte

Para consultas o problemas, contacta al equipo de desarrollo.

---

Desarrollado con ❤️ para la comunidad
