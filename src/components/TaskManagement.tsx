
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, CheckCircle } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isLoading, setIsLoading] = useState(true);

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
      priority: newTaskPriority
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
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

  // Sort tasks: incomplete first, then by priority (high to low)
  const sortedTasks = [...tasks].sort((a, b) => {
    // Completed tasks go last
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // If both are completed or both are not completed, sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Task Management
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
            <Button className="flex-shrink-0" onClick={addTask}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {sortedTasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center justify-between p-2 rounded border ${
                task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-2 flex-1">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                  className={task.completed ? 'text-gray-400' : ''}
                />
                <div className="flex flex-col">
                  <label
                    htmlFor={`task-${task.id}`}
                    className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'font-medium'}`}
                  >
                    {task.title}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </Badge>
                    {task.dueDate && (
                      <span className="text-xs flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => deleteTask(task.id)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
              <p className="mb-2">No tasks yet</p>
              <p className="text-sm">Add a task to get started</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
