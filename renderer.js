console.log("[DEBUG] renderer.js loaded");

document.addEventListener("DOMContentLoaded", () => {
    //Connect to Socket.io server
    console.log('[DEBUG] Attempting to connect to Socket.io...')
    const socket = io('http://localhost:3000', {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    //UI elements
    const sendBtn = document.getElementById("sendBtn");
    const messageInput = document.getElementById("message");
    const chatBox = document.getElementById("chatBox");
    const workspaceInput = document.getElementById('workspace');
    const createBtn = document.getElementById('createWorkspace');
    const joinBtn = document.getElementById('joinWorkspace');
    const profileDiv = document.getElementById('profile');

    let currentWorkspace = null;

    socket.on('connect', () => {
        console.log('Connected to server with id:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server with id:', socket.id);
    });

    socket.on('reconnect_attempt', (attempt) => {
        console.log('Attempting to reconnect to socket.io', attempt);
    })

    fetch('http://localhost:3000/api/current_user', { credentials: 'include' })
        .then(res => {
            if (res.status === 200) return res.json();
            throw new Error('Not Authenticated');
        })
        .then(user => {
            profileDiv.innerHTML = `
            <img src="${user.avatarUrl}" alt="Avatar">
            <span>${user.displayName}</span>
            `;
        })
        .catch(err => {
            console.error('User not authenticated:', err)
            profileDiv.innerHTML = `<a href="http://localhost:3000/auth/github">Login with GitHub</a>`;
        });

    //Create workspace event
    createBtn.addEventListener('click', () => {
        const workspaceName = workspaceInput.value.trim();
        if (workspaceName) {
            socket.emit('createWorkspace', workspaceName);
            currentWorkspace = workspaceName;
            console.log('Creating/Joining workspace:', currentWorkspace);
        }
    });

    //Join workspace event
    joinBtn.addEventListener('click', () => {
        const workspaceName = workspaceInput.value.trim();
        if (workspaceName) {
            socket.emit('joinWorkspace', workspaceName);
            currentWorkspace = workspaceName;
            console.log('Joining workspace:', currentWorkspace);
        }
    });

    //Send chat event
    sendBtn.addEventListener('click', () => {
        const msg = messageInput.value.trim();
        if (msg && currentWorkspace) {
            socket.emit('chatMessage', { workspace: currentWorkspace, msg });
            messageInput.value = '';
        }
    });

    //Display incoming chat
    socket.on('chatMessage', ({ senderId, msg, timestamp }) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const header = document.createElement('div');
        header.classList.add('message-header');

        const senderElement = document.createElement('span');
        senderElement.classList.add('sender');
        senderElement.textContent = senderId;
        //TODO:Replace senderId with proper username system

        const timeElement = document.createElement('span');
        timeElement.classList.add('time');
        timeElement.textContent = timestamp;

        header.appendChild(senderElement);
        header.appendChild(timeElement);

        //Message content
        const messageText = document.createElement('p');
        messageText.textContent = msg;

        messageElement.appendChild(header);
        messageElement.appendChild(messageText);
        chatBox.appendChild(messageElement);
    });
});





















