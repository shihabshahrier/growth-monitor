import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { MessageCircle, Plus, Trash2, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const ConversationsPage = () => {
    const navigate = useNavigate();
    const { apiFetch } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiFetch("/conversations");
            console.log("Full API response:", response);
            console.log("Response type:", typeof response);
            console.log("Response.data:", response?.data);

            if (response && response.data) {
                setConversations(response.data);
            } else if (Array.isArray(response)) {
                setConversations(response);
            } else {
                console.error("Unexpected response format:", response);
                setConversations([]);
            }
        } catch (error) {
            console.error("Error loading conversations:", error);
            console.error("Error details:", {
                message: error.message,
                status: error.status,
                payload: error.payload
            });
            toast.error(error.message || "Failed to load conversations");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this conversation?")) {
            return;
        }

        try {
            await apiFetch(`/conversations/${id}`, {
                method: "DELETE",
            });

            toast.success("Conversation deleted successfully");
            setConversations((prev) => prev.filter((c) => c.id !== id));
        } catch (error) {
            console.error("Error deleting conversation:", error);
            toast.error("Failed to delete conversation");
        }
    };

    const handleNewConversation = () => {
        navigate("/chat");
    };

    const handleOpenConversation = (id) => {
        navigate(`/chat/${id}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
        });
    };

    const getPreview = (conversation) => {
        if (!conversation.messages || conversation.messages.length === 0) {
            return "No messages yet";
        }
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        return lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? "..." : "");
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Loading conversations...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Conversations</h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage your AI chat conversations
                    </p>
                </div>
                <Button onClick={handleNewConversation}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Conversation
                </Button>
            </div>

            {/* Conversations List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        All Conversations ({conversations.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-6 mb-4">
                                <MessageSquare className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Start a new conversation with the AI assistant to get insights about your business data.
                            </p>
                            <Button onClick={handleNewConversation}>
                                <Plus className="h-4 w-4 mr-2" />
                                Start Your First Conversation
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className="group flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleOpenConversation(conversation.id)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-medium truncate">
                                                {conversation.title || "Untitled Conversation"}
                                            </h3>
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                <MessageSquare className="h-3 w-3" />
                                                {conversation._count?.messages || 0} messages
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {getPreview(conversation)}
                                        </p>
                                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {formatDate(conversation.updatedAt)}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-4"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(conversation.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
