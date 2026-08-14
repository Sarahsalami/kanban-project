const Board = require("../models/Board");

const requireBoardRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const boardId =
        req.params?.boardId ||
        req.body?.boardId ||
        req.query?.boardId;

      if (!boardId) {
        return res.status(400).json({
          success: false,
          message: "Board ID is required",
        });
      }

      const board = await Board.findById(boardId);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      const member = board.members.find(
        (member) =>
          member.user.toString() === req.user._id.toString()
      );

      if (!member) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this board",
        });
      }

      if (!allowedRoles.includes(member.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission for this action",
        });
      }

      req.board = board;
      req.boardRole = member.role;

      next();
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  };
};

module.exports = requireBoardRole;