const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  getTeamMembers,
  addMember,
  deleteTeam,
  removeMember,
} = require('../controllers/teamsController');
const { validate, createTeamSchema, addMemberSchema } = require('../validators');
const { requireAuth } = require('../middleware/auth');

// All team routes require authentication
router.use(requireAuth);

// GET  /teams        — list my teams
router.get('/', getTeams);

// POST /teams        — create a team
router.post('/', validate(createTeamSchema), createTeam);

// DELETE /teams/:id  — delete a team (owner only)
router.delete('/:id', deleteTeam);

// GET    /teams/:id/members     — list team members
router.get('/:id/members', getTeamMembers);

// POST   /teams/:id/members     — add a member by email (owner only)
router.post('/:id/members', validate(addMemberSchema), addMember);

// DELETE /teams/:id/members/:userId — remove a member
router.delete('/:id/members/:userId', removeMember);

module.exports = router;