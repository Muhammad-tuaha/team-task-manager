const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('./database');

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const result = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email.toLowerCase()]
        );

        const user = result.rows[0];

        if (!user) {
            return done(null, false, { message: 'This email address is not registered' });
          }
          
          const isMatch = await bcrypt.compare(password, user.password_hash);
          if (!isMatch) {
            return done(null, false, { message: 'Incorrect password. Please try again.' });
          }

        // Don't expose password hash
        const { password_hash, ...safeUser } = user;
        return done(null, safeUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
}); 

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );

    const user = result.rows[0];
    if (!user) return done(null, false);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;