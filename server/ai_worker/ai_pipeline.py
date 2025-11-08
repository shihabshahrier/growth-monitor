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

from db import fetch_recent_insights, fetch_sales_summary


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], operator.add]


async def _gather_user_context(user_id: str | None) -> Dict[str, Any]:
    if not user_id:
        return {}

    try:
        sales_summary, recent_insights = await asyncio.gather(
            asyncio.to_thread(fetch_sales_summary, user_id),
            asyncio.to_thread(fetch_recent_insights, user_id),
        )
    except Exception:
        return {}

    context: Dict[str, Any] = {}
    if sales_summary:
        context["sales_summary"] = sales_summary
    if recent_insights:
        context["recent_insights"] = recent_insights
    return context


def _build_model() -> ChatGoogleGenerativeAI:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro-latest")
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


def _chunk_text(text: str) -> List[str]:
    if not text:
        return []
    paragraphs = [segment.strip() for segment in text.split("\n\n") if segment.strip()]
    if not paragraphs:
        return [text]
    return [paragraph + "\n\n" for paragraph in paragraphs]


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
    enriched_context: Dict[str, Any],
) -> List[Tool]:
    tools: List[Tool] = []

    def _format_output(data: Any, empty_message: str) -> str:
        if not data:
            return empty_message
        return json.dumps(data, indent=2, default=str)

    if user_id:
        def sales_tool(_: str = "") -> str:
            data = fetch_sales_summary(user_id)
            return _format_output(
                data,
                "No historical sales data found for this user.",
            )

        tools.append(
            Tool(
                name="fetch_sales_summary",
                description="Retrieve aggregated revenue performance by channel for the authenticated user.",
                func=sales_tool,
            )
        )

        def insights_tool(_: str = "") -> str:
            data = fetch_recent_insights(user_id)
            return _format_output(
                data,
                "No recent insights are available for this user.",
            )

        tools.append(
            Tool(
                name="fetch_recent_insights",
                description="Return the latest saved insights (title, summary, payload) for the authenticated user.",
                func=insights_tool,
            )
        )

    def context_tool(_: str = "") -> str:
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
        response = llm.invoke(state["messages"])
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
    user_context = await _gather_user_context(user_id)
    enriched_context = {**base_context, **user_context}

    try:
        tools = _build_tools(user_id, enriched_context)
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
        "You are GrowthMonitor, an AI co-pilot for revenue leaders. "
        "Leverage available tools for data retrieval. When delivering answers, "
        "provide concise insights, actionable recommendations, and optional next steps. "
        "Always cite which tools (if any) you used."
    )

    if enriched_context:
        serialized_context = json.dumps(enriched_context, indent=2, default=str)
        system_message += f"\n\nSupplemental context (JSON):\n{serialized_context}"

    initial_state: AgentState = {
        "messages": [
            SystemMessage(content=system_message),
            HumanMessage(content=query),
        ]
    }

    try:
        result_state = await agent_app.ainvoke(initial_state)
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
    for chunk in _chunk_text(text_content):
        yield chunk
