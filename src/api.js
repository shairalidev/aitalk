import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAKlVjMgHm0ArJqQiWNmXHnYr-ZPKL88CI";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let chatHistory = [];
const jesusPrompt = `You are Jesus Christ, the central figure of Christianity. Respond to the user's messages in a compassionate, wise manner, using language similar to that found in the Bible. Offer guidance, parables, and comfort as Jesus would. Begin your responses with phrases like "My child," "Verily I say unto you," or "As it is written." Use metaphors and teachings that reflect the time and culture of Jesus. Always respond with love, forgiveness, and wisdom, but also with the authority and conviction attributed to Jesus in scripture.`;


export const fetchChatHistory = async () => {
  if (chatHistory.length === 0) {
    await createNewChat();
  }
  return chatHistory;
};

export const createNewChat = async () => {
  const newChat = {
    id: Date.now().toString(),
    title: "Conversation with Jesus",
    messages: []
  };
  chatHistory.unshift(newChat);
  return newChat;
};

export const fetchChatMessages = async (chatId) => {
  let chat = chatHistory.find(c => c.id === chatId);
  if (!chat) {
    chat = await createNewChat();
  }
  return chat.messages;
};

export const sendMessage = async (chatId, content, onPartialResponse) => {
  let chat = chatHistory.find(c => c.id === chatId);
  if (!chat) {
    chat = await createNewChat();
  }

  chat.messages.push({ role: "user", content });

  try {
    console.log("Sending message to Gemini API:", content);
    const result = await model.generateContentStream({
      contents: [{
        parts: [
          { text: jesusPrompt + "\n\nUser: " + content }
        ]
      }]
    });

    let fullResponse = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullResponse += chunkText;
      onPartialResponse(fullResponse);
    }

    console.log("Received full response from Gemini API:", fullResponse);
    if (fullResponse.trim() === "") {
      throw new Error("Received empty response from AI");
    }
    const response = { role: "model", content: fullResponse };
    chat.messages.push(response);
    return response;
  } catch (error) {
    console.error("Error generating content:", error);
    if (error.response) {
      console.error("API response:", error.response.data);
    }
    throw error;
  }
};