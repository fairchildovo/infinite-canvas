import { apiGet, apiPost, apiPut, compactApiParams, type ApiParams } from "@/services/api/request";

export type TicketType = "bug" | "feature" | "question" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type Ticket = {
    id: string;
    userId: string;
    assignedTo: string;
    type: TicketType;
    title: string;
    status: TicketStatus;
    lastReplyAt: string;
    createdAt: string;
    updatedAt: string;
};

export type TicketReply = {
    id: string;
    ticketId: string;
    userId: string;
    content: string;
    isStaff: boolean;
    createdAt: string;
};

export type TicketListResponse = {
    items: Ticket[];
    total: number;
};

export type TicketDetail = {
    ticket: Ticket;
    replies: TicketReply[];
};

export type CreateTicketParams = {
    type: TicketType;
    title: string;
    content: string;
};

// 用户端。
export async function fetchMyTickets(token: string, query: ApiParams = {}) {
    return apiGet<TicketListResponse>("/api/tickets", compactApiParams(query), token);
}

export async function createTicket(token: string, params: CreateTicketParams) {
    return apiPost<Ticket>("/api/tickets", params, token);
}

export async function getTicketDetail(token: string, id: string) {
    return apiGet<TicketDetail>(`/api/tickets/${id}`, undefined, token);
}

export async function addTicketReply(token: string, id: string, content: string) {
    return apiPost<TicketReply>(`/api/tickets/${id}/replies`, { content }, token);
}

// 管理端。
export async function fetchAdminTickets(token: string, query: ApiParams = {}) {
    return apiGet<TicketListResponse>("/api/admin/tickets", compactApiParams(query), token);
}

export async function getAdminTicketDetail(token: string, id: string) {
    return apiGet<TicketDetail>(`/api/admin/tickets/${id}`, undefined, token);
}

export async function addAdminTicketReply(token: string, id: string, content: string) {
    return apiPost<TicketReply>(`/api/admin/tickets/${id}/replies`, { content }, token);
}

export async function updateTicketStatus(token: string, id: string, status: TicketStatus) {
    return apiPut<Ticket>(`/api/admin/tickets/${id}/status`, { status }, token);
}

export async function assignTicket(token: string, id: string, assignedTo: string) {
    return apiPut<Ticket>(`/api/admin/tickets/${id}/assign`, { assignedTo }, token);
}
