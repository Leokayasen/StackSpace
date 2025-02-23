console.log('[DEBUG] user.js loaded');

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    githubId: { type: String, unique: true },
    username: String,
    displayName: String,
    avatarUrl: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);
