import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { 
  toggleAgentChat, 
  addUserMessage, 
  fetchChatHistory, 
  clearPersistedChat, 
  addAssistantMessagePlaceholder, 
  updateLastAssistantMessage, 
  setLoading 
} from "../../features/agent/agentSlice";
import ReactMarkdown from "react-markdown";
import { getAccessToken } from "../../services/api";

const sanitizeMarkdown = (text) => {
  if (!text) return "";
  return text
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<[\s\S]*?on\w+\s*=\s*['"][\s\S]*?['"][^>]*>/gi, "")
    .replace(/<a\s+[^>]*href\s*=\s*['"]javascript:[\s\S]*?['"][^>]*>/gi, "")
    .replace(/<\/?(html|body|head|meta|link|object|embed|form|input|button|textarea|select|option)[^>]*>/gi, "");
};

const FloatingAgent = () => {
  const dispatch = useDispatch();
  const { chatHistory, isLoading, isOpen } = useSelector((state) => state.agent);
  const [input, setInput] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch persistent conversation history when widget is opened
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchChatHistory());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [chatHistory, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");

    // 1. Instantly append User's message to UI
    dispatch(addUserMessage(userMsg));
    dispatch(setLoading(true));

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://medicare-healthcare-app.onrender.com/api/v1';
      const token = getAccessToken();
      const headers = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiUrl}/agent/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message: userMsg }),
        credentials: "include", // Automatically send HttpOnly accessToken cookie
      });

      if (!response.ok) {
        throw new Error("Failed to connect to assistant.");
      }

      // 2. Append placeholder Assistant message bubble
      dispatch(addAssistantMessagePlaceholder());

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = "";

      // 3. Stream generated text chunks dynamically
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") {
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  dispatch(updateLastAssistantMessage(accumulatedText));
                } else if (parsed.error) {
                  dispatch(updateLastAssistantMessage(`⚠️ System Error: ${parsed.error}`));
                }
              } catch {
                // Ignore chunk parsing anomalies
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("SSE stream error", error);
      dispatch(addAssistantMessagePlaceholder());
      dispatch(updateLastAssistantMessage(`⚠️ System Error: ${error.message}. Please check connection.`));
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => dispatch(toggleAgentChat())}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 transition-all z-50 group flex items-center justify-center animate-bounce duration-1000"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-50 border border-gray-100 dark:border-slate-800 animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-linear-to-r from-indigo-600 to-blue-600 p-4 flex justify-between items-center text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide">MediBot Assistant</h3>
            <p className="text-xs text-indigo-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {showConfirmClear ? (
            <div className="flex items-center gap-1 bg-red-700/40 rounded-lg p-1 animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[10px] text-red-200 font-semibold px-1">Clear history?</span>
              <button
                onClick={() => {
                  dispatch(clearPersistedChat());
                  setShowConfirmClear(false);
                }}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] cursor-pointer"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded text-[10px] cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmClear(true)}
              title="Clear Chat History"
              className="p-2 hover:bg-white/20 rounded-full transition-colors mr-1 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          )}
          <button 
            onClick={() => dispatch(toggleAgentChat())}
            className="p-2 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/50 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 leading-normal flex items-start gap-2 shrink-0">
        <span className="font-bold shrink-0 mt-0.5">⚠️ Disclaimer:</span>
        <span>MediBot is an AI assistant, not a doctor. For life-threatening emergencies, contact local emergency services immediately.</span>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50">
        {chatHistory.map((msg, index) => (
          <div 
            key={index} 
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            {/* Message Bubble */}
            <div 
              className={`max-w-[75%] px-4 py-3 text-sm rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-sm shadow-sm'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed max-w-none">
                <ReactMarkdown>
                  {sanitizeMarkdown(msg.text)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && chatHistory[chatHistory.length - 1]?.role !== 'assistant' && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 dark:border-slate-700">
              <div className="flex gap-1 items-center h-5">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shrink-0">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="E.g. Book an eye doctor for tomorrow..."
            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-xl pl-4 pr-12 py-3.5 text-sm outline-none ring-0 placeholder:text-gray-400 dark:text-white"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer"
          >
            {isLoading && chatHistory[chatHistory.length - 1]?.role !== 'assistant' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        <p className="text-[10px] text-center text-gray-400 mt-2">MediBot may make mistakes. Always verify appointments.</p>
      </div>
    </div>
  );
};

export default FloatingAgent;
