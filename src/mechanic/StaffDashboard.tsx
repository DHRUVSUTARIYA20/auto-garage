import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import ProfileEditorDialog from "@/components/ProfileEditorDialog";
import {
  Calendar,
  Clock,
  Car,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Wrench,
  TrendingUp,
  Zap,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";

type Garage = {
  id: string;
  name: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  ownerId?: string;
};

type Task = {
  id: string;
  trackingId: string;
  name: string;
  email: string;
  phone: string;
  vehicle: string;
  date: string;
  time: string;
  total: number;
  status: string;
  taskStatus?: string;
  progressPercentage?: number;
  notes?: string;
  createdAt: string;
  services?: Array<{ id: string; name?: string; price?: number }>;
};

const StaffDashboard = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);
  const [garageLoading, setGarageLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [updateFormState, setUpdateFormState] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/register");
      return;
    }

    if (authLoading || !user) {
      return;
    }

    if (user.role !== "staff" && user.role !== "mechanic") {
      navigate("/");
      return;
    }

    let isMounted = true;
    const loadData = async () => {
      try {
        // Load garage info
        const { data: garageData, error: garageError } = await api.getStaffGarageApi();
        if (garageError) {
          console.error("Garage load error:", garageError);
        } else if (isMounted && garageData) {
          setGarage(garageData as Garage);
        }
        setGarageLoading(false);

        // Load tasks
        const { data: tasksData, error: tasksError } = await api.getStaffTasksApi();
        if (tasksError) throw new Error(tasksError);
        if (isMounted && tasksData) {
          setTasks(Array.isArray(tasksData) ? tasksData : []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard",
          variant: "destructive",
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [navigate, user, authLoading, toast]);

  const handleLogout = async () => {
    await logout();
  };

  const calculateStats = () => {
    const completed = tasks.filter((t) => t.taskStatus === "completed").length;
    const inProgress = tasks.filter((t) => t.taskStatus === "in progress").length;
    const pending = tasks.filter((t) => !t.taskStatus || t.taskStatus === "assigned").length;

    return { completed, inProgress, pending, total: tasks.length };
  };

  const handleUpdateProgress = async (taskId: string) => {
    try {
      const form = updateFormState[taskId] || {};
      const { taskStatus, progressPercentage, notes } = form;

      if (!taskStatus) {
        toast({
          title: "Error",
          description: "Please select a task status",
          variant: "destructive",
        });
        return;
      }

      const { error } = await api.updateTaskProgressApi(
        taskId,
        taskStatus,
        progressPercentage || 0,
        notes || ""
      );

      if (error) throw new Error(error);

      toast({
        title: "Task updated",
        description: "Your progress has been saved",
      });

      setExpandedTaskId(null);
      // Reload tasks
      const { data: tasksData } = await api.getStaffTasksApi();
      if (tasksData) setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const getTaskStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "assigned":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = calculateStats();

  if (authLoading || !user || loading || garageLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-32 pb-24 bg-background">
        <div className="page-shell max-w-6xl">
          {/* Garage Info Card */}
          {garageLoading ? (
            <div className="mb-8 p-6 bg-muted rounded-lg animate-pulse">Loading garage info...</div>
          ) : garage ? (
            <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="text-2xl font-bold text-foreground">{garage.name}</h2>
                      <Badge className="bg-green-500/20 text-green-700 border-green-300">Your Garage</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {garage.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {garage.address}
                        </div>
                      )}
                      {garage.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {garage.phone}
                        </div>
                      )}
                      {garage.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {garage.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => handleLogout()} variant="destructive" className="gap-2 md:w-auto w-full">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                  <ProfileEditorDialog triggerClassName="md:w-auto w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8 border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-6">
                <p className="text-destructive font-semibold">⚠️ Garage information not found</p>
                <p className="text-sm text-muted-foreground mt-1">Contact your garage owner for assistance</p>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-display text-foreground mb-2">My Tasks</h1>
              <p className="text-muted-foreground">View and complete your assigned service tasks from {garage?.name || "your garage"}</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tasks</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">In Progress</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-simple">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks List */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Assigned Tasks</h2>

            {tasks.length === 0 ? (
              <Card className="card-simple text-center py-12">
                <CardContent>
                  <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Wait for garage owner to assign tasks to you
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    className="card-simple hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() =>
                      setExpandedTaskId(expandedTaskId === task.id ? null : task.id)
                    }
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-[10px] bg-muted">
                              {task.trackingId}
                            </Badge>
                            <Badge className={`text-[9px] font-bold ${getTaskStatusColor(task.taskStatus)}`}>
                              {task.taskStatus || "Assigned"}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{task.vehicle}</h3>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1">
                              <Car className="w-3 h-3" /> {task.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(task.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {task.time}
                            </span>
                          </div>
                          {task.services && task.services.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                                Services:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {task.services.map((s) => (
                                  <Badge key={s.id} variant="secondary" className="text-[9px]">
                                    {s.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Task Details */}
                      {expandedTaskId === task.id && (
                        <div
                          className="border-t pt-4 space-y-4"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold mb-2 block">Task Status</label>
                              <Select
                                value={updateFormState[task.id]?.taskStatus || task.taskStatus || "assigned"}
                                onValueChange={(value) =>
                                  setUpdateFormState((prev) => ({
                                    ...prev,
                                    [task.id]: { ...prev[task.id], taskStatus: value },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assigned" disabled>
                                    Assigned (Owner Only)
                                  </SelectItem>
                                  <SelectItem value="in progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-semibold mb-2 block">Progress %</label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={updateFormState[task.id]?.progressPercentage ?? 0}
                                onChange={(e) =>
                                  setUpdateFormState((prev) => ({
                                    ...prev,
                                    [task.id]: {
                                      ...prev[task.id],
                                      progressPercentage: parseInt(e.target.value) || 0,
                                    },
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-semibold mb-2 block">Work Notes</label>
                            <Textarea
                              value={updateFormState[task.id]?.notes || ""}
                              onChange={(e) =>
                                setUpdateFormState((prev) => ({
                                  ...prev,
                                  [task.id]: { ...prev[task.id], notes: e.target.value },
                                }))
                              }
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateProgress(task.id)}
                              className="flex-1"
                            >
                              Save Progress
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setExpandedTaskId(null)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
