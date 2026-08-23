const request = require("supertest");

jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    req.user = {
      _id: "6a7acd738f156f96674562d6",
      name: "Test Owner",
    };

    next();
  };
});

let mockRole = "owner";

jest.mock("../middleware/boardRoleMiddleware", () => {
  return (allowedRoles) => {
    return (req, res, next) => {
      if (!allowedRoles.includes(mockRole)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      next();
    };
  };
});

jest.mock("../models/Task", () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock("../models/ActivityLog", () => ({
  create: jest.fn(),
}));

const Task = require("../models/Task");
const app = require("../server");

const mockActivity = {
  populate: jest.fn().mockResolvedValue(undefined),
};

describe("Task API", () => {
  beforeEach(() => {
  jest.clearAllMocks();
  mockRole = "owner";
});

  test("should return 404 when updating a task that does not exist", async () => {
    Task.findById.mockResolvedValue(null);

    const response = await request(app)
      .put("/api/tasks/6a7efb80b437d878dd9c240f")
      .send({
        status: "done",
        version: 0,
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Task not found");
  });

  test("should reject update when task version is missing", async () => {
    Task.findById.mockResolvedValue({
      _id: "6a7efb80b437d878dd9c240f",
      boardId: "6a7ede6f2cd428df16d0e9dd",
      status: "todo",
      version: 0,
    });

    const response = await request(app)
      .put("/api/tasks/6a7efb80b437d878dd9c240f")
      .send({
        status: "done",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Task version is required");
  });

  test("should return 409 for a stale task version", async () => {
    const existingTask = {
      _id: "6a7efb80b437d878dd9c240f",
      boardId: "6a7ede6f2cd428df16d0e9dd",
      title: "Prepare launch checklist",
      status: "todo",
      version: 2,
    };

    Task.findById
      .mockResolvedValueOnce(existingTask)
      .mockResolvedValueOnce(existingTask)
      .mockResolvedValueOnce(existingTask);

    Task.findOneAndUpdate.mockResolvedValue(null);

    const response = await request(app)
      .put("/api/tasks/6a7efb80b437d878dd9c240f")
      .send({
        status: "done",
        version: 1,
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("This task has been updated by another user");
    expect(response.body.currentTask).toBeDefined();
  });

  test("should successfully create a task", async () => {
    const createdTask = {
      _id: "6a7efb80b437d878dd9c240f",
      title: "Test automated task",
      description: "Created by Jest",
      status: "todo",
      priority: "medium",
      assignedTo: null,
      dueDate: null,
      boardId: "6a7ede6f2cd428df16d0e9dd",
      createdBy: "6a7acd738f156f96674562d6",
      version: 0,
    };

    Task.create.mockResolvedValue(createdTask);

    const ActivityLog = require("../models/ActivityLog");
    ActivityLog.create.mockResolvedValue(mockActivity);

    const response = await request(app)
      .post("/api/tasks")
      .send({
        title: "Test automated task",
        description: "Created by Jest",
        status: "todo",
        priority: "medium",
        boardId: "6a7ede6f2cd428df16d0e9dd",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.task.title).toBe("Test automated task");

    expect(Task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test automated task",
        boardId: "6a7ede6f2cd428df16d0e9dd",
        createdBy: "6a7acd738f156f96674562d6",
      })
    );
  });

  test("should successfully update a task", async () => {
    const existingTask = {
      _id: "6a7efb80b437d878dd9c240f",
      title: "Prepare launch checklist",
      boardId: "6a7ede6f2cd428df16d0e9dd",
      status: "todo",
      version: 0,
    };

    const updatedTask = {
      ...existingTask,
      status: "in-progress",
      version: 1,
    };

    Task.findById
      .mockResolvedValueOnce(existingTask)
      .mockResolvedValueOnce(existingTask);

    Task.findOneAndUpdate.mockResolvedValue(updatedTask);

    const ActivityLog = require("../models/ActivityLog");
    ActivityLog.create.mockResolvedValue(mockActivity);

    const response = await request(app)
      .put("/api/tasks/6a7efb80b437d878dd9c240f")
      .send({
        status: "in-progress",
        version: 0,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.task.status).toBe("in-progress");
    expect(response.body.task.version).toBe(1);

    expect(Task.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: "6a7efb80b437d878dd9c240f",
        version: 0,
      },
      {
        $set: {
          status: "in-progress",
        },
        $inc: {
          version: 1,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );
  });

test("should successfully delete a task", async () => {
  const existingTask = {
    _id: {
      toString: () => "6a7efb80b437d878dd9c240f",
    },
    title: "Prepare launch checklist",
    boardId: {
      toString: () => "6a7ede6f2cd428df16d0e9dd",
    },
  };

  Task.findById
    .mockResolvedValueOnce(existingTask)
    .mockResolvedValueOnce(existingTask);

  Task.findByIdAndDelete.mockResolvedValue(existingTask);

  const ActivityLog = require("../models/ActivityLog");

  ActivityLog.create.mockResolvedValue({
    populate: jest.fn().mockResolvedValue(undefined),
  });

  const response = await request(app)
    .delete("/api/tasks/6a7efb80b437d878dd9c240f");

  expect(response.statusCode).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe(
    "Task deleted successfully"
  );

  expect(Task.findByIdAndDelete).toHaveBeenCalledWith(
    "6a7efb80b437d878dd9c240f"
  );

  expect(ActivityLog.create).toHaveBeenCalledWith(
    expect.objectContaining({
      action: "TASK_DELETED",
      metadata: {
        title: "Prepare launch checklist",
      },
    })
  );
});

test("should prevent a member from creating a task", async () => {
  mockRole = "member";

  const response = await request(app)
    .post("/api/tasks")
    .send({
      title: "Restricted task",
      boardId: "6a7ede6f2cd428df16d0e9dd",
    });

  expect(response.statusCode).toBe(403);
  expect(response.body.success).toBe(false);
});

test("should prevent a member from deleting a task", async () => {
  mockRole = "member";

  const existingTask = {
    _id: "6a7efb80b437d878dd9c240f",
    title: "Prepare launch checklist",
    boardId: "6a7ede6f2cd428df16d0e9dd",
  };

  Task.findById.mockResolvedValue(existingTask);

  const response = await request(app)
    .delete("/api/tasks/6a7efb80b437d878dd9c240f");

  expect(response.statusCode).toBe(403);
  expect(response.body.success).toBe(false);

  expect(Task.findByIdAndDelete).not.toHaveBeenCalled();
});
    
});
