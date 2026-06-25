"use client";

import { App, Button, Card, Flex, Form, Input, Select, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createTicket, type TicketType } from "@/services/api/tickets";
import { useUserStore } from "@/stores/use-user-store";

const typeOptions = [
    { label: "Bug", value: "bug" },
    { label: "功能建议", value: "feature" },
    { label: "问题反馈", value: "question" },
    { label: "其他", value: "other" },
];

export default function NewTicketPage() {
    const router = useRouter();
    const { message } = App.useApp();
    const token = useUserStore((state) => state.token);
    const [form] = Form.useForm<{ type: string; title: string; content: string }>();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const values = await form.validateFields();
        setSubmitting(true);
        try {
            const ticket = await createTicket(token, { type: values.type as TicketType, title: values.title, content: values.content });
            message.success("工单已创建");
            router.push(`/tickets/${ticket.id}`);
        } catch (error) {
            message.error(error instanceof Error ? error.message : "创建失败");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main style={{ padding: 24, maxWidth: 700, margin: "0 auto" }}>
            <Card>
                <Flex vertical gap={16}>
                    <Typography.Title level={4} style={{ margin: 0 }}>新建工单</Typography.Title>
                    <Form form={form} layout="vertical" requiredMark={false} initialValues={{ type: "question" }}>
                        <Form.Item name="type" label="类型" rules={[{ required: true, message: "请选择类型" }]}>
                            <Select options={typeOptions} />
                        </Form.Item>
                        <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
                            <Input placeholder="简要描述你的问题或建议" maxLength={200} />
                        </Form.Item>
                        <Form.Item name="content" label="详细描述" rules={[{ required: true, message: "请输入详细描述" }]}>
                            <Input.TextArea rows={8} placeholder="请详细描述你遇到的问题、复现步骤、期望的行为等" maxLength={10000} showCount />
                        </Form.Item>
                    </Form>
                    <Flex justify="flex-end" gap={12}>
                        <Button onClick={() => router.back()}>取消</Button>
                        <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>提交</Button>
                    </Flex>
                </Flex>
            </Card>
        </main>
    );
}
