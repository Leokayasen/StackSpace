console.log('[DEBUG] auth.js loaded')

const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;

passport.use(new GitHubStrategy({
    clientID: 'Iv23liBxBzZvEVqJecCW',
    clientSecret: '4958e03130b225f35c030b2dd7b90ea11b4b347c',
    callbackURL: "http://localhost:3000/auth/github/callback",
},
    function(accessToken, refreshToken, profile, cb) {
        const userData = {
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName || profile.username,
            avatarUrl: (profile.photos && profile.photos[0] ? profile.photos[0].value : null)
        };
        return cb(null, userData);
    }
));

passport.serializeUser((user, done) => {
    done(null, user.githubId);
});

passport.deserializeUser((id, done) => {
    done(null, { githubId: id });
});

module.exports = passport;








