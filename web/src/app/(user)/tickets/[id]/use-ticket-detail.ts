"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";

import { getTicketDetail, addTicketReply, type TicketDetail } from "@/services/api/tickets";
import { useUserStore } from "@/stores/use-user-store";

export function useTicketDetail(id: string) {
    const { message } = App.useApp();
    const queryClient = useQueryClient();
    const token = useUserStore((state) => state.token);
    const clearSession = useUserStore((state) => state.clearSession);

    const query = useQuery({
        queryKey: ["ticket", id, token],
        queryFn: () => getTicketDetail(token, id),
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

    const submitReply = async (content: string) => {
        setReplying(true);
        try {
            await addTicketReply(token, id, content);
            await queryClient.invalidateQueries({ queryKey: ["ticket", id] });
            await queryClient.invalidateQueries({ queryKey: ["tickets"] });
            message.success("回复已发送");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "回复失败");
        } finally {
            setReplying(false);
        }
    };

    return {
        detail: query.data as TicketDetail | undefined,
        isLoading: query.isFetching,
        replying,
        submitReply,
        refresh: () => query.refetch(),
    };
}