package handlers

import (
	"time"
	"water-management-api/internal/database"
	"water-management-api/internal/middleware"
	"water-management-api/internal/models"
	"water-management-api/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type CreateReadingRequest struct {
	CustomerID     string  `json:"customer_id"`
	CurrentReading float64 `json:"current_reading"`
	Month          int     `json:"month"`
	Year           int     `json:"year"`
	Notes          string  `json:"notes"`
}

// CreateReading crea una nueva lectura mensual
func CreateReading(c *fiber.Ctx) error {
	lectorID := middleware.GetUserID(c)

	var req CreateReadingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	// Validar campos
	if req.CustomerID == "" || req.CurrentReading < 0 || req.Month < 1 || req.Month > 12 || req.Year < 2020 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos: verifique customer_id, current_reading, month y year",
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

	// Verificar si ya existe una lectura para este mes/año
	var existingReading models.Reading
	result := database.DB.Where("customer_id = ? AND month = ? AND year = ?",
		customerID, req.Month, req.Year).First(&existingReading)

	if result.Error == nil {
		// ACTUALIZAR LECTURA EXISTENTE (Modo Edición)
		existingReading.CurrentReading = req.CurrentReading
		existingReading.Notes = req.Notes
		existingReading.ReadingDate = time.Now()
		existingReading.LectorID = lectorID
		
		// Recalcular consumo y monto contra la lectura anterior real
		// (La lógica de obtener previousValue ya se hará abajo, así que movemos el bloque)
	}

	// Obtener la lectura anterior (mes pasado)
	var previousReading models.Reading
	var previousValue float64 = 0

	// Buscar la lectura del mes anterior
	prevMonth := req.Month - 1
	prevYear := req.Year
	if prevMonth < 1 {
		prevMonth = 12
		prevYear = req.Year - 1
	}

	result = database.DB.Where("customer_id = ? AND month = ? AND year = ?",
		customerID, prevMonth, prevYear).First(&previousReading)

	if result.Error == nil {
		previousValue = previousReading.CurrentReading
	}

	// Validar que la lectura actual sea mayor o igual a la anterior
	if req.CurrentReading < previousValue {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":            "La lectura actual no puede ser menor que la anterior",
			"previous_reading": previousValue,
			"current_reading":  req.CurrentReading,
		})
	}

	// Calcular consumo
	consumption := req.CurrentReading - previousValue

	// Calcular monto total usando el servicio de facturación
	totalAmount := services.CalculateWaterBill(consumption)

	// Si existe, actualizamos; si no, creamos
	if existingReading.ID != uuid.Nil {
		existingReading.PreviousReading = previousValue
		existingReading.Consumption = consumption
		existingReading.TotalAmount = totalAmount
		
		if err := database.DB.Save(&existingReading).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error al actualizar lectura",
			})
		}
		// Cargar relaciones para la respuesta
		database.DB.Preload("Customer.User").Preload("Lector").First(&existingReading, existingReading.ID)
		return c.Status(fiber.StatusOK).JSON(existingReading)
	} else {
		// Crear la lectura nueva
		reading := models.Reading{
			CustomerID:      customerID,
			Month:           req.Month,
			Year:            req.Year,
			PreviousReading: previousValue,
			CurrentReading:  req.CurrentReading,
			Consumption:     consumption,
			TotalAmount:     totalAmount,
			IsPaid:          false,
			ReadingDate:     time.Now(),
			LectorID:        lectorID,
			Notes:           req.Notes,
		}

		if err := database.DB.Create(&reading).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error al crear lectura",
			})
		}

		// Cargar relaciones para la respuesta
		database.DB.Preload("Customer.User").Preload("Lector").First(&reading, reading.ID)
		return c.Status(fiber.StatusCreated).JSON(reading)
	}
}

// GetReadings obtiene todas las lecturas con filtros opcionales
func GetReadings(c *fiber.Ctx) error {
	var readings []models.Reading

	query := database.DB.Preload("Customer.User").Preload("Lector")

	// Filtros opcionales
	month := c.Query("month")
	year := c.Query("year")
	isPaid := c.Query("is_paid")
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if month != "" {
		query = query.Where("month = ?", month)
	}
	if year != "" {
		query = query.Where("year = ?", year)
	}
	if isPaid != "" {
		query = query.Where("is_paid = ?", isPaid == "true")
	}
	if startDate != "" && endDate != "" {
		query = query.Where("reading_date BETWEEN ? AND ?", startDate, endDate)
	}

	if err := query.Order("year DESC, month DESC").Find(&readings).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener lecturas",
		})
	}

	return c.JSON(readings)
}

// GetReadingByID obtiene una lectura específica
func GetReadingByID(c *fiber.Ctx) error {
	id := c.Params("id")
	readingID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var reading models.Reading
	if err := database.DB.Preload("Customer.User").Preload("Lector").Preload("Payments").
		First(&reading, readingID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Lectura no encontrada",
		})
	}

	return c.JSON(reading)
}

// GetReadingsByCustomer obtiene todas las lecturas de un cliente
func GetReadingsByCustomer(c *fiber.Ctx) error {
	customerIDStr := c.Params("customer_id")
	customerID, err := uuid.Parse(customerIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID de cliente inválido",
		})
	}

	// Verificar permisos: los usuarios solo pueden ver sus propias lecturas
	userID := middleware.GetUserID(c)
	role := middleware.GetUserRole(c)

	if role == models.RoleUser {
		// Verificar que el customerID corresponde al usuario autenticado
		var customer models.Customer
		if err := database.DB.Where("id = ? AND user_id = ?", customerID, userID).
			First(&customer).Error; err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "No tienes permiso para ver estas lecturas",
			})
		}
	}

	var readings []models.Reading
	if err := database.DB.Where("customer_id = ?", customerID).
		Preload("Payments").
		Order("year DESC, month DESC").
		Find(&readings).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener lecturas",
		})
	}

	return c.JSON(readings)
}
