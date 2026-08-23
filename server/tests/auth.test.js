const request = require("supertest");

jest.mock("../models/User", () => ({
  findOne: jest.fn(),
}));

const User = require("../models/User");
const app = require("../server");

describe("Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject login with invalid credentials", async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject protected route without token", async () => {
    const response = await request(app)
      .get(
        "/api/tasks?boardId=6a7ede6f2cd428df16d0e9dd"
      );

    expect(response.statusCode).toBe(401);
  });
});