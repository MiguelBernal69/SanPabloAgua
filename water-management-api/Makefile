.PHONY: help run build test clean seed migrate dev

help: ## Mostrar esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

run: ## Ejecutar el servidor
	@echo "🚀 Iniciando servidor..."
	go run cmd/api/main.go

build: ## Compilar el binario
	@echo "🔨 Compilando..."
	go build -o bin/api cmd/api/main.go
	@echo "✅ Binario creado en bin/api"

dev: ## Modo desarrollo con hot reload (requiere air)
	@echo "🔥 Iniciando en modo desarrollo..."
	air

test: ## Ejecutar tests
	@echo "🧪 Ejecutando tests..."
	go test -v ./...

clean: ## Limpiar archivos compilados
	@echo "🧹 Limpiando..."
	rm -rf bin/
	go clean

seed: ## Crear datos iniciales (admin, lector, cliente)
	@echo "🌱 Creando datos iniciales..."
	go run cmd/seed/main.go

migrate: ## Ejecutar migraciones manualmente
	@echo "📊 Ejecutando migraciones..."
	@go run -exec 'true' cmd/api/main.go || true

deps: ## Descargar dependencias
	@echo "📦 Descargando dependencias..."
	go mod download
	go mod tidy

docker-build: ## Construir imagen Docker
	@echo "🐳 Construyendo imagen Docker..."
	docker build -t water-management-api .

docker-run: ## Ejecutar contenedor Docker
	@echo "🐳 Ejecutando contenedor..."
	docker-compose up -d

docker-stop: ## Detener contenedor Docker
	@echo "🛑 Deteniendo contenedor..."
	docker-compose down

lint: ## Ejecutar linter
	@echo "🔍 Ejecutando linter..."
	golangci-lint run

fmt: ## Formatear código
	@echo "✨ Formateando código..."
	go fmt ./...