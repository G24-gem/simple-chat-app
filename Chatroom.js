const http = require('http');
const fs = require('fs');
const path = require('path');

// Directory where messages will be stored
const messagesDir = path.join(__dirname, 'messages2');

// Ensure messages directory exists
if (!fs.existsSync(messagesDir)) {
    fs.mkdirSync(messagesDir);
}

// Serve HTML, CSS, and JS all in one single server file
const server = http.createServer((req, res) => {
    if (req.method === 'GET') {
        if (req.url === '/') {
            // Serve HTML with inline CSS and JS
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Simple Chat App</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                        #chat-box { width: 100%; height: 300px; border: 1px solid #ccc; overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
                        #message { width: 80%; padding: 10px; }
                        #send { padding: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Simple Chat App</h1>
                    <div id="chat-box"></div>
                    <input type="text" id="message" placeholder="Type a message...">
                    <button id="send">Send</button>

                    <script>
                        const chatBox = document.getElementById('chat-box');
                        const messageInput = document.getElementById('message');
                        const sendButton = document.getElementById('send');
                            if (localStorage.Username === undefined || null) {
                                localStorage.Username = "anonymous"+""+Math.floor(Math.random()*1000000000);
                                alert(234)
                            }

                        // Fetch and display messages
                        function loadMessages() {
                            fetch('/messages').then(response => response.json()).then(data => {
                                chatBox.innerHTML = '';
                                data.forEach(msg => {
                                    const div = document.createElement('div');
                                    div.textContent = msg;
                                    chatBox.appendChild(div);
                                });
                                chatBox.scrollTop = chatBox.scrollHeight;
                            });
                        }

                        // Send message to the server
                        sendButton.addEventListener('click', () => {
                            const message = \`\${localStorage.Username}: \${messageInput.value}\`;
                            if (message.trim()) {
                                fetch('/send', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({message })
                                }).then(() => {
                                    messageInput.value = '';
                                    loadMessages(); // Refresh messages after sending
                                });
                            }
                        });

                        // Poll for new messages every 2 seconds
                        setInterval(loadMessages, 2000);
                        loadMessages(); // Initial load
                    </script>
                </body>
                </html>
            `);
        } else if (req.url === '/messages') {
            // Serve the list of all messages
            fs.readdir(messagesDir, (err, files) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Could not read messages directory' }));
                }
                const messages = files.map(file => { 
                    const filePath = path.join(messagesDir, file);
                    return fs.readFileSync(filePath, 'utf-8');
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(messages));
            });
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    } else if (req.method === 'POST' && req.url === '/send') {
        // Handle new message submission
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const { message } = JSON.parse(body);
            const timestamp = Date.now();
            const filePath = path.join(messagesDir, `${timestamp}.txt`);
            fs.writeFile(filePath, message, err => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Failed to save message' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
        });
    } else {
        res.writeHead(405);
        res.end('Method Not Allowed');
    }
});

// Start the server
server.listen(3030 || process.env.PORT, () => {
    console.log('Server is running on http://localhost:3000');
});
