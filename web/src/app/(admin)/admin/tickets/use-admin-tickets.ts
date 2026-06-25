"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { App } from "antd";

import { fetchAdminTickets } from "@/services/api/tickets";
import { useUserStore } from "@/stores/use-user-store";

const defaultPageSize = 10;

export function useAdminTickets() {
    const { message } = App.useApp();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);
    const [keyword, setKeyword] = useState("");
    const [status, setStatus] = useState("");
    const [ticketType, setTicketType] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const query = useQuery({
        queryKey: ["admin", "tickets", token, keyword, status, ticketType, assignedTo, page, pageSize],
        queryFn: () => fetchAdminTickets(token, { keyword, status, type: ticketType, assignedTo, page, pageSize }),
        enabled: Boolean(token),
        retry: false,
    });

    useEffect(() => {
        if (query.isError) {
            const errorMessage = query.error instanceof Error ? query.error.message : "读取工单失败";
            message.error(errorMessage);
            if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
        }
    }, [clearSession, message, query.error, query.isError]);

    const updateFilters = (next: Partial<{ keyword: string; status: string; ticketType: string; assignedTo: string; page: number; pageSize: number }>) => {
        const queryState = { keyword, status, ticketType, assignedTo, page, pageSize, ...next };
        if (next.keyword !== undefined || next.status !== undefined || next.ticketType !== undefined || next.assignedTo !== undefined || next.pageSize !== undefined) queryState.page = 1;
        setKeyword(queryState.keyword);
        setStatus(queryState.status);
        setTicketType(queryState.ticketType);
        setAssignedTo(queryState.assignedTo);
        setPage(queryState.page);
        setPageSize(queryState.pageSize);
    };

    const data = query.data;

    return {
        tickets: data?.items || [],
        keyword,
        status,
        ticketType,
        assignedTo,
        page,
        pageSize,
        total: data?.total || 0,
        isLoading: query.isFetching,
        searchTickets: (value = keyword) => updateFilters({ keyword: value }),
        changeStatus: (value: string) => updateFilters({ status: value }),
        changeType: (value: string) => updateFilters({ ticketType: value }),
        changeAssignedTo: (value: string) => updateFilters({ assignedTo: value }),
        changePage: (value: number) => updateFilters({ page: value }),
        changePageSize: (value: number) => updateFilters({ pageSize: value }),
        resetFilters: () => updateFilters({ keyword: "", status: "", ticketType: "", assignedTo: "", page: 1, pageSize: defaultPageSize }),
        refreshTickets: () => query.refetch(),
    };
}