
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, CheckCircle, Edit, Check, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  editing?: boolean;
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>('');

  useEffect(() => {
    // Load tasks from localStorage if available
    const savedTasks = localStorage.getItem('pharmacy-tasks');
    
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error("Error parsing saved tasks:", error);
        setTasks(getDefaultTasks());
      }
    } else {
      // Set default tasks if none saved
      setTasks(getDefaultTasks());
    }
    
    setIsLoading(false);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('pharmacy-tasks', JSON.stringify(tasks));
    }
  }, [tasks, isLoading]);

  const getDefaultTasks = (): Task[] => {
    return [
      { 
        id: '1', 
        title: 'Check inventory levels', 
        completed: false, 
        priority: 'high',
        dueDate: new Date().toISOString().split('T')[0]
      },
      { 
        id: '2', 
        title: 'Contact supplier for reorder', 
        completed: false, 
        priority: 'medium',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
      },
      { 
        id: '3', 
        title: 'Review daily sales report', 
        completed: true, 
        priority: 'medium'
      }
    ];
  };

  const addTask = () => {
    if (newTaskTitle.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || undefined
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const startEditTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, editing: true } : task
    ));
  };
  
  const saveTaskEdit = (taskId: string, newTitle: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, title: newTitle, editing: false } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent, taskId: string, newTitle: string) => {
    if (e.key === 'Enter') {
      saveTaskEdit(taskId, newTitle);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get filtered tasks based on active tab
  const getFilteredTasks = () => {
    let filteredTasks = [...tasks];
    
    if (activeFilter === 'completed') {
      filteredTasks = filteredTasks.filter(task => task.completed);
    } else if (activeFilter === 'pending') {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }
    
    // Sort tasks: incomplete first, then by priority (high to low), then by due date if exists
    filteredTasks.sort((a, b) => {
      // If active filter is 'all', sort completed tasks last
      if (activeFilter === 'all') {
        if (a.completed && !b.completed) return 1;
        if (!a.completed && b.completed) return -1;
      }
      
      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sort by due date if both have one
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Tasks with due dates come first
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      return 0;
    });
    
    return filteredTasks;
  };

  // Format due date to be more readable
  const formatDueDate = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return new Date(dateString).toLocaleDateString();
    }
  };

  const isDueDateSoon = (dateString?: string) => {
    if (!dateString) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays <= 2 && diffDays >= 0;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-primary mr-2" />
            Task Management
          </div>
          <Tabs defaultValue="all" className="w-auto" value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs h-6">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs h-6">Pending</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs h-6">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="mb-2"
          />
          <div className="flex items-center space-x-2">
            <div className="flex-1 grid grid-cols-3 gap-2">
              <Button
                type="button"
                size="sm"
                variant={newTaskPriority === 'low' ? 'default' : 'outline'}
                onClick={() => setNewTaskPriority('low')}
                className={newTaskPriority === 'low' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Low
              </Button>
              <Button
                type="button"
                size="sm"
                variant={newTaskPriority === 'medium' ? 'default' : 'outline'}
                onClick={() => setNewTaskPriority('medium')}
                className={newTaskPriority === 'medium' ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                Medium
              </Button>
              <Button
                type="button"
                size="sm"
                variant={newTaskPriority === 'high' ? 'default' : 'outline'}
                onClick={() => setNewTaskPriority('high')}
                className={newTaskPriority === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                High
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="flex-1"
            />
            <Button className="flex-shrink-0" onClick={addTask}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {getFilteredTasks().map(task => (
            <div
              key={task.id}
              className={`flex items-start justify-between p-2 rounded border ${
                task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${isDueDateSoon(task.dueDate) && !task.completed ? 'border-amber-300' : ''}`}
            >
              <div className="flex items-start space-x-2 flex-1">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className={`mt-1 ${task.completed ? 'text-gray-400' : ''}`}
                />
                <div className="flex flex-col flex-1">
                  {task.editing ? (
                    <div className="flex items-center space-x-1">
                      <Input 
                        defaultValue={task.title} 
                        className="text-sm h-8 py-1"
                        autoFocus
                        onKeyPress={(e) => handleEditKeyPress(e, task.id, (e.target as HTMLInputElement).value)}
                        onBlur={(e) => saveTaskEdit(task.id, e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => saveTaskEdit(task.id, task.title)}
                        className="h-8 w-8 p-1"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor={`task-${task.id}`}
                      className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'font-medium'}`}
                    >
                      {task.title}
                    </label>
                  )}
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className={`text-xs flex items-center gap-1 ${
                        isDueDateSoon(task.dueDate) && !task.completed 
                          ? 'text-amber-600 font-medium' 
                          : 'text-gray-500'
                      }`}>
                        <Calendar className="h-3 w-3" />
                        {formatDueDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {!task.editing && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => startEditTask(task.id)}
                    className="h-7 w-7 p-1"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => deleteTask(task.id)}
                  className="h-7 w-7 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          
          {getFilteredTasks().length === 0 && (
            <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
              <p className="mb-2">No {activeFilter !== 'all' ? activeFilter : ''} tasks</p>
              <p className="text-sm">{activeFilter === 'all' ? 'Add a task to get started' : `Switch to the "${activeFilter === 'completed' ? 'pending' : 'completed'}" tab to see tasks`}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
