package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string

	// Server
	Port string
	Env  string

	// JWT
	JWTSecret     string
	JWTExpiration string

	// Email
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	EmailFrom    string

	// Tarifas
	MinConsumption float64
	MinCost        float64
	Tier1Limit     float64
	Tier1Price     float64
	Tier2Price     float64
}

var AppConfig *Config

func LoadConfig() {
	// Cargar .env solo en desarrollo
	if os.Getenv("ENV") != "production" {
		if err := godotenv.Load(); err != nil {
			log.Println("No .env file found, using environment variables")
		}
	}

	smtpPort, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	minConsumption, _ := strconv.ParseFloat(getEnv("MIN_CONSUMPTION", "10"), 64)
	minCost, _ := strconv.ParseFloat(getEnv("MIN_COST", "37"), 64)
	tier1Limit, _ := strconv.ParseFloat(getEnv("TIER1_LIMIT", "25"), 64)
	tier1Price, _ := strconv.ParseFloat(getEnv("TIER1_PRICE", "3"), 64)
	tier2Price, _ := strconv.ParseFloat(getEnv("TIER2_PRICE", "8"), 64)

	AppConfig = &Config{
		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", ""),
		DBName:     getEnv("DB_NAME", "water_management"),

		// Server
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("ENV", "development"),

		// JWT
		JWTSecret:     getEnv("JWT_SECRET", "change-this-secret"),
		JWTExpiration: getEnv("JWT_EXPIRATION", "24h"),

		// Email
		SMTPHost:     getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:     smtpPort,
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		EmailFrom:    getEnv("EMAIL_FROM", "Sistema de Agua"),

		// Tarifas
		MinConsumption: minConsumption,
		MinCost:        minCost,
		Tier1Limit:     tier1Limit,
		Tier1Price:     tier1Price,
		Tier2Price:     tier2Price,
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
