
export type Role = 'user' | 'assistant';
export type Model = 'flash' | 'pro';
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error';
export type AttachmentStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

export interface Attachment {
  id: string;
  name: string;
  mime: string;
  size: number;
  status: AttachmentStatus;
  content: string; // base64 content
}

export interface Citation {
  id: string;
  url: string;
  title: string;
  snippet: string;
}

export interface Message {
  id: string;
  chatId: string;
  role: Role;
  content: string;
  createdAt: string;
  attachments: Attachment[];
  citations: Citation[];
  status: MessageStatus;
  modelUsed: Model | null;
}

export interface Chat {
  id: string;
  title: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Settings {
  webSearchDefault: boolean;
  thinkingModeDefault: boolean;
  temperature: number;
}
