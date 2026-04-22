package database

import (
	"fmt"
	"log"
	"water-management-api/config"
	"water-management-api/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect() {
	cfg := config.AppConfig

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=America/La_Paz",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("✅ Database connected successfully")
}

func Migrate() {
	log.Println("Running migrations...")

	err := DB.AutoMigrate(
		&models.User{},
		&models.Customer{},
		&models.Reading{},
		&models.Payment{},
	)

	if err != nil {
		log.Fatal("Migration failed:", err)
	}

	log.Println("✅ Migrations completed successfully")
}

// Crear índices adicionales para optimizar consultas
func CreateIndexes() {
	// Índice compuesto para búsquedas de lecturas por mes/año
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_readings_customer_month_year ON readings(customer_id, year, month)")

	// Índice para búsquedas de pagos por fecha
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date)")

	// Índice para clientes activos
	DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true")

	log.Println("✅ Indexes created successfully")
}
