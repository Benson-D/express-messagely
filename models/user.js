"use strict";

const { BCRYPT_WORK_FACTOR } = require("../config");
const bcrypt = require("bcrypt");
const db = require("../db");

const { UnauthorizedError, NotFoundError } = require("../expressError");

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
    // Need to Hash password

    const hashedPass = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at) 
            VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
            RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPass, first_name, last_name, phone]
      // NOTE: could lead to a bug
    );
    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password 
        FROM users 
        WHERE username = $1
      `,
      [username]
    );

    let user = result.rows[0];

    if (user) {
      return (await bcrypt.compare(password, user.password)) === true;
    }

    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1
      RETURNING username, last_login_at
      `,
      [username]
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError();

    return user;
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username,first_name,last_name 
        FROM users
      `
    );
    const allUsers = result.rows;

    return allUsers;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username,first_name,last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1
      `,
      [username]
    );

    const user = result.rows[0];

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id AS message_id, 
          m.to_username AS to_username, 
          m.body AS body, 
          m.sent_at AS sent_at, 
          m.read_at AS read_at,
          u.username AS username,
          u.first_name AS to_first,
          u.last_name AS to_last,
          u.phone AS to_phone
        FROM messages as m
        JOIN users as u
          ON m.to_username = u.username
        WHERE m.from_username = $1
      `,
      [username]
    );
    let messages = result.rows;

    return messages.map((m) => ({
      id: m.message_id,
      to_user: {
        username: m.to_username,
        first_name: m.to_first,
        last_name: m.to_last,
        phone: m.to_phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   *
   *
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id AS message_id, 
              m.from_username AS from_username, 
              m.body AS body, 
              m.sent_at AS sent_at, 
              m.read_at AS read_at,
              u.username,
              u.first_name AS from_first,
              u.last_name AS from_last,
              u.phone AS from_phone
        FROM messages as m
        JOIN users as u
          ON m.from_username = u.username
        WHERE m.to_username = $1
      `,
      [username]
    );
    let messages = result.rows;

    return messages.map((m) => ({
      id: m.message_id,
      from_user: {
        username: m.from_username,
        first_name: m.from_first,
        last_name: m.from_last,
        phone: m.from_phone,
      },
      body: m.body,
      sent_at: m.sent_at,
      read_at: m.read_at,
    }));
  }
}

module.exports = User;
