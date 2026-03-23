import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import {
  getStaffProfile,
  getTimeLogsForStaff,
  getWorkOrdersForStaff,
  updateWorkOrderStatus,
  type StaffProfile,
  type TimeLog,
  type WorkOrder,
} from "@/lib/staff";

const Staff = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/register");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMessage("");

    Promise.all([
      getStaffProfile(user.id),
      getWorkOrdersForStaff(user.id),
      getTimeLogsForStaff(user.id),
    ])
      .then(([staffProfile, orders, logs]) => {
        if (!isMounted) return;
        setProfile(staffProfile);
        setWorkOrders(orders);
        setTimeLogs(logs);
      })
      .catch((error: any) => {
        if (!isMounted) return;
        setErrorMessage(error?.message || "Unable to load staff data.");
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [authLoading, navigate, user]);

  const formatStatus = (status?: string | null) => {
    if (!status) return "Pending";
    return status
      .replace(/[_-]/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const isToday = (value?: string | null) => {
    if (!value) return false;
    const date = new Date(value);
    const now = new Date();
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  const todayTasks = useMemo(
    () =>
      workOrders
        .filter((order) => isToday(order.scheduled_date || order.updated_at || order.created_at))
        .map((order) => ({
          id: order.id,
          service: order.service_type || "Service",
          customer: order.customer_name || "Customer",
          time: order.estimated_time || "--",
          status: formatStatus(order.status),
        })),
    [workOrders]
  );

  const performanceMetrics = useMemo(() => {
    const completed = workOrders.filter((order) => (order.status || "").toLowerCase() === "completed").length;
    const inProgress = workOrders.filter((order) => (order.status || "").toLowerCase() === "in-progress").length;
    const pending = workOrders.filter((order) => (order.status || "").toLowerCase() === "pending").length;

    return [
      { metric: "Services Completed", value: `${completed}`, trend: "" },
      { metric: "Active Jobs", value: `${inProgress}`, trend: "" },
      { metric: "Pending", value: `${pending}`, trend: "" },
    ];
  }, [workOrders]);

  const handleLogout = () => {
    logout();
  };

  const updateTaskStatus = async (id: string, status: string) => {
    try {
      await updateWorkOrderStatus(id, status);
      setWorkOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    } catch (error: any) {
      setErrorMessage(error?.message || "Unable to update task status.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-shell pt-32 pb-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display text-primary-foreground mb-2">Staff Portal</h1>
            <p className="text-muted-foreground">
              {loading ? "Loading staff profile..." : `Welcome, ${profile?.full_name || profile?.name || "Staff"}`}
            </p>
          </div>
          <Button variant="destructive" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Profile Card */}
        <Card className="mb-8 scale-rotate-3d shadow-3d">
          <CardContent className="pt-6">
            {errorMessage ? (
              <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {errorMessage}
              </div>
            ) : null}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Staff ID</p>
                <p className="text-2xl font-bold text-primary-foreground mb-4">{profile?.id || "-"}</p>
                <p className="text-primary-foreground font-medium">{profile?.full_name || profile?.name || "-"}</p>
                <p className="text-muted-foreground">{profile?.role || "-"}</p>
                <p className="text-sm text-muted-foreground mt-2">{user?.email || "-"}</p>
              </div>
              <div className="text-right">
                <div className="inline-block bg-primary/20 px-6 py-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-garage-success">On Duty</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {performanceMetrics.map((perf, idx) => (
            <Card key={idx} className="scale-rotate-3d shadow-3d">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{perf.metric}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-primary-foreground">{perf.value}</div>
                  <div className="text-sm text-garage-success font-medium">{perf.trend || ""}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border">
            <TabsTrigger value="tasks">Today's Tasks</TabsTrigger>
            <TabsTrigger value="timelog">Time Log</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          {/* Today's Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Today's Service Tasks</CardTitle>
                <CardDescription>Your scheduled services for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading tasks...</p>
                  ) : todayTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks scheduled for today.</p>
                  ) : (
                    todayTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border/50 tilt-3d hover:bg-card/70 transition">
                      <div className="flex items-center gap-4 flex-1">
                        {task.status === "Completed" && <CheckCircle className="w-5 h-5 text-garage-success" />}
                        {task.status === "In Progress" && <Clock className="w-5 h-5 text-primary animate-spin" />}
                        {task.status === "Pending" && <AlertCircle className="w-5 h-5 text-garage-warning" />}
                        <div>
                          <p className="font-medium text-primary-foreground">{task.service}</p>
                          <p className="text-sm text-muted-foreground">{task.customer} • {task.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === "Completed" ? "bg-garage-success/20 text-garage-success" :
                        task.status === "In Progress" ? "bg-primary/20 text-primary" :
                        "bg-garage-warning/20 text-garage-warning"
                      }`}>
                        {task.status}
                      </span>
                      <div className="ml-3 flex items-center gap-2">
                        {task.status === "Pending" ? (
                          <>
                            <Button size="sm" className="h-8" onClick={() => updateTaskStatus(task.id, "in-progress")}>
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" className="h-8" onClick={() => updateTaskStatus(task.id, "cancelled")}>
                              Reject
                            </Button>
                          </>
                        ) : task.status === "In Progress" ? (
                          <Button size="sm" className="h-8" onClick={() => updateTaskStatus(task.id, "completed")}>
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Time Log Tab */}
          <TabsContent value="timelog" className="space-y-4">
            <div className="flex gap-4 mb-6">
              <Button className="bg-garage-success hover:bg-garage-success/90">Clock In</Button>
              <Button variant="outline" className="border-primary-foreground/20">Clock Out</Button>
            </div>
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Time Log History</CardTitle>
                <CardDescription>Your recent clock in/out records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clock In</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Clock Out</th>
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Hours Worked</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeLogs.map((log, idx) => (
                        <tr key={idx} className="border-b border-border/50 hover:bg-card/50">
                          <td className="py-3 px-4">{log.work_date}</td>
                          <td className="py-3 px-4">{log.clock_in || "-"}</td>
                          <td className="py-3 px-4">{log.clock_out || "-"}</td>
                          <td className="py-3 px-4 font-medium">{log.hours ?? "-"}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="shadow-3d">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Full Name</label>
                    <input
                      type="text"
                      defaultValue={profile?.full_name || profile?.name || ""}
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ""}
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Role</label>
                    <input
                      type="text"
                      defaultValue={profile?.role || ""}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-primary-foreground">Staff ID</label>
                    <input
                      type="text"
                      defaultValue={profile?.id || ""}
                      disabled
                      className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground/50 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary-foreground">Change Password</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-2 rounded-lg bg-input border border-border text-primary-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 w-full">Update Profile</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Staff;
