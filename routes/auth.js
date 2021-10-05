"use strict";

const Router = require("express").Router;
const router = new Router();
const User = require("../models/user");

const { SECRET_KEY } = require("../config");

const jwt = require("jsonwebtoken");

const { UnauthorizedError, BadRequestError } = require("../expressError");

/** POST /login: {username, password} => {token} */
router.post("/login", async function (req, res, next) {
  const { username, password } = req.body;
  if (await User.authenticate(username, password)) {
    let token = jwt.sign({ username }, SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token });
  }

  throw new UnauthorizedError("Invalid username or password");
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */

router.post("/register", async function (req, res, next) {
  // User.register req.body
  const { username, password, first_name, last_name, phone } = req.body;
  try {
    await User.register({ username, password, first_name, last_name, phone });
    let token = jwt.sign({ username }, SECRET_KEY);
    return res.json({ token });
  } catch (err) {
    throw new BadRequestError("Unable to register user");
  }

  //
});

module.exports = router;
