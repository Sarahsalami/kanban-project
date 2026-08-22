const express = require("express");
const Board = require("../models/Board");
const protect = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();

router.post("/", protect, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Board name is required",
      });
    }

    const board = await Board.create({
      name,
      description,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
    });

    res.status(201).json({
      success: true,
      board,
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
    const boards = await Board.find({
      "members.user": req.user._id,
    }).populate("members.user", "name email");

    res.status(200).json({
      success: true,
      boards,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

router.post("/:boardId/members", protect, async (req, res) => {
  try {
    const { email, role = "member" } = req.body;

    const board = await Board.findById(req.params.boardId);

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (board.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the board owner can add members",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyMember = board.members.some(
      (member) => member.user.toString() === user._id.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "User is already a board member",
      });
    }

    if (!["manager", "member"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    board.members.push({
      user: user._id,
      role,
    });

    await board.save();

    res.status(200).json({
      success: true,
      message: "Member added successfully",
      board,
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
  "/:boardId/members/:memberId",
  protect,
  async (req, res) => {
    try {
      const { boardId, memberId } = req.params;
      const { role } = req.body;

      if (!["member", "manager"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role",
        });
      }

      const board = await Board.findById(boardId);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      if (board.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Only the board owner can change member roles",
        });
      }

      const member = board.members.find(
        (boardMember) =>
          boardMember.user.toString() === memberId
      );

      if (!member) {
        return res.status(404).json({
          success: false,
          message: "Member not found",
        });
      }

      member.role = role;

      await board.save();

      res.status(200).json({
        success: true,
        message: "Member role updated successfully",
        member,
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