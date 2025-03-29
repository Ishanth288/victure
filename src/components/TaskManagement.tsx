
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Check inventory levels', completed: false },
    { id: '2', title: 'Contact supplier for reorder', completed: false },
    { id: '3', title: 'Review daily sales report', completed: true }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = () => {
    if (newTaskTitle.trim() === '') return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Task Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Input
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button size="sm" onClick={addTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {tasks.map(task => (
            <div
              key={task.id}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`task-${task.id}`}
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskCompletion(task.id)}
                />
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}
                >
                  {task.title}
                </label>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {tasks.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No tasks yet. Add one to get started!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
