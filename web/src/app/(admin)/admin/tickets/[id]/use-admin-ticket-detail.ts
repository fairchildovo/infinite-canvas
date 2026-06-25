"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import { getAdminTicketDetail, addAdminTicketReply, updateTicketStatus, assignTicket, type TicketDetail, type TicketStatus } from "@/services/api/tickets";
import { useUserStore } from "@/stores/use-user-store";

export function useAdminTicketDetail(id: string) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);

    const query = useQuery({
        queryKey: ["admin", "ticket", id, token],
        queryFn: () => getAdminTicketDetail(token, id),
        enabled: Boolean(token && id),
        retry: false,
    });

    useEffect(() => {
        if (query.isError) {
            const errorMessage = query.error instanceof Error ? query.error.message : "读取工单失败";
            message.error(errorMessage);
            if (errorMessage.includes("未登录") || errorMessage.includes("权限不足") || errorMessage.includes("登录状态无效")) clearSession();
        }
    }, [clearSession, message, query.error, query.isError]);

    const [replying, setReplying] = useState(false);
    const [updating, setUpdating] = useState(false);

    const submitReply = async (content: string) => {
        setReplying(true);
        try {
            await addAdminTicketReply(token, id, content);
            await queryClient.invalidateQueries({ queryKey: ["admin", "ticket", id] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
            message.success("回复已发送");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "回复失败");
        } finally {
            setReplying(false);
        }
    };

    const changeStatus = async (status: TicketStatus) => {
        setUpdating(true);
        try {
            await updateTicketStatus(token, id, status);
            await queryClient.invalidateQueries({ queryKey: ["admin", "ticket", id] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
            message.success("状态已更新");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "更新失败");
        } finally {
            setUpdating(false);
        }
    };

    const assignTo = async (userId: string) => {
        setUpdating(true);
        try {
            await assignTicket(token, id, userId);
            await queryClient.invalidateQueries({ queryKey: ["admin", "ticket", id] });
            await queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
            message.success("指派成功");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "指派失败");
        } finally {
            setUpdating(false);
        }
    };

    return {
        detail: query.data as TicketDetail | undefined,
        isLoading: query.isFetching,
        replying,
        updating,
        submitReply,
        changeStatus,
        assignTo,
        refresh: () => query.refetch(),
    };
}