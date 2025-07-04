import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m HostelHelper, your virtual assistant for finding hostels near Kirinyaga University. How can I help you today?' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    setIsLoading(true);
    
    try {
      console.log("Sending message to assistant:", userMessage);

      // Create a clean history for the API call
      const cleanHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Use Supabase function invocation instead of direct fetch
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage,
          history: cleanHistory
        },
      });
      
      if (error) {
        throw new Error(error.message || 'Failed to get response from assistant');
      }
      
      console.log("Received response from assistant:", data.response);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error: any) {
      console.error('Error getting response:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get response from assistant. Please try again.",
        variant: "destructive",
      });
      
      // Add an error message to the chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat button */}
      <div className={`fixed ${isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6'} z-50`}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full shadow-lg ${isMobile ? 'w-12 h-12' : 'w-16 h-16'}`}
          aria-label={isOpen ? "Close chat" : "Open chat"}
        >
          {isOpen ? (
            <X size={isMobile ? 20 : 24} />
          ) : (
            <MessageSquare size={isMobile ? 20 : 24} />
          )}
        </Button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-white rounded-lg shadow-xl flex flex-col overflow-hidden border border-border
            ${isMobile 
              ? 'bottom-20 right-4 left-4 h-[60vh] max-h-[500px]' 
              : 'bottom-24 right-6 w-96 h-[500px]'
            }`}
        >
          {/* Chat header */}
          <div className="bg-primary p-4 text-white flex justify-between items-center">
            <div className="flex items-center">
              <MessageSquare size={20} className="mr-2" />
              <h3 className="font-medium">HostelHelper</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-primary/80"
            >
              <X size={18} />
            </Button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-secondary/50 text-foreground'
                  }`}
                >
                  {message.content.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {line}
                      {j < message.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-border p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1"
                aria-label="Chat message"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
                aria-label="Send message"
              >
                <Send size={18} />
                <span className="sr-only">Send</span>
              </Button>
            </form>
            {isLoading && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                HostelHelper is typing...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
