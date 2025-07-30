// --- User State
const defaultUser = {
    username: "User",
    avatar: "https://ui-avatars.com/api/?name=User&background=7289da&color=fff",
    theme: "dark",
};
let user = JSON.parse(localStorage.getItem("ss_user")) || defaultUser;
applyTheme();

function updateUser(newUser) {
    user = {...user, ...newUser};
    localStorage.setItem("ss_user", JSON.stringify(user));
    document.getElementById("user-name").textContent = user.username;
    document.getElementById("user-avatar").src = user.avatar;
    applyTheme();
}

function applyTheme() {
    document.documentElement.setAttribute("data-theme", user.theme);
}

// --- Channels and Messages
const channels = {
    announcements: [
        {user: "system", text: "Welcome to #announcements. Stay tuned for updates!", time: Date.now()},
        {user: "system", text: "This is a read-only channel.", time: Date.now()},
    ],
    general: [
        {user: "system", text: "Welcome to #general", time: Date.now()},
    ],
    help: [
        {user: "system", text: "Welcome to #help. How can we assist you today?", time: Date.now()},
    ],
    random: [
        {user: "system", text: "Welcome to #random. Share your thoughts!", time: Date.now()},
    ]
};

let currentChannel = "general";

// --- Limits
const CHAR_LIMIT = 4000;
const FILE_LIMIT = 500 * 1024 * 1024;

// --- Tenor GIF API
const TENOR_API_KEY = "LIVDSRZULELA";
const TENOR_SEARCH_URL = "https://tenor.googleapis.com/v2/search";
const TENOR_TRENDING_URL = "https://tenor.googleapis.com/v2/featured";

// --- DOM Elements
const channelList = document.getElementById("channel-list");
const messagesContainer = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const charCount = document.getElementById("char-count");
const fileInput = document.getElementById("file-input");
const livePreviewContainer = document.getElementById("live-preview-container");
const livePreview = document.getElementById("live-preview");
const currentChannelSpan = document.getElementById("current-channel");
const slashCommandsList = document.getElementById("slash-commands-list");
const toastContainer = document.getElementById("toast-container");
const emojiBtn = document.getElementById("emoji-btn");
const emojiPickerModal = document.getElementById("emoji-picker-modal");
const emojiGrid = document.getElementById("emoji-grid");
const emojiPickerClose = document.getElementById("emoji-picker-close");
const gifBtn = document.getElementById("gif-btn");
const gifPickerModal = document.getElementById("gif-picker-modal");
const gifSearchInput = document.getElementById("gif-search-input");
const gifSearchBtn = document.getElementById("gif-search-btn");
const gifGrid = document.getElementById("gif-grid");
const gifPickerClose = document.getElementById("gif-picker-close");

const workspaceIDE = document.getElementById("workspace-ide");
let editorView = null;
const runBtn = document.getElementById("run-btn");
const outputPanel = document.getElementById("output-panel");

// --- Slash Commands
const slashCommands = [
    {command: "help", description: "Show help information"},
    {command: "shrug", description: "Send a shrug emoticon '¯\\_(ツ)_/¯'"}
];

// --- File Upload State
let uploadedFile = null;

// --- Channel Switching
channelList.addEventListener("click", (event) => {
    const li = event.target.closest(".channel");
    if (li) {
        document.querySelectorAll(".channel").forEach(channel =>
            channel.classList.remove("active")
        );
        li.classList.add("active");
        currentChannel = li.dataset.channel;
        currentChannelSpan.textContent = "# " + currentChannel;
        renderMessages();
        toggleInputBar();
        toggleWorkspaceIDE();
    }
});

