import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import {
    Smile, Send, Paperclip, LogOut, Phone, MoreVertical,
    MessageSquare, Menu, User, Settings, Users, Moon, HelpCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
    _id: string;
    email: string;
    isOnline: boolean;
    unreadCount?: number;
}

interface Message {
    _id: string;
    sender: any;
    receiver: any;
    content: string;
    isRead: boolean;
    createdAt: string;
}

const ChatPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchHistory(selectedUser._id);
            if (socket) {
                socket.emit('markAsRead', { senderId: selectedUser._id });
            }
            setUsers(prev => prev.map(u =>
                u._id === selectedUser._id ? { ...u, unreadCount: 0 } : u
            ));
        }
    }, [selectedUser, socket]);

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (message: Message) => {
                const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
                const receiverId = typeof message.receiver === 'string' ? message.receiver : message.receiver._id;
                const currentUserId = user?.id;
                const selectedId = selectedUser?._id;

                if (
                    (senderId === selectedId && receiverId === currentUserId) ||
                    (senderId === currentUserId && receiverId === selectedId)
                ) {
                    setMessages((prev) => [...prev, message]);

                    if (senderId === selectedId) {
                        socket.emit('markAsRead', { senderId: selectedId });
                    }
                } else if (receiverId === currentUserId) {
                    setUsers(prev => prev.map(u =>
                        u._id === senderId ? { ...u, unreadCount: (u.unreadCount || 0) + 1 } : u
                    ));
                }
            });

            socket.on('messagesRead', ({ readerId, senderId }: { readerId: string; senderId: string }) => {
                const myId = user?.id || (user as any)?._id;
                const currentSelectedId = selectedUser?._id;

                if (String(senderId) === String(myId) && String(readerId) === String(currentSelectedId)) {
                    setMessages((prev) =>
                        prev.map(msg => ({ ...msg, isRead: true }))
                    );
                }
            });

            socket.on('userStatusChanged', ({ userId, status }: { userId: string; status: string }) => {
                setUsers((prev) =>
                    prev.map((u) => (u._id === userId ? { ...u, isOnline: status === 'online' } : u))
                );
            });

            return () => {
                socket.off('receiveMessage');
                socket.off('messagesRead');
                socket.off('userStatusChanged');
            };
        }
    }, [socket, selectedUser, user]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        }
    };

    const fetchHistory = async (otherUserId: string) => {
        try {
            const response = await api.get(`/chat/history/${otherUserId}`);
            setMessages(response.data);
        } catch (err) {
            console.error('Failed to fetch history', err);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || !socket) return;

        socket.emit('sendMessage', {
            receiverId: selectedUser._id,
            content: newMessage,
        });

        setNewMessage('');
        setShowEmojiPicker(false);
    };

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessage(prev => prev + emojiData.emoji);
        inputRef.current?.focus();
    };

    const menuItems = [
        { icon: <User className="w-5 h-5" />, label: 'My Profile', onClick: () => console.log('Profile') },
        { icon: <Users className="w-5 h-5" />, label: 'New Group', onClick: () => console.log('New Group') },
        { icon: <Phone className="w-5 h-5" />, label: 'Calls', onClick: () => console.log('Calls') },
        { icon: <Settings className="w-5 h-5" />, label: 'Settings', onClick: () => console.log('Settings') },
        { icon: <Moon className="w-5 h-5" />, label: 'Night Mode', onClick: () => console.log('Night Mode') },
        { icon: <HelpCircle className="w-5 h-5" />, label: 'Skygram Help', onClick: () => console.log('Help') },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative font-sans text-slate-900">
            {/* Side Menu Drawer Overlay */}
            <AnimatePresence>
                {isSideMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSideMenuOpen(false)}
                            className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-[100]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 left-0 h-full w-[280px] bg-white z-[101] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 bg-sky-600 text-white">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-bold text-2xl border border-white/30">
                                        {user?.email[0].toUpperCase()}
                                    </div>
                                    <button
                                        onClick={() => setIsSideMenuOpen(false)}
                                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg truncate">{user?.email.split('@')[0]}</h3>
                                    <p className="text-sky-100 text-xs truncate opacity-80">{user?.email}</p>
                                </div>
                            </div>

                            <div className="flex-1 py-4 overflow-y-auto">
                                {menuItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            item.onClick();
                                            setIsSideMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-4 px-6 py-3.5 text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-slate-400">{item.icon}</span>
                                        <span className="font-semibold text-[14.5px]">{item.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-4 border-t border-slate-100">
                                <button
                                    onClick={logout}
                                    className="w-full flex items-center gap-4 px-4 py-3 text-sky-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-[14.5px]"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Logout from Skygram</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm transition-all duration-300 ${selectedUser ? 'hidden md:flex' : 'flex'
                }`}>
                <div className="p-5 border-b border-slate-100 flex items-center gap-4 bg-white">
                    <button
                        onClick={() => setIsSideMenuOpen(true)}
                        className="p-2 -ml-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col flex-1">
                        <span className="text-[10px] text-sky-600 font-extrabold uppercase tracking-widest">Skygram</span>
                        <span className="font-bold text-slate-800 truncate max-w-[140px] leading-tight">Recent Chats</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 text-slate-400">
                    <div className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Active Discussions</div>
                    {users.map((u) => (
                        <div
                            key={u._id}
                            onClick={() => setSelectedUser(u)}
                            className={`px-4 py-3.5 mb-1 rounded-2xl cursor-pointer transition-all duration-200 flex items-center ${selectedUser?._id === u._id
                                ? 'bg-sky-50 shadow-sm'
                                : 'hover:bg-slate-50'
                                }`}
                        >
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${selectedUser?._id === u._id ? 'bg-sky-600' : 'bg-slate-300'
                                    }`}>
                                    {u.email[0].toUpperCase()}
                                </div>
                                <div
                                    className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${u.isOnline ? 'bg-green-500' : 'bg-slate-400'
                                        }`}
                                />
                            </div>
                            <div className="ml-4 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`text-[14.5px] font-bold truncate ${selectedUser?._id === u._id ? 'text-sky-900' : 'text-slate-700'}`}>
                                        {u.email.split('@')[0]}
                                    </span>
                                    {(u.unreadCount ?? 0) > 0 && (
                                        <span className="bg-sky-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                            {u.unreadCount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium truncate">Active now</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedUser ? (
                <div className="flex-1 flex flex-col bg-white h-full relative">
                    <div className="h-[73px] px-6 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm z-10">
                        <div className="flex items-center min-w-0">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="mr-3 p-2 -ml-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl md:hidden transition-all"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="relative flex-shrink-0">
                                <div className="w-11 h-11 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center font-bold text-lg">
                                    {selectedUser.email[0].toUpperCase()}
                                </div>
                                <div className={`absolute bottom-[-4px] right-[-4px] w-3.5 h-3.5 rounded-full border-2 border-white ${selectedUser.isOnline ? 'bg-green-500' : 'bg-slate-300'
                                    }`} />
                            </div>
                            <div className="ml-4 overflow-hidden">
                                <h3 className="font-bold text-slate-800 leading-tight truncate">{selectedUser.email.split('@')[0]}</h3>
                                <span className={`text-[10px] font-extrabold uppercase tracking-widest ${selectedUser.isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><Phone className="h-5 w-5" /></button>
                            <button className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"><MoreVertical className="h-5 w-5" /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                                <div className="p-4 bg-white rounded-3xl shadow-sm italic text-center text-[#94a3b8]">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm font-medium">No messages yet. Say hi!</p>
                                </div>
                            </div>
                        )}
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender._id === user?.id || msg.sender === user?.id;
                            const prevMsg = messages[idx - 1];
                            const isSameSender = prevMsg && (prevMsg.sender._id === msg.sender._id || prevMsg.sender === msg.sender);

                            return (
                                <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isSameSender ? '-mt-3' : ''}`}>
                                    <div
                                        className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${isMe
                                            ? 'bg-sky-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-[14.5px] leading-relaxed break-words text-left">{msg.content}</p>
                                        <div className="flex items-center justify-end mt-1.5 space-x-1.5 text-right w-full">
                                            <span className={`text-[9.5px] font-bold ${isMe ? 'text-sky-100 opacity-80' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                <span className={`flex items-center ${msg.isRead ? 'text-sky-100' : 'text-sky-300 opacity-60'}`}>
                                                    {msg.isRead ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            <path fillRule="evenodd" d="M13.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L5 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" transform="translate(-3,0)" />
                                                        </svg>
                                                    ) : (
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 relative">
                        {/* Emoji Picker Overlay */}
                        {showEmojiPicker && (
                            <div
                                ref={emojiPickerRef}
                                className="absolute bottom-20 left-4 z-50 shadow-2xl rounded-2xl overflow-hidden border border-slate-200"
                            >
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.LIGHT}
                                    width={320}
                                    height={400}
                                    lazyLoadEmojis={true}
                                />
                            </div>
                        )}

                        <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-7xl mx-auto">
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className={`p-2.5 rounded-xl transition-all ${showEmojiPicker ? 'bg-sky-50 text-sky-600' : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100'}`}
                                >
                                    <Smile className="h-6 w-6" />
                                </button>
                                <button type="button" className="p-2.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-xl transition-all">
                                    <Paperclip className="h-6 w-6" />
                                </button>
                            </div>

                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 bg-slate-100/50 border border-slate-200 rounded-2xl px-5 py-3 text-[14.5px] font-medium focus:outline-none focus:ring-4 focus:ring-sky-600/5 focus:border-sky-600 focus:bg-white transition-all outline-none"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />

                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white p-3 rounded-2xl transition-all shadow-lg shadow-sky-600/20 active:scale-95 disabled:shadow-none flex items-center justify-center"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-400 bg-slate-50 font-medium">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                        <MessageSquare className="h-10 w-10 text-slate-200" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">Choose a Conversation</h2>
                    <p className="text-slate-400 mt-2">Select a user to start a seamless chat experience</p>
                </div>
            )}
        </div>
    );
};

export default ChatPage;
