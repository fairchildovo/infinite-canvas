"use client";

import { CopyOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { App, Button, Card, Col, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Tag, Tooltip, Typography } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import type { Coupon } from "@/services/api/coupons";
import { useAdminCoupons } from "./use-admin-coupons";

const statusOptions = [
    { label: "全部状态", value: "" },
    { label: "未使用", value: "unused" },
    { label: "已使用", value: "used" },
];

export default function AdminCouponsPage() {
    const { message } = App.useApp();
    const { coupons, keyword, status, page, pageSize, total, isLoading, searchCoupons, changeStatus, changePage, changePageSize, resetFilters, refreshCoupons, generateCoupons } = useAdminCoupons();
    const [form] = Form.useForm<{ count: number; credits: number; expiresAt: string }>();
    const [keywordText, setKeywordText] = useState(keyword);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [generatedCodes, setGeneratedCodes] = useState<Coupon[]>([]);

    useEffect(() => setKeywordText(keyword), [keyword]);

    const handleGenerate = async () => {
        const values = await form.validateFields();
        const coupons = await generateCoupons({ count: values.count, credits: values.credits, expiresAt: values.expiresAt || undefined });
        setGeneratedCodes(coupons);
        setIsGenerateOpen(false);
        form.resetFields();
    };

    const copyAllCodes = () => {
        const text = generatedCodes.map((c) => c.code).join("\n");
        navigator.clipboard.writeText(text);
        message.success("已复制全部兑换码");
    };

    const columns: ProColumns<Coupon>[] = [
        {
            title: "兑换码",
            dataIndex: "code",
            width: 180,
            render: (_, item) => (
                <Typography.Text copyable code>
                    {item.code}
                </Typography.Text>
            ),
        },
        {
            title: "额度",
            dataIndex: "credits",
            width: 100,
        },
        {
            title: "状态",
            dataIndex: "usedBy",
            width: 100,
            render: (_, item) => <Tag color={item.usedBy ? "default" : "green"}>{item.usedBy ? "已使用" : "未使用"}</Tag>,
        },
        {
            title: "使用者",
            dataIndex: "usedBy",
            width: 160,
            render: (_, item) => <Typography.Text type="secondary">{item.usedBy || "-"}</Typography.Text>,
        },
        {
            title: "使用时间",
            dataIndex: "usedAt",
            width: 180,
            render: (_, item) => <Typography.Text type="secondary">{item.usedAt ? dayjs(item.usedAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</Typography.Text>,
        },
        {
            title: "创建时间",
            dataIndex: "createdAt",
            width: 180,
            render: (_, item) => <Typography.Text type="secondary">{item.createdAt ? dayjs(item.createdAt).format("YYYY-MM-DD HH:mm:ss") : "-"}</Typography.Text>,
        },
    ];

    return (
        <main style={{ padding: 24 }}>
            <Flex vertical gap={16}>
                <Card variant="borderless">
                    <Form layout="vertical">
                        <Row gutter={16} align="bottom">
                            <Col flex="360px">
                                <Form.Item label="关键词">
                                    <Input.Search value={keywordText} placeholder="搜索兑换码或使用者" allowClear enterButton={<SearchOutlined />} onSearch={() => searchCoupons(keywordText)} onChange={(event) => setKeywordText(event.target.value)} />
                                </Form.Item>
                            </Col>
                            <Col flex="160px">
                                <Form.Item label="状态">
                                    <Select value={status} options={statusOptions} onChange={(value) => changeStatus(value)} />
                                </Form.Item>
                            </Col>
                            <Col flex="none">
                                <Form.Item>
                                    <Button
                                        icon={<ReloadOutlined />}
                                        onClick={() => {
                                            setKeywordText("");
                                            resetFilters();
                                        }}
                                    >
                                        重置
                                    </Button>
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Card>
                <ProTable<Coupon>
                    rowKey="id"
                    columns={columns}
                    dataSource={coupons}
                    loading={isLoading}
                    search={false}
                    defaultSize="middle"
                    tableLayout="fixed"
                    cardProps={{ variant: "borderless" }}
                    headerTitle={
                        <Space>
                            <Typography.Text strong>兑换码列表</Typography.Text>
                            <Tag>{total} 条</Tag>
                        </Space>
                    }
                    options={{ density: true, setting: true, reload: () => void refreshCoupons() }}
                    toolBarRender={() => [
                        <Button key="generate" type="primary" icon={<PlusOutlined />} onClick={() => setIsGenerateOpen(true)}>
                            批量生成
                        </Button>,
                    ]}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        pageSizeOptions: [10, 20, 50, 100],
                        showTotal: (value) => `共 ${value} 条`,
                        onChange: (nextPage, nextPageSize) => (nextPageSize !== pageSize ? changePageSize(nextPageSize) : changePage(nextPage)),
                    }}
                />
            </Flex>

            <Modal title="批量生成兑换码" open={isGenerateOpen} onCancel={() => setIsGenerateOpen(false)} onOk={() => void handleGenerate()} okText="生成" cancelText="取消" destroyOnHidden>
                <Form form={form} layout="vertical" requiredMark={false}>
                    <Row gutter={14}>
                        <Col span={12}>
                            <Form.Item name="count" label="数量" rules={[{ required: true, message: "请输入数量" }]}>
                                <InputNumber min={1} max={100} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="credits" label="额度" rules={[{ required: true, message: "请输入额度" }]}>
                                <InputNumber min={1} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item name="expiresAt" label="过期时间">
                                <Input placeholder="如 2026-12-31T23:59:59+08:00，留空永不过期" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            <Modal
                title="生成成功"
                open={generatedCodes.length > 0}
                onCancel={() => setGeneratedCodes([])}
                width={560}
                footer={
                    <Space>
                        <Button icon={<CopyOutlined />} onClick={copyAllCodes}>
                            复制全部
                        </Button>
                        <Button onClick={() => setGeneratedCodes([])}>关闭</Button>
                    </Space>
                }
            >
                <Flex vertical gap={8}>
                    <Typography.Text type="secondary">已生成 {generatedCodes.length} 个兑换码：</Typography.Text>
                    <div style={{ maxHeight: 320, overflow: "auto" }}>
                        {generatedCodes.map((coupon) => (
                            <Typography.Text key={coupon.id} copyable code block style={{ marginBottom: 4 }}>
                                {coupon.code}
                            </Typography.Text>
                        ))}
                    </div>
                </Flex>
            </Modal>
        </main>
    );
}
