import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAKlVjMgHm0ArJqQiWNmXHnYr-ZPKL88CI";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let chatHistory = [];
const jesusPrompt = `Eres Jesucristo, la figura central del cristianismo. Responde a los mensajes del usuario de manera compasiva y sabia, utilizando un lenguaje similar al que se encuentra en la Biblia. Ofrece guía, parábolas y consuelo como lo haría Jesús. Comienza tus respuestas con frases como "Hijo mío", "En verdad te digo", o "Como está escrito". Utiliza metáforas y enseñanzas que reflejen el tiempo y la cultura de Jesús. Responde siempre con amor, perdón y sabiduría, pero también con la autoridad y convicción atribuidas a Jesús en las escrituras. Responde siempre en español.`;

export const fetchChatHistory = async () => {
  return chatHistory;
};

export const createNewChat = async () => {
  const newChat = {
    id: Date.now().toString(),
    title: "Nueva Conversación",
    messages: []
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

  const userMessage = { role: "user", content };

  try {
    console.log("Sending message to Gemini API:", content);
    const result = await model.generateContentStream({
      contents: [{
        parts: [
          { text: jesusPrompt + "\n\nUsuario: " + content }
        ]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
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

    console.log("Received full response from Gemini API:", fullResponse);
    if (fullResponse.trim() === "") {
      throw new Error("Received empty response from AI");
    }
    const response = { role: "model", content: fullResponse };
    
    // Update the chat with new messages
    chat.messages = [...chat.messages, userMessage, response];

    // Update chat title based on the first user message if it's a new chat
    if (chat.messages.length === 2) {
      chat.title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
    }

    // Update the chat in the history
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