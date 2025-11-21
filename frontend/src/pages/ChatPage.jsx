import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChatView } from "../components/chat/ChatView";
import { Button } from "../components/ui/button";
import { MessageSquarePlus, MessageCircle, Trash2, Menu, X } from "lucide-react";
import { toast } from "sonner";

export const ChatPage = () => {
    const { id: conversationId } = useParams();
    const navigate = useNavigate();
    const { apiFetch } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [title, setTitle] = useState("");
    const [currentMessages, setCurrentMessages] = useState([]);

    const handleMessagesChange = useCallback((messages) => {
        setCurrentMessages(messages);
    }, []);

    const loadConversations = useCallback(async () => {
        try {
            const response = await apiFetch("/conversations");
            const conversationsData = response.data || response;
            setConversations(Array.isArray(conversationsData) ? conversationsData : []);
        } catch (error) {
            console.error("Error loading conversations:", error);
        }
    }, [apiFetch]);

    const loadConversation = useCallback(async () => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const response = await apiFetch(`/conversations/${conversationId}`);
            console.log("Conversation response:", response);

            // Backend returns { success: true, data: conversation }
            const conversationData = response.data || response;
            setConversation(conversationData);
            setTitle(conversationData.title || "");
        } catch (error) {
            console.error("Error loading conversation:", error);
            toast.error("Failed to load conversation");
            navigate("/chat");
        } finally {
            setLoading(false);
        }
    }, [conversationId, apiFetch, navigate]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (conversationId) {
            loadConversation();
        }
    }, [conversationId, loadConversation]);

    const handleSaveConversation = async (messages) => {
        if (!messages || messages.length === 0) {
            return;
        }

        try {
            // Filter only unsaved messages (ones without saved flag or with saved=false)
            const unsavedMessages = messages.filter(m => !m.saved && m.content && !m.streaming);

            if (unsavedMessages.length === 0) {
                console.log("No unsaved messages to save");
                return;
            }

            console.log(`Saving ${unsavedMessages.length} unsaved messages...`);

            // Generate title from first user message if not set
            const generatedTitle = title || messages.find(m => m.role === "user")?.content.substring(0, 50) || "New Conversation";

            // Track saved message IDs for state update
            const savedMessageIds = [];

            if (conversationId) {
                // Update existing conversation
                await apiFetch(`/conversations/${conversationId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        title: generatedTitle,
                    }),
                });

                // Save only unsaved messages
                for (const message of unsavedMessages) {
                    try {
                        await apiFetch(`/conversations/${conversationId}/messages`, {
                            method: "POST",
                            body: JSON.stringify({
                                role: message.role,
                                content: message.content,
                            }),
                        });
                        savedMessageIds.push(message.id);
                    } catch (err) {
                        console.error(`Failed to save message ${message.id}:`, err);
                        // Continue saving other messages
                    }
                }

                // Update state to mark messages as saved
                setCurrentMessages(prev => 
                    prev.map(msg => 
                        savedMessageIds.includes(msg.id) 
                            ? { ...msg, saved: true } 
                            : msg
                    )
                );

                // Refresh conversations list
                loadConversations();
            } else {
                // Create new conversation
                const response = await apiFetch("/conversations", {
                    method: "POST",
                    body: JSON.stringify({
                        title: generatedTitle,
                    }),
                });

                // Backend returns { success: true, data: conversation }
                const conversationData = response.data || response;
                const newConversationId = conversationData.id;

                // Save unsaved messages
                for (const message of unsavedMessages) {
                    try {
                        await apiFetch(`/conversations/${newConversationId}/messages`, {
                            method: "POST",
                            body: JSON.stringify({
                                role: message.role,
                                content: message.content,
                            }),
                        });
                        savedMessageIds.push(message.id);
                    } catch (err) {
                        console.error(`Failed to save message ${message.id}:`, err);
                        // Continue saving other messages
                    }
                }

                // Update state to mark messages as saved
                setCurrentMessages(prev => 
                    prev.map(msg => 
                        savedMessageIds.includes(msg.id) 
                            ? { ...msg, saved: true } 
                            : msg
                    )
                );

                toast.success("Conversation saved");
                // Refresh conversations list
                loadConversations();
                navigate(`/chat/${newConversationId}`, { replace: true });
            }
        } catch (error) {
            console.error("Error saving conversation:", error);
            toast.error("Failed to save conversation");
        }
    };

    const handleDeleteConversation = async (id) => {
        if (!confirm("Are you sure you want to delete this conversation?")) {
            return;
        }

        try {
            await apiFetch(`/conversations/${id}`, {
                method: "DELETE",
            });
            toast.success("Conversation deleted");
            loadConversations();
            if (id === conversationId) {
                navigate("/chat");
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("Failed to delete conversation");
        }
    };

    const handleNewConversation = async () => {
        // If current conversation has messages, save before creating new one
        if (currentMessages.length > 0) {
            const hasUnsavedMessages = currentMessages.some(m => !m.saved);
            if (hasUnsavedMessages) {
                console.log("Saving current conversation before creating new one...");
                await handleSaveConversation(currentMessages);
            }
        }

        // Clear state and navigate to new chat
        setConversation(null);
        setCurrentMessages([]);
        setTitle("");
        navigate("/chat");
    };

    return (
        <div className="h-full flex">
            {/* Sidebar */}
            <div
                className={`${sidebarOpen ? "w-64" : "w-0"
                    } flex-shrink-0 border-r bg-muted/30 transition-all duration-300 overflow-hidden`}
            >
                <div className="h-full flex flex-col p-4">
                    {/* New Chat Button */}
                    <Button
                        onClick={handleNewConversation}
                        className="w-full mb-4"
                        variant="default"
                    >
                        <MessageSquarePlus className="h-4 w-4 mr-2" />
                        New Chat
                    </Button>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${conv.id === conversationId
                                    ? "bg-primary/10 border border-primary/20"
                                    : "hover:bg-muted"
                                    }`}
                                onClick={() => navigate(`/chat/${conv.id}`)}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <MessageCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="text-sm truncate">
                                        {conv.title || "Untitled"}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteConversation(conv.id);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        {conversations.length === 0 && (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                No conversations yet
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? (
                                <X className="h-4 w-4" />
                            ) : (
                                <Menu className="h-4 w-4" />
                            )}
                        </Button>
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {conversationId
                                    ? conversation?.title || "Loading..."
                                    : "New Conversation"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chat View */}
                <div className="flex-1 overflow-hidden p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Loading conversation...
                                </p>
                            </div>
                        </div>
                    ) : (
                        <ChatView
                            conversationId={conversationId}
                            initialMessages={conversation?.messages}
                            onSave={handleSaveConversation}
                            onMessagesChange={handleMessagesChange}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