// --- Toggle Workspace IDE
function toggleWorkspaceIDE() {
    if (currentChannel === "workspace") {
        messagesContainer.style.display = "none";
        workspaceIDE.style.display = "block";
        document.getElementById("message-form").style.display = "none";
        initCodeMirrorEditor();
    } else {
        workspaceIDE.style.display = "none";
        messagesContainer.style.display = "flex";
    }


// --- Initialize CodeMirror Editor (only once)
    function initCodeMirrorEditor() {
        if (editorView) return;
        // Wait for CodeMirror library (loaded via window.CodeMirrorLib)
        if (!window.CodeMirrorLib) {
            setTimeout(initCodeMirrorEditor, 100);
            return;
        }
        const {EditorView, EditorState, basicSetup, javascript} = window.CodeMirrorLib;
        editorView = new EditorView({
            state: EditorState.create({
                doc: `// Write JavaScript code here!\nconsole.log("Hello StackSpace!");`,
                extensions: [
                    basicSetup,
                    javascript(),
                    EditorView.theme({
                        "&": {backgroundColor: "#23272a"},
                    }),
                ]
            }),
            parent: document.getElementById("editor")
        });
    }

    // --- Run Button Logic
    runBtn.addEventListener("click", () => {
        if (!editorView) return;
        outputPanel.textContent = "";
        const code = editorView.state.doc.toString();
        // Capture console.log output
        let result = "";
        const oldLog = console.log;
        console.log = function (...args) {
            result += args.join(" ") + "\n";
            oldLog.apply(console, args);
        };
        try {
            // eslint-disable-next-line no-eval
            let evalResult = eval(code);
            if (evalResult !== undefined) result += evalResult + "\n";
            outputPanel.textContent = result || "(No output)";
        } catch (e) {
            outputPanel.textContent = "Error: " + e.message;
        }
        console.log = oldLog;
    });

// --- Toggle Input Bar based on channel
    function toggleInputBar() {
        const messageForm = document.getElementById("message-form");
        if (currentChannel === "announcements") {
            messageForm.style.display = "none";
        } else {
            messageForm.style.display = "flex";
        }
    }

// --- Render Messages
    function renderMessages() {
        messagesContainer.innerHTML = "";
        (channels[currentChannel] || []).forEach(msg => {
            const msgDiv = document.createElement("div");
            msgDiv.className = "message" + (msg.user === "user" ? " user" : "");

            // Avatar
            const avatarImg = document.createElement("img");
            avatarImg.className = "avatar";
            avatarImg.src = (msg.avatar || (msg.user === "user" ? user.avatar : "https://ui-avatars.com/api/?name=System&background=7289da&color=fff"));
            avatarImg.alt = msg.username || (msg.user === "user" ? user.username : "System");
            msgDiv.appendChild(avatarImg);

            // Bubble
            const bubble = document.createElement("div");
            bubble.className = "msg-bubble";

            // Meta (name and time)
            if (msg.user !== "system") {
                const meta = document.createElement("div");
                meta.className = "msg-meta";
                meta.textContent = (msg.username || "User") + " - " +
                    (msg.time ? new Date(msg.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : "");
                bubble.appendChild(meta);
            }

            // Content (markdown, file, gif)
            const content = document.createElement("div");
            content.className = "msg-content";
            let contentHtml = "";
            if (msg.html) {
                content.innerHTML += msg.html;
            } else if (msg.text) {
                contentHtml += escapeHTML(msg.text).replace(/\n/g, "<br>");
            }
            if (msg.file) {
                if (msg.file.url && msg.file.type && msg.file.type.startsWith("image/")) {
                    contentHtml += `<br><img src="${msg.file.url}" alt="${escapeHTML(msg.file.name)}"><div class="uploaded-file-preview">${escapeHTML(msg.file.name)}</div>`;
                } else {
                    contentHtml += `<br><a href="${msg.file.url}" target="_blank">${escapeHTML(msg.file.name)}</a>`;
                }
            }
            if (msg.gif) {
                contentHtml += `<br><img src="${msg.gif}" alt="GIF" style="max-width:220px;max-height:180px;border-radius:8px;">`;
            }
            content.innerHTML += contentHtml;
            bubble.appendChild(content);

            msgDiv.appendChild(bubble);
            messagesContainer.appendChild(msgDiv);
        });
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function escapeHTML(str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function (m) {
            return ({
                "&": "&amp;", "<": "&lt;", ">": "&gt;",
                '"': "&quot;", "'": "&#39;"
            })[m];
        });
    }

// --- Live Markdown Preview
    messageInput.addEventListener("input", () => {
        const val = messageInput.value;
        updateCharCount();
        if (val.trim() && !val.startsWith("/")) {
            livePreviewContainer.style.display = "block";
            livePreview.innerHTML = marked.parse(val);
        } else {
            livePreviewContainer.style.display = "none";
            livePreview.innerHTML = "";
        }
        handleSlashCommands(val);
    });

// --- Character Count
    function updateCharCount() {
        const len = messageInput.value.length;
        charCount.textContent = `${len}/${CHAR_LIMIT}`;
        if (len > CHAR_LIMIT) {
            charCount.classList.add("limit-exceeded");
        } else {
            charCount.classList.remove("limit-exceeded");
        }
    }

    messageInput.addEventListener("input", updateCharCount);

// --- Slash Commands Autocomplete & Handling
    function handleSlashCommands(val) {
        if (val.startsWith("/")) {
            const q = val.slice(1).toLowerCase();
            const matches = slashCommands.filter(cmd => cmd.command.startsWith(q));
            if (matches.length) {
                slashCommandsList.innerHTML = matches.map(
                    (cmd, i) => `<li class="${i === 0 ? "active" : ""} data-command="${cmd.command}"><b>/${cmd.command}</b> - ${cmd.description}</li>`
                ).join("");
                slashCommandsList.style.display = "block";
            } else {
                slashCommandsList.style.display = "none";
            }
        } else {
            slashCommandsList.style.display = "none";
        }
    }

// --- Arrow Navigation for Slash Commands
    let slashIdx = 0;
    messageInput.addEventListener("keydown", event => {
        if (slashCommandsList.style.display === "block") {
            const items = slashCommandsList.querySelectorAll("li");
            if (event.key === "ArrowDown") {
                slashIdx = (slashIdx + 1) % items.length;
                items.forEach((li, idx) => li.classList.toggle("active", idx === slashIdx));
                event.preventDefault();
            }
            if (event.key === "ArrowUp") {
                slashIdx = (slashIdx - 1 + items.length) % items.length;
                items.forEach((li, idx) => li.classList.toggle("active", idx === slashIdx));
                event.preventDefault();
            }
            if (event.key === "Enter") {
                if (slashIdx >= 0 && items[slashIdx]) {
                    messageInput.value = "/" + items[slashIdx].dataset.command + "";
                    livePreviewContainer.style.display = "none";
                    slashCommandsList.style.display = "none";
                    setTimeout(() => messageInput.focus(), 10);
                    event.preventDefault();
                }
            }
            if (e.key === "Escape") {
                slashCommandsList.style.display = "none";
            }
        }
    });
    slashCommandsList.addEventListener("mousedown", event => {
        if (event.target.closest("li")) {
            messageInput.value = "/" + event.target.closest("li").dataset.command + "";
            livePreviewContainer.style.display = "none";
            slashCommandsList.style.display = "none";
            messageInput.focus();
        }
    });

// --- File Upload Handling (limit & preview)
    fileInput.addEventListener("change", e => {
        uploadedFile = null;
        const file = fileInput.files[0];
        const prevDiv = document.getElementById("file-preview");
        if (file) {
            if (file.size > FILE_LIMIT) {
                showToast("File size exceeds limit of 500MB", true);
                fileInput.value = "";
                uploadedFile = null;
                if (prevDiv) prevDiv.remove();
                return;
            }
            uploadedFile = file;
            let preview = "";
            if (file.type.startsWith("image/")) {
                const url = URL.createObjectURL(uploadedFile);
                preview = `<img src="${url}" alt="${file.name}" style="max-width:120px;border-radius:4px;>"<br>${file.name}`;
            } else {
                preview = file.name;
            }
            let prevDiv = document.getElementById("file-preview");
            if (!prevDiv) {
                prevDiv = document.createElement("div");
                prevDiv.id = "file-preview";
                prevDiv.className = "uploaded-file-preview";
                messageForm.insertBefore(prevDiv, messageInput);
            }
            prevDiv.innerHTML = preview;
        } else {
            if (prevDiv) prevDiv.remove();
        }
    });

// --- Toast Notifications
    function showToast(msg, isError = false, duration = 2400) {
        const toast = document.createElement("div");
        toast.className = "toast" + (isError ? " error" : "");
        toast.textContent = msg;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            setTimeout(() => toast.remove(), 500);
        }, duration);
    }


