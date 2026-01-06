
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { PaperclipIcon, MicIcon, GlobeIcon, BrainIcon, SendIcon, StopIcon } from './icons';
import { Attachment } from '../types';

interface ComposerProps {
    isStreaming: boolean;
    onSendMessage: (content: string, attachments: Attachment[], webEnabled: boolean, thinkingEnabled: boolean) => void;
    onStopStreaming: () => void;
    webEnabled: boolean;
    setWebEnabled: (enabled: boolean) => void;
    thinkingEnabled: boolean;
    setThinkingEnabled: (enabled: boolean) => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const SUPPORTED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/heic',
    'image/heif',
];


export const Composer: React.FC<ComposerProps> = ({
    isStreaming,
    onSendMessage,
    onStopStreaming,
    webEnabled,
    setWebEnabled,
    thinkingEnabled,
    setThinkingEnabled
}) => {
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${scrollHeight}px`;
        }
    }, [message]);

    const handleSendMessage = () => {
        if (message.trim() || attachments.length > 0) {
            onSendMessage(message, attachments, webEnabled, thinkingEnabled);
            setMessage('');
            setAttachments([]);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0];
            if (file) {
                 if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
                     alert(`Unsupported file type: ${file.type}. Please select a PNG, JPEG, WEBP, HEIC, or HEIF file.`);
                     if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                     }
                     return;
                 }
                 const base64Content = await fileToBase64(file);
                 const newAttachment: Attachment = {
                    id: `file-${Date.now()}`,
                    name: file.name,
                    mime: file.type,
                    size: file.size,
                    status: 'uploaded',
                    content: base64Content
                 };
                 setAttachments(prev => [...prev, newAttachment]);
            }
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-col">
                {attachments.length > 0 && (
                    <div className="p-2 flex flex-wrap gap-2">
                        {attachments.map(att => (
                            <div key={att.id} className="bg-gray-200 text-sm px-2 py-1 rounded-md flex items-center gap-2">
                                <span>{att.name}</span>
                                <button onClick={() => setAttachments(atts => atts.filter(a => a.id !== att.id))} className="text-gray-500 hover:text-gray-800">
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex items-end gap-2 sm:gap-3 whitespace-nowrap overflow-hidden">
                    <div className="flex items-center gap-1">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden"
                            accept={SUPPORTED_MIME_TYPES.join(',')}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 grid place-items-center w-10 h-10">
                            <PaperclipIcon className="w-5 h-5" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 grid place-items-center w-10 h-10">
                            <MicIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Message LumenArc..."
                        rows={1}
                        className="flex-1 min-w-[100px] bg-transparent resize-none border-none focus:ring-0 text-base placeholder-gray-500 py-2.5 max-h-48 custom-scrollbar"
                    />
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        <button onClick={() => setWebEnabled(!webEnabled)} className={`p-2 rounded-lg hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 grid place-items-center w-10 h-10 ${webEnabled ? 'bg-blue-100 text-blue-700' : ''}`}>
                            <GlobeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setThinkingEnabled(!thinkingEnabled)} className={`p-2 rounded-lg hover:bg-gray-200 text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 grid place-items-center w-10 h-10 ${thinkingEnabled ? 'bg-purple-100 text-purple-700' : ''}`}>
                            <BrainIcon className="w-5 h-5" />
                        </button>
                        {isStreaming ? (
                            <button onClick={onStopStreaming} className="p-2 w-10 h-10 grid place-items-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors">
                                <StopIcon className="w-5 h-5" />
                            </button>
                        ) : (
                            <button onClick={handleSendMessage} disabled={!message.trim() && attachments.length === 0} className="p-2 w-10 h-10 grid place-items-center rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                                <SendIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2 px-4">
                Tips: Shift+Enter for newline. Verify important info.
            </p>
        </div>
    );
};
