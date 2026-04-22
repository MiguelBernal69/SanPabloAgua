package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Roles del sistema
type Role string

const (
	RoleUser   Role = "user"
	RoleLector Role = "lector"
	RoleAdmin  Role = "admin"
)

// Usuario del sistema (clientes, lectores y administradores)
type User struct {
	ID        uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	Name      string         `gorm:"not null" json:"name"`
	Phone     string         `gorm:"unique;not null" json:"phone"`
	Email     string         `gorm:"unique" json:"email"`
	Password  string         `gorm:"not null" json:"-"` // No se envía en JSON
	Role      Role           `gorm:"type:varchar(20);not null;default:'user'" json:"role"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relaciones
	Customer *Customer `gorm:"foreignKey:UserID" json:"customer,omitempty"`
}

// Cliente (información adicional para usuarios tipo "user")
type Customer struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	UserID       uuid.UUID      `gorm:"type:uuid;not null;unique" json:"user_id"`
	CustomerCode string         `gorm:"unique;not null" json:"customer_code"` // Código único del cliente
	HousePhoto   string         `json:"house_photo"`                          // URL de la foto
	Latitude     float64        `json:"latitude"`
	Longitude    float64        `json:"longitude"`
	Address      string         `json:"address"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Relaciones
	User     User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Readings []Reading `gorm:"foreignKey:CustomerID" json:"readings,omitempty"`
	Payments []Payment `gorm:"foreignKey:CustomerID" json:"payments,omitempty"`
}

// Lectura mensual del medidor
type Reading struct {
	ID              uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CustomerID      uuid.UUID      `gorm:"type:uuid;not null" json:"customer_id"`
	Month           int            `gorm:"not null" json:"month"`             // 1-12
	Year            int            `gorm:"not null" json:"year"`              // 2024, 2025, etc.
	PreviousReading float64        `gorm:"default:0" json:"previous_reading"` // Lectura anterior en m³
	CurrentReading  float64        `gorm:"not null" json:"current_reading"`   // Lectura actual en m³
	Consumption     float64        `gorm:"not null" json:"consumption"`       // Consumo calculado
	TotalAmount     float64        `gorm:"not null" json:"total_amount"`      // Monto total a pagar en Bs
	IsPaid          bool           `gorm:"default:false" json:"is_paid"`
	ReadingDate     time.Time      `gorm:"not null" json:"reading_date"`
	LectorID        uuid.UUID      `gorm:"type:uuid" json:"lector_id"` // Quien tomó la lectura
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`

	// Relaciones
	Customer Customer  `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Lector   User      `gorm:"foreignKey:LectorID" json:"lector,omitempty"`
	Payments []Payment `gorm:"foreignKey:ReadingID" json:"payments,omitempty"`
}

// Pago realizado
type Payment struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey" json:"id"`
	CustomerID    uuid.UUID      `gorm:"type:uuid;not null" json:"customer_id"`
	ReadingID     uuid.UUID      `gorm:"type:uuid" json:"reading_id"` // Puede ser null si es pago adelantado
	Amount        float64        `gorm:"not null" json:"amount"`      // Monto pagado
	PaymentDate   time.Time      `gorm:"not null" json:"payment_date"`
	PaymentMethod string         `gorm:"default:'efectivo'" json:"payment_method"` // efectivo, transferencia, etc.
	ReceiptNumber string         `gorm:"unique" json:"receipt_number"`             // Número de recibo
	Notes         string         `json:"notes"`
	RegisteredBy  uuid.UUID      `gorm:"type:uuid" json:"registered_by"` // Admin que registró
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`

	// Relaciones
	Customer         Customer `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Reading          *Reading `gorm:"foreignKey:ReadingID" json:"reading,omitempty"`
	RegisteredByUser User     `gorm:"foreignKey:RegisteredBy" json:"registered_by_user,omitempty"`
}

// Hook para generar UUID antes de crear
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (c *Customer) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return nil
}

func (r *Reading) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
