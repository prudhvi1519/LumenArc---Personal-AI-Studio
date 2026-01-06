
import React, { useState } from 'react';
import { Message as MessageType, Citation } from '../types';
import { CopyIcon, StarIcon, BrainIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageProps {
    message: MessageType;
}

const UserAvatar = () => <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>;
const AssistantAvatar = () => <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0"></div>;

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return !inline ? (
        <div className="relative my-4 rounded-lg bg-[#0d1117]">
            <div className="flex items-center justify-between px-4 py-1.5 text-xs text-gray-300 border-b border-gray-700">
                <span>{match ? match[1] : 'code'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-white">
                    {copied ? <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied</> : <><CopyIcon className="w-3.5 h-3.5" />Copy</>}
                </button>
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={match ? match[1] : undefined}
                PreTag="div"
                {...props}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className="px-1 py-0.5 bg-gray-200 rounded-sm text-sm" {...props}>
            {children}
        </code>
    );
};


export const Message: React.FC<MessageProps> = ({ message }) => {
    const isUser = message.role === 'user';

    const bubbleClasses = isUser
        ? 'bg-[#0E1116] text-white rounded-2xl rounded-tr-md shadow-sm'
        : 'bg-[#F3F5F7] text-[#0E1116] rounded-2xl rounded-tl-md shadow-sm';
    
    const alignmentClasses = isUser ? 'justify-end' : 'justify-start';

    return (
        <div className={`flex items-start gap-3 w-full ${alignmentClasses}`}>
            {!isUser && <AssistantAvatar />}
            <div className={`flex flex-col max-w-[720px] ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 ${bubbleClasses}`}>
                     <ReactMarkdown
                        components={{ code: CodeBlock }}
                        className="prose prose-sm max-w-none"
                     >
                        {message.content}
                    </ReactMarkdown>
                </div>
                {!isUser && message.citations.length > 0 && (
                    <div className="mt-2">
                        <button className="px-3 py-1 text-xs bg-gray-200 rounded-full hover:bg-gray-300">
                           Sources ({message.citations.length})
                        </button>
                    </div>
                )}
            </div>
            {isUser && <UserAvatar />}
        </div>
    );
};

export const MessageSkeleton: React.FC = () => (
    <div className="flex items-start gap-3 w-full justify-start">
        <AssistantAvatar />
        <div className="flex flex-col max-w-[720px] w-full">
            <div className="px-4 py-3 bg-[#F3F5F7] rounded-2xl rounded-tl-md shadow-sm w-full">
                <div className="space-y-2 animate-shimmer">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        </div>
    </div>
);
