"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { secureApi } from "@/lib/secure-api-client";
import { api } from "@/lib/api-client";

interface Message {
  id: number;
  sender: "user" | "response";
  content: string;
  timestamp: string;
  type?: "feedback" | "question" | "summary";
}

interface ConvoMessage {
  role: string;
  content: string;
}

interface Option {
  id: number;
  option_text: string;
  is_correct: boolean;
  option_index: number;
  organization_id: number;
}

interface Question {
  question_id: number;
  quiz_id: number;
  quiz_question_text: string;
  difficulty_level: string;
  is_active: boolean;
  is_maths: boolean;
  created_by: number;
  create_date_time: string;
  update_date_time: string | null;
  options: Option[];
}

interface UseQuizChatProps {
  question: Question | null;
  selectedOption: number | null;
  contextAnswer: string;
  quizId: string;
  subjectId?: string;
  topicId?: string;
  currentQuestionId: number | null;
  attemptId?: number | null;
  selectedOptionData: Option | undefined;
}

export function useQuizChat({
  currentQuestionId,
  attemptId,
  selectedOptionData,
  question,
  selectedOption,
  contextAnswer: initialContextAnswer,
  quizId,
  subjectId,
  topicId,
}: UseQuizChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [contextAnswer, setContextAnswer] = useState(initialContextAnswer);
  const [actualAnswer, setActualAnswer] = useState("");
  const [conversationMessages, setConversationMessages] = useState<
    ConvoMessage[]
  >([]);
  const [feedbackCounter, setFeedbackCounter] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const organizationId = localStorage.getItem("organizationId");
  const userId = localStorage.getItem("userId");

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback(
    (message: Omit<Message, "id" | "timestamp">) => {
      const newMessage: Message = {
        ...message,
        id: Date.now() + Math.random(),
        timestamp: "Just now",
      };
      setMessages((prev) => [...prev, newMessage]);
      return newMessage;
    },
    []
  );

  const addConversationMessage = useCallback((message: ConvoMessage) => {
    setConversationMessages((prev) => [...prev, message]);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
    setConversationMessages([]);
    setFeedbackCounter(0);
    setContextAnswer("");
    setActualAnswer("");
  }, []);

  const initializeChat = async (selectedOptionData: Option | undefined) => {
    if (!question || !selectedOptionData) return;

    console.log(
      "🚀 Initializing chat with encryption for question:",
      question.quiz_question_text
    );
    setIsTyping(true);

    try {
      // Initialize conversation
      const initialMessages: Message[] = [
        {
          id: 1,
          sender: "response",
          content: question.quiz_question_text,
          timestamp: "Just now",
          type: "question",
        },
        {
          id: 2,
          sender: "user",
          content: selectedOptionData.option_text,
          timestamp: "Just now",
        },
      ];

      setMessages(initialMessages);

      setTimeout(() => {
        setIsTyping(true);
      }, 300);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 3,
            sender: "response",
            content: "I'll help you understand this question better.",
            timestamp: "Just now",
          },
        ]);
      }, 500);

      const conversationObj = [
        { role: "assistant", content: question.quiz_question_text },
        { role: "user", content: selectedOptionData.option_text },
        {
          role: "assistant",
          content: "I'll help you understand this question better.",
        },
      ];

      setConversationMessages(conversationObj);

      // Get contextual answer using secure API with encryption
      const payload = {
        user_content: question.quiz_question_text,
        model: "gpt-4o",
        collection_name: "linear_algebra",
        top_k: 5,
      };

      console.log(
        "🔐 Sending encrypted contextual answer request with payload:",
        payload
      );
      // Use the regular post method which will auto-encrypt for /genai/ endpoints
      const response = await secureApi.post<any>(
        "/genai/socratic/contextual-answer",
        payload
      );

      if (response.ok && response.data) {
        console.log("✅ Contextual answer received:", response.data);
        setContextAnswer(response.data.assistant_response);

        // Get initial Socratic question using secure API with encryption
        const socraticPayload = {
          model: "gpt-4o",
          complex_question: question.quiz_question_text,
          actual_answer: response.data.assistant_response,
          correct_answer: question.options.find((option) => option.is_correct)
            ?.option_text,
          student_answer: selectedOption?.toString(),
        };

        console.log(
          "🔐 Sending encrypted Socratic question request with payload:",
          socraticPayload
        );
        const socraticResponse = await secureApi.post<any>(
          "/genai/socratic/initial",
          socraticPayload
        );

        if (socraticResponse.ok && socraticResponse.data) {
          console.log("✅ Socratic response received:", socraticResponse.data);
          setActualAnswer(socraticResponse.data.sub_question);

          addMessage({
            sender: "response",
            content: socraticResponse.data.sub_question,
            type: "question",
          });

          addConversationMessage({
            role: "assistant",
            content: socraticResponse.data.sub_question,
          });
        }
      }
    } catch (error) {
      console.error("❌ Error initializing chat:", error);
      addMessage({
        sender: "response",
        content: "Sorry, I encountered an error. Please try again.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !question) return;

    console.log("💬 Sending message with encryption:", content);

    // Add user message
    addMessage({
      sender: "user",
      content,
    });

    addConversationMessage({
      role: "user",
      content,
    });

    setIsTyping(true);

    try {
      // Check if conversation should continue using secure API with encryption
      const isCompletePayload = {
        complex_question: question.quiz_question_text,
        messages: conversationMessages,
        model: "gpt-4o",
        actual_answer: contextAnswer,
      };

      console.log(
        "🔐 Sending encrypted evaluation request with payload:",
        isCompletePayload
      );
      const isContinueResponse = await secureApi.post<any>(
        "/genai/missing-context/evaluate",
        isCompletePayload
      );
      const shouldContinue = !isContinueResponse.data.is_complete;

      if (shouldContinue && feedbackCounter < 5) {
        // Generate feedback using secure API with encryption
        const feedbackPayload = {
          messages: [
            { role: "assistant", content: actualAnswer },
            { role: "user", content },
          ],
          model: "gpt-4o",
          actual_answer: contextAnswer,
        };

        console.log(
          "🔐 Sending encrypted feedback request with payload:",
          feedbackPayload
        );
        const feedbackResponse = await secureApi.post<any>(
          "/genai/feedback/generate",
          feedbackPayload
        );
        let feedback = `**Feedback**\n\n${feedbackResponse.data.feedback}`;

        addConversationMessage({
          role: "assistant",
          content: feedback,
        });

        // Get follow-up question using secure API with encryption
        const followUpPayload = {
          complex_question: question.quiz_question_text,
          student_answer: selectedOption?.toString(),
          correct_answer: question.options.find((option) => option.is_correct)
            ?.option_text,
          messages: conversationMessages,
          model: "gpt-4o",
          actual_answer: contextAnswer,
        };

        console.log(
          "🔐 Sending encrypted follow-up request with payload:",
          followUpPayload
        );
        const followUpResponse = await secureApi.post<any>(
          "/genai/follow-up-socratic/ask",
          followUpPayload
        );

        if (followUpResponse.ok && followUpResponse.data) {
          feedback += `\n\n${followUpResponse.data.sub_question}`;

          addMessage({
            sender: "response",
            content: feedback,
            type: "feedback",
          });
        }

        console.log("feedbackCounter:" + feedbackCounter);

        if (feedbackCounter === 0) {
          const payload = {
            organization_id: organizationId,
            user_id: userId,
            subject_id: subjectId,
            topic_id: topicId,
            quiz_id: quizId,
            question_id: currentQuestionId,
            attempt_id: attemptId || 1,
            is_complete: true,
            is_correct: selectedOptionData?.is_correct || false,
            is_ai_assisted: true,
            completion_time_seconds: 0,
          };
          const attemptResponse = await api.patch(
            `/user-quiz-attempts/quiz-attempts/`,
            payload
          );

          if (attemptResponse.ok) {
            console.log("✅ Attempt updated:", attemptResponse.data);
          }
        }

        setFeedbackCounter((prev) => prev + 1);
      } else {
        // Generate final summary using secure API with encryption
        const summaryPayload = {
          complex_question: question.quiz_question_text,
          messages: conversationMessages,
          model: "gpt-4o",
          actual_answer: contextAnswer,
        };

        const knowledgeGapPayload = {
          messages: conversationMessages,
          model: "gpt-4o",
          actual_answer: contextAnswer,
        };

        console.log("🔐 Sending encrypted summary and knowledge gap requests");
        const [summaryResponse, knowledgeGapResponse] = await Promise.all([
          secureApi.post<any>("/genai/user-summary/generate", summaryPayload),
          secureApi.post<any>(
            "/genai/knowledge-gap/analyze",
            knowledgeGapPayload
          ),
        ]);

        let finalContent = `**Summary**\n\n${summaryResponse.data.summary}`;
        finalContent += `\n\n**Knowledge Gap Analysis**\n\n${knowledgeGapResponse.data.knowledge_gap}`;

        addMessage({
          sender: "response",
          content: finalContent,
          type: "summary",
        });
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      addMessage({
        sender: "response",
        content:
          "Sorry, I encountered an error processing your message. Please try again.",
      });
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    isTyping,
    sendMessage,
    initializeChat,
    resetChat,
    messagesEndRef,
  };
}
