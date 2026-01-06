
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { Settings as SettingsView } from './components/Settings';
import { Chat, Message, Settings, Attachment } from './types';
import { streamChatResponse } from './services/geminiService';

const initialChats: Chat[] = [
    {
        id: 'chat-1',
        title: 'Welcome to LumenArc',
        starred: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
            {
                id: 'msg-1',
                chatId: 'chat-1',
                role: 'assistant',
                content: "Hello! I'm LumenArc, your personal AI assistant. How can I help you today?",
                createdAt: new Date().toISOString(),
                attachments: [],
                citations: [],
                status: 'done',
                modelUsed: 'flash',
            }
        ]
    }
];

export default function App() {
    const [chats, setChats] = useState<Chat[]>(initialChats);
    const [activeChatId, setActiveChatId] = useState<string | null>('chat-1');
    const [view, setView] = useState<'chat' | 'settings'>('chat');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [streamController, setStreamController] = useState<AbortController | null>(null);
    
    const [settings, setSettings] = useState<Settings>({
        webSearchDefault: false,
        thinkingModeDefault: false,
        temperature: 0.7,
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('lumenarc-settings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    const handleSettingsChange = (newSettings: Partial<Settings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('lumenarc-settings', JSON.stringify(updated));
            return updated;
        });
    };

    const activeChat = useMemo(() => chats.find(c => c.id === activeChatId), [chats, activeChatId]);

    const createNewChat = () => {
        const newChat: Chat = {
            id: `chat-${Date.now()}`,
            title: 'New Chat',
            starred: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        setView('chat');
        setSidebarOpen(false);
    };

    const deleteChat = (chatId: string) => {
        setChats(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) {
            setActiveChatId(chats.length > 1 ? chats[1].id : null);
        }
    };
    
    const updateChatTitle = (chatId: string, title: string) => {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title } : c));
    };

    const stopStreaming = useCallback(() => {
        if (streamController) {
            streamController.abort();
            setStreaming(false);
            setStreamController(null);
        }
    }, [streamController]);

    const sendMessage = useCallback(async (
        content: string, 
        attachments: Attachment[],
        webEnabled: boolean, 
        thinkingEnabled: boolean
    ) => {
        if (!activeChatId) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            chatId: activeChatId,
            role: 'user',
            content,
            attachments,
            createdAt: new Date().toISOString(),
            citations: [],
            status: 'done',
            modelUsed: thinkingEnabled ? 'pro' : 'flash',
        };

        const assistantMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            chatId: activeChatId,
            role: 'assistant',
            content: '',
            createdAt: new Date().toISOString(),
            attachments: [],
            citations: [],
            status: 'streaming',
            modelUsed: thinkingEnabled ? 'pro' : 'flash',
        };
        
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, userMessage, assistantMessage] } : c));

        setStreaming(true);
        const controller = new AbortController();
        setStreamController(controller);

        try {
            const history = chats.find(c => c.id === activeChatId)?.messages || [];
            const stream = streamChatResponse(history, userMessage, webEnabled, thinkingEnabled, settings.temperature, controller.signal);

            for await (const chunk of stream) {
                setChats(prev => prev.map(c => {
                    if (c.id === activeChatId) {
                        const newMessages = c.messages.map(m => {
                            if (m.id === assistantMessage.id) {
                                return { 
                                    ...m, 
                                    content: m.content + (chunk.text || ''),
                                    citations: chunk.citations && chunk.citations.length > 0 ? chunk.citations : m.citations
                                };
                            }
                            return m;
                        });
                        return { ...c, messages: newMessages };
                    }
                    return c;
                }));
            }
        } catch (error) {
            console.error('Error during streaming:', error);
            setChats(prev => prev.map(c => {
                if (c.id === activeChatId) {
                    const newMessages = c.messages.map(m => m.id === assistantMessage.id ? { ...m, status: 'error' as 'error', content: "Sorry, I couldn't get a response. Please try again." } : m);
                    return { ...c, messages: newMessages };
                }
                return c;
            }));
        } finally {
            setChats(prev => prev.map(c => {
                if (c.id === activeChatId) {
                    const newMessages = c.messages.map(m => m.id === assistantMessage.id ? { ...m, status: 'done' as 'done' } : m);
                    return { ...c, messages: newMessages, updatedAt: new Date().toISOString() };
                }
                return c;
            }));
            setStreaming(false);
            setStreamController(null);
            
            // Auto-generate title for new chats
            const currentChat = chats.find(c => c.id === activeChatId);
            if (currentChat && currentChat.title === 'New Chat' && currentChat.messages.length > 1) {
                // In a real app, this would be a separate API call to summarize
                const firstUserMessage = currentChat.messages[0].content;
                const newTitle = firstUserMessage.split(' ').slice(0, 5).join(' ') + (firstUserMessage.length > 30 ? '...' : '');
                updateChatTitle(activeChatId, newTitle);
            }
        }
    }, [activeChatId, chats, settings.temperature]);

    return (
        <div className="flex h-screen w-screen bg-[#F9FAFB] text-gray-900 overflow-hidden">
            <Sidebar
                chats={chats}
                activeChatId={activeChatId}
                onNewChat={createNewChat}
                onSelectChat={(id) => { setActiveChatId(id); setView('chat'); setSidebarOpen(false);}}
                onDeleteChat={deleteChat}
                onToggleStar={(id) => setChats(c => c.map(chat => chat.id === id ? {...chat, starred: !chat.starred} : chat))}
                onRenameChat={updateChatTitle}
                onSettings={() => { setView('settings'); setSidebarOpen(false); }}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />
            <main className="flex-1 flex flex-col h-full transition-all duration-300 md:ml-[260px]">
                {view === 'chat' && activeChat ? (
                    <ChatPanel
                        key={activeChat.id}
                        chat={activeChat}
                        isStreaming={streaming}
                        onSendMessage={sendMessage}
                        onStopStreaming={stopStreaming}
                        onToggleSidebar={() => setSidebarOpen(p => !p)}
                        onUpdateTitle={(title) => updateChatTitle(activeChat.id, title)}
                        settings={settings}
                    />
                ) : view === 'settings' ? (
                    <SettingsView 
                        settings={settings}
                        onSettingsChange={handleSettingsChange}
                        onToggleSidebar={() => setSidebarOpen(p => !p)}
                    />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">
                        Select a chat or start a new one.
                    </div>
                )}
            </main>
        </div>
    );
}
