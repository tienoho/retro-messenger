import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  DashboardOutlined,
  SafetyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { RetroApiClient } from "@retro/api-client";
import type {
  AdminAuditLogDto,
  AdminOverviewDto,
  AdminUserDto,
} from "@retro/contracts";

interface LoginValues {
  username: string;
  password: string;
}

export function validateAdminActionReason(reason: string): string | null {
  const length = reason.trim().length;
  if (length < 10) return "Lý do phải có ít nhất 10 ký tự.";
  if (length > 500) return "Lý do không được vượt quá 500 ký tự.";
  return null;
}

export function App() {
  const api = useMemo(
    () => new RetroApiClient(import.meta.env.VITE_API_URL ?? ""),
    [],
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [restoringSession, setRestoringSession] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionUser, setActionUser] = useState<AdminUserDto | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState(false);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [nextOverview, nextUsers, nextAuditLogs] = await Promise.all([
        api.getAdminOverview(),
        api.listAdminUsers(),
        api.listAdminAuditLogs(),
      ]);
      setOverview(nextOverview);
      setUsers(nextUsers);
      setAuditLogs(nextAuditLogs);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const restored = await api.restoreWebSession();
        if (cancelled || !restored) return;
        await loadAdminData();
        setCurrentUserId(restored.user.id);
        setAuthenticated(true);
      } catch {
        // Not logged in or not admin
      } finally {
        if (!cancelled) setRestoringSession(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, loadAdminData]);

  async function handleLogin(values: LoginValues): Promise<void> {
    setAuthenticating(true);
    setAuthError(null);
    try {
      const response = await api.login(values.username.trim(), values.password);
      await loadAdminData();
      setCurrentUserId(response.user.id);
      setAuthenticated(true);
    } catch (error) {
      api.clearSession();
      setAuthError(
        error instanceof Error && error.message.includes("403")
          ? "Tài khoản không có quyền truy cập trang quản trị."
          : "Không thể đăng nhập hoặc tải dữ liệu quản trị.",
      );
    } finally {
      setAuthenticating(false);
    }
  }

  async function handleLogout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      api.clearSession();
    }
    setAuthenticated(false);
    setCurrentUserId(null);
    setOverview(null);
    setUsers([]);
    setAuditLogs([]);
  }

  function openSuspensionAction(user: AdminUserDto): void {
    setActionUser(user);
    setActionReason("");
    setActionError(null);
  }

  async function submitSuspensionAction(): Promise<void> {
    if (!actionUser) return;
    const validationError = validateAdminActionReason(actionReason);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSavingAction(true);
    setActionError(null);
    try {
      await api.setAdminUserSuspension(
        actionUser.id,
        !actionUser.suspended,
        actionReason.trim(),
      );
      setActionUser(null);
      setActionReason("");
      await loadAdminData();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Thao tác quản trị thất bại.",
      );
    } finally {
      setSavingAction(false);
    }
  }

  if (restoringSession) {
    return (
      <Layout style={{ minHeight: "100vh", display: "flex", placeItems: "center", justifyContent: "center", padding: 24 }}>
        <Typography.Text type="secondary">Đang khôi phục phiên quản trị…</Typography.Text>
      </Layout>
    );
  }

  if (!authenticated) {
    return (
      <Layout style={{ minHeight: "100vh", placeItems: "center", padding: 24 }}>
        <Card style={{ width: "min(420px, 100%)" }}>
          <Typography.Title level={2}>Retro Admin</Typography.Title>
          <Typography.Paragraph type="secondary">
            Chỉ tài khoản có vai trò quản trị viên mới được truy cập.
          </Typography.Paragraph>
          {authError && <Alert type="error" message={authError} showIcon />}
          <Form<LoginValues>
            layout="vertical"
            onFinish={(values: LoginValues) => void handleLogin(values)}
            style={{ marginTop: 20 }}
          >
            <Form.Item
              label="Tên đăng nhập"
              name="username"
              rules={[{ required: true, message: "Nhập tên đăng nhập." }]}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Nhập mật khẩu." }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={authenticating}
              block
            >
              Đăng nhập quản trị
            </Button>
          </Form>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider theme="dark" breakpoint="lg" collapsedWidth={0}>
        <Typography.Title level={4} style={{ color: "white", padding: 20 }}>
          Retro Admin
        </Typography.Title>
        <Menu
          theme="dark"
          selectedKeys={["dashboard"]}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "Tổng quan",
            },
            { key: "users", icon: <UserOutlined />, label: "Người dùng" },
            { key: "audit", icon: <SafetyOutlined />, label: "Nhật ký audit" },
          ]}
        />
      </Layout.Sider>

      <Layout.Content style={{ padding: 28 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Typography.Title level={2}>Operations Dashboard</Typography.Title>
          <Space>
            <Button onClick={() => void loadAdminData()} loading={loading}>
              Làm mới
            </Button>
            <Button onClick={() => void handleLogout()}>Đăng xuất</Button>
          </Space>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="Người dùng" value={overview?.userCount ?? 0} />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Hội thoại"
                value={overview?.conversationCount ?? 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Outbox đang chờ"
                value={overview?.pendingOutboxCount ?? 0}
              />
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic
                title="Refresh session"
                value={overview?.activeRefreshSessionCount ?? 0}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Người dùng" style={{ marginTop: 20 }}>
          <Table<AdminUserDto>
            rowKey="id"
            dataSource={users}
            loading={loading}
            pagination={{ pageSize: 20 }}
            columns={[
              { title: "Username", dataIndex: "username" },
              { title: "Tên hiển thị", dataIndex: "displayName" },
              {
                title: "Trạng thái",
                render: (_: unknown, user: AdminUserDto) => (
                  <Tag color={user.suspended ? "red" : "green"}>
                    {user.suspended ? "Đình chỉ" : user.status}
                  </Tag>
                ),
              },
              {
                title: "Tạo lúc",
                render: (_: unknown, user: AdminUserDto) =>
                  new Date(user.createdAt).toLocaleString("vi-VN"),
              },
              {
                title: "Thao tác",
                render: (_: unknown, user: AdminUserDto) => {
                  const isCurrentUser = user.id === currentUserId;
                  return (
                    <Button
                      danger={!user.suspended && !isCurrentUser}
                      disabled={isCurrentUser}
                      onClick={() => openSuspensionAction(user)}
                    >
                      {isCurrentUser
                        ? "Phiên hiện tại"
                        : user.suspended
                          ? "Khôi phục"
                          : "Đình chỉ"}
                    </Button>
                  );
                },
              },
            ]}
          />
        </Card>

        <Card title="Nhật ký audit" style={{ marginTop: 20 }}>
          <Table<AdminAuditLogDto>
            rowKey="id"
            dataSource={auditLogs}
            loading={loading}
            pagination={{ pageSize: 20 }}
            columns={[
              {
                title: "Thời gian",
                render: (_: unknown, item: AdminAuditLogDto) =>
                  new Date(item.occurredAt).toLocaleString("vi-VN"),
              },
              { title: "Quản trị viên", dataIndex: "actorUsername" },
              { title: "Hành động", dataIndex: "action" },
              { title: "Đối tượng", dataIndex: "targetId" },
              { title: "Lý do", dataIndex: "reason" },
            ]}
          />
        </Card>
      </Layout.Content>

      <Modal
        open={actionUser !== null}
        title={
          actionUser?.suspended
            ? "Xác nhận khôi phục user"
            : "Xác nhận đình chỉ user"
        }
        okText={actionUser?.suspended ? "Khôi phục" : "Đình chỉ"}
        cancelText="Hủy"
        confirmLoading={savingAction}
        onOk={() => void submitSuspensionAction()}
        onCancel={() => setActionUser(null)}
      >
        <Typography.Paragraph>
          Hành động với <strong>{actionUser?.username}</strong> sẽ được ghi vào
          audit log.
        </Typography.Paragraph>
        <Input.TextArea
          aria-label="Lý do quản trị"
          rows={4}
          maxLength={500}
          value={actionReason}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
            setActionReason(event.target.value)
          }
          placeholder="Nhập lý do cụ thể (10–500 ký tự)"
        />
        {actionError && (
          <Alert
            type="error"
            message={actionError}
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Modal>
    </Layout>
  );
}
