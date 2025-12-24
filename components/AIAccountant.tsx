"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "./ui/button";
import { Bot, User, X, TrendingUp, ArrowDown, ArrowUp, Sparkles, Send, Mic, Globe, MessageSquare, Zap } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import ListeningIndicator from "@/components/ai/ListeningIndicator";
import GeminiShimmerEffect from "@/components/ai/GeminiShimmerEffect";
import Toast from "@/components/ai/Toast";
import INGRESCommandBar from "@/components/ai/CommandBar";
import { MemoizedStatCard } from "@/components/ai/StatCard";
import AnimatedMarkdownMessage from "@/components/ai/AnimatedMarkdownMessage";
import HydrogeologicalAnalysisChart from "@/components/ai/HydrogeologicalAnalysisChart";

type ChatMessage = {
  id: number;
  type: string;
  text?: string;
  component?: React.ReactNode;
};

// Premium Stat Card Component
const PremiumStatCard = ({ stat, delay = 0 }: { stat: any; delay?: number }) => {
  const Icon = stat.icon;
  const isPositive = stat.change.startsWith('+');
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group relative"
    >
      {/* Glow Effect */}
      <div className={`absolute -inset-0.5 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${
        isPositive ? 'bg-green-500/30' : 'bg-red-500/30'
      }`} />
      
      {/* Card */}
      <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 transition-all duration-500 group-hover:border-white/[0.15] group-hover:bg-white/[0.06]">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-zinc-400 text-sm font-medium">{stat.title}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {stat.title.includes('Customer') ? stat.value.toLocaleString() : `₹${stat.value.toLocaleString()}`}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${
            isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}>
            <Icon className={`w-5 h-5 ${stat.iconColor}`} />
          </div>
        </div>
        <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
          isPositive 
            ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {stat.change} vs last period
        </div>
      </div>
    </motion.div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ title, description, icon: Icon, onClick, delay = 0 }: any) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="group relative text-left w-full"
  >
    {/* Glow */}
    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
    
    {/* Card */}
    <div className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl transition-all duration-300 group-hover:border-blue-500/30 group-hover:bg-white/[0.06]">
      <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors">{title}</h4>
        <p className="text-zinc-500 text-xs truncate">{description}</p>
      </div>
      <div className="text-zinc-600 group-hover:text-blue-400 transition-colors">
        <Send className="w-4 h-4 rotate-45" />
      </div>
    </div>
  </motion.button>
);

