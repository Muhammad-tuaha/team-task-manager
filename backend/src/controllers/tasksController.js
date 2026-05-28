const { pool } = require('../config/database');

/**
 * Helper: Verify user is a member of the given team.
 */
const assertTeamMember = async (teamId, userId) => {
  const res = await pool.query(
    'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
    [teamId, userId]
  );
  if (res.rows.length === 0) throw { status: 403, message: 'You are not a member of this team' };
  return res.rows[0].role;
};

/**
 * GET /tasks
 * Fetch tasks across all teams the user belongs to.
 * Supports filtering: ?team_id=&assignee_id=&status=&priority=&search=
 */
const getTasks = async (req, res, next) => {
  const { team_id, assignee_id, status, priority, search } = req.query;

  try {
    let query = `
      SELECT
        t.id, t.title, t.description, t.status, t.priority,
        t.team_id, t.creator_id, t.assignee_id, t.due_date,
        t.created_at, t.updated_at,
        tm_name.name AS team_name,
        creator.name AS creator_name,
        assignee.name AS assignee_name,
        assignee.email AS assignee_email
      FROM tasks t
      JOIN teams tm_name ON tm_name.id = t.team_id
      JOIN team_members my_membership ON my_membership.team_id = t.team_id
        AND my_membership.user_id = $1
      JOIN users creator ON creator.id = t.creator_id
      LEFT JOIN users assignee ON assignee.id = t.assignee_id
      WHERE 1 = 1
    `;

    const params = [req.user.id];
    let paramIdx = 2;

    if (team_id) {
      query += ` AND t.team_id = $${paramIdx++}`;
      params.push(parseInt(team_id));
    }

    if (assignee_id) {
      query += ` AND t.assignee_id = $${paramIdx++}`;
      params.push(parseInt(assignee_id));
    }

    if (status) {
      query += ` AND t.status = $${paramIdx++}`;
      params.push(status);
    }

    if (priority) {
      query += ` AND t.priority = $${paramIdx++}`;
      params.push(priority);
    }

    if (search) {
      query += ` AND (t.title ILIKE $${paramIdx} OR t.description ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /tasks
 * Create a new task in a team.
 */
const createTask = async (req, res, next) => {
  const { title, description, status, priority, team_id, assignee_id, due_date } = req.body;

  try {
    await assertTeamMember(team_id, req.user.id);

    // Validate assignee is a member of the same team
    if (assignee_id) {
      const assigneeCheck = await pool.query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [team_id, assignee_id]
      );
      if (assigneeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assignee must be a member of the team' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, priority, team_id, creator_id, assignee_id, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description || null, status, priority, team_id, req.user.id, assignee_id || null, due_date || null]
    );

    res.status(201).json({ message: 'Task created', task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /tasks/:id
 * Update a task. Must be a team member.
 */
const updateTask = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  try {
    // Fetch task to get team_id
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = existing.rows[0];
    await assertTeamMember(task.team_id, req.user.id);

    const fields = ['title', 'description', 'status', 'priority', 'assignee_id', 'due_date'];
    const updates = [];
    const params = [];
    let paramIdx = 1;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIdx++}`);
        params.push(req.body[field] === null ? null : req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(taskId);

    const result = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
      params
    );

    res.json({ message: 'Task updated', task: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /tasks/:id
 * Delete a task. Only the task creator or team owner can delete.
 */
const deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = existing.rows[0];
    const role = await assertTeamMember(task.team_id, req.user.id);

    const isCreator = task.creator_id === req.user.id;
    const isOwner = role === 'owner';

    if (!isCreator && !isOwner) {
      return res.status(403).json({ error: 'Only the task creator or team owner can delete this task' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /tasks/upcoming
 * Returns tasks due within the next 48 hours for the current user (assigned to them).
 * Used for the due-date reminder feature.
 */
const getUpcomingTasks = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.due_date, t.status, tm_name.name AS team_name
       FROM tasks t
       JOIN teams tm_name ON tm_name.id = t.team_id
       WHERE t.assignee_id = $1
         AND t.due_date IS NOT NULL
         AND t.due_date BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
         AND t.status != 'done'
       ORDER BY t.due_date ASC`,
      [req.user.id]
    );

    res.json({ upcoming: result.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask, getUpcomingTasks };