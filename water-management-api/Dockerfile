# Build stage
FROM golang:1.21-alpine AS builder

# Instalar dependencias de compilación
RUN apk add --no-cache git

WORKDIR /app

# Copiar archivos de dependencias
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fuente
COPY . .

# Compilar la aplicación
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/api/main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copiar el binario desde el builder
COPY --from=builder /app/main .
COPY --from=builder /app/.env.example .env

# Exponer puerto
EXPOSE 8080

# Comando para ejecutar
CMD ["./main"]