// --- Main INGRES Assistant Component ---
const AIAccountant = ({ embedded = false }: { embedded?: boolean }) => {
  const [view, setView] = useState("dashboard");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const handleFakeMapAnalysis = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setView("chat");

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: "user",
      text: `Analyzing map: ${file.name}`,
    };

    setChatHistory((previousChatHistory) => [
      ...previousChatHistory,
      userMessage,
    ]);

    setIsThinking(true);

    setTimeout(() => {
      const graphMessage: ChatMessage = {
        id: Date.now() + 1,
        type: "bot",
        component: <HydrogeologicalAnalysisChart />,
      };

      setChatHistory((previousChatHistory) => [
        ...previousChatHistory,
        graphMessage,
      ]);
      setIsThinking(false);
    }, 4000);

    if (event.target) {
      event.target.value = "";
    }
  };
  const [isThinking, setIsThinking] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeYear, setActiveYear] = useState("Latest (2025)");
  const [language, setLanguage] = useState("en-US");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    visible: false,
  });

  const [isCoPilotMode, setIsCoPilotMode] = useState(false);
  const [isListeningForFollowUp, setIsListeningForFollowUp] = useState(false);
  const [showListeningIndicator, setShowListeningIndicator] = useState(false);

  const {
    text: voiceText,
    startListening,
    stopListening,
    isListening,
    hasRecognitionSupport,
  } = useSpeechRecognition({ lang: language });

  const speakText = (text: string, onEnd?: () => void) => {
    if (!isCoPilotMode) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice;
    if (language.startsWith("en")) {
      const preferredVoiceNames = [
        "Google UK English Female",
        "Microsoft Aria Online (Natural)",
        "Microsoft Libby Online (Natural)",
        "Apple Samantha",
        "Apple Moira",
        "Daniel",
        "Samantha",
        "Karen",
        "Google US English",
        "Alex",
      ];
      for (const voiceName of preferredVoiceNames) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }
      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            (voice.name.toLowerCase().includes("natural") ||
              voice.name.toLowerCase().includes("premium") ||
              voice.name.toLowerCase().includes("enhanced")) &&
            voice.lang.startsWith("en")
        );
      }
    } else if (language.startsWith("hi")) {
      const preferredHindiVoices = [
        "Google हिन्दी",
        "Microsoft Swara Online (Natural)",
        "Lekha",
      ];
      for (const voiceName of preferredHindiVoices) {
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          selectedVoice = voice;
          break;
        }
      }
    }
    if (!selectedVoice) {
      selectedVoice = voices.find((voice) =>
        voice.lang.startsWith(language.split("-")[0])
      );
    }
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = 0.92;
    utterance.pitch = 1.0;
    text = text.replace(/([.,!?;:])/g, "$1 ");
    text = text.replace(/\n\n/g, ".\n\n");
    text = text.replace(
      /\b(critical|severe|important|significant|Over-Exploited|Critical|Safe)\b/g,
      " $1 "
    );
    text = text.replace(/(\d+)%/g, "$1 percent");
    text = text.replace(/(\d+)\.(\d+)/g, "$1 point $2");
    text = text.replace(/(\d{4})-(\d{4})/g, "$1 to $2");
    const sentences = text.split(/(?<=[.!?])\s+/);
    const processedSentences = sentences.map((sentence, index) => {
      if (index > 0 && index % 10 === 0) {
        const fillers = [
          "Now, ",
          "So, ",
          "Well, ",
          "You see, ",
          "Actually, ",
          "Essentially, ",
        ];
        const randomFiller =
          fillers[Math.floor(Math.random() * fillers.length)];
        return randomFiller + sentence;
      }
      return sentence;
    });
    utterance.text = processedSentences.join(" ");
    if (onEnd) {
      utterance.onend = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => {
        window.speechSynthesis.getVoices();
      };
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
        loadVoices();
        return () => {
          window.speechSynthesis.removeEventListener(
            "voiceschanged",
            loadVoices
          );
        };
      }
    }
  }, []);

  useEffect(() => {
    if (voiceText) setInputValue(voiceText);
  }, [voiceText]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setShowListeningIndicator(false);
      setIsListeningForFollowUp(false);
      if (isCoPilotMode && voiceText) {
        setInputValue(voiceText);
        setTimeout(() => {
          handleChatSubmit(voiceText);
        }, 300);
      }
    } else {
      if (isCoPilotMode) {
        speakText(
          "I'm listening now. How can I assist with your financial data analysis?",
          () => {
            startListening();
            setShowListeningIndicator(true);
          }
        );
      } else {
        startListening();
        setShowListeningIndicator(true);
      }
    }
  };
  const handleLanguageChange = () =>
    setLanguage((prev) => (prev === "en-US" ? "hi-IN" : "en-US"));

  useEffect(() => {
    if (chatContainerRef.current)
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
  }, [chatHistory, isThinking]);

  useEffect(() => {
    if (voiceText) {
      setInputValue(voiceText);
      if (
        isCoPilotMode &&
        isListeningForFollowUp &&
        voiceText.trim().length > 5
      ) {
        stopListening();
        setShowListeningIndicator(false);
        setIsListeningForFollowUp(false);
        handleChatSubmit(voiceText);
      }
    }
  }, [voiceText, isCoPilotMode, isListeningForFollowUp]);

  useEffect(() => {
    if (isCoPilotMode) {
      speakText(
        "Voice assistant activated. I'll provide detailed spoken responses to help you analyze financial data."
      );
    }
  }, [isCoPilotMode]);

  // --- 🔧 THIS ENTIRE FUNCTION IS CORRECTED ---
  const handleChatSubmit = async (text: string) => {
    console.log("handleChatSubmit called with text:", text);
    if (!text.trim()) {
      console.log("Text is empty, returning");
      return;
    }
    setView("chat");
    setChatHistory((prev) => [...prev, { id: Date.now(), type: "user", text }]);
    setInputValue("");
    setIsThinking(true);
    console.log("Chat history updated, thinking started", chatHistory);

    try {
      const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log("API_KEY available:", !!API_KEY);
      
      if (API_KEY) {
        try {
          console.log("Initializing Gemini AI...");
          const genAI = new GoogleGenerativeAI(API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
          const prompt = `You are an AI Data Analyst for CyFuture AI, a comprehensive financial analysis and data management platform. You help users with:

- Financial data analysis and insights
- Transaction analysis and categorization  
- Budget planning and expense tracking
- Investment portfolio analysis
- Risk assessment and financial forecasting
- Data visualization and reporting
- GST calculations and compliance
- Business intelligence and KPI analysis

Respond in a helpful, professional manner with actionable insights. Use Markdown formatting for better readability. If asked about specific data, provide realistic examples and analysis.

User's question: "${text}"`;

          console.log("Sending request to Gemini...");
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const aiResponseText = response.text();
          console.log(
            "Gemini response received:",
            aiResponseText.substring(0, 100) + "..."
          );

          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: aiResponseText,
          };

          setChatHistory((prev) => {
            console.log("Adding AI response to chat history");
            return [...prev, aiResponse];
          });
          setIsThinking(false);

          // Add voice response if Co-Pilot mode is enabled
          if (isCoPilotMode) {
            speakText(aiResponseText, () => {
              if (hasRecognitionSupport) {
                setIsListeningForFollowUp(true);
                setShowListeningIndicator(true);
                startListening();
              }
            });
          }
        } catch (error: any) {
          console.error("Error calling Gemini API:", error);
          
          let errorMessage = "I apologize, but I'm experiencing technical difficulties. ";
          
          // Handle specific quota exceeded error
          if (error?.message?.includes("429") || error?.message?.includes("quota")) {
            errorMessage = "🚨 **API Quota Exceeded**\n\nI've reached the daily limit for the Gemini AI service. This is a temporary limitation of the free tier.\n\n**In the meantime, I can still help you with:**\n- General financial advice and best practices\n- Explaining financial concepts\n- Providing sample analyses and reports\n- Guidance on data organization\n\n**Fallback Response for your query:**\n\n";
            
            // Provide intelligent fallback responses based on keywords
            const lowerText = text.toLowerCase();
            if (lowerText.includes("revenue") || lowerText.includes("income")) {
              errorMessage += "📊 **Revenue Analysis**\n\nBased on your query about revenue, here are key insights to consider:\n\n- **Trend Analysis**: Look for seasonal patterns in your revenue data\n- **Growth Rate**: Calculate month-over-month and year-over-year growth\n- **Revenue Sources**: Identify your top revenue streams and their contribution percentages\n- **Forecasting**: Use historical data to project future revenue trends\n\nFor detailed analysis, please try again later when the API quota resets.";
            } else if (lowerText.includes("expense") || lowerText.includes("cost")) {
              errorMessage += "💰 **Expense Analysis**\n\nFor expense-related queries, consider these approaches:\n\n- **Categorization**: Group expenses into fixed vs. variable costs\n- **Budget Variance**: Compare actual vs. budgeted expenses\n- **Cost Optimization**: Identify areas where costs can be reduced\n- **ROI Analysis**: Evaluate which expenses generate the best returns\n\nI can provide more specific guidance once the API service is available again.";
            } else if (lowerText.includes("forecast") || lowerText.includes("predict")) {
              errorMessage += "🔮 **Financial Forecasting**\n\nFor forecasting and predictions:\n\n- **Historical Trends**: Analyze past 12-24 months of data\n- **Seasonal Adjustments**: Account for recurring seasonal patterns\n- **Market Conditions**: Consider external economic factors\n- **Multiple Scenarios**: Create best-case, worst-case, and realistic projections\n\nOnce the AI service is restored, I can provide detailed predictive models.";
            } else {
              errorMessage += "🤖 **General Financial Guidance**\n\nWhile I wait for the AI service to restore, here are some general best practices:\n\n- **Data Quality**: Ensure your financial data is accurate and up-to-date\n- **Regular Reviews**: Conduct monthly financial reviews\n- **Key Metrics**: Monitor cash flow, profit margins, and growth rates\n- **Documentation**: Maintain detailed records for all transactions\n\nPlease try your question again in about an hour when the quota resets.";
            }
          } else if (error?.message?.includes("network") || error?.message?.includes("fetch")) {
            errorMessage = "🌐 **Network Connection Issue**\n\nI'm having trouble connecting to the AI service. This could be due to:\n- Network connectivity issues\n- Temporary server maintenance\n- Firewall restrictions\n\nPlease check your internet connection and try again in a few moments.";
          } else {
            errorMessage = "⚠️ **Technical Difficulty**\n\nI encountered an unexpected error while processing your request. This could be due to:\n- API service maintenance\n- Rate limiting\n- Configuration issues\n\nPlease try rephrasing your question or contact support if the issue persists.";
          }

          const aiResponse = {
            id: Date.now() + 1,
            type: "ai",
            text: errorMessage,
          };

          setChatHistory((prev) => [...prev, aiResponse]);
          setIsThinking(false);
          
          // Show a toast notification for the error
          setToast({
            message: "AI service temporarily unavailable. Using fallback response.",
            type: "warning",
            visible: true
          });
          
          // Auto-dismiss toast after 5 seconds
          setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
          }, 5000);
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const aiResponse = {
          id: Date.now() + 1,
          type: "ai",
          text: "🔧 **Setup Required**\n\nI'm ready to help with your financial analysis! However, the AI service is not fully configured.\n\n**To enable full AI functionality:**\n1. Set up a Gemini API key in your environment variables\n2. Add `NEXT_PUBLIC_GEMINI_API_KEY` to your `.env.local` file\n3. Restart your development server\n\n**In the meantime, I can provide:**\n- General financial guidance\n- Best practices for data analysis\n- Sample reports and templates\n- Financial planning frameworks\n\nContact your administrator for API setup assistance.",
        };

        setChatHistory((prev) => [...prev, aiResponse]);
        setIsThinking(false);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const errorResponse = {
        id: Date.now() + 1,
        type: "ai",
        text: "❌ **Unexpected Error**\n\nI encountered an unexpected error while processing your request. This is likely a temporary issue.\n\n**Please try:**\n- Refreshing the page\n- Rephrasing your question\n- Checking your internet connection\n\nIf the problem persists, please contact technical support with the error details.",
      };

      setChatHistory((prev) => [...prev, errorResponse]);
      setIsThinking(false);
      
      setToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
        visible: true
      });
      
      setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 5000);
    }
  };

  const iconMap: { [key: string]: React.ElementType } = {
    TrendingUp,
    ArrowDown,
    ArrowUp,
    User,
  };

  const stats = useMemo(
    () => [
      {
        title: "Total Revenue",
        value: 660000,
        icon: iconMap["TrendingUp"],
        iconColor: "text-green-400",
        change: "+5.2%",
      },
      {
        title: "Total Expenses",
        value: 150000,
        icon: iconMap["ArrowDown"],
        iconColor: "text-red-400",
        change: "+2.1%",
      },
      {
        title: "Net Profit",
        value: 510000,
        icon: iconMap["ArrowUp"],
        iconColor: "text-emerald-400",
        change: "+6.8%",
      },
      {
        title: "New Customers",
        value: 3461,
        icon: iconMap["User"],
        iconColor: "text-blue-400",
        change: "+0.5%",
      },
    ],
    []
  );

  const commonCommandBarProps = {
    inputValue,
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setInputValue(e.target.value),
    onSubmit: () => handleChatSubmit(inputValue),
    isListening,
    onMicClick: handleMicClick,
    hasSpeechSupport: hasRecognitionSupport,
    language,
    onLanguageChange: handleLanguageChange,
    activeYear: activeYear,
    onYearChange: setActiveYear,
    isCoPilotMode,
    onCoPilotModeChange: setIsCoPilotMode,
    showListeningIndicator,
    isListeningForFollowUp,
  };

  const suggestedPrompts = [
    {
      title: "Revenue Analysis",
      text: "Show the revenue for the last quarter",
      description: "Get detailed revenue breakdown",
      icon: TrendingUp,
    },
    {
      title: "Expense Report",
      text: "List all top expenses in the last month",
      description: "Track spending patterns",
      icon: ArrowDown,
    },
    {
      title: "Quarter Comparison",
      text: "Compare revenue in Q1 and Q2 over the last 5 years.",
      description: "Historical trend analysis",
      icon: Zap,
    },
    {
      title: "AI Recommendations",
      text: "What can we do to reduce expenses in marketing?",
      description: "Get actionable insights",
      icon: Sparkles,
    },
  ];

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#0a0b0e] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-600/20 via-blue-500/10 to-transparent blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-cyan-500/15 via-blue-400/10 to-transparent blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className={`relative container mx-auto px-4 py-8 ${embedded ? "" : "pt-16"}`}>
        {/* Header */}
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Powered by AI</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Your Intelligent{" "}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 text-transparent bg-clip-text">
              Command Center
            </span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">
            Transform your financial data into actionable insights with AI-powered analytics
          </p>
        </motion.div>

        {/* Premium Command Bar */}
        <motion.div
          className="max-w-3xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 via-cyan-500/20 to-blue-500/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
            
            {/* Command Bar Container */}
            <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-4 transition-all duration-300 group-hover:border-white/[0.12]">
              <INGRESCommandBar
                {...commonCommandBarProps}
                onFileSelect={handleFakeMapAnalysis}
              />
            </div>
          </div>
        </motion.div>

        {/* Quick Start Button */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            onClick={() => setView("chat")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white overflow-hidden group"
          >
            {/* Button Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 rounded-xl blur opacity-60 group-hover:opacity-80 transition-opacity" />
            
            {/* Button Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-xl" />
            
            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </div>
            
            <MessageSquare className="relative w-5 h-5" />
            <span className="relative">Start Chat Session</span>
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <div className="max-w-5xl mx-auto mb-16">
          <motion.h2 
            className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Financial Overview
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <PremiumStatCard key={stat.title} stat={stat} delay={0.5 + index * 0.1} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-3xl mx-auto">
          <motion.h2 
            className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Quick Actions
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestedPrompts.map((prompt, index) => (
              <QuickActionButton
                key={prompt.title}
                title={prompt.title}
                description={prompt.description}
                icon={prompt.icon}
                onClick={() => handleChatSubmit(prompt.text)}
                delay={0.8 + index * 0.1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatView = () => (
    <div className="min-h-screen bg-[#0a0b0e] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-600/15 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-cyan-500/10 to-transparent blur-3xl" />
      </div>

      <div className="relative h-screen flex flex-col max-w-4xl mx-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between py-4 border-b border-white/[0.06]"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-50" />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">AI Data Analyst</h1>
              <p className="text-xs text-zinc-500">Powered by Gemini</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setView("dashboard");
              setChatHistory([]);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">End Chat</span>
          </motion.button>
        </motion.div>

        {/* Chat Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
        >
          {chatHistory.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 mb-6">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">How can I help you today?</h3>
              <p className="text-zinc-500 mb-8">Ask me anything about your financial data</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                {suggestedPrompts.slice(0, 4).map((prompt, index) => (
                  <motion.button
                    key={prompt.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onClick={() => handleChatSubmit(prompt.text)}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <prompt.icon className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">{prompt.title}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{prompt.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {chatHistory.map((msg) => {
              const isUser = msg.type === "user";
              const isGraphMessage = !!msg.component;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${isUser ? "order-1" : ""}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isUser 
                        ? "bg-gradient-to-br from-zinc-600 to-zinc-700" 
                        : "bg-gradient-to-br from-blue-500 to-cyan-500"
                    }`}>
                      {isUser ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className={`max-w-2xl ${isGraphMessage ? "w-full" : ""}`}>
                    {isUser ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-md bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20">
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ) : msg.component ? (
                      <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
                        {msg.component}
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.08] backdrop-blur-lg text-zinc-100 prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-zinc-200 prose-strong:text-white prose-code:text-blue-300 prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-white/5 prose-ul:text-zinc-200 prose-ol:text-zinc-200 prose-li:text-zinc-200">
                        <AnimatedMarkdownMessage text={msg.text || ""} />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {isThinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.05] border border-white/[0.08]">
                  <GeminiShimmerEffect />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-4 border-t border-white/[0.06]"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur opacity-50 group-focus-within:opacity-70 transition-opacity" />
            <div className="relative bg-white/[0.05] border border-white/[0.08] rounded-2xl transition-all group-focus-within:border-blue-500/30">
              <INGRESCommandBar
                {...commonCommandBarProps}
                onFileSelect={handleFakeMapAnalysis}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <AnimatePresence>
        {toast.visible && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast({ ...toast, visible: false })}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showListeningIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <ListeningIndicator />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {view === "dashboard" ? renderDashboard() : renderChatView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AIAccountant;
