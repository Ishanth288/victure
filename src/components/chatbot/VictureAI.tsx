
import React, { useState, useRef, useEffect } from "react";
import { Send, X, BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

type Message = {
  text: string;
  isUser: boolean;
  source?: "database" | "openai";
};

const VictureAI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi, I'm Victure AI! How can I help you with pharmacy management today?", isUser: false }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close chatbot when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('victure-ai-chatbot', {
        body: { message: userMessage },
      });

      if (error) throw error;

      setMessages(prev => [
        ...prev, 
        { 
          text: data.text, 
          isUser: false,
          source: data.source
        }
      ]);
    } catch (error) {
      console.error('Error calling chatbot function:', error);
      toast.error("Sorry, I couldn't process your request. Please try again.");
      setMessages(prev => [
        ...prev,
        { text: "Sorry, I couldn't process your request. Please try again.", isUser: false }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full fixed bottom-6 right-6 shadow-lg z-50 flex items-center justify-center p-0 bg-primary hover:bg-primary/90"
        aria-label="Open chatbot"
      >
        <BotIcon size={24} />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px] h-[600px] flex flex-col p-0 gap-0 rounded-lg overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center">
                <BotIcon className="mr-2" size={20} />
                Victure AI
              </DialogTitle>
              <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  {message.source && !message.isUser && (
                    <p className="text-xs mt-1 opacity-60">
                      Source: {message.source === 'database' ? 'Knowledge Base' : 'AI'}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted max-w-[80%] rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send size={18} />
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VictureAI;
