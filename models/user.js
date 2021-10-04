"use strict";

const { DB_URI, SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const jwt = require("jsonwebtoken");

const { UnauthorizedError } = require("../expressError");

/** User of the site. */

class User {
  // NOTE: stored in objects may need to revisit
  constructor({ username, password, first_name, last_name, phone }) {
    this.username = username;
    this.password = password;
    this.first_name = first_name;
    this.last_name = last_name;
    this.phone = phone;
  }

  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const results = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) 
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id`,
      [username, password, first_name, last_name, phone]
      // NOTE: could lead to a bug
    );
    return { username, password, first_name, last_name, phone };
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const results = await db.query(
      `SELECT password 
      FROM users 
      WHERE username = $1, 
      `,
      [username]
    );

    let user = results.rows[0];

    if (user) {
      if ((await bcrypt.compare(password, user.password)) === true) {
        let token = jwt.sign({ username, SECRET_KEY });
        // NOTE: think of assigning tolken to user
        return true;
      }
    }

    throw new UnauthorizedError("Invalid User");
    // let current users
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {}

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {}

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {}

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {}

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {}
}

module.exports = User;
