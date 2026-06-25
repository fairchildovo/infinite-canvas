package handler

import (
	"encoding/json"
	"net/http"

	"github.com/basketikun/infinite-canvas/model"
	"github.com/basketikun/infinite-canvas/service"
)

type updateTicketStatusRequest struct {
	Status model.TicketStatus `json:"status"`
}

type assignTicketRequest struct {
	AssignedTo string `json:"assignedTo"`
}

func AdminTickets(w http.ResponseWriter, r *http.Request) {
	q := parseQuery(r)
	status := r.URL.Query().Get("status")
	ticketType := r.URL.Query().Get("type")
	assignedTo := r.URL.Query().Get("assignedTo")
	result, err := service.ListAllTickets(q, status, ticketType, assignedTo)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, result)
}

func AdminGetTicket(w http.ResponseWriter, r *http.Request, id string) {
	detail, err := service.GetTicketDetail(id)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, detail)
}

func AdminAddTicketReply(w http.ResponseWriter, r *http.Request, id string) {
	user, ok := service.UserFromContext(r.Context())
	if !ok {
		Fail(w, "未登录或权限不足")
		return
	}
	var request addReplyRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	reply, err := service.AddReply(id, user.ID, request.Content, true)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, reply)
}

func AdminUpdateTicketStatus(w http.ResponseWriter, r *http.Request, id string) {
	var request updateTicketStatusRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	ticket, err := service.UpdateTicketStatus(id, request.Status, true)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, ticket)
}

func AdminAssignTicket(w http.ResponseWriter, r *http.Request, id string) {
	var request assignTicketRequest
	_ = json.NewDecoder(r.Body).Decode(&request)
	ticket, err := service.AssignTicket(id, request.AssignedTo)
	if err != nil {
		FailError(w, err)
		return
	}
	OK(w, ticket)
}
