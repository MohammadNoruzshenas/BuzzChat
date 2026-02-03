import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';

interface User {
    _id: string;
    email: string;
    isOnline: boolean;
}

interface Message {
    _id: string;
    sender: any;
    receiver: any;
    content: string;
    createdAt: string;
}

const ChatPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { socket } = useSocket();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchHistory(selectedUser._id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (message: Message) => {
                console.log('Received message:', message);

                const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
                const receiverId = typeof message.receiver === 'string' ? message.receiver : message.receiver._id;
                const currentUserId = user?.id;
                const selectedId = selectedUser?._id;

                console.log('Comparison:', { senderId, receiverId, currentUserId, selectedId });

                if (
                    (senderId === selectedId && receiverId === currentUserId) ||
                    (senderId === currentUserId && receiverId === selectedId)
                ) {
                    setMessages((prev) => [...prev, message]);
                }
            });

            socket.on('userStatusChanged', ({ userId, status }: { userId: string; status: string }) => {
                setUsers((prev) =>
                    prev.map((u) => (u._id === userId ? { ...u, isOnline: status === 'online' } : u))
                );
            });

            return () => {
                socket.off('receiveMessage');
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
            setUsers(response.data.filter((u: User) => u._id !== user?.id));
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
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-1/4 bg-white border-r flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                    <span className="font-bold truncate">{user?.email}</span>
                    <button onClick={logout} className="text-xs bg-red-500 px-2 py-1 rounded hover:bg-red-600">
                        Logout
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {users.map((u) => (
                        <div
                            key={u._id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 flex items-center border-b ${selectedUser?._id === u._id ? 'bg-blue-50' : ''
                                }`}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold uppercase">
                                    {u.email[0]}
                                </div>
                                <div
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${u.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                        }`}
                                />
                            </div>
                            <span className="ml-3 text-sm font-medium text-gray-700 truncate">{u.email}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b bg-white flex items-center shadow-sm">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold uppercase text-xs">
                                {selectedUser.email[0]}
                            </div>
                            <div className="ml-3">
                                <h3 className="font-bold text-gray-800">{selectedUser.email}</h3>
                                <span className="text-xs text-green-500">
                                    {selectedUser.isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg) => {
                                const isMe = msg.sender._id === user?.id || msg.sender === user?.id;
                                return (
                                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-xs px-4 py-2 rounded-lg shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex space-x-2">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-center items-center justify-center text-gray-400 italic">
                        Select a user to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
