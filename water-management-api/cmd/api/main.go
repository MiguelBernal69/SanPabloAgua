package main

import (
	"log"
	"water-management-api/config"
	"water-management-api/internal/database"
	"water-management-api/internal/handlers"
	"water-management-api/internal/middleware"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	// Cargar configuración
	config.LoadConfig()

	// Conectar a la base de datos
	database.Connect()
	database.Migrate()
	database.CreateIndexes()

	// Crear aplicación Fiber
	app := fiber.New(fiber.Config{
		AppName: "Water Management API v1.0",
	})

	// Middlewares globales
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH",
	}))

	// Servir archivos estáticos (fotos de casas)
	app.Static("/uploads", "./uploads")

	// Rutas públicas
	api := app.Group("/api/v1")

	// Auth
	auth := api.Group("/auth")
	auth.Post("/login", handlers.Login)

	// Rutas protegidas
	// Usuarios
	users := api.Group("/users")
	users.Use(middleware.AuthMiddleware)
	users.Get("/me", handlers.GetCurrentUser)
	users.Put("/me", handlers.UpdateCurrentUser)

	// Admin only - Gestión de usuarios
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware)
	admin.Use(middleware.RoleMiddleware(models.RoleAdmin))
	admin.Post("/users", handlers.CreateUser)
	admin.Get("/users", handlers.GetAllUsers)
	admin.Get("/users/:id", handlers.GetUserByID)
	admin.Put("/users/:id", handlers.UpdateUser)
	admin.Delete("/users/:id", handlers.DeleteUser)

	// Lecturas
	readings := api.Group("/readings")
	readings.Use(middleware.AuthMiddleware)
	readings.Post("/", middleware.RoleMiddleware(models.RoleLector, models.RoleAdmin), handlers.CreateReading)
	readings.Get("/", middleware.RoleMiddleware(models.RoleAdmin, models.RoleLector), handlers.GetReadings)
	readings.Get("/:id", handlers.GetReadingByID)
	readings.Get("/customer/:customer_id", handlers.GetReadingsByCustomer) // Todos los roles autenticados

	// Pagos
	payments := api.Group("/payments")
	payments.Use(middleware.AuthMiddleware)
	// Ruta pública para que el usuario vea sus propios pagos
	payments.Get("/customer/:customer_id", handlers.GetPaymentsByCustomer)
	
	// Rutas solo para Admin
	paymentsAdmin := payments.Group("/")
	paymentsAdmin.Use(middleware.RoleMiddleware(models.RoleAdmin))
	paymentsAdmin.Post("/", handlers.CreatePayment)
	paymentsAdmin.Get("/", handlers.GetPayments)

	// Clientes
	customers := api.Group("/customers")
	customers.Use(middleware.AuthMiddleware)
	customers.Get("/", middleware.RoleMiddleware(models.RoleAdmin, models.RoleLector), handlers.GetAllCustomers)
	customers.Get("/:id", handlers.GetCustomerByID)
	customers.Put("/:id", middleware.RoleMiddleware(models.RoleAdmin, models.RoleLector), handlers.UpdateCustomer)
	customers.Post("/:id/photo", middleware.RoleMiddleware(models.RoleAdmin, models.RoleLector), handlers.UploadCustomerPhoto)

	// Reportes (Solo Admins)
	reports := api.Group("/reports")
	reports.Use(middleware.AuthMiddleware)
	reports.Use(middleware.RoleMiddleware(models.RoleAdmin))
	reports.Get("/monthly", handlers.GetMonthlyReport)
	reports.Get("/debtors", handlers.GetDebtorsReport)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Water Management API is running",
		})
	})

	// Iniciar servidor
	port := config.AppConfig.Port
	log.Printf("🚀 Server starting on port %s\n", port)
	log.Fatal(app.Listen(":" + port))
}
