
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat, Settings, Attachment } from '../types';
import { Message as MessageComponent, MessageSkeleton } from './Message';
import { Composer } from './Composer';
import { MenuIcon, BrainIcon } from './icons';

interface ChatPanelProps {
    chat: Chat;
    isStreaming: boolean;
    onSendMessage: (content: string, attachments: Attachment[], webEnabled: boolean, thinkingEnabled: boolean) => void;
    onStopStreaming: () => void;
    onToggleSidebar: () => void;
    onUpdateTitle: (title: string) => void;
    settings: Settings;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    chat,
    isStreaming,
    onSendMessage,
    onStopStreaming,
    onToggleSidebar,
    onUpdateTitle,
    settings
}) => {
    const [title, setTitle] = useState(chat.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [webEnabled, setWebEnabled] = useState(settings.webSearchDefault);
    const [thinkingEnabled, setThinkingEnabled] = useState(settings.thinkingModeDefault);
    const [showScrollToBottom, setShowScrollToBottom] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (title.trim() && title !== chat.title) {
            onUpdateTitle(title.trim());
        } else {
            setTitle(chat.title);
        }
    };

    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chat.messages.length, scrollToBottom]);

    useEffect(() => {
        const lastMessage = chat.messages[chat.messages.length - 1];
        if (lastMessage?.status === 'streaming') {
            const el = scrollRef.current;
            if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
                 scrollToBottom();
            }
        }
    }, [chat.messages, scrollToBottom]);


    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
                const isScrolledUp = scrollHeight - scrollTop - clientHeight > 200;
                setShowScrollToBottom(isScrolledUp);
            }
        };

        const scrollEl = scrollRef.current;
        scrollEl?.addEventListener('scroll', handleScroll);
        return () => scrollEl?.removeEventListener('scroll', handleScroll);
    }, []);

    const modelForTurn = thinkingEnabled ? 'pro' : 'flash';
    const lastMessageModel = chat.messages[chat.messages.length -1]?.modelUsed;
    const displayModel = isStreaming && lastMessageModel ? lastMessageModel : modelForTurn;

    return (
        <div className="flex flex-col h-full bg-[#F9FAFB]">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 z-10 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <button onClick={onToggleSidebar} className="p-2 md:hidden">
                        <MenuIcon className="w-6 h-6" />
                    </button>
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                            className="text-lg font-semibold bg-transparent border-b-2 border-gray-400 focus:outline-none"
                        />
                    ) : (
                        <h1 onClick={() => setIsEditingTitle(true)} className="text-lg font-semibold cursor-pointer">{chat.title}</h1>
                    )}
                </div>
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${displayModel === 'pro' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {displayModel === 'pro' && <BrainIcon className="w-4 h-4" />}
                    <span>Gemini {displayModel === 'pro' ? 'Pro (Thinking)' : 'Flash'}</span>
                </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
                <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                    {chat.messages.map((message, index) => (
                        message.status === 'streaming' && message.content === '' ? 
                        <MessageSkeleton key={message.id} /> :
                        <MessageComponent key={message.id} message={message} />
                    ))}
                </div>
                {showScrollToBottom && (
                    <button 
                        onClick={scrollToBottom} 
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm shadow-md hover:bg-gray-50 animate-fade-in"
                    >
                        Jump to latest
                    </button>
                )}
            </div>

            <div className="flex-shrink-0 p-4 bg-transparent">
                <Composer
                    isStreaming={isStreaming}
                    onSendMessage={onSendMessage}
                    onStopStreaming={onStopStreaming}
                    webEnabled={webEnabled}
                    setWebEnabled={setWebEnabled}
                    thinkingEnabled={thinkingEnabled}
                    setThinkingEnabled={setThinkingEnabled}
                />
            </div>
        </div>
    );
};
