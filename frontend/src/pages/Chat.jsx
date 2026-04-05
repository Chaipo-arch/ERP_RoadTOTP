import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, MessageSquare, Trash2, Bot, User, Terminal, Sparkles, Loader2, Menu, X } from 'lucide-react';
import { chatApi } from '../services/api';
import '../Chat.css';

export default function Chat() {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        } else {
            setMessages([]);
        }
    }, [activeConversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const response = await chatApi.getConversations();
            const data = response.data;
            // Handle both plain array and wrapped response (e.g. { data: [...] })
            if (Array.isArray(data)) {
                setConversations(data);
            } else if (data && Array.isArray(data.data)) {
                setConversations(data.data);
            } else {
                console.warn('Unexpected conversations response format:', data);
                setConversations([]);
            }
        } catch (error) {
            console.error('Failed to load conversations', error);
            setConversations([]);
        }
    };

    const loadMessages = async (id) => {
        try {
            setIsLoading(true);
            const response = await chatApi.getMessages(id);
            const data = response.data;
            if (Array.isArray(data)) {
                setMessages(data);
            } else if (data && Array.isArray(data.data)) {
                setMessages(data.data);
            } else {
                console.warn('Unexpected messages response format:', data);
                setMessages([]);
            }
        } catch (error) {
            console.error('Failed to load messages', error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNewChat = () => {
        setActiveConversationId(null);
        setMessages([]);
    };

    const handleDeleteConversation = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Voulez-vous vraiment supprimer cette conversation ?')) {
            try {
                await chatApi.deleteConversation(id);
                setConversations(conversations.filter(c => c.id !== id));
                if (activeConversationId === id) {
                    handleNewChat();
                }
            } catch (error) {
                console.error('Failed to delete conversation', error);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            created_at: new Date().toISOString()
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatApi.sendMessage({
                message: userMessage.content,
                conversation_id: activeConversationId
            });

            const { conversation_id, message: assistantMessage } = response.data;

            if (!activeConversationId) {
                setActiveConversationId(conversation_id);
                loadConversations();
            }

            await loadMessages(conversation_id);
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Désolé, une erreur est survenue lors de la communication avec l'assistant.",
                isError: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = (content) => {
        if (!content) return null;
        return content.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                <br />
            </React.Fragment>
        ));
    };

    return (
        <div className="chat-container">
            {/* Sidebar */}
            <div className={`chat-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="chat-sidebar-header">
                    <button onClick={handleNewChat} className="btn-new-chat">
                        <Plus size={18} />
                        <span>Nouvelle discussion</span>
                    </button>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="btn-icon btn-ghost chat-sidebar-close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="chat-sidebar-conversations">
                    {conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => setActiveConversationId(conv.id)}
                            className={`chat-conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                        >
                            <MessageSquare size={16} className="chat-conversation-icon" />
                            <span className="chat-conversation-title">
                                {conv.title || 'Nouvelle conversation'}
                            </span>
                            <button
                                onClick={(e) => handleDeleteConversation(e, conv.id)}
                                className="chat-conversation-delete"
                                title="Supprimer"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}

                    {conversations.length === 0 && (
                        <div className="chat-sidebar-empty">
                            Aucune conversation historique
                        </div>
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="chat-main">
                {!sidebarOpen && (
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="btn-icon btn-ghost chat-sidebar-toggle"
                    >
                        <Menu size={20} />
                    </button>
                )}

                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="chat-empty-state">
                            <div className="chat-empty-icon">
                                <Bot size={64} />
                                <Sparkles size={24} className="chat-sparkle" />
                            </div>
                            <h2 className="chat-empty-title">Assistant IA RoadToTP</h2>
                            <p className="chat-empty-subtitle">
                                Je peux vous aider à gérer vos chantiers, créer des clients, ou vérifier le planning.
                            </p>
                            <div className="chat-suggestions">
                                <button className="chat-suggestion" onClick={() => setInput("Liste tous mes clients")}>
                                    <MessageSquare size={16} />
                                    Liste tous mes clients
                                </button>
                                <button className="chat-suggestion" onClick={() => setInput("Quel est l'état de mes chantiers ?")}>
                                    <MessageSquare size={16} />
                                    État de mes chantiers
                                </button>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                <div className="chat-message-avatar">
                                    {msg.role === 'user' ? (
                                        <User size={16} />
                                    ) : msg.role === 'tool' ? (
                                        <Terminal size={14} />
                                    ) : (
                                        <Bot size={16} />
                                    )}
                                </div>

                                <div className="chat-message-content">
                                    <div className="chat-message-header">
                                        {msg.role === 'assistant' ? 'RoadToTP Assistant' : msg.role === 'user' ? 'Vous' : 'Outil'}
                                    </div>

                                    {msg.tool_calls && (
                                        <div className="chat-tool-calls">
                                            {msg.tool_calls.map((tool, tIdx) => (
                                                <div key={tIdx} className="chat-tool-call">
                                                    <Terminal size={12} />
                                                    <span className="chat-tool-name">{tool.function.name}</span>
                                                    <span className="chat-tool-args">{JSON.stringify(tool.function.arguments)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {msg.content && (
                                        <div className={`chat-message-bubble ${msg.isError ? 'error' : ''}`}>
                                            {renderContent(msg.content)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {isLoading && (
                        <div className="chat-message assistant">
                            <div className="chat-message-avatar">
                                <Bot size={16} />
                            </div>
                            <div className="chat-message-content">
                                <div className="chat-message-header">RoadToTP Assistant</div>
                                <div className="chat-message-bubble">
                                    <div className="chat-typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="chat-input-container">
                    <form onSubmit={handleSendMessage} className="chat-input-form">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Posez une question sur vos chantiers..."
                            className="chat-input"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="chat-send-button"
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </form>
                    <div className="chat-input-footer">
                        L'IA peut faire des erreurs. Vérifiez les informations importantes.
                    </div>
                </div>
            </div>
        </div>
    );
}