// --- Message Send (char/file limits, emoji/gif/file support)
    messageForm.addEventListener("submit", async event => {
        event.preventDefault();
        const text = messageInput.value.trim();

        // Character Limit
        if (text.length > CHAR_LIMIT) {
            showToast(`Message exceeds character limit of ${CHAR_LIMIT}`, true);
            return;
        }

        // File limit check
        if (uploadedFile && uploadedFile.size > FILE_LIMIT) {
            showToast(`File too large. Maximum size is ${FILE_LIMIT}`, true);
            return;
        }

        //Only send if there is text, file or gif
        if (!text && !uploadedFile) {
            showToast("Type a message or attach a file", true);
            return;
        }

        // Markdown
        let html = null;
        if (text) html = marked.parse(text);

        // File Upload
        let fileObj = null;
        if (uploadedFile) {
            const fileUrl = URL.createObjectURL(uploadedFile);
            fileObj = {
                name: uploadedFile.name,
                type: uploadedFile.type,
                url: fileUrl
            };
        }
        channels[currentChannel].push({
            user: "user",
            username: user.username,
            text: text || undefined,
            html: html || undefined,
            file: fileObj,
            time: Date.now()
        });

        renderMessages();

        messageInput.value = "";
        updateCharCount();
        livePreviewContainer.style.display = "none";
        slashCommandsList.style.display = "none";

        // Reset file input
        uploadedFile = null;
        fileInput.value = "";
        const prevDiv = document.getElementById("file-preview");
        if (prevDiv) prevDiv.remove();
    });

