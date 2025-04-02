const auth = require('basic-auth');

/**
 * Create a basic authentication middleware function that checks
 * against the given credentials.
 */
exports.basicAuth = (username, password) => {
  if (!username || !password) {
    throw new Error('Missing required username and password for basic authentication.');
  }

  return (req, res, next) => {
    const user = auth(req);

    if (user && user.name === username && user.pass === password) {
      next();
    } else {
      res
        .set({ 'WWW-Authenticate': 'Basic realm="Authentication required"' })
        .status(401)
        .end("I'm afraid I cannot let you do that.");
    }
  };
};

/**
 * USAGE EXAMPLE
 *
  // Use basic authentication when not in dev mode. This is
  // intentionally after the static middleware, /.well-known and /api
  // endpoints as those will bypass basic auth.
  if (!dev) {
    const USERNAME = process.env.BASIC_AUTH_USERNAME;
    const PASSWORD = process.env.BASIC_AUTH_PASSWORD;
    const hasUsername = typeof USERNAME === 'string' && USERNAME.length > 0;
    const hasPassword = typeof PASSWORD === 'string' && PASSWORD.length > 0;

    // If BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD have been set - let's use them
    if (hasUsername && hasPassword) {
      app.use(auth.basicAuth(USERNAME, PASSWORD));
    }
  }
 */
