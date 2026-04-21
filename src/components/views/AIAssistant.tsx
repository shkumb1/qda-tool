import { useState, useEffect, useRef } from "react";
import { useQDAStore } from "@/store/qdaStore";
import { chatWithAssistant } from "@/services/aiService";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Send,
  Loader2,
  User,
  Bot,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIAssistant({ open, onOpenChange }: AIAssistantProps) {
  const {
    codes,
    themes,
    documents,
    excerpts,
    activeStudyId,
    studies,
  } = useQDAStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your QDA assistant. I can help you with:\n\n• Understanding your codes and themes\n• Analyzing patterns in your data\n• Suggesting coding strategies\n• Explaining QDA concepts\n• Navigating this tool's features\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeStudy = studies.find((s) => s.id === activeStudyId);

  // Build context about current study
  const studyContext = activeStudy
    ? {
        studyTitle: activeStudy.title,
        documentCount: documents.length,
        codeCount: codes.length,
        themeCount: themes.length,
        excerptCount: excerpts.length,
        topCodes: codes
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 5)
          .map((c) => `${c.name} (${c.frequency} excerpts)`),
        themes: themes.map((t) => ({
          name: t.name,
          level: t.level,
          codeCount: t.codeIds.length,
        })),
      }
    : null;

  // Clear chat when study changes
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm your QDA assistant. I can help you with:\n\n• Understanding your codes and themes\n• Analyzing patterns in your data\n• Suggesting coding strategies\n• Explaining QDA concepts\n• Navigating this tool's features\n\nWhat would you like to know?",
        timestamp: new Date(),
      },
    ]);
  }, [activeStudyId]); // Reset when study changes

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chatWithAssistant(
        input.trim(),
        studyContext,
        messages.map((m) => ({ role: m.role, content: m.content })),
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Assistant error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I apologize, but I encountered an error. Please check your OpenAI API configuration and try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I assist you with your qualitative data analysis?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                QDA AI Assistant
              </SheetTitle>
              <SheetDescription>
                Your specialized qualitative data analysis helper
              </SheetDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Study Context Badge */}
          {studyContext && (
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs">
                {studyContext.documentCount} docs
              </Badge>
              <Badge variant="outline" className="text-xs">
                {studyContext.codeCount} codes
              </Badge>
              <Badge variant="outline" className="text-xs">
                {studyContext.themeCount} themes
              </Badge>
              <Badge variant="outline" className="text-xs">
                {studyContext.excerptCount} excerpts
              </Badge>
            </div>
          )}
        </SheetHeader>

        {/* Messages */}
        <ScrollArea
          ref={scrollRef}
          className="flex-1 px-6 py-4"
        >
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-accent" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-50 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-accent" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your codes, themes, or QDA strategies..."
              className="min-h-[80px] resize-none"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              This assistant is specialized for QDA and this tool only. Press Enter
              to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
