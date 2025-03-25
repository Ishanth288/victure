import { useState, useRef, useEffect } from "react";
import { m } from "framer-motion";
import { X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
}

interface ChatbotDialogProps {
  onClose: () => void;
}

export default function ChatbotDialog({ onClose }: ChatbotDialogProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: 'Hello! I\'m your assistant. How can I help you with Victure Healthcare Solutions?', 
      sender: 'bot' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = { 
      id: Date.now().toString(), 
      text: input, 
      sender: 'user' 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      console.log('Sending to chatbot:', input);
      
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: { message: input }
      });

      console.log('Chatbot response:', data, 'Error:', error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function error: ${error.message || 'Unknown error'}`);
      }
      
      if (!data) {
        throw new Error('No data received from chatbot function');
      }

      if (data.error) {
        console.error('Error in function response:', data.error);
        throw new Error(`Response error: ${data.error}`);
      }

      if (data.response) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          sender: 'bot'
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Response field missing in function response');
      }
    } catch (error: any) {
      console.error('Chatbot error details:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error. Please try again later.",
        sender: 'bot'
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error('Chatbot error: ' + (error.message || 'Unknown error'));
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <m.div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <m.div
        className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
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
                      : 'bg-white'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <Card className="max-w-[80%] p-3 bg-white">
                  <p className="text-sm">Typing...</p>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
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
      </m.div>
    </m.div>
  );
}
