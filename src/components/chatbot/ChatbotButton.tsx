
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatbotDialog from "./ChatbotDialog";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const path = location.pathname;
      
      // Only show on authenticated pages except auth and index
      setShouldShow(!!session && path !== '/' && path !== '/auth');
    };

    checkAuth();
  }, [location]);
  
  if (!shouldShow) return null;
  
  return (
    <>
      <motion.div 
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open help chatbot"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && <ChatbotDialog onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
