
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  isLoading?: boolean;
}

interface ChatbotDialogProps {
  onClose: () => void;
}

export default function ChatbotDialog({ onClose }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Hello! I\'m Victure AI, your pharmacy assistant. How can I help you today?', 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = { 
      id: Date.now().toString(), 
      text: input, 
      sender: 'user' 
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add a loading message
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { 
      id: loadingId, 
      text: 'Typing...', 
      sender: 'bot',
      isLoading: true 
    }]);
    
    setInput('');
    setIsLoading(true);
    
    try {
      // Call the Supabase edge function
      const { data, error } = await supabase.functions.invoke('victure-ai-chatbot', {
        body: { message: input },
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Remove loading message and add response
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: data.text,
        sender: 'bot'
      }]);
      
    } catch (error) {
      console.error('Error calling chatbot function:', error);
      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingId));
      
      // Add error message
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        text: "I'm sorry, I'm having trouble connecting to my knowledge base. Please try again later.",
        sender: 'bot'
      }]);
      
      toast.error("Failed to get response from Victure AI");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Bot className="h-5 w-5" />
            <h2 className="font-medium">Victure Assistant</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary/90"
            onClick={onClose}
            aria-label="Close chatbot"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Messages */}
        <ScrollArea className="h-[400px] p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card 
                  className={`max-w-[80%] p-3 ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : message.isLoading ? 'bg-gray-100' : 'bg-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about pharmacy management..."
              className="resize-none"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
