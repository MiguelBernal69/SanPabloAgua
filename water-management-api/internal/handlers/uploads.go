package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"water-management-api/internal/database"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// UploadCustomerPhoto maneja la subida de la foto de la casa de un cliente
func UploadCustomerPhoto(c *fiber.Ctx) error {
	id := c.Params("id")
	customerID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID de cliente inválido",
		})
	}

	// Obtener el archivo del formulario
	file, err := c.FormFile("photo")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No se recibió ninguna imagen",
		})
	}

	// Crear nombre de archivo único
	extension := filepath.Ext(file.Filename)
	newFileName := fmt.Sprintf("%s%s", customerID.String(), extension)
	uploadPath := filepath.Join("uploads", "house_photos", newFileName)

	// Asegurar que el directorio existe
	if err := os.MkdirAll(filepath.Dir(uploadPath), os.ModePerm); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al crear directorio de subida",
		})
	}

	// Guardar el archivo en el servidor
	if err := c.SaveFile(file, uploadPath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al guardar el archivo",
		})
	}

	// Actualizar la base de datos con la ruta (URL relativa)
	var customer models.Customer
	if err := database.DB.First(&customer, customerID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Cliente no encontrado",
		})
	}

	// Guardamos la URL relativa que será servida por Fiber
	photoURL := fmt.Sprintf("/uploads/house_photos/%s", newFileName)
	customer.HousePhoto = photoURL

	if err := database.DB.Save(&customer).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar la base de datos",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Foto subida con éxito",
		"url":     photoURL,
	})
}
