"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");

const { SECRET_KEY } = require("../config")

describe("Users Routes Test", function () {
    let USER_TOKEN;
    beforeEach(async function () {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");
        let u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });
        USER_TOKEN = jwt.sign({ username: u1.username }, SECRET_KEY);
    });

    /** GET /users/ => [{user},{user},...]  */

    describe("GET /users/", function () {
        test("get all users", async function () {
            let response = await request(app)
                .get("/users/")
                .send({ _token: USER_TOKEN });
            console.log("response body for GET /users/", response.body);
            expect(response.body).toEqual(
                { users: [{ username: "test1", first_name: "Test1", last_name: "Testy1" }] });
        });
    });

    /** GET /users/username => {user:{user_details}}  */

    describe("GET /users/username", function () {

        test("get test user", async function () {
            let response = await request(app)
                .get("/users/test1")
                .send({ _token: USER_TOKEN });

            expect(response.body).toEqual(
                {
                    user: {
                        username: "test1",
                        first_name: "Test1",
                        last_name: "Testy1",
                        phone: "+14155550000",
                        join_at: expect.any(String),
                        last_login_at: expect.any(String)
                    }
                }
            );
        });

        test("error on invalid user", async function () {
            let response = await request(app)
                .get("/users/user_that_doesnt_exist")
                .send({ _token: USER_TOKEN });

            expect(response.statusCode).toEqual(401);
        });
    });


    // test("won't login w/wrong password", async function () {
    //     let response = await request(app)
    //         .post("/auth/login")
    //         .send({ username: "test1", password: "WRONG" });
    //     expect(response.statusCode).toEqual(401);
    // });

    // test("won't login w/wrong password", async function () {
    //     let response = await request(app)
    //         .post("/auth/login")
    //         .send({ username: "not-user", password: "password" });
    //     expect(response.statusCode).toEqual(401);
    // });
});


afterAll(async function () {
    await db.end();
});
