import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ChatView } from "../components/chat/ChatView";
import { Button } from "../components/ui/button";
import { ArrowLeft, Save, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export const ChatPage = () => {
    const { id: conversationId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [conversation, setConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");

    const loadConversation = useCallback(async () => {
        if (!conversationId) return;

        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:8080/api/conversations/${conversationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to load conversation");
            }

            const data = await response.json();
            setConversation(data.conversation);
            setTitle(data.conversation.title || "");
        } catch (error) {
            console.error("Error loading conversation:", error);
            toast.error("Failed to load conversation");
            navigate("/conversations");
        } finally {
            setLoading(false);
        }
    }, [conversationId, token, navigate]);

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
            // Generate title from first user message if not set
            const generatedTitle = title || messages.find(m => m.role === "user")?.content.substring(0, 50) || "New Conversation";

            if (conversationId) {
                // Update existing conversation
                const response = await fetch(
                    `http://localhost:8080/api/conversations/${conversationId}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            title: generatedTitle,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Failed to update conversation");
                }

                // Save messages
                for (const message of messages) {
                    if (!message.saved) {
                        await fetch(
                            `http://localhost:8080/api/conversations/${conversationId}/messages`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    role: message.role,
                                    content: message.content,
                                }),
                            }
                        );
                    }
                }

                toast.success("Conversation updated");
            } else {
                // Create new conversation
                const response = await fetch("http://localhost:8080/api/conversations", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        title: generatedTitle,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to create conversation");
                }

                const data = await response.json();
                const newConversationId = data.conversation.id;

                // Save messages
                for (const message of messages) {
                    await fetch(
                        `http://localhost:8080/api/conversations/${newConversationId}/messages`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                                role: message.role,
                                content: message.content,
                            }),
                        }
                    );
                }

                toast.success("Conversation saved");
                navigate(`/chat/${newConversationId}`, { replace: true });
            }
        } catch (error) {
            console.error("Error saving conversation:", error);
            toast.error("Failed to save conversation");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading conversation...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/conversations")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        All Conversations
                    </Button>
                    {conversationId && (
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                {conversation?.title || "Untitled Conversation"}
                            </span>
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const chatView = document.querySelector('[data-chat-view]');
                        if (chatView) {
                            const messages = chatView.messages || [];
                            handleSaveConversation(messages);
                        }
                    }}
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Conversation
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden p-6">
                <ChatView
                    conversationId={conversationId}
                    initialMessages={conversation?.messages}
                    onSave={handleSaveConversation}
                />
            </div>
        </div>
    );
};
