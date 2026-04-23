package main

import (
	"fmt"
	"log"
	"math/rand"
	"water-management-api/config"
	"water-management-api/internal/database"
	"water-management-api/internal/models"
	"water-management-api/internal/utils"

	"github.com/google/uuid"
)

func main() {
	config.LoadConfig()
	database.Connect()
	database.Migrate()

	log.Println("🌱 Sincronizando contraseñas legibles y datos...")

	// 1. Roles base
	passAdmin := "admin123"
	hashedAdmin, _ := utils.HashPassword(passAdmin)
	var admin models.User
	if err := database.DB.Where("phone = ?", "77777777").First(&admin).Error; err != nil {
		admin = models.User{
			ID: uuid.New(), Name: "Admin San Pablo", Phone: "77777777",
			Email: "admin@agua.com", Password: hashedAdmin, PasswordPlain: passAdmin, Role: models.RoleAdmin, IsActive: true,
		}
		database.DB.Create(&admin)
	} else {
		admin.Password = hashedAdmin
		admin.PasswordPlain = passAdmin
		database.DB.Save(&admin)
	}

	passLector := "lector123"
	hashedLector, _ := utils.HashPassword(passLector)
	var lector models.User
	if err := database.DB.Where("phone = ?", "70000001").First(&lector).Error; err != nil {
		lector = models.User{
			ID: uuid.New(), Name: "Lector Movil", Phone: "70000001",
			Email: "lector@agua.com", Password: hashedLector, PasswordPlain: passLector, Role: models.RoleLector, IsActive: true,
		}
		database.DB.Create(&lector)
	} else {
		lector.Password = hashedLector
		lector.PasswordPlain = passLector
		database.DB.Save(&lector)
	}

	// 2. Clientes
	nombres := []string{"Juan Pablo Rojas", "Maria Elena Gomez", "Carlos Eduardo Vaca", "Ana Lucia Rios", "Roberto Carlos Nina", "Elena Victoria Choque", "David Mamani Soliz", "Sofia Condori", "Jorge Vargas Pardo", "Carmen Rosa Luna"}
	calles := []string{"Calle Aroma", "Av. Blanco Galindo", "Calle Bolivar", "Av. Heroinas", "Calle Sucre", "Calle Jordan", "Av. America", "Calle España", "Calle 25 de Mayo", "Av. San Martin"}
	
	passUser := "user123"
	hashedUser, _ := utils.HashPassword(passUser)

	for i := 0; i < 10; i++ {
		phone := fmt.Sprintf("6000001%d", i)
		prefix := "U"; if i < 5 { prefix = "S" }
		code := fmt.Sprintf("%s-%03d", prefix, i+1)
		
		var user models.User
		if err := database.DB.Where("phone = ?", phone).First(&user).Error; err != nil {
			user = models.User{
				ID: uuid.New(), Name: nombres[i], Phone: phone,
				Email: fmt.Sprintf("cliente%d@example.com", i), Password: hashedUser,
				PasswordPlain: passUser, Role: models.RoleUser, IsActive: true,
			}
			database.DB.Create(&user)
		} else {
			user.Password = hashedUser
			user.PasswordPlain = passUser
			database.DB.Save(&user)
		}
		
		var customer models.Customer
		if err := database.DB.Where("user_id = ?", user.ID).First(&customer).Error; err != nil {
			customer = models.Customer{
				ID: uuid.New(), UserID: user.ID, CustomerCode: code,
				Address: fmt.Sprintf("%s #%d", calles[i], rand.Intn(100)+1),
			}
			database.DB.Create(&customer)
		} else {
			customer.CustomerCode = code
			database.DB.Save(&customer)
		}
	}

	log.Println("✅ Usuarios y contraseñas sincronizados correctamente!")
}
