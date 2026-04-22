package handlers

import (
	"fmt"
	"time"
	"water-management-api/internal/database"
	"water-management-api/internal/middleware"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreatePaymentRequest struct {
	CustomerID    string  `json:"customer_id"`
	ReadingID     string  `json:"reading_id"` // Opcional
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"` // efectivo, transferencia, etc.
	Notes         string  `json:"notes"`
}

// CreatePayment registra un nuevo pago
func CreatePayment(c *fiber.Ctx) error {
	adminID := middleware.GetUserID(c)

	var req CreatePaymentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	// Validar campos requeridos
	if req.CustomerID == "" || req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "customer_id y amount son requeridos",
		})
	}

	customerID, err := uuid.Parse(req.CustomerID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID de cliente inválido",
		})
	}

	// Verificar que el cliente existe
	var customer models.Customer
	if err := database.DB.First(&customer, customerID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Cliente no encontrado",
		})
	}

	// Generar número de recibo único
	receiptNumber := fmt.Sprintf("REC-%s-%d", time.Now().Format("20060102"), time.Now().Unix()%100000)

	payment := models.Payment{
		CustomerID:    customerID,
		Amount:        req.Amount,
		PaymentDate:   time.Now(),
		PaymentMethod: req.PaymentMethod,
		ReceiptNumber: receiptNumber,
		Notes:         req.Notes,
		RegisteredBy:  adminID,
	}

	// Si se especifica una lectura, asociar el pago y marcarla como pagada
	if req.ReadingID != "" {
		readingID, err := uuid.Parse(req.ReadingID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "ID de lectura inválido",
			})
		}

		// Verificar que la lectura existe y pertenece al cliente
		var reading models.Reading
		if err := database.DB.Where("id = ? AND customer_id = ?", readingID, customerID).
			First(&reading).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Lectura no encontrada",
			})
		}

		payment.ReadingID = readingID

		// Si el pago cubre el monto total, marcar como pagada
		if req.Amount >= reading.TotalAmount {
			reading.IsPaid = true
			database.DB.Save(&reading)
		}
	}

	// Crear el pago
	if err := database.DB.Create(&payment).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al registrar pago",
		})
	}

	// Cargar relaciones
	database.DB.Preload("Customer.User").Preload("Reading").Preload("RegisteredByUser").
		First(&payment, payment.ID)

	return c.Status(fiber.StatusCreated).JSON(payment)
}

// GetPayments obtiene todos los pagos con filtros
func GetPayments(c *fiber.Ctx) error {
	var payments []models.Payment

	query := database.DB.Preload("Customer.User").Preload("Reading").Preload("RegisteredByUser")

	// Filtros opcionales
	customerID := c.Query("customer_id")
	if customerID != "" {
		query = query.Where("customer_id = ?", customerID)
	}

	if err := query.Order("payment_date DESC").Find(&payments).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener pagos",
		})
	}

	return c.JSON(payments)
}

// GetPaymentsByCustomer obtiene todos los pagos de un cliente
func GetPaymentsByCustomer(c *fiber.Ctx) error {
	customerIDStr := c.Params("customer_id")
	customerID, err := uuid.Parse(customerIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID de cliente inválido",
		})
	}

	var payments []models.Payment
	if err := database.DB.Where("customer_id = ?", customerID).
		Preload("Reading").
		Preload("RegisteredByUser").
		Order("payment_date DESC").
		Find(&payments).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener pagos",
		})
	}

	return c.JSON(payments)
}
