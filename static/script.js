// Environment variables (Replace with actual values)
const endpoint = "https://iocl-hr-openai-service.openai.azure.com/";
const deployment = "gpt-4o";
const subscriptionKey = "9f82a1e82c7444e8a8453f9d7f787e2a"; // Your actual API key
 
// Search Service Variables
const searchEndpoint = "https://ioclhrbotlanguageservice-as4opiftbiczhpi.search.windows.net";
const searchKey = "KdAi5bqgwcJcIW1wLhD3DbanfpxoghPuU1wtzUGxmZAzSeD9rKzi";
const searchIndex = "iocl-chunk-idx";
async function callChatbotAPI(message) {
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;

    const headers = {
        "Content-Type": "application/json",
        "api-key": subscriptionKey
    };

    const body = {
        "messages": [
            {
                "role": "system",
                "content": "You are an AI assistant that helps people find information."
            },
            {
                "role": "user",
                "content": message
            }
        ],
        "max_tokens": 800,
        "temperature": 0.4,
        "top_p": 0.95,
        "frequency_penalty": 0,
        "presence_penalty": 0,
        "data_sources": [
            {
                "type": "azure_search",
                "parameters": {
                    "endpoint": searchEndpoint,
                    "index_name": searchIndex,
                    "semantic_configuration": "default",
                    "query_type": "vector_simple_hybrid",
                    "fields_mapping": {},
                    "in_scope": true,
                    "role_information": "You are an AI assistant that must provide users with specific information from the documents and **mention the document name** only in this format e.g. 'documemnt.pdf'. For each question, you **must** include the **exact** line numbers from the document, where the content in your response can be directly verified. Do not approximate or provide inaccurate line numbers. The format must be like e.g. '(document_name.pdf, Lines Y-Z).' Additionally, provide a **reference link to the document in this format e.g. 'https://ioclhrchatgpt.blob.core.windows.net/hrhbtb-pdf-chunks/{document_name}' where document_name is the document name from where the response is queried." ,
                    "filter": null,
                    "strictness": 4,
                    "top_n_documents": 20,
                    "authentication": {
                        "type": "api_key",
                        "key": searchKey
                    },
                    "embedding_dependency": {
                        "type": "deployment_name",
                        "deployment_name": "iocl-ada"
                    }
                }
            }
        ]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (response.ok) {
            const jsonResponse = await response.json();
            console.log("Received response:", jsonResponse);
            return jsonResponse.choices[0].message.content; // Extracting the message content
        } else {
            console.error('Error response from API:', response.status, response.statusText);
            return 'Error retrieving a response. Please try again later.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return 'Error retrieving a response. Please check your connection and try again later.';
    }
}

async function sendMessage() {
    const inputField = document.getElementById('chat-input');
    const message = inputField.value.trim();

    if (message === '') return;

    addMessageToChat('You', message);
    inputField.value = '';

    const chatbotResponse = await callChatbotAPI(message);
    let responseWithLink = chatbotResponse;
    if (chatbotResponse.toLowerCase().includes('pdf')) {
        const encodedText = encodeURIComponent(chatbotResponse); 
        responseWithLink += `<br><a href="/view-pdf?response=${encodedText}" target="_blank" style="color: blue; text-decoration: underline;">View in PDF</a>`;
    }
     else {
        responseWithLink += `<br><small style="color: grey;">Generated by AI.</small>`;
    }

    addMessageToChat('IOCL Bot', responseWithLink);
}

// Function to add a message to the chat window
function addMessageToChat(sender, message) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageElement = document.createElement('div');
    messageElement.innerHTML = `${sender}: ${message}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Function to toggle the chatbot window
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    if (chatbotWindow.classList.contains('active')) {
        chatbotWindow.classList.remove('active');
        chatbotWindow.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            chatbotWindow.style.display = 'none';
        }, 300);
    } else {
        chatbotWindow.style.display = 'flex';
        chatbotWindow.classList.add('active');
        chatbotWindow.style.animation = 'fadeIn 0.3s ease-out';
        addMessageToChat('IOCL Bot', 'Hello, how may I assist you?');
    }
}