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

      const activity = await ActivityLog.create({
        boardId: task.boardId,
        user: req.user._id,
        action: "TASK_CREATED",
        taskId: task._id,
        metadata: {
          title: task.title,
        },
      });

      await activity.populate("user", "name email");

      req.io
        .to(task.boardId.toString())
        .emit("taskCreated", task);

      req.io
        .to(task.boardId.toString())
        .emit("activityCreated", activity);

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
  }
);

router.get(
  "/",
  protect,
  requireBoardRole(["owner", "manager", "member"]),
  async (req, res) => {
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
  }
);

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
      const clientVersion = req.body.version;

      if (clientVersion === undefined) {
        return res.status(400).json({
          success: false,
          message: "Task version is required",
        });
      }

      const currentTask = await Task.findById(req.params.id);

      if (!currentTask) {
        return res.status(404).json({
          success: false,
          message: "Task not found",
        });
      }

      const previousStatus = currentTask.status;

      const allowedFields = [
        "title",
        "description",
        "status",
        "priority",
        "assignedTo",
        "dueDate",
      ];

      const updates = {};

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      });

      const task = await Task.findOneAndUpdate(
        {
          _id: req.params.id,
          version: clientVersion,
        },
        {
          $set: updates,
          $inc: {
            version: 1,
          },
        },
        {
          returnDocument: "after",
          runValidators: true,
}
      );

      if (!task) {
        const latestTask = await Task.findById(req.params.id);

        return res.status(409).json({
          success: false,
          message: "This task has been updated by another user",
          currentTask: latestTask,
        });
      }

      req.io
        .to(task.boardId.toString())
        .emit("taskUpdated", task);

      const activity = await ActivityLog.create({
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

      await activity.populate("user", "name email");

      req.io
        .to(task.boardId.toString())
        .emit("activityCreated", activity);

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

      const boardId = task.boardId.toString();
      const taskId = task._id.toString();
      const taskTitle = task.title;

      await Task.findByIdAndDelete(req.params.id);

      const activity = await ActivityLog.create({
        boardId: task.boardId,
        user: req.user._id,
        action: "TASK_DELETED",
        taskId: task._id,
        metadata: {
          title: taskTitle,
        },
      });

      await activity.populate("user", "name email");

      req.io
        .to(boardId)
        .emit("taskDeleted", taskId);

      req.io
        .to(boardId)
        .emit("activityCreated", activity);

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