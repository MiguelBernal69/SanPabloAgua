package middleware

import (
	"strings"
	"water-management-api/internal/auth"
	"water-management-api/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

// AuthMiddleware verifica que el usuario esté autenticado
func AuthMiddleware(c *fiber.Ctx) error {
	// Obtener el token del header Authorization
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Token no proporcionado",
		})
	}

	// El formato debe ser: Bearer <token>
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Formato de token inválido",
		})
	}

	tokenString := parts[1]

	// Validar el token
	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Token inválido o expirado",
		})
	}

	// Guardar información del usuario en el contexto
	c.Locals("userID", claims.UserID)
	c.Locals("role", claims.Role)

	return c.Next()
}

// RoleMiddleware verifica que el usuario tenga uno de los roles permitidos
func RoleMiddleware(allowedRoles ...models.Role) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role := c.Locals("role").(models.Role)

		for _, allowedRole := range allowedRoles {
			if role == allowedRole {
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "No tienes permisos para acceder a este recurso",
		})
	}
}

// GetUserID obtiene el ID del usuario desde el contexto
func GetUserID(c *fiber.Ctx) uuid.UUID {
	return c.Locals("userID").(uuid.UUID)
}

// GetUserRole obtiene el rol del usuario desde el contexto
func GetUserRole(c *fiber.Ctx) models.Role {
	return c.Locals("role").(models.Role)
}
