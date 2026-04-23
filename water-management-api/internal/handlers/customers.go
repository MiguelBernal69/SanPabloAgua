package handlers

import (
	"time"
	"water-management-api/internal/database"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// GetAllCustomers obtiene todos los clientes
func GetAllCustomers(c *fiber.Ctx) error {
	var customers []models.Customer
	now := time.Now()

	// Preload User and only current month readings
	if err := database.DB.Preload("User").
		Preload("Readings", "month = ? AND year = ?", int(now.Month()), now.Year()).
		Find(&customers).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener clientes",
		})
	}

	return c.JSON(customers)
}

// GetCustomerByID obtiene un cliente por ID
func GetCustomerByID(c *fiber.Ctx) error {
	id := c.Params("id")
	customerID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var customer models.Customer
	if err := database.DB.Preload("User").
		Preload("Readings").
		Preload("Payments").
		First(&customer, customerID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Cliente no encontrado",
		})
	}

	return c.JSON(customer)
}

// UpdateCustomer actualiza información del cliente
func UpdateCustomer(c *fiber.Ctx) error {
	id := c.Params("id")
	customerID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var updateData struct {
		HousePhoto string  `json:"house_photo"`
		Latitude   float64 `json:"latitude"`
		Longitude  float64 `json:"longitude"`
		Address    string  `json:"address"`
	}

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	var customer models.Customer
	if err := database.DB.First(&customer, customerID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Cliente no encontrado",
		})
	}

	// Actualizar campos
	if updateData.HousePhoto != "" {
		customer.HousePhoto = updateData.HousePhoto
	}
	if updateData.Latitude != 0 {
		customer.Latitude = updateData.Latitude
	}
	if updateData.Longitude != 0 {
		customer.Longitude = updateData.Longitude
	}
	if updateData.Address != "" {
		customer.Address = updateData.Address
	}

	if err := database.DB.Save(&customer).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar cliente",
		})
	}

	return c.JSON(customer)
}
