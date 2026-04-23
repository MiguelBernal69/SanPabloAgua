package handlers

import (
	"water-management-api/internal/auth"
	"water-management-api/internal/database"
	"water-management-api/internal/middleware"
	"water-management-api/internal/models"
	"water-management-api/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type LoginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// Login maneja el inicio de sesión
func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	// Validar campos requeridos
	if req.Phone == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Teléfono y contraseña son requeridos",
		})
	}

	// Buscar usuario por teléfono con sus datos de cliente
	var user models.User
	result := database.DB.Preload("Customer").Where("phone = ? AND is_active = ?", req.Phone, true).First(&user)
	if result.Error != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Credenciales inválidas",
		})
	}

	// Verificar contraseña
	if !utils.CheckPassword(req.Password, user.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Credenciales inválidas",
		})
	}

	// Generar token JWT
	token, err := auth.GenerateToken(user.ID, user.Role)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al generar token",
		})
	}

	return c.JSON(LoginResponse{
		Token: token,
		User:  &user,
	})
}

// GetCurrentUser obtiene la información del usuario autenticado
func GetCurrentUser(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var user models.User
	result := database.DB.Preload("Customer").First(&user, userID)
	if result.Error != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Usuario no encontrado",
		})
	}

	return c.JSON(user)
}

// UpdateCurrentUser permite al usuario actualizar su propia información
func UpdateCurrentUser(c *fiber.Ctx) error {
	userID := middleware.GetUserID(c)

	var updateData struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Usuario no encontrado",
		})
	}

	// Actualizar solo campos no vacíos
	if updateData.Name != "" {
		user.Name = updateData.Name
	}
	if updateData.Email != "" {
		emailStr := updateData.Email
		user.Email = &emailStr
	}
	if updateData.Phone != "" {
		user.Phone = updateData.Phone
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar usuario",
		})
	}

	return c.JSON(user)
}

// Handlers de administración de usuarios (solo para admins)

type CreateUserRequest struct {
	Name         string      `json:"name"`
	Phone        string      `json:"phone"`
	Email        string      `json:"email"`
	Password     string      `json:"password"`
	Role         models.Role `json:"role"`
	CustomerCode string      `json:"customer_code"` // Solo para users
	Address      string      `json:"address"`       // Solo para users
}

// CreateUser crea un nuevo usuario (admin only)
func CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	// Validar campos requeridos
	if req.Name == "" || req.Phone == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Nombre, teléfono y contraseña son requeridos",
		})
	}

	// Hash de la contraseña
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al procesar contraseña",
		})
	}

	// Verificar si ya existe un usuario con ese teléfono o email
	var existingUser models.User
	query := database.DB.Where("phone = ?", req.Phone)
	if req.Email != "" {
		query = query.Or("email = ?", req.Email)
	}
	
	if err := query.First(&existingUser).Error; err == nil {
		if existingUser.Phone == req.Phone {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "El número de teléfono ya está registrado",
			})
		}
		if req.Email != "" && existingUser.Email != nil && *existingUser.Email == req.Email {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "El correo electrónico ya está registrado",
			})
		}
	}

	// Procesar email como puntero (vacio = null)
	var emailPtr *string
	if req.Email != "" {
		emailStr := req.Email
		emailPtr = &emailStr
	}

	// Crear usuario
	user := models.User{
		Name:          req.Name,
		Phone:         req.Phone,
		Email:         emailPtr,
		Password:      hashedPassword,
		PasswordPlain: req.Password,
		Role:          req.Role,
		IsActive:      true,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al crear usuario en la base de datos",
		})
	}

	// Si es un cliente (user), crear registro de Customer
	if req.Role == models.RoleUser {
		customer := models.Customer{
			UserID:       user.ID,
			CustomerCode: req.CustomerCode,
			Address:      req.Address,
		}

		if err := database.DB.Create(&customer).Error; err != nil {
			// Si falla, eliminar el usuario creado
			database.DB.Delete(&user)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error al crear cliente",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(user)
}

// GetAllUsers obtiene todos los usuarios (admin only)
func GetAllUsers(c *fiber.Ctx) error {
	var users []models.User

	query := database.DB.Preload("Customer")

	// Filtros opcionales
	role := c.Query("role")
	if role != "" {
		query = query.Where("role = ?", role)
	}

	if err := query.Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al obtener usuarios",
		})
	}

	return c.JSON(users)
}

// GetUserByID obtiene un usuario por ID (admin only)
func GetUserByID(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var user models.User
	if err := database.DB.Preload("Customer").First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Usuario no encontrado",
		})
	}

	return c.JSON(user)
}

// UpdateUser actualiza un usuario (admin only)
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	var updateData struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		Password string `json:"password"`
		IsActive *bool  `json:"is_active"`
	}

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Datos inválidos",
		})
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Usuario no encontrado",
		})
	}

	// Mapear cambios para actualización (solo si no están vacíos)
	updates := map[string]interface{}{}
	
	if updateData.Name != "" {
		updates["name"] = updateData.Name
	}
	if updateData.Email != "" {
		emailStr := updateData.Email
		updates["email"] = &emailStr
	}
	if updateData.Phone != "" {
		updates["phone"] = updateData.Phone
	}
	if updateData.IsActive != nil {
		updates["is_active"] = *updateData.IsActive
	}

	// Solo actualizar contraseña si se ha escrito algo nuevo
	if updateData.Password != "" {
		hashedPassword, err := utils.HashPassword(updateData.Password)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Error al procesar la nueva contraseña",
			})
		}
		updates["password"] = hashedPassword
		updates["password_plain"] = updateData.Password
	}

	if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al actualizar usuario en la base de datos",
		})
	}

	return c.JSON(user)
}

// DeleteUser elimina un usuario (soft delete, admin only)
func DeleteUser(c *fiber.Ctx) error {
	id := c.Params("id")
	userID, err := uuid.Parse(id)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "ID inválido",
		})
	}

	if err := database.DB.Delete(&models.User{}, userID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Error al eliminar usuario",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Usuario eliminado correctamente",
	})
}
