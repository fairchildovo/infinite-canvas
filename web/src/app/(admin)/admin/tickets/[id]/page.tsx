"use client";

import { ReloadOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Card, Flex, Input, Select, Spin, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { fetchAdminUsers, type AdminUser } from "@/services/api/admin";
import type { TicketStatus, TicketType } from "@/services/api/tickets";
import { useUserStore } from "@/stores/use-user-store";
import { useAdminTicketDetail } from "./use-admin-ticket-detail";

const statusOptions = [
    { label: "待处理", value: "open" },
    { label: "处理中", value: "in_progress" },
    { label: "已解决", value: "resolved" },
    { label: "已关闭", value: "closed" },
];

const statusLabels: Record<TicketStatus, { text: string; color: string }> = {
    open: { text: "待处理", color: "orange" },
    in_progress: { text: "处理中", color: "blue" },
    resolved: { text: "已解决", color: "green" },
    closed: { text: "已关闭", color: "default" },
};

const typeLabels: Record<TicketType, string> = {
    bug: "Bug",
    feature: "功能建议",
    question: "问题反馈",
    other: "其他",
};

export default function AdminTicketDetailPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;
    const token = useUserStore((state) => state.token);
    const user = useUserStore((state) => state.user);
    const { detail, isLoading, replying, updating, submitReply, changeStatus, assignTo, refresh } = useAdminTicketDetail(id);
    const [replyContent, setReplyContent] = useState("");
    const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
    const [userMap, setUserMap] = useState<Map<string, AdminUser>>(new Map());

    useEffect(() => {
        if (!token) return;
        fetchAdminUsers(token, { pageSize: 500 }).then((res) => {
            setAdminUsers(res.items.filter((u) => u.role === "admin"));
            const map = new Map<string, AdminUser>();
            res.items.forEach((u) => map.set(u.id, u));
            setUserMap(map);
        }).catch(() => {});
    }, [token]);

    const handleSend = async () => {
        const content = replyContent.trim();
        if (!content) return;
        await submitReply(content);
        setReplyContent("");
    };

    if (isLoading) {
        return (
            <main style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
                <Spin />
            </main>
        );
    }

    if (!detail) {
        return (
            <main style={{ padding: 24, textAlign: "center" }}>
                <Typography.Text type="secondary">工单不存在</Typography.Text>
            </main>
        );
    }

    const ticket = detail.ticket;
    const statusInfo = statusLabels[ticket.status];

    return (
        <Flex vertical gap={20} style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
            {/* 工单元信息 + 操作 */}
            <Card>
                <Flex vertical gap={12}>
                    <Flex align="center" gap={12} wrap="wrap">
                        <Typography.Title level={4} style={{ margin: 0 }}>{ticket.title}</Typography.Title>
                        <Tag>{typeLabels[ticket.type] || ticket.type}</Tag>
                        <Tag color={statusInfo?.color}>{statusInfo?.text || ticket.status}</Tag>
                    </Flex>
                    <Typography.Text type="secondary">
                        提交者：{userMap.get(ticket.userId)?.displayName || userMap.get(ticket.userId)?.username || ticket.userId.slice(0, 8)} | 创建于 {dayjs(ticket.createdAt).format("YYYY-MM-DD HH:mm")}
                    </Typography.Text>
                    <Flex gap={16} wrap="wrap" align="center">
                        <Flex align="center" gap={8}>
                            <Typography.Text>状态：</Typography.Text>
                            <Select
                                options={statusOptions}
                                value={ticket.status}
                                onChange={(v) => void changeStatus(v as TicketStatus)}
                                style={{ width: 130 }}
                                loading={updating}
                            />
                        </Flex>
                        <Flex align="center" gap={8}>
                            <Typography.Text>指派：</Typography.Text>
                            <Select
                                showSearch
                                optionFilterProp="label"
                                options={[
                                    { label: "未指派", value: "" },
                                    ...adminUsers.map((u) => ({ label: u.displayName || u.username, value: u.id })),
                                ]}
                                value={ticket.assignedTo || ""}
                                onChange={(v) => void assignTo(v)}
                                style={{ width: 180 }}
                                loading={updating}
                            />
                        </Flex>
                        <Button icon={<ReloadOutlined />} onClick={refresh}>刷新</Button>
                    </Flex>
                </Flex>
            </Card>

            {/* 对话流 */}
            <Flex vertical gap={16}>
                {detail.replies.map((reply) => {
                    const isMe = reply.userId === user?.id;
                    return (
                        <Flex key={reply.id} justify={isMe ? "flex-end" : "flex-start"}>
                            <div style={{ maxWidth: "80%" }}>
                                <Flex align="center" gap={8} style={{ marginBottom: 4 }} justify={isMe ? "flex-end" : "flex-start"}>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {reply.isStaff ? "管理员" : "用户"} ({reply.userId.slice(0, 12)})
                                    </Typography.Text>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {dayjs(reply.createdAt).format("YYYY-MM-DD HH:mm")}
                                    </Typography.Text>
                                </Flex>
                                <div
                                    style={{
                                        padding: "10px 14px",
                                        borderRadius: 12,
                                        background: isMe ? "#1677ff" : "#f0f0f0",
                                        color: isMe ? "#fff" : "#000",
                                    }}
                                >
                                    <Typography.Text style={{ color: isMe ? "#fff" : undefined, whiteSpace: "pre-wrap" }}>
                                        {reply.content}
                                    </Typography.Text>
                                </div>
                            </div>
                        </Flex>
                    );
                })}
            </Flex>

            {/* 管理员回复 */}
            <Card>
                <Flex gap={12} align="flex-end">
                    <Input.TextArea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="输入回复内容..."
                        rows={3}
                        maxLength={5000}
                        style={{ flex: 1 }}
                        onPressEnter={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                                e.preventDefault();
                                void handleSend();
                            }
                        }}
                    />
                    <Button type="primary" icon={<SendOutlined />} loading={replying} onClick={() => void handleSend()} disabled={!replyContent.trim()}>
                        发送
                    </Button>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                    Ctrl+Enter 发送
                </Typography.Text>
            </Card>
        </Flex>
    );
}