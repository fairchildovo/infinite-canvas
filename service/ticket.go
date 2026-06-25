package service

import (
	"strings"

	"github.com/basketikun/infinite-canvas/model"
	"github.com/basketikun/infinite-canvas/repository"
)

// 合法的状态转换表。
var validTransitions = map[model.TicketStatus][]model.TicketStatus{
	model.TicketStatusOpen:       {model.TicketStatusInProgress, model.TicketStatusClosed},
	model.TicketStatusInProgress: {model.TicketStatusResolved, model.TicketStatusOpen, model.TicketStatusClosed},
	model.TicketStatusResolved:   {model.TicketStatusClosed, model.TicketStatusOpen},
	model.TicketStatusClosed:     {model.TicketStatusOpen},
}

func canTransition(from, to model.TicketStatus, isAdmin bool) bool {
	targets, ok := validTransitions[from]
	if !ok {
		return false
	}
	for _, t := range targets {
		if t == to {
			return true
		}
	}
	// 管理员可从任意状态关闭。
	if isAdmin && to == model.TicketStatusClosed {
		return true
	}
	return false
}

func isValidTicketType(t model.TicketType) bool {
	switch t {
	case model.TicketTypeBug, model.TicketTypeFeature, model.TicketTypeQuestion, model.TicketTypeOther:
		return true
	}
	return false
}

// CreateTicket 用户创建工单。
func CreateTicket(userID string, ticketType model.TicketType, title string, content string) (model.Ticket, error) {
	title = strings.TrimSpace(title)
	content = strings.TrimSpace(content)
	if !isValidTicketType(ticketType) {
		return model.Ticket{}, safeMessageError{message: "无效的工单类型"}
	}
	if title == "" {
		return model.Ticket{}, safeMessageError{message: "标题不能为空"}
	}
	if content == "" {
		return model.Ticket{}, safeMessageError{message: "内容不能为空"}
	}
	ts := now()
	ticket := model.Ticket{
		ID:        newID("ticket"),
		UserID:    userID,
		Type:      ticketType,
		Title:     title,
		Status:    model.TicketStatusOpen,
		CreatedAt: ts,
		UpdatedAt: ts,
	}
	// 自动指派给第一个管理员。
	if admin, ok, _ := repository.GetFirstAdmin(); ok {
		ticket.AssignedTo = admin.ID
	}
	ticket, err := repository.SaveTicket(ticket)
	if err != nil {
		return model.Ticket{}, err
	}
	// 创建首条回复（工单内容）。
	_, err = repository.SaveTicketReply(model.TicketReply{
		ID:        newID("reply"),
		TicketID:  ticket.ID,
		UserID:    userID,
		Content:   content,
		IsStaff:   false,
		CreatedAt: ts,
	})
	if err != nil {
		return model.Ticket{}, err
	}
	ticket.LastReplyAt = ts
	ticket, err = repository.SaveTicket(ticket)
	if err != nil {
		return model.Ticket{}, err
	}
	return ticket, nil
}

// ListUserTickets 查询用户的工单。
func ListUserTickets(userID string, q model.Query, status string, ticketType string) (model.TicketList, error) {
	items, total, err := repository.ListUserTickets(userID, q, status, ticketType)
	if err != nil {
		return model.TicketList{}, err
	}
	return model.TicketList{Items: items, Total: int(total)}, nil
}

// GetTicketDetail 查询工单详情。
func GetTicketDetail(ticketID string) (model.TicketDetail, error) {
	ticket, ok, err := repository.GetTicketByID(ticketID)
	if err != nil {
		return model.TicketDetail{}, err
	}
	if !ok {
		return model.TicketDetail{}, safeMessageError{message: "工单不存在"}
	}
	replies, err := repository.ListTicketReplies(ticketID)
	if err != nil {
		return model.TicketDetail{}, err
	}
	return model.TicketDetail{Ticket: ticket, Replies: replies}, nil
}

// AddReply 用户追加回复。
func AddReply(ticketID string, userID string, content string, isAdmin bool) (model.TicketReply, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return model.TicketReply{}, safeMessageError{message: "回复内容不能为空"}
	}
	_, ok, err := repository.GetTicketByID(ticketID)
	if err != nil {
		return model.TicketReply{}, err
	}
	if !ok {
		return model.TicketReply{}, safeMessageError{message: "工单不存在"}
	}
	ts := now()
	reply := model.TicketReply{
		ID:        newID("reply"),
		TicketID:  ticketID,
		UserID:    userID,
		Content:   content,
		IsStaff:   isAdmin,
		CreatedAt: ts,
	}
	reply, err = repository.SaveTicketReply(reply)
	if err != nil {
		return model.TicketReply{}, err
	}
	// 更新工单最后回复时间和 updated_at。
	ticket, ok, err := repository.GetTicketByID(ticketID)
	if err != nil {
		return reply, err
	}
	if !ok {
		return reply, safeMessageError{message: "工单不存在"}
	}
	ticket.LastReplyAt = ts
	ticket.UpdatedAt = ts
	if _, err = repository.SaveTicket(ticket); err != nil {
		return reply, err
	}
	return reply, nil
}

// ListAllTickets 管理员查询全部工单。
func ListAllTickets(q model.Query, status string, ticketType string, assignedTo string) (model.TicketList, error) {
	items, total, err := repository.ListAllTickets(q, status, ticketType, assignedTo)
	if err != nil {
		return model.TicketList{}, err
	}
	return model.TicketList{Items: items, Total: int(total)}, nil
}

// UpdateTicketStatus 变更工单状态。
func UpdateTicketStatus(ticketID string, newStatus model.TicketStatus, isAdmin bool) (model.Ticket, error) {
	ticket, ok, err := repository.GetTicketByID(ticketID)
	if err != nil {
		return model.Ticket{}, err
	}
	if !ok {
		return model.Ticket{}, safeMessageError{message: "工单不存在"}
	}
	if !canTransition(ticket.Status, newStatus, isAdmin) {
		return model.Ticket{}, safeMessageError{message: "不允许从 " + string(ticket.Status) + " 变更为 " + string(newStatus)}
	}
	ticket.Status = newStatus
	ticket.UpdatedAt = now()
	return repository.SaveTicket(ticket)
}

// AssignTicket 指派工单。
func AssignTicket(ticketID string, assignedTo string) (model.Ticket, error) {
	ticket, ok, err := repository.GetTicketByID(ticketID)
	if err != nil {
		return model.Ticket{}, err
	}
	if !ok {
		return model.Ticket{}, safeMessageError{message: "工单不存在"}
	}
	ticket.AssignedTo = strings.TrimSpace(assignedTo)
	ticket.UpdatedAt = now()
	return repository.SaveTicket(ticket)
}