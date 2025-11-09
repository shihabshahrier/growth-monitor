import asyncio
import json
import os
import operator
from typing import Annotated, Any, AsyncGenerator, Dict, List, TypedDict

from langchain_core.tools import Tool
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
)
from langgraph.graph import END, StateGraph
from langgraph.prebuilt import ToolNode
from langchain_google_genai import ChatGoogleGenerativeAI

from db import (
    # Sales queries
    fetch_recent_insights, 
    fetch_sales_summary,
    fetch_sales_by_time_period,
    fetch_top_products,
    fetch_sales_by_region,
    fetch_top_sales_reps,
    fetch_sales_by_category,
    fetch_sales_by_channel,
    # Campaign queries
    fetch_campaigns_summary,
    fetch_campaign_performance_by_platform,
    fetch_campaign_performance_by_region,
    # Customer queries
    fetch_customer_summary,
    fetch_customer_segments,
    fetch_customer_retention_metrics,
    fetch_top_customers,
)


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]


async def _gather_user_context(user_id: str | None, company_id: str | None = None) -> Dict[str, Any]:
    """Gather comprehensive context about the user's business data."""
    if not user_id:
        return {}

    try:
        # Gather sales and insights data - use company_id for consistent data access
        sales_summary, recent_insights = await asyncio.gather(
            asyncio.to_thread(fetch_sales_summary, user_id, company_id),
            asyncio.to_thread(fetch_recent_insights, user_id, company_id),
        )
        
        context: Dict[str, Any] = {}
        if sales_summary:
            context["sales_summary"] = sales_summary
        if recent_insights:
            context["recent_insights"] = recent_insights
            
        return context
    except Exception:
        return {}


def _build_model() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
    return ChatGoogleGenerativeAI(
        model=model_name,
        temperature=float(os.getenv("GEMINI_TEMPERATURE", "0.2")),
        max_output_tokens=int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "1024")),
        google_api_key=api_key,
    )


