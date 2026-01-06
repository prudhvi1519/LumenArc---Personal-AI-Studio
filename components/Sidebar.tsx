
import React, { useState } from 'react';
import { Chat } from '../types';
import { PlusIcon, SearchIcon, StarIcon, EditIcon, TrashIcon, MoreHorizontalIcon, SettingsIcon } from './icons';

interface SidebarProps {
    chats: Chat[];
    activeChatId: string | null;
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onToggleStar: (id: string) => void;
    onRenameChat: (id: string, newTitle: string) => void;
    onSettings: () => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    chats,
    activeChatId,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onToggleStar,
    onRenameChat,
    onSettings,
    isOpen,
    setIsOpen,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredChats = chats.filter(chat =>
        chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupChatsByDate = (chatList: Chat[]) => {
        const groups: { [key: string]: Chat[] } = {
            'Today': [],
            'Yesterday': [],
            'Previous 7 Days': [],
            'Earlier': [],
        };
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        chatList.forEach(chat => {
            const chatDate = new Date(chat.updatedAt);
            if (chatDate >= today) {
                groups['Today'].push(chat);
            } else if (chatDate >= yesterday) {
                groups['Yesterday'].push(chat);
            } else if (chatDate >= sevenDaysAgo) {
                groups['Previous 7 Days'].push(chat);
            } else {
                groups['Earlier'].push(chat);
            }
        });

        return groups;
    };

    const groupedChats = groupChatsByDate(filteredChats);

    return (
        <>
            <div className={`fixed inset-y-0 left-0 z-30 w-[260px] bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-4 flex-shrink-0">
                    <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                        <PlusIcon className="w-4 h-4" />
                        New Chat
                    </button>
                    <div className="relative mt-4">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                        />
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {Object.entries(groupedChats).map(([group, chatList]) => (
                        chatList.length > 0 && (
                            <div key={group} className="mb-4">
                                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{group}</h3>
                                <ul>
                                    {chatList.map(chat => (
                                        <ChatItem
                                            key={chat.id}
                                            chat={chat}
                                            isActive={chat.id === activeChatId}
                                            onSelect={() => onSelectChat(chat.id)}
                                            onDelete={() => onDeleteChat(chat.id)}
                                            onToggleStar={() => onToggleStar(chat.id)}
                                            onRename={(newTitle) => onRenameChat(chat.id, newTitle)}
                                        />
                                    ))}
                                </ul>
                            </div>
                        )
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <button onClick={onSettings} className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
                        <SettingsIcon className="w-5 h-5" />
                        Settings
                    </button>
                </div>
            </div>
            {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/30 z-20 md:hidden"></div>}
        </>
    );
};

const ChatItem: React.FC<{
    chat: Chat;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onToggleStar: () => void;
    onRename: (newTitle: string) => void;
}> = ({ chat, isActive, onSelect, onDelete, onToggleStar, onRename }) => {
    const handleRename = () => {
        const newTitle = prompt('Rename chat:', chat.title);
        if (newTitle && newTitle.trim() !== '') {
            onRename(newTitle.trim());
        }
    };
    
    return (
        <li className={`group relative rounded-lg ${isActive ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); onSelect(); }} className="block w-full text-left px-3 py-2 text-sm text-gray-800 truncate">
                {chat.title}
            </a>
            <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {chat.starred && <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />}
                <button onClick={onToggleStar} className="p-1 rounded-md hover:bg-gray-200"><StarIcon className="w-4 h-4 text-gray-500" /></button>
                <button onClick={handleRename} className="p-1 rounded-md hover:bg-gray-200"><EditIcon className="w-4 h-4 text-gray-500" /></button>
                <button onClick={onDelete} className="p-1 rounded-md hover:bg-gray-200"><TrashIcon className="w-4 h-4 text-gray-500" /></button>
            </div>
        </li>
    );
};
