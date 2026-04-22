package main

import (
	"log"
	"water-management-api/config"
	"water-management-api/internal/database"
	"water-management-api/internal/models"
	"water-management-api/internal/utils"

	"github.com/google/uuid"
)

func main() {
	// Cargar configuración
	config.LoadConfig()

	// Conectar a la base de datos
	database.Connect()
	database.Migrate()
	database.CreateIndexes()

	log.Println("🌱 Creando datos iniciales...")

	// Crear usuario administrador
	hashedPassword, _ := utils.HashPassword("admin123")

	admin := models.User{
		ID:       uuid.New(),
		Name:     "Administrador",
		Phone:    "77777777",
		Email:    "admin@agua.com",
		Password: hashedPassword,
		Role:     models.RoleAdmin,
		IsActive: true,
	}

	result := database.DB.Create(&admin)
	if result.Error != nil {
		log.Printf("⚠️  Admin ya existe o error: %v\n", result.Error)
	} else {
		log.Println("✅ Admin creado - Phone: 77777777, Password: admin123")
	}

	// Crear usuario lector
	hashedPasswordLector, _ := utils.HashPassword("lector123")

	lector := models.User{
		ID:       uuid.New(),
		Name:     "Juan Lector",
		Phone:    "70000001",
		Email:    "lector@agua.com",
		Password: hashedPasswordLector,
		Role:     models.RoleLector,
		IsActive: true,
	}

	result = database.DB.Create(&lector)
	if result.Error != nil {
		log.Printf("⚠️  Lector ya existe o error: %v\n", result.Error)
	} else {
		log.Println("✅ Lector creado - Phone: 70000001, Password: lector123")
	}

	// Crear cliente de ejemplo
	hashedPasswordUser, _ := utils.HashPassword("user123")

	user := models.User{
		ID:       uuid.New(),
		Name:     "María García",
		Phone:    "60000001",
		Email:    "maria@example.com",
		Password: hashedPasswordUser,
		Role:     models.RoleUser,
		IsActive: true,
	}

	result = database.DB.Create(&user)
	if result.Error != nil {
		log.Printf("⚠️  Usuario ya existe o error: %v\n", result.Error)
	} else {
		customer := models.Customer{
			ID:           uuid.New(),
			UserID:       user.ID,
			CustomerCode: "AGUA-001",
			Address:      "Av. Principal #123",
			Latitude:     -17.3935,
			Longitude:    -66.1570,
		}

		database.DB.Create(&customer)
		log.Println("✅ Cliente creado - Phone: 60000001, Password: user123, Code: AGUA-001")
	}

	log.Println("🎉 Datos iniciales creados correctamente!")
	log.Println("\n📝 Credenciales de acceso:")
	log.Println("Admin - Phone: 77777777, Password: admin123")
	log.Println("Lector - Phone: 70000001, Password: lector123")
	log.Println("Cliente - Phone: 60000001, Password: user123")
}
