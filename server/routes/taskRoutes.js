const express = require("express");
const Task = require("../models/Task");
const protect = require("../middleware/authMiddleware");
const requireBoardRole = require("../middleware/boardRoleMiddleware");

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

router.put("/:id", protect, requireBoardRole(["owner", "manager"]), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

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
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

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
});

module.exports = router;
