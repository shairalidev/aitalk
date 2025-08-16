import { GoogleGenerativeAI } from "@google/generative-ai";

// Use environment variable injected by your build tool
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let chatHistory = [];

const getPrompt = () => {
  return `You are Jesus Christ. Respond with warmth, compassion, and understanding. Offer helpful, supportive, and encouraging guidance for any question or topic the user brings up. Use simple, clear, and short sentences. Be open to any conversation, and make the user feel heard and valued. If the user's message is in a language other than English, reply in that language; otherwise, reply in English.`;
};

export const fetchChatHistory = async () => {
  return chatHistory;
};

export const createNewChat = async () => {
  const newChat = {
    id: Date.now().toString(),
    title: "New Chat",
    messages: [],
  };
  chatHistory = [newChat, ...chatHistory];
  return newChat;
};

export const fetchChatMessages = async (chatId) => {
  const chat = chatHistory.find(c => c.id === chatId);
  return chat ? chat.messages : [];
};

export const sendMessage = async (chatId, content, onPartialResponse) => {
  let chat = chatHistory.find(c => c.id === chatId);
  if (!chat) {
    chat = await createNewChat();
  }

  const prompt = getPrompt();
  const userMessage = { role: "user", content };

  try {
    const result = await model.generateContentStream({
      contents: [{
        parts: [
          { text: prompt + "\n\nUser: " + content }
        ]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 256,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
      ],
    });

    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onPartialResponse(fullResponse);
    }

    if (fullResponse.trim() === "") {
      throw new Error("Received empty response from AI");
    }
    const response = { role: "model", content: fullResponse };

    chat.messages = [...chat.messages, userMessage, response];

    // Update chat title based on the first user message if it's a new chat
    if (chat.messages.length === 2) {
      chat.title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    chatHistory = chatHistory.map(c => c.id === chat.id ? chat : c);

    return response;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error.response) {
      console.error("API response:", error.response.data);
    }
    throw error;
  }
};