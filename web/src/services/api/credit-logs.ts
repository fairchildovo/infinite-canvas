import { apiGet, compactApiParams } from "@/services/api/request";

export type CreditLog = {
    id: string;
    userId: string;
    type: string;
    amount: number;
    balance: number;
    relatedId: string;
    remark: string;
    extra: string;
    createdAt: string;
};

export type CreditLogListResponse = {
    items: CreditLog[];
    total: number;
};

export type CreditLogQuery = {
    page?: number;
    pageSize?: number;
};

export async function fetchCreditLogs(token: string, query: CreditLogQuery = {}) {
    return apiGet<CreditLogListResponse>("/api/credit-logs", compactApiParams(query), token);
}
