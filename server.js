console.log('[DEBUG] server.js loaded')

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const session = require('express-session');
const passport = require('./auth.js');
const mongoose = require('mongoose');
const User = require('./models/user.js')

//Connect to MongoDB (using IPv4)
mongoose.connect('mongodb://127.0.0.1:27017/stackspace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('MongoDB connection error:', err));

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*'}
});

//Session & auth middleware
app.use(session({
    secret: 'STACKSPACE_SECRET',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

//Static file service from root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});

//GitHub auth routes
app.get('/auth/github', passport.authenticate('github'));
app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/' }),
    async (req, res) => {
        if (!req.user) {
            return res.redirect('/');
        }
        const { githubId, username, displayName, avatarUrl } = req.user;
        try {
            await User.findOneAndUpdate(
                {githubId},
                {username, displayName, avatarUrl},
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error('Error saving user:', error);
        }
        //Redirect back to main app window
        res.redirect('/');
    }
);

//Endpoint to return current userData
app.get('/api/current_user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

//In-memory store for workspaces
let workspaces = {};

//Socket.io handling workspace & chat
io.on('connection', (socket) => {
    console.log('Client Connected:', socket.id);

    //Create Workspace
    socket.on('createWorkspace', (workspaceName) => {
        if (!workspaces[workspaceName]) {
            workspaces[workspaceName] = { members: [] };
            console.log(`Workspace created: ${workspaceName}`);
        }
        socket.join(workspaceName);
        workspaces[workspaceName].members.push(socket.id);
        io.to(workspaceName).emit('workspaceUpdate', workspaces[workspaceName]);
    });

    //Join Workspace
    socket.on('joinWorkspace', (workspaceName) => {
        if (workspaces[workspaceName]) {
            socket.join(workspaceName);
            workspaces[workspaceName].members.push(socket.id);
            io.to(workspaceName).emit('workspaceUpdate', workspaces[workspaceName]);
        }
    });

    //Chat Handle
    socket.on('chatMessage', ({ workspace, msg }) => {
        const senderId = socket.id
        const timestamp = new Date().toLocaleTimeString();
        const messageDetails = {senderId, msg, timestamp,};
        if (workspace) {
            io.to(workspace).emit('chatMessage', messageDetails);
            console.log(`Message from ${senderId} in ${workspace} at ${timestamp}: ${msg}`);
        }
    });

    socket.on('disconnect', () => {
        for (const workspace in workspaces) {
            workspaces[workspace].members = workspaces[workspace].members.filter(id => id !== socket.id);
            if (workspaces[workspace].members.length === 0) {
                delete workspaces[workspace];
            }
        }
        console.log('Client Disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});






















