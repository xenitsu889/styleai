import React from "react";
import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Sparkles,
  Crown,
  Menu,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { ensureUserId, sendChat, generateOutfitImage } from "../services/api";
import { ScrollArea } from "./ui/scroll-area";

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatbotProps {
  onNavigate: (page: string) => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onCreateSession: () => void;
  onSwitchSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, messages: Message[]) => void;
  userRegion?: string | undefined;
  isLoadingChats?: boolean;
}

export function AIChatbot({
  onNavigate,
  chatSessions,
  currentSessionId,
  onCreateSession,
  onSwitchSession,
  onDeleteSession,
  onUpdateSession,
  userRegion,
  isLoadingChats = false,
}: AIChatbotProps) {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current session
  const currentSession = chatSessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const userId = ensureUserId();

  const handleSend = async () => {
    if (!inputValue.trim() || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    onUpdateSession(currentSessionId, updatedMessages);
    setInputValue("");
    setIsTyping(true);

    try {
      // Persist this message to the backend chat session so it survives refresh.
      const result = await sendChat(userId, userMessage.text, {
        chatId: currentSessionId,
      });
      const replyText =
        result?.reply ||
        result?.explain ||
        "Hmm, I could not generate a reply right now.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "ai",
        timestamp: new Date(),
      };
      onUpdateSession(currentSessionId, [...updatedMessages, aiMessage]);

      // Optional: kick off outfit image generation if prompt is present (no UI here yet)
      if (result?.image_prompt) {
        try {
          await generateOutfitImage(userId, result.image_prompt);
        } catch {
          // silently ignore image errors in chat UI
        }
      }
    } catch (e: any) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Server error. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      };
      onUpdateSession(currentSessionId, [...updatedMessages, aiMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    onCreateSession();
    setShowSidebar(false);
  };

  const handleSelectSession = (sessionId: string) => {
    onSwitchSession(sessionId);
    setShowSidebar(false);
  };

  const mapRegionToTimeZone = (region?: string) => {
    if (!region) return undefined;
    const r = region.toLowerCase();
    // Minimal mapping - extend as needed
    if (r.includes("india") || r === "in") return "Asia/Kolkata";
    if (r.includes("us") || r.includes("united states") || r === "usa")
      return "America/New_York";
    if (r.includes("uk") || r.includes("united kingdom") || r === "gb")
      return "Europe/London";
    return undefined;
  };

  const formatDate = (date: Date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const now = new Date();

    // helper: local midnight for a date
    const startOfDay = (dt: Date) =>
      new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;

    const daysDiff = Math.floor(
      (startOfDay(now).getTime() - startOfDay(d).getTime()) / msPerDay
    );

    const tz = mapRegionToTimeZone(userRegion);

    const timeStr = tz
      ? new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        }).format(d)
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (daysDiff === 0) {
      return `Today, ${timeStr}`;
    }
    if (daysDiff === 1) {
      return `Yesterday, ${timeStr}`;
    }

    // For older dates show full date + time
    const dateStr = tz
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "short",
          timeStyle: "short",
          timeZone: tz,
        }).format(d)
      : `${d.toLocaleDateString()}, ${timeStr}`;
    return `${dateStr}`;
  };

  return (
    <div className="pb-24 min-h-screen bg-stone-50 flex flex-col relative">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-slate-900 z-50 transform transition-transform duration-300 ${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white">Chat History</h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <Button
              onClick={handleNewChat}
              className="w-full bg-gradient-to-r from-slate-700 to-amber-800 hover:opacity-90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Chat Sessions List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {chatSessions.length === 0 ? (
                <div className="text-center text-slate-400 py-8 px-4">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No chat history yet</p>
                  <p className="text-xs mt-1">Start a new conversation!</p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                      session.id === currentSessionId
                        ? "bg-slate-800"
                        : "hover:bg-slate-800/50"
                    }`}
                    onClick={() => handleSelectSession(session.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                          <h3 className="text-white text-sm truncate">
                            {session.title}
                          </h3>
                        </div>
                        <p
                          className="text-slate-400 text-xs"
                          title={new Date(session.updatedAt).toISOString()}
                        >
                          {formatDate(session.updatedAt)} •{" "}
                          {session.messages.length} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this chat?")) {
                            onDeleteSession(session.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
              <p>StylieAI Chat History</p>
              <p className="mt-1">
                {chatSessions.length} of 3 conversations saved
              </p>
              <p className="mt-2 text-slate-500">
                Older chats are auto-deleted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="px-6 py-4 flex items-center gap-3">
          <button onClick={() => setShowSidebar(true)} className="mr-1">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <button onClick={() => onNavigate("dashboard")}>
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-slate-900">AI Fashion Stylist</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-slate-600 text-sm">Online</p>
            </div>
          </div>
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {isLoadingChats ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-200 animate-pulse" />
              <p className="text-slate-600">Loading conversations…</p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  message.sender === "user" ? "order-2" : "order-1"
                }`}
              >
                {message.sender === "ai" && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-amber-800 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-slate-600">AI Stylist</span>
                  </div>
                )}
                <Card
                  className={`p-4 ${
                    message.sender === "user"
                      ? "bg-gradient-to-r from-slate-900 to-amber-900 text-white border-0"
                      : "bg-white border-slate-100"
                  }`}
                >
                  <p
                    className={
                      message.sender === "user"
                        ? "text-white"
                        : "text-slate-800"
                    }
                  >
                    {message.text}
                  </p>
                </Card>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[80%]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-amber-800 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-slate-600">
                  AI Stylist is typing...
                </span>
              </div>
              <Card className="p-4 bg-white border-slate-100">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </Card>
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-amber-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-slate-900 mb-2">Start a New Conversation</h2>
              <p className="text-slate-600 text-sm mb-6">
                Ask me anything about fashion, styling, or your wardrobe!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  "What should I wear today?",
                  "Style tips for formal events",
                  "How to mix patterns?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInputValue(suggestion)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex gap-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything about fashion..."
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-gradient-to-r from-slate-900 to-amber-900 hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {messages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "What should I wear for a date?",
              "Color suggestions?",
              "Interview outfit?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputValue(suggestion)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