// --- Emoji Picker (custom grid)
// List of common emojis
    const EMOJI_LIST = [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
        "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
        "😘", "😗", "😙", "😚", "😋", "😜", "😝", "😛",
        "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐",
        "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌",
        "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢",
        "🥳", "🥺", "🤩", "🥲", "😎", "🥸", "🧐", "🤓",
        "😎", "😤", "😡", "😠", "🤬", "😈", "👿", "💀"
    ];

// Populate emoji grid
    function populateEmojiGrid() {
        emojiGrid.innerHTML = "";
        EMOJI_LIST.forEach(emoji => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.textContent = emoji;
            btn.title = emoji;
            btn.addEventListener("click", () => {
                insertAtCursor(messageInput, emoji);
                closeEmojiPicker();
                updateCharCount();
                messageInput.focus();
            });
            emojiGrid.appendChild(btn);
        });
    }

    function openEmojiPicker() {
        populateEmojiGrid();
        emojiPickerModal.style.display = "flex";
        emojiGrid.querySelector("button")?.focus();
    }

    function closeEmojiPicker() {
        emojiPickerModal.style.display = "none";
    }

    emojiBtn.addEventListener("click", openEmojiPicker);
    emojiPickerClose.addEventListener("click", closeEmojiPicker);
    emojiPickerModal.addEventListener("click", e => {
        if (e.target === emojiPickerModal) closeEmojiPicker();
    });

// Utility: Insert emoji at caret
    function insertAtCursor(input, text) {
        const [start, end] = [input.selectionStart, input.selectionEnd];
        const before = input.value.substring(0, start);
        const after = input.value.substring(end);
        input.value = before + text + after;
        input.selectionStart = input.selectionEnd = start + text.length;
    }

// --- GIF Picker with Tenor API
    gifBtn.addEventListener("click", () => {
        gifPickerModal.style.display = "flex";
        gifSearchInput.value = "";
        fetchTrendingGifs();
    });
    gifPickerClose.addEventListener("click", closeGifPicker);
    gifPickerModal.addEventListener("click", e => {
        if (e.target === gifPickerModal) closeGifPicker();
    });

    function closeGifPicker() {
        gifPickerModal.style.display = "none";
        gifGrid.innerHTML = "";
    }

