const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getUpcomingTasks,
} = require('../controllers/tasksController');
const { validate, createTaskSchema, updateTaskSchema } = require('../validators');
const { requireAuth } = require('../middleware/auth');

// All task routes require authentication
router.use(requireAuth);

// GET    /tasks           — list tasks (with optional filters)
router.get('/', getTasks);

// GET    /tasks/upcoming  — tasks due in next 48 hrs assigned to me
router.get('/upcoming', getUpcomingTasks);

// POST   /tasks           — create a task
router.post('/', validate(createTaskSchema), createTask);

// PATCH  /tasks/:id       — update a task
router.patch('/:id', validate(updateTaskSchema), updateTask);

// DELETE /tasks/:id       — delete a task
router.delete('/:id', deleteTask);

module.exports = router;