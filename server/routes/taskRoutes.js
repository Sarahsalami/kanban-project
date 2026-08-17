const express = require("express");
const Task = require("../models/Task");
const protect = require("../middleware/authMiddleware");
const requireBoardRole = require("../middleware/boardRoleMiddleware");
const ActivityLog = require("../models/ActivityLog");


const router = express.Router();

router.post(
  "/",
  protect,
  requireBoardRole(["owner", "manager"]),
  async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      dueDate,
      boardId,
    } = req.body;

    if (!title || !boardId) {
      return res.status(400).json({
        success: false,
        message: "Task title and board ID are required",
      });
    }

    const task = await Task.create({
  title,
  description,
  status,
  priority,
  assignedTo,
  dueDate,
  boardId,
  createdBy: req.user._id,
});

await ActivityLog.create({
  boardId: task.boardId,
  user: req.user._id,
  action: "TASK_CREATED",
  taskId: task._id,
  metadata: {
    title: task.title,
  },
});

req.io.to(task.boardId.toString()).emit("taskCreated", task);   
    
res.status(201).json({
  success: true,
  task,
});

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.get("/", protect, async (req, res) => {
  try {
    const { boardId } = req.query;

    if (!boardId) {
      return res.status(400).json({
        success: false,
        message: "Board ID is required",
      });
    }

    const tasks = await Task.find({
  boardId,
}).sort({ createdAt: -1 });


    res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.put(
  "/:id",
  protect,

  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const previousStatus = task.status;
      req.body = req.body || {};
      req.body.boardId = task.boardId;

      next();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  requireBoardRole(["owner", "manager", "member"]),

  async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const previousStatus = task.status;

    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "assignedTo",
      "dueDate",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();
    req.io
  .to(task.boardId.toString())
  .emit("taskUpdated", task);

    await ActivityLog.create({
      boardId: task.boardId,
      user: req.user._id,
      action:
        previousStatus !== task.status
          ? "TASK_MOVED"
          : "TASK_UPDATED",
      taskId: task._id,
      metadata: {
        title: task.title,
        previousStatus,
        newStatus: task.status,
      },
    });

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
}
);

router.delete(
  "/:id",
  protect,

  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      req.body = req.body || {};
      req.body.boardId = task.boardId;
      next();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  },

  requireBoardRole(["owner", "manager"]),

  async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      await Task.findByIdAndDelete(req.params.id);

      await ActivityLog.create({
        boardId: task.boardId,
        user: req.user._id,
        action: "TASK_DELETED",
        taskId: task._id,
        metadata: {
          title: task.title,
        },
      });

      req.io
  .to(task.boardId.toString())
  .emit("taskDeleted", task._id.toString());

      res.status(200).json({
        success: true,
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

module.exports = router;
