
import { GoogleGenAI, GenerateContentResponse, Content, Part } from "@google/genai";
import { Message, Attachment } from '../types';

let ai: GoogleGenAI;
const getAi = () => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }
  return ai;
};

const fileToGenerativePart = (file: Attachment) => {
  return {
    inlineData: {
      data: file.content,
      mimeType: file.mime,
    },
  };
};

export async function* streamChatResponse(
  history: Message[],
  latestMessage: Message,
  webEnabled: boolean,
  thinkingEnabled: boolean,
  temperature: number,
  abortSignal: AbortSignal
): AsyncGenerator<{ text?: string; citations?: any[] }> {
  const genAI = getAi();
  const modelName = thinkingEnabled ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

  // FIX: Correctly map history with attachments. The previous implementation ignored them.
  const contents: Content[] = history.map(msg => {
    const parts: Part[] = [];
    if (msg.content) {
        parts.push({ text: msg.content });
    }
    msg.attachments.forEach(attachment => {
        parts.push(fileToGenerativePart(attachment));
    });
    return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts,
    };
  });

  // FIX: Correctly type and construct parts for the latest message to fix type errors.
  const latestParts: Part[] = [];
  if (latestMessage.content) {
      latestParts.push({ text: latestMessage.content });
  }
  latestMessage.attachments.forEach(attachment => {
    latestParts.push(fileToGenerativePart(attachment));
  });

  contents.push({
    role: 'user',
    parts: latestParts,
  });


  const modelConfig = {
    model: modelName,
    contents: contents,
    config: {
      temperature,
      ...(thinkingEnabled && { thinkingConfig: { thinkingBudget: 32768 } }),
      ...(webEnabled && { tools: [{ googleSearch: {} }] }),
    },
  };

  try {
    const stream = await genAI.models.generateContentStream(modelConfig);
    const abortPromise = new Promise((_, reject) => {
        abortSignal.addEventListener('abort', () => reject(new Error('Aborted')));
    });

    for await (const chunk of stream) {
        if (abortSignal.aborted) {
            console.log("Stream aborted");
            return;
        }
        
        const text = chunk.text;
        const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
        
        const citations = groundingMetadata?.groundingChunks?.map((c: any) => ({
            id: c.web.uri,
            url: c.web.uri,
            title: c.web.title,
            snippet: '' 
        })) || [];
        
        yield { text, citations };
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'Aborted') {
      console.log('API call was aborted.');
    } else {
      console.error('Error streaming response:', error);
      throw error;
    }
  }
}
