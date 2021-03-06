"use strict";

/** Middleware for handling req authorization for routes. throws unauthorized error if not */

const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");
const Message = require("../models/message");

/** Middleware: Authenticate user. */

function authenticateJWT(req, res, next) {
  try {
    const tokenFromRequest = req.query._token || req.body._token;
    const payload = jwt.verify(tokenFromRequest, SECRET_KEY);
    res.locals.user = payload;
    return next();
  } catch (err) {
    // error in this middleware isn't error -- continue on
    return next();
  }
}

/** Middleware: Requires user is authenticated.throws unauthorized error if not  */

function ensureLoggedIn(req, res, next) {
  try {
    if (!res.locals.user) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user is user for route. throws unauthorized error if not */

function ensureCorrectUser(req, res, next) {
  try {
    if (!res.locals.user || res.locals.user.username !== req.params.username) {
      throw new UnauthorizedError();
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}


/** Middleware: Requires user is either from or to party.throws unauthorized error if not  */

function ensureCorrectMessageAccess(req, res, next) {
  const message = Message.get(req.params.id);
  try {
    if (
      res.locals.user !== message.from_username ||
      res.locals.user !== message.to_username
    ) {
      throw new UnauthorizedError("Invalid user request");
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

/** Middleware: Requires user is 'to' party. throws unauthorized error if not */

function ensureRecipientAccess(req, res, next) {
  const message = Message.get(req.params.id);
  try {
    if (res.locals.user !== message.to_username) {
      throw new UnauthorizedError("Invalid user request");
    } else {
      return next();
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureCorrectUser,
  ensureCorrectMessageAccess,
  ensureRecipientAccess
};
