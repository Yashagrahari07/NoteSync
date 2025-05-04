const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const { authUser } = require("../middlewares/auth.middleware");

router.use(authUser);

router.post("/", noteController.createNote);

router.get("/", noteController.getAllNotes);

router.get("/:id", noteController.getNoteById);

router.put("/:id", noteController.updateNote);

router.delete("/:id", noteController.deleteNote);

router.post("/:id/collaborators", noteController.addCollaborator);

module.exports = router;