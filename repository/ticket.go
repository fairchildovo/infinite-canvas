package repository

import (
	"strings"

	"github.com/basketikun/infinite-canvas/model"
	"gorm.io/gorm"
)

// SaveTicket 保存工单。
func SaveTicket(t model.Ticket) (model.Ticket, error) {
	db, err := DB()
	if err != nil {
		return t, err
	}
	return t, db.Save(&t).Error
}

// GetTicketByID 根据 ID 查询工单。
func GetTicketByID(id string) (model.Ticket, bool, error) {
	db, err := DB()
	if err != nil {
		return model.Ticket{}, false, err
	}
	var t model.Ticket
	err = db.Where("id = ?", id).First(&t).Error
	if err == gorm.ErrRecordNotFound {
		return model.Ticket{}, false, nil
	}
	return t, err == nil, err
}

// ListUserTickets 分页查询用户的工单。
func ListUserTickets(userID string, q model.Query, status string, ticketType string) ([]model.Ticket, int64, error) {
	db, err := DB()
	if err != nil {
		return nil, 0, err
	}
	q.Normalize()
	tx := db.Model(&model.Ticket{}).Where("user_id = ?", userID)
	if keyword := strings.TrimSpace(q.Keyword); keyword != "" {
		like := "%" + keyword + "%"
		tx = tx.Where("title LIKE ?", like)
	}
	if s := strings.TrimSpace(status); s != "" {
		tx = tx.Where("status = ?", s)
	}
	if tp := strings.TrimSpace(ticketType); tp != "" {
		tx = tx.Where("type = ?", tp)
	}
	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []model.Ticket
	err = tx.Order("updated_at desc").Offset(q.Offset()).Limit(q.PageSize).Find(&items).Error
	return items, total, err
}

// ListAllTickets 分页查询全部工单（管理用）。
func ListAllTickets(q model.Query, status string, ticketType string, assignedTo string) ([]model.Ticket, int64, error) {
	db, err := DB()
	if err != nil {
		return nil, 0, err
	}
	q.Normalize()
	tx := db.Model(&model.Ticket{})
	if keyword := strings.TrimSpace(q.Keyword); keyword != "" {
		like := "%" + keyword + "%"
		tx = tx.Where("title LIKE ?", like)
	}
	if s := strings.TrimSpace(status); s != "" {
		tx = tx.Where("status = ?", s)
	}
	if tp := strings.TrimSpace(ticketType); tp != "" {
		tx = tx.Where("type = ?", tp)
	}
	if a := strings.TrimSpace(assignedTo); a != "" {
		tx = tx.Where("assigned_to = ?", a)
	}
	var total int64
	if err := tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var items []model.Ticket
	err = tx.Order("updated_at desc").Offset(q.Offset()).Limit(q.PageSize).Find(&items).Error
	return items, total, err
}

// SaveTicketReply 保存工单回复。
func SaveTicketReply(r model.TicketReply) (model.TicketReply, error) {
	db, err := DB()
	if err != nil {
		return r, err
	}
	return r, db.Save(&r).Error
}

// ListTicketReplies 查询工单的全部回复。
func ListTicketReplies(ticketID string) ([]model.TicketReply, error) {
	db, err := DB()
	if err != nil {
		return nil, err
	}
	var replies []model.TicketReply
	err = db.Where("ticket_id = ?", ticketID).Order("created_at asc").Find(&replies).Error
	return replies, err
}