// GIF Search
    gifSearchBtn.addEventListener("click", e => {
        e.preventDefault();
        fetchGifs(gifSearchInput.value.trim());
    });
    gifSearchInput.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            fetchGifs(gifSearchInput.value.trim());
        }
    });

    function fetchTrendingGifs() {
        gifGrid.innerHTML = "Loading...";
        fetch(`${TENOR_TRENDING_URL}?key=${TENOR_API_KEY}&limit=15&media_filter=gif,tinygif`)
            .then(res => res.json())
            .then(data => renderGifGrid(data.results || []))
            .catch(() => gifGrid.innerHTML = "Failed to load GIFs");
    }

    function fetchGifs(query) {
        if (!query) return;
        gifGrid.innerHTML = "Searching...";
        fetch(`${TENOR_SEARCH_URL}?key=${TENOR_API_KEY}&q=${encodeURIComponent(query)}&limit=15&media_filter=gif,tinygif`)
            .then(res => res.json())
            .then(data => renderGifGrid(data.results || []))
            .catch(() => gifGrid.innerHTML = "Failed to load GIFs");
    }

    function renderGifGrid(results) {
        gifGrid.innerHTML = "";
        if (!results.length) {
            gifGrid.innerHTML = "<span>No GIFs found.</span>";
            return;
        }
        results.forEach(result => {
            const gifUrl = result.media_formats?.tinygif?.url || result.media_formats?.gif?.url;
            if (!gifUrl) return;
            const img = document.createElement("img");
            img.src = gifUrl;
            img.alt = result.content_description || "GIF";
            img.loading = "lazy";
            img.title = "Send this GIF";
            img.addEventListener("click", () => {
                sendGifMessage(gifUrl);
                closeGifPicker();
            });
            gifGrid.appendChild(img);
        });
    }

// Send GIF as a message
    function sendGifMessage(gifUrl) {
        if (!gifUrl) return;
        channels[currentChannel].push({
            user: "user",
            username: user.username,
            avatar: user.avatar,
            gif: gifUrl,
            time: Date.now()
        });
        renderMessages();
    }

// --- Slash Command Handling
    function handleCommand(command) {
        const parts = command.replace(/^\//, "").split(" ");
        const base = parts[0];
        if (base === "shrug") {
            channels[currentChannel].push({
                user: "user",
                username: user.username,
                text: "¯\\_(ツ)_/¯",
                time: Date.now()
            });
            renderMessages();
        } else if (base === "help") {
            const html = "<br>Slash Commands:<br><ul>" +
                slashCommands.map(sc => `<li><b>/${sc.command}</b>: ${sc.description}</li>`).join("") +
                "</ul>";
            channels[currentChannel].push({
                user: "system",
                username: "System",
                html,
                time: Date.now()
            });
            renderMessages();
        } else {
            const html = `<i>Unknown command: <b>/${base}</b></i>`;
            channels[currentChannel].push({
                user: "system",
                username: "System",
                html,
                time: Date.now()
            });
            renderMessages();
        }
    }

// --- User Popup
    const userProfileTrigger = document.getElementById("userProfileTrigger");
    const userPopup = document.getElementById("userPopup");
    userProfileTrigger.addEventListener("click", (event) => {
        userPopup.style.display = userPopup.style.display === "block" ? "none" : "block";
    });
    document.addEventListener("mousedown", function (event) {
        if (!userPopup.contains(event.target) && !userProfileTrigger.contains(event.target)) {
            userPopup.style.display = "none";
        }
    });
    document.getElementById("userSettingsBtn").addEventListener("click", (event) => {
        document.getElementById("setUsername").value = user.username;
        document.getElementById("setAvatar").value = user.avatar;
        document.getElementById("setTheme").value = user.theme;
        document.getElementById("settingsModal").style.display = "block";
        userPopup.style.display = "none";
    });
    document.getElementById("logoutBtn").addEventListener("click", (event) => {
        alert("Logout functionality is not implemented yet.");
        userPopup.style.display = "none";
    });

// --- Settings Modal
    const settingsModal = document.getElementById("settingsModal");
    document.getElementById("closeSettings").onclick = () => {
        settingsModal.style.display = "none";
    };
    document.getElementById("saveSettingsBtn").onclick = () => {
        const newUser = {
            username: document.getElementById("setUsername").value.trim() || "User",
            avatar: document.getElementById("setAvatar").value.trim() || defaultUser.avatar,
            theme: document.getElementById("setTheme").value,
        };
        updateUser(newUser);
        settingsModal.style.display = "none";
    };
    window.onclick = function (event) {
        if (event.target === settingsModal) {
            settingsModal.style.display = "none";
        }
    };

// --- Init
    updateUser({});
    renderMessages();
    updateCharCount();
    toggleInputBar();
    toggleWorkspaceIDE();
}
