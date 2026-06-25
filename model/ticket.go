package model

type TicketType string

const (
	TicketTypeBug      TicketType = "bug"
	TicketTypeFeature  TicketType = "feature"
	TicketTypeQuestion TicketType = "question"
	TicketTypeOther    TicketType = "other"
)

type TicketStatus string

const (
	TicketStatusOpen       TicketStatus = "open"
	TicketStatusInProgress TicketStatus = "in_progress"
	TicketStatusResolved   TicketStatus = "resolved"
	TicketStatusClosed     TicketStatus = "closed"
)

// Ticket 工单。
type Ticket struct {
	ID          string       `json:"id" gorm:"primaryKey"`
	UserID      string       `json:"userId" gorm:"index"`
	AssignedTo  string       `json:"assignedTo" gorm:"index"`
	Type        TicketType   `json:"type"`
	Title       string       `json:"title"`
	Status      TicketStatus `json:"status" gorm:"index"`
	LastReplyAt string       `json:"lastReplyAt"`
	CreatedAt   string       `json:"createdAt"`
	UpdatedAt   string       `json:"updatedAt"`
}

// TicketReply 工单回复。
type TicketReply struct {
	ID        string `json:"id" gorm:"primaryKey"`
	TicketID  string `json:"ticketId" gorm:"index"`
	UserID    string `json:"userId"`
	Content   string `json:"content" gorm:"type:text"`
	IsStaff   bool   `json:"isStaff"`
	CreatedAt string `json:"createdAt"`
}

// TicketList 工单分页结果。
type TicketList struct {
	Items []Ticket `json:"items"`
	Total int      `json:"total"`
}

// TicketDetail 工单详情（含回复列表）。
type TicketDetail struct {
	Ticket  Ticket        `json:"ticket"`
	Replies []TicketReply `json:"replies"`
}
