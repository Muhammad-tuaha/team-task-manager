const Joi = require('joi');

/**
 * Middleware factory: validate req.body against a Joi schema.
 * Returns 400 with validation details on failure.
 */
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true, // Stop at the first error to give a clear, singular message
      stripUnknown: true,
    });
  
    if (error) {
      // Extract the exact message (e.g., "password length must be at least 8 characters long")
      const cleanMessage = error.details[0].message.replace(/"/g, ''); 
      return res.status(400).json({ error: cleanMessage });
    }
  
    req.body = value;
    next();
  };

// ── Auth schemas ──────────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

// ── Team schemas ──────────────────────────────────────────────────────────────

const createTeamSchema = Joi.object({
  name: Joi.string().min(2).max(100).trim().required(),
  description: Joi.string().max(500).trim().allow('').optional(),
});

const addMemberSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

// ── Task schemas ──────────────────────────────────────────────────────────────

const createTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim().required(),
  description: Joi.string().max(2000).trim().allow('').optional(),
  status: Joi.string().valid('todo', 'in_progress', 'done').default('todo'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  team_id: Joi.number().integer().positive().required(),
  assignee_id: Joi.number().integer().positive().allow(null).optional(),
  due_date: Joi.date().iso().allow(null).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(2).max(200).trim().optional(),
  description: Joi.string().max(2000).trim().allow('').optional(),
  status: Joi.string().valid('todo', 'in_progress', 'done').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  assignee_id: Joi.number().integer().positive().allow(null).optional(),
  due_date: Joi.date().iso().allow(null).optional(),
}).min(1); // At least one field required

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createTeamSchema,
  addMemberSchema,
  createTaskSchema,
  updateTaskSchema,
};