def _stringify_content(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(item["text"])
            elif hasattr(item, "text"):
                parts.append(getattr(item, "text"))
        return "".join(parts)
    return json.dumps(content, default=str)


def _chunk_text(text: str, chunk_size: int = 100) -> List[str]:
    """
    Split text into chunks for streaming.
    Larger chunks = faster streaming, fewer network calls.
    """
    if not text:
        return []
    
    # For short text, send all at once
    if len(text) <= chunk_size:
        return [text]
    
    # Split by paragraphs first
    paragraphs = [segment.strip() for segment in text.split("\n\n") if segment.strip()]
    if not paragraphs:
        return [text]
    
    # Group small paragraphs together to reach chunk_size
    chunks = []
    current_chunk = ""
    
    for paragraph in paragraphs:
        # If adding this paragraph keeps us under chunk_size, add it
        if len(current_chunk) + len(paragraph) + 2 <= chunk_size:
            current_chunk += paragraph + "\n\n"
        else:
            # Current chunk is full, save it and start new one
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = paragraph + "\n\n"
    
    # Add remaining chunk
    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks if chunks else [text]


def _mock_response(query: str, context: Dict[str, Any]) -> List[str]:
    base = "GrowthMonitor AI is running in mock mode."
    context_summary = json.dumps(context, default=str) if context else "{}"
    return [
        base + "\n",
        f"Question: {query}\n",
        f"Context received: {context_summary}\n",
        "Please configure GEMINI_API_KEY to enable live analysis.",
    ]


def _build_tools(
    user_id: str | None,
    company_id: str | None,
    enriched_context: Dict[str, Any],
) -> List[Tool]:
    """Build comprehensive set of tools for the AI agent."""
    tools: List[Tool] = []

    def _format_output(data: Any, empty_message: str) -> str:
        if not data:
            print(f"⚠️  Tool returned no data: {empty_message}")
            return empty_message
        print(f"✅ Tool returned {len(data)} records")
        return json.dumps(data, indent=2, default=str)

    if user_id:
        # ============================================================
        # SALES TOOLS - Descriptive & Diagnostic
        # ============================================================
        
        def sales_summary_tool(_: str = "") -> str:
            """Get aggregated sales by channel."""
            print(f"🔧 Calling fetch_sales_by_channel: user_id={user_id}, company_id={company_id}")
            data = fetch_sales_by_channel(user_id, company_id)
            print(f"   Result: {data}")
            return _format_output(
                data,
                "No historical sales data found for this user.",
            )

        tools.append(
            Tool(
                name="fetch_sales_by_channel",
                description=(
                    "Get sales breakdown by channel (WhatsApp, Facebook, Website, etc.) "
                    "with total revenue, order count, and average order value. "
                    "Use for: 'Show sales by channel', 'Which channel performs best?'"
                ),
                func=sales_summary_tool,
            )
        )

        def sales_time_period_tool(time_query: str) -> str:
            """Get sales for a specific time period (week, month, quarter)."""
            # Parse common time expressions
            from datetime import datetime, timedelta
            now = datetime.now()
            
            # Default to last 30 days
            params = {"company_id": company_id}
            
            if "week" in time_query.lower():
                params["start_date"] = (now - timedelta(days=7)).strftime("%Y-%m-%d")
                params["group_by"] = "day"
            elif "month" in time_query.lower() or "july" in time_query.lower():
                params["start_date"] = (now - timedelta(days=30)).strftime("%Y-%m-%d")
                params["group_by"] = "day"
            elif "quarter" in time_query.lower() or "q2" in time_query.lower() or "q3" in time_query.lower():
                params["start_date"] = (now - timedelta(days=90)).strftime("%Y-%m-%d")
                params["group_by"] = "month"
            elif "year" in time_query.lower():
                params["start_date"] = (now - timedelta(days=365)).strftime("%Y-%m-%d")
                params["group_by"] = "month"
            
            data = fetch_sales_by_time_period(user_id, **params)
            return _format_output(
                data,
                "No sales data found for the specified period.",
            )

        tools.append(
            Tool(
                name="fetch_sales_by_time_period",
                description=(
                    "Get sales data for a specific time period with daily/weekly/monthly breakdown. "
                    "Shows total orders, revenue, average order value, and quantity sold over time. "
                    "Use for: 'Show me sales this week', 'Revenue in July', 'Q2 performance'"
                ),
                func=sales_time_period_tool,
            )
        )

        def top_products_tool(query: str = "") -> str:
            """Get top-selling products."""
            limit = 10
            if "top 5" in query.lower():
                limit = 5
            elif "top 3" in query.lower():
                limit = 3
            
            print(f"🔧 Calling fetch_top_products: user_id={user_id}, company_id={company_id}, limit={limit}")
            data = fetch_top_products(user_id, company_id, limit)
            print(f"   Result: {data[:2] if data else 'None'}... (showing first 2)")
            return _format_output(
                data,
                "No product sales data available.",
            )

        tools.append(
            Tool(
                name="fetch_top_products",
                description=(
                    "Get top-selling products by revenue with order count, quantity sold, and category. "
                    "Use for: 'Top selling products', 'Best performers', 'What sells most in Dhaka?'"
                ),
                func=top_products_tool,
            )
        )

        def sales_by_region_tool(_: str = "") -> str:
            """Get sales breakdown by region."""
            data = fetch_sales_by_region(user_id, company_id)
            return _format_output(
                data,
                "No regional sales data available.",
            )

        tools.append(
            Tool(
                name="fetch_sales_by_region",
                description=(
                    "Get sales performance by region (Dhaka, Chattogram, etc.) "
                    "with order count, total revenue, and average order value. "
                    "Use for: 'Which region performs best?', 'Dhaka vs Chattogram sales'"
                ),
                func=sales_by_region_tool,
            )
        )

        def top_sales_reps_tool(query: str = "") -> str:
            """Get top-performing sales representatives."""
            limit = 10
            if "top 5" in query.lower():
                limit = 5
            
            data = fetch_top_sales_reps(user_id, company_id, limit)
            return _format_output(
                data,
                "No sales representative data available.",
            )

        tools.append(
            Tool(
                name="fetch_top_sales_reps",
                description=(
                    "Get top-performing sales representatives with total sales, revenue, and average sale value. "
                    "Use for: 'Top 5 sales reps', 'Best performing team members', 'Who needs coaching?'"
                ),
                func=top_sales_reps_tool,
            )
        )

        def sales_by_category_tool(_: str = "") -> str:
            """Get sales breakdown by product category."""
            data = fetch_sales_by_category(user_id, company_id)
            return _format_output(
                data,
                "No category sales data available.",
            )

        tools.append(
            Tool(
                name="fetch_sales_by_category",
                description=(
                    "Get sales breakdown by product category (Apparel, Electronics, etc.) "
                    "with revenue, order count, quantity, and average order value. "
                    "Use for: 'Category performance', 'Which category sells best?', 'Winter products performance'"
                ),
                func=sales_by_category_tool,
            )
        )

        # ============================================================
        # CAMPAIGN TOOLS - Descriptive & Diagnostic
        # ============================================================

        def campaigns_summary_tool(query: str = "") -> str:
            """Get campaigns with performance metrics."""
            status = None
            if "active" in query.lower():
                status = "Active"
            elif "completed" in query.lower():
                status = "Completed"
            
            data = fetch_campaigns_summary(user_id, company_id, status)
            return _format_output(
                data,
                "No campaign data available.",
            )

        tools.append(
            Tool(
                name="fetch_campaigns_summary",
                description=(
                    "Get all campaigns with performance metrics including ROI, CTR, cost per lead, "
                    "conversions, and revenue. Shows campaign status, dates, spend, and impressions. "
                    "Use for: 'Show active campaigns', 'Eid campaign performance', 'Campaign ROI'"
                ),
                func=campaigns_summary_tool,
            )
        )

        def campaign_by_platform_tool(_: str = "") -> str:
            """Get campaign performance by platform."""
            data = fetch_campaign_performance_by_platform(user_id, company_id)
            return _format_output(
                data,
                "No campaign platform data available.",
            )

        tools.append(
            Tool(
                name="fetch_campaign_by_platform",
                description=(
                    "Get aggregated campaign performance by platform (Facebook, WhatsApp, Google, etc.) "
                    "with total spend, leads, conversions, revenue, ROI, and CTR. "
                    "Use for: 'Which channel performs best?', 'Facebook vs WhatsApp ads', 'Best ad platform'"
                ),
                func=campaign_by_platform_tool,
            )
        )

        def campaign_by_region_tool(_: str = "") -> str:
            """Get campaign performance by region."""
            data = fetch_campaign_performance_by_region(user_id, company_id)
            return _format_output(
                data,
                "No regional campaign data available.",
            )

        tools.append(
            Tool(
                name="fetch_campaign_by_region",
                description=(
                    "Get campaign performance by target region with spend, leads, conversions, revenue, and ROI. "
                    "Use for: 'Why did Eid campaign underperform in Chattogram?', 'Regional campaign effectiveness'"
                ),
                func=campaign_by_region_tool,
            )
        )

    # ============================================================
    # CUSTOMER TOOLS - Descriptive & Diagnostic
    # ============================================================
    
    if company_id:
        def customer_summary_tool(_: str = "") -> str:
            """Get customer summary with purchase behavior."""
            data = fetch_customer_summary(company_id)
            return _format_output(
                data,
                "No customer data available.",
            )

        tools.append(
            Tool(
                name="fetch_customer_summary",
                description=(
                    "Get all customers with total orders, spending, average order value, "
                    "first and last purchase dates. "
                    "Use for: 'Show all customers', 'Customer list', 'Who are my customers?'"
                ),
                func=customer_summary_tool,
            )
        )

        def customer_segments_tool(_: str = "") -> str:
            """Get customer segments by behavior."""
            data = fetch_customer_segments(company_id)
            return _format_output(
                data,
                "No customer segmentation data available.",
            )

        tools.append(
            Tool(
                name="fetch_customer_segments",
                description=(
                    "Get customers segmented by purchase behavior (Loyal, Occasional, One-time, At Risk). "
                    "Shows order count, total spending, and status. "
                    "Use for: 'Customer segments', 'Who is at risk of churning?', 'Loyal customers'"
                ),
                func=customer_segments_tool,
            )
        )

        def customer_retention_tool(_: str = "") -> str:
            """Get customer retention metrics."""
            data = fetch_customer_retention_metrics(company_id)
            return _format_output(
                data,
                "No retention data available.",
            )

        tools.append(
            Tool(
                name="fetch_customer_retention_metrics",
                description=(
                    "Get monthly customer retention metrics with active, returning, and new customers. "
                    "Shows retention rates and churn analysis. "
                    "Use for: 'Customer retention', 'Why did retention drop?', 'New vs returning customers'"
                ),
                func=customer_retention_tool,
            )
        )

        def top_customers_tool(query: str = "") -> str:
            """Get top customers by spending."""
            limit = 10
            if "top 5" in query.lower():
                limit = 5
            
            data = fetch_top_customers(company_id, limit)
            return _format_output(
                data,
                "No top customer data available.",
            )

        tools.append(
            Tool(
                name="fetch_top_customers",
                description=(
                    "Get top customers by total spending with order count and last purchase date. "
                    "Use for: 'Top customers', 'Best buyers', 'Who spends most?', 'VIP customers'"
                ),
                func=top_customers_tool,
            )
        )

    # ============================================================
    # INSIGHTS & CONTEXT
    # ============================================================

    if user_id:
        def insights_tool(_: str = "") -> str:
            """Get recent insights."""
            data = fetch_recent_insights(user_id, company_id)
            return _format_output(
                data,
                "No recent insights are available for this user.",
            )

        tools.append(
            Tool(
                name="fetch_recent_insights",
                description=(
                    "Get the latest AI-generated insights, recommendations, warnings, and trends. "
                    "Use for context about recent business patterns and opportunities."
                ),
                func=insights_tool,
            )
        )

    def context_tool(_: str = "") -> str:
        """Access request context."""
        return _format_output(
            enriched_context,
            "No supplemental context was provided with this request.",
        )

    tools.append(
        Tool(
            name="fetch_request_context",
            description="Access the structured JSON payload supplied by the frontend along with this AI query.",
            func=context_tool,
        )
    )

    return tools


def _create_agent_app(
    tools: List[Tool],
) -> Any:
    llm = _build_model().bind_tools(tools)

    def call_agent(state: AgentState) -> Dict[str, List[BaseMessage]]:
        print(f"🤖 Calling LLM with {len(state['messages'])} messages...")
        print(f"🔧 Available tools: {[t.name for t in tools]}")
        response = llm.invoke(state["messages"])
        if isinstance(response, AIMessage) and response.tool_calls:
            print(f"🔧 AI wants to call {len(response.tool_calls)} tools:")
            for tool_call in response.tool_calls:
                print(f"   - {tool_call.get('name', 'unknown')}")
        else:
            print(f"💬 AI responded without calling tools")
            print(f"   Response content: {response.content if hasattr(response, 'content') else 'N/A'}")
        return {"messages": [response]}

    def should_continue(state: AgentState) -> str:
        last_message = state["messages"][-1]
        if isinstance(last_message, AIMessage) and last_message.tool_calls:
            return "continue"
        return "end"

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_agent)
    workflow.add_node("tools", ToolNode(tools))
    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "continue": "tools",
            "end": END,
        },
    )
    workflow.add_edge("tools", "agent")
    workflow.set_entry_point("agent")

    return workflow.compile()


