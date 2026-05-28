const { pool } = require('../config/database');

/**
 * GET /teams
 * List all teams the current user belongs to.
 */
const getTeams = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT
         t.id, t.name, t.description, t.creator_id, t.created_at,
         u.name AS creator_name,
         tm.role AS my_role,
         (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) AS member_count,
         (SELECT COUNT(*) FROM tasks WHERE team_id = t.id) AS task_count
       FROM teams t
       JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = $1
       JOIN users u ON u.id = t.creator_id
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );

    res.json({ teams: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /teams
 * Create a new team. Creator becomes owner.
 */
const createTeam = async (req, res, next) => {
  const { name, description } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const teamResult = await client.query(
      `INSERT INTO teams (name, description, creator_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, req.user.id]
    );

    const team = teamResult.rows[0];

    // Add creator as owner
    await client.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'owner')`,
      [team.id, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Team created', team });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * GET /teams/:id/members
 * List members of a team (must be a member yourself).
 */
const getTeamMembers = async (req, res, next) => {
  const teamId = parseInt(req.params.id);

  try {
    // Verify requester is a member
    const membership = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (membership.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    const result = await pool.query(
      `SELECT u.id, u.name, u.email, tm.role, tm.joined_at
       FROM team_members tm
       JOIN users u ON u.id = tm.user_id
       WHERE tm.team_id = $1
       ORDER BY tm.role DESC, u.name ASC`,
      [teamId]
    );

    res.json({ members: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /teams/:id/members
 * Add a member to the team by email. Only team owners can add members.
 */
const addMember = async (req, res, next) => {
  const teamId = parseInt(req.params.id);
  const { email } = req.body;

  try {
    // Only owners can add members
    const ownership = await pool.query(
      `SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, req.user.id]
    );

    if (ownership.rows.length === 0 || ownership.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only team owners can add members' });
    }

    // Find the user to add
    const userResult = await pool.query(
      'SELECT id, name, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No user found with that email address' });
    }

    const targetUser = userResult.rows[0];

    // Check if already a member
    const existing = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, targetUser.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User is already a member of this team' });
    }

    await pool.query(
      `INSERT INTO team_members (team_id, user_id, role) VALUES ($1, $2, 'member')`,
      [teamId, targetUser.id]
    );

    res.status(201).json({
      message: `${targetUser.name} added to team`,
      member: { ...targetUser, role: 'member' },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /teams/:id
 * Delete a team. Only the team creator/owner can do this.
 */
const deleteTeam = async (req, res, next) => {
  const teamId = parseInt(req.params.id);

  try {
    const team = await pool.query(
      'SELECT creator_id FROM teams WHERE id = $1',
      [teamId]
    );

    if (team.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.rows[0].creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the team creator can delete the team' });
    }

    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /teams/:id/members/:userId
 * Remove a member from a team. Owner can remove anyone; member can remove themselves.
 */
const removeMember = async (req, res, next) => {
  const teamId = parseInt(req.params.id);
  const targetUserId = parseInt(req.params.userId);

  try {
    const myRole = await pool.query(
      'SELECT role FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, req.user.id]
    );

    if (myRole.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    const isOwner = myRole.rows[0].role === 'owner';
    const isSelf = req.user.id === targetUserId;

    if (!isOwner && !isSelf) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Don't allow the owner to remove themselves (they'd need to delete the team)
    if (isSelf && isOwner) {
      return res.status(400).json({ error: 'Team owner cannot leave. Delete the team instead.' });
    }

    await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, targetUserId]
    );

    res.json({ message: 'Member removed from team' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTeams, createTeam, getTeamMembers, addMember, deleteTeam, removeMember };