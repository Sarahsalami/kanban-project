const express = require("express");
const ActivityLog = require("../models/ActivityLog");
const protect = require("../middleware/authMiddleware");
const requireBoardRole = require("../middleware/boardRoleMiddleware");

const router = express.Router();

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

      const activities = await ActivityLog.find({
        boardId,
      })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .limit(50);

      res.status(200).json({
        success: true,
        activities,
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