async def stream_ai_response(
    query: str,
    context: Dict[str, Any] | None,
    user_id: str | None,
) -> AsyncGenerator[str, None]:
    base_context = dict(context or {})
    company_id = base_context.get("companyId") or base_context.get("company_id")
    
    user_context = await _gather_user_context(user_id, company_id)
    enriched_context = {**base_context, **user_context}

    try:
        tools = _build_tools(user_id, company_id, enriched_context)
        agent_app = _create_agent_app(tools)
    except RuntimeError:
        chunks = _mock_response(query, enriched_context)
        for chunk in chunks:
            yield chunk
        return
    except Exception as error:  # pragma: no cover - defensive path
        fallback = _mock_response(query, enriched_context)
        fallback.append(f"Encountered error while creating agent: {error}")
        for chunk in fallback:
            yield chunk
        return

    system_message = (
        "You are GrowthMonitor AI, an expert business intelligence assistant for SME owners, "
        "marketing managers, and sales teams. You provide data-driven insights with specific numbers.\n\n"
        
        "## ⚠️ CRITICAL RESPONSE RULES (YOU MUST FOLLOW THESE):\n\n"
        
        "1. **YOU MUST CALL TOOLS FIRST** - For EVERY question about sales, products, campaigns, or customers, "
        "you MUST call the appropriate tool to fetch real data BEFORE responding. NEVER give answers without calling tools.\n"
        "2. **ALWAYS include ALL items requested** - If asked for \"top 5\", show ALL 5 items, not just 2-3\n"
        "3. **ALWAYS show specific numbers** - Include exact amounts, percentages, counts from the data\n"
        "4. **ALWAYS use clear formatting** - Use numbered lists (#1, #2, #3...) with bullet points for details\n"
        "5. **NEVER give generic responses** - Every answer must cite actual data from the tools\n\n"
        
        "## 🔧 Available Tools - YOU MUST USE THESE:\n"
        "- fetch_top_products: Get top selling products (USE THIS FOR: \"top products\", \"best sellers\")\n"
        "- fetch_sales_summary: Get overall sales metrics\n"
        "- fetch_sales_by_channel: Get sales by channel (WhatsApp, Phone, etc.)\n"
        "- fetch_sales_by_region: Get sales by region\n"
        "- fetch_campaigns_summary: Get campaign performance\n"
        "- fetch_customer_summary: Get customer statistics\n\n"
        
        "## Response Format Template:\n\n"
        "For ranking questions (top products, best channels, etc.):\n"
        "```\n"
        "Here are [the requested items]:\n\n"
        "#1. [Name/Title]\n"
        "   • Revenue: ৳XX,XXX ([XX] orders)\n"
        "   • Key metric: [specific number]\n"
        "   • Insight: [brief context]\n\n"
        "#2. [Name/Title]\n"
        "   • Revenue: ৳XX,XXX ([XX] orders)\n"
        "   ...\n"
        "[Continue for ALL requested items]\n\n"
        "**Key Takeaway:** [One-line actionable insight]\n"
        "```\n\n"
        
        "For comparison questions:\n"
        "```\n"
        "[Channel A] vs [Channel B]:\n\n"
        "**[Channel A]:**\n"
        "• Metric 1: [specific number]\n"
        "• Metric 2: [specific number]\n\n"
        "**[Channel B]:**\n"
        "• Metric 1: [specific number]\n"
        "• Metric 2: [specific number]\n\n"
        "**Winner:** [Channel] is [X]% better in [metric]\n"
        "```\n\n"
        
        "## Your Capabilities:\n\n"
        "**Sales Analysis:** Show revenue, orders, products, regions, channels, categories, sales reps\n"
        "**Campaign Analysis:** Show ROI, CTR, spend, platforms, conversions, revenue generated\n"
        "**Customer Analysis:** Show segments, retention, churn risk, top customers, purchase behavior\n"
        "**Trends & Forecasting:** Analyze patterns over time, predict future performance\n"
        "**Recommendations:** Suggest specific actions based on data (with numbers to back it up)\n\n"
        
        "## Conversation Context:\n"
        "- Reference previous messages when users say 'that', 'it', 'those'\n"
        "- Build on previous analysis, don't repeat information\n"
        "- If asked to elaborate, provide deeper analysis with more metrics\n\n"
        
        "**REMEMBER:** Complete responses with ALL requested items and specific numbers!"
    )

    # Build conversation history from context
    conversation_history = []
    if enriched_context and "conversationHistory" in enriched_context:
        history = enriched_context.get("conversationHistory", [])
        if isinstance(history, list):
            for msg in history:
                if isinstance(msg, dict) and "role" in msg and "content" in msg:
                    role = msg["role"]
                    content = msg["content"]
                    if role == "user":
                        conversation_history.append(HumanMessage(content=content))
                    elif role == "assistant":
                        conversation_history.append(AIMessage(content=content))
    
    # Add supplemental context to system message (excluding conversationHistory)
    if enriched_context:
        context_without_history = {k: v for k, v in enriched_context.items() if k != "conversationHistory"}
        if context_without_history:
            serialized_context = json.dumps(context_without_history, indent=2, default=str)
            system_message += f"\n\nSupplemental context (JSON):\n{serialized_context}"

    # Build initial state with conversation history
    messages = [SystemMessage(content=system_message)]
    messages.extend(conversation_history)
    messages.append(HumanMessage(content=query))
    
    initial_state: AgentState = {
        "messages": messages
    }

    try:
        # Limit recursion to speed up responses (max 10 agent-tool loops)
        config = {"recursion_limit": 10}
        result_state = await agent_app.ainvoke(initial_state, config=config)
    except Exception as error:  # pragma: no cover - defensive path
        fallback = _mock_response(query, enriched_context)
        fallback.append(f"Encountered error while running agent: {error}")
        for chunk in fallback:
            yield chunk
        return

    ai_messages = [
        message
        for message in result_state.get("messages", [])
        if isinstance(message, AIMessage)
    ]

    if not ai_messages:
        for chunk in _mock_response(query, enriched_context):
            yield chunk
        return

    final_message = ai_messages[-1]
    text_content = _stringify_content(final_message.content)
    print(f"\n📝 Full AI response ({len(text_content)} chars):")
    print(f"   {text_content[:200]}...")
    if len(text_content) > 200:
        print(f"   ...{text_content[-200:]}")
    
    chunks = _chunk_text(text_content)
    print(f"📦 Chunked into {len(chunks)} pieces")
    for chunk in chunks:
        yield chunk
