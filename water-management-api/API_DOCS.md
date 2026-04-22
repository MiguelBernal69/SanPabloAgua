# 📚 Documentación de API

## Base URL

```
http://localhost:8080/api/v1
```

## Autenticación

Todos los endpoints protegidos requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "phone": "77777777",
  "password": "admin123"
}
```

**Respuesta exitosa:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Administrador",
    "phone": "77777777",
    "email": "admin@agua.com",
    "role": "admin",
    "is_active": true
  }
}
```

---

## 👤 Usuarios

### Obtener perfil actual

```http
GET /users/me
Authorization: Bearer <token>
```

### Actualizar perfil

```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nuevo Nombre",
  "email": "nuevo@email.com",
  "phone": "70000000"
}
```

---

## 👥 Administración de Usuarios (Admin only)

### Crear nuevo usuario

```http
POST /admin/users
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Pedro López",
  "phone": "60000002",
  "email": "pedro@example.com",
  "password": "password123",
  "role": "user",
  "customer_code": "AGUA-002",
  "address": "Calle Falsa 456"
}
```

**Roles disponibles:** `user`, `lector`, `admin`

### Listar todos los usuarios

```http
GET /admin/users
Authorization: Bearer <admin-token>

# Filtrar por rol
GET /admin/users?role=user
```

### Obtener usuario por ID

```http
GET /admin/users/:id
Authorization: Bearer <admin-token>
```

### Actualizar usuario

```http
PUT /admin/users/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Nombre Actualizado",
  "is_active": false
}
```

### Eliminar usuario (soft delete)

```http
DELETE /admin/users/:id
Authorization: Bearer <admin-token>
```

---

## 📊 Lecturas

### Crear nueva lectura (Lector/Admin)

```http
POST /readings
Authorization: Bearer <lector-token>
Content-Type: application/json

{
  "customer_id": "uuid-del-cliente",
  "current_reading": 45.5,
  "month": 3,
  "year": 2024
}
```

**Respuesta:**

```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "month": 3,
  "year": 2024,
  "previous_reading": 30.0,
  "current_reading": 45.5,
  "consumption": 15.5,
  "total_amount": 53.5,
  "is_paid": false,
  "reading_date": "2024-03-15T10:30:00Z",
  "lector_id": "uuid",
  "customer": {
    "customer_code": "AGUA-001",
    "user": {
      "name": "María García"
    }
  }
}
```

### Listar lecturas

```http
GET /readings
Authorization: Bearer <token>

# Filtros disponibles:
GET /readings?month=3
GET /readings?year=2024
GET /readings?is_paid=false
GET /readings?month=3&year=2024&is_paid=true
```

### Obtener lectura por ID

```http
GET /readings/:id
Authorization: Bearer <token>
```

### Obtener lecturas de un cliente

```http
GET /readings/customer/:customer_id
Authorization: Bearer <token>
```

---

## 💰 Pagos (Admin only)

### Registrar pago

```http
POST /payments
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "customer_id": "uuid-del-cliente",
  "reading_id": "uuid-de-lectura",
  "amount": 53.5,
  "payment_method": "efectivo",
  "notes": "Pago completo del mes de marzo"
}
```

**Respuesta:**

```json
{
  "id": "uuid",
  "customer_id": "uuid",
  "reading_id": "uuid",
  "amount": 53.5,
  "payment_date": "2024-03-20T14:30:00Z",
  "payment_method": "efectivo",
  "receipt_number": "REC-20240320-12345",
  "notes": "Pago completo del mes de marzo",
  "registered_by": "uuid-admin"
}
```

### Listar pagos

```http
GET /payments
Authorization: Bearer <admin-token>

# Filtrar por cliente
GET /payments?customer_id=uuid
```

### Obtener pagos de un cliente

```http
GET /payments/customer/:customer_id
Authorization: Bearer <admin-token>
```

---

## 🏠 Clientes

### Listar todos los clientes (Admin/Lector)

```http
GET /customers
Authorization: Bearer <token>
```

### Obtener cliente por ID

```http
GET /customers/:id
Authorization: Bearer <token>
```

### Actualizar cliente (Admin/Lector)

```http
PUT /customers/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "house_photo": "https://example.com/photo.jpg",
  "latitude": -17.3935,
  "longitude": -66.1570,
  "address": "Nueva dirección 789"
}
```

---

## 📈 Reportes (Admin only)

### Reporte mensual

```http
GET /reports/monthly?month=3&year=2024
Authorization: Bearer <admin-token>
```

**Respuesta:**

```json
{
  "month": 3,
  "year": 2024,
  "total_readings": 150,
  "total_consumption": 2250.5,
  "total_billed": 8500.0,
  "total_paid": 7200.0,
  "total_pending": 1300.0,
  "readings_paid": 130,
  "readings_pending": 20,
  "average_consumption": 15.0
}
```

### Reporte de morosos

```http
GET /reports/debtors
Authorization: Bearer <admin-token>
```

**Respuesta:**

```json
{
  "total_debtors": 15,
  "debtors": [
    {
      "customer_id": "uuid",
      "customer_code": "AGUA-025",
      "name": "Carlos Pérez",
      "phone": "60000025",
      "address": "Av. 6 de Agosto",
      "months_in_debt": 3,
      "total_debt": 180.5,
      "oldest_debt": "1/2024"
    }
  ]
}
```

---

## ❌ Códigos de Error

| Código | Descripción                                |
| ------ | ------------------------------------------ |
| 400    | Bad Request - Datos inválidos              |
| 401    | Unauthorized - Token inválido o ausente    |
| 403    | Forbidden - Sin permisos suficientes       |
| 404    | Not Found - Recurso no encontrado          |
| 500    | Internal Server Error - Error del servidor |

**Formato de error:**

```json
{
  "error": "Descripción del error"
}
```

---

## 🔄 Flujo de Trabajo Típico

### 1. Admin crea un nuevo cliente

```bash
# 1. Login como admin
POST /auth/login

# 2. Crear usuario tipo "user"
POST /admin/users
```

### 2. Lector toma lectura mensual

```bash
# 1. Login como lector
POST /auth/login

# 2. Crear lectura
POST /readings
```

### 3. Cliente revisa su deuda

```bash
# 1. Login como usuario
POST /auth/login

# 2. Ver mis lecturas
GET /readings/customer/:my_customer_id
```

### 4. Admin registra pago

```bash
# 1. Login como admin
POST /auth/login

# 2. Registrar pago
POST /payments
```

### 5. Admin genera reportes

```bash
# Reporte del mes
GET /reports/monthly?month=3&year=2024

# Lista de morosos
GET /reports/debtors
```

---

## 📌 Notas Importantes

1. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC)
2. **UUIDs**: Todos los IDs son UUIDs v4
3. **Teléfonos**: Se usan como username para login (únicos)
4. **Lecturas**: Solo se puede crear una lectura por mes/año/cliente
5. **Validación**: La lectura actual debe ser >= lectura anterior
6. **Soft Delete**: Los usuarios eliminados no se borran físicamente

---

## 🧪 Datos de Prueba

Después de ejecutar el seed (`make seed`):

| Rol    | Phone    | Password  | Descripción               |
| ------ | -------- | --------- | ------------------------- |
| Admin  | 77777777 | admin123  | Administrador del sistema |
| Lector | 70000001 | lector123 | Lector de medidores       |
| User   | 60000001 | user123   | Cliente (AGUA-001)        |
