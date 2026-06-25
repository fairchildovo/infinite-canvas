package handler

import (
	"encoding/json"
	"net/http"

	"github.com/basketikun/infinite-canvas/model"
	"github.com/basketikun/infinite-canvas/service"
)

type createTicketRequest struct {
	Type    model.TicketType `json:"type"`
	Title   string           `json:"title"`
	Content string           `json:"content"`
}

type addReplyRequest struct {
	Content string `json:"content"`
}

func CreateTicket(w http.ResponseWriter, r *http.Request) {
	user, ok := service.UserFromContext(r.Context())
	if !ok {
		Fail(w, "未登录或权限不足")
		return
	}
	var request createTicketRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	ticket, err := service.CreateTicket(user.ID, request.Type, request.Title, request.Content)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, ticket)
}

func ListMyTickets(w http.ResponseWriter, r *http.Request) {
	user, ok := service.UserFromContext(r.Context())
	if !ok {
		Fail(w, "未登录或权限不足")
		return
	}
	q := parseQuery(r)
	status := r.URL.Query().Get("status")
	ticketType := r.URL.Query().Get("type")
	result, err := service.ListUserTickets(user.ID, q, status, ticketType)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func GetTicket(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := service.UserFromContext(r.Context())
	if !ok {
		Fail(w, "未登录或权限不足")
		return
	}
	detail, err := service.GetTicketDetail(id)
	if err != nil {
		FailError(w, err)
		return
	}
	// 用户只能查看自己的工单。
	if detail.Ticket.UserID != user.ID {
		Fail(w, "无权查看此工单")
		return
	}
	OK(w, detail)
}

func AddTicketReply(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := service.UserFromContext(r.Context())
	if !ok {
		Fail(w, "未登录或权限不足")
		return
	}
	// 校验工单归属。
	detail, err := service.GetTicketDetail(id)
	if err != nil {
		FailError(w, err)
		return
	}
	if detail.Ticket.UserID != user.ID && user.Role != model.UserRoleAdmin {
		Fail(w, "无权回复此工单")
		return
	}
	var request addReplyRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	reply, err := service.AddReply(id, user.ID, request.Content, user.Role == model.UserRoleAdmin)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, reply)
}
