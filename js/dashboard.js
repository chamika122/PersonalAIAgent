
const API_BASE = "/api";
const USER_ID = 1;

let currentConversationId = null;

const conversationList = document.getElementById("conversationList");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const chatContainer = document.getElementById("messagesContainer");
const connectionStatus = document.getElementById("connectionStatus");

async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE}/health`);

        if (!response.ok) throw new Error("Backend unavailable");

        connectionStatus.textContent = "● Backend Connected";
        connectionStatus.style.color = "#22c55e";
    } catch (error) {
        connectionStatus.textContent = "● Backend Disconnected";
        connectionStatus.style.color = "#ef4444";
    }
}

function showMessage(role, content) {
    const welcome = document.getElementById("welcomeScreen");
    if (welcome) welcome.style.display = "none";

    const message = document.createElement("div");

    message.style.cssText = `
        padding: 16px;
        margin-bottom: 15px;
        border-radius: 10px;
        background: ${role === "user" ? "#263b5c" : "#252525"};
        line-height: 1.6;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
    `;

    const label = document.createElement("strong");
    label.textContent = role === "user" ? "You" : "AI Assistant";

    const text = document.createElement("p");
    text.textContent = content;
    text.style.marginTop = "8px";

    message.append(label, text);
    chatContainer.appendChild(message);

    message.scrollIntoView({ behavior: "smooth", block: "end" });
}

async function loadConversations() {
    try {
        const response = await fetch(
            `${API_BASE}/users/${USER_ID}/conversations`
        );

        if (!response.ok) throw new Error("Could not load conversations");

        const data = await response.json();
        conversationList.replaceChildren();

        if (!data.conversations.length) {
            const empty = document.createElement("p");
            empty.className = "empty-text";
            empty.textContent = "No conversations yet.";
            conversationList.appendChild(empty);
            return;
        }

        data.conversations.forEach(item => {
            const button = document.createElement("button");

            button.textContent = item.title;
            button.style.cssText = `
                width: 100%;
                text-align: left;
                padding: 11px;
                background: ${item.id === currentConversationId ? "#333" : "transparent"};
                color: #ccc;
                border: none;
                border-radius: 7px;
                cursor: pointer;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            `;

            button.addEventListener("click", () => {
                loadMessages(item.id);
            });

            conversationList.appendChild(button);
        });
    } catch (error) {
        console.error("Conversation loading error:", error);
        conversationList.textContent = "Unable to load conversations.";
    }
}

async function loadMessages(conversationId) {
    try {
        const response = await fetch(
            `${API_BASE}/conversations/${conversationId}/messages?user_id=${USER_ID}`
        );

        if (!response.ok) throw new Error("Could not load chat history");

        const data = await response.json();

        currentConversationId = conversationId;
        chatContainer.replaceChildren();

        if (data.messages.length === 0) {
            document.getElementById("welcomeScreen").style.display = "block";
    chatContainer.innerHTML = `
                <div class="welcome-screen">
                    <h1>Personal AI Assistant</h1>
                    <p>How can I help you today?</p>
                </div>
            `;
        } else {
            data.messages.forEach(item => {
                showMessage(item.role, item.content);
            });
        }

        await loadConversations();
    } catch (error) {
        console.error("Message loading error:", error);
        alert("Unable to load conversation.");
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    messageInput.value = "";
    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";

    showMessage("user", message);

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id: USER_ID,
                message: message,
                conversation_id: currentConversationId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "AI request failed");
        }

        currentConversationId = data.conversation_id;

        showMessage("assistant", data.response);

        await loadConversations();

    } catch (error) {
        console.error("Chat error:", error);
        showMessage("assistant", "Error: " + error.message);
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send";
        messageInput.focus();
    }
}

document.getElementById("newChatBtn").addEventListener("click", () => {
    currentConversationId = null;

    document.getElementById("welcomeScreen").style.display = "block";
    chatContainer.innerHTML = `
        <div class="welcome-screen">
            <h1>Personal AI Assistant</h1>
            <p>How can I help you today?</p>
        </div>
    `;

    loadConversations();
});

document.getElementById("clearChatBtn").addEventListener("click", () => {
    currentConversationId = null;

    document.getElementById("welcomeScreen").style.display = "block";
    chatContainer.innerHTML = `
        <div class="welcome-screen">
            <h1>Personal AI Assistant</h1>
            <p>Start a new conversation.</p>
        </div>
    `;

    messageInput.value = "";
});

sendBtn.addEventListener("click", sendMessage);

messageInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

checkConnection();
loadConversations();
