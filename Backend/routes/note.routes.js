const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const { authUser } = require("../middlewares/auth.middleware");
const { noteLimiter } = require("../middlewares/rateLimit.middleware");

router.use(authUser);

router.post("/", noteLimiter, noteController.createNote);

router.get("/", noteController.getAllNotes);

router.get("/:id", noteController.getNoteById);

router.put("/:id", noteLimiter, noteController.updateNote);

router.delete("/:id", noteController.deleteNote);

router.post("/:id/collaborators", noteLimiter, noteController.addCollaborator);

router.delete("/:id/collaborators/:collaboratorId", noteController.removeCollaborator);

router.patch("/:id/pin", noteLimiter, noteController.togglePinNote);

module.exports = router;