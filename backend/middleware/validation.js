// Validation middleware for ticket creation
export const validateCreateTicket = (req, res, next) => {
  const { title, user_id, organisation_id } = req.body;

  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!user_id || isNaN(parseInt(user_id))) {
    errors.push('Valid user_id is required');
  }

  if (!organisation_id || isNaN(parseInt(organisation_id))) {
    errors.push('Valid organisation_id is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }

  next();
};

// Validation middleware for ticket update
export const validateUpdateTicket = (req, res, next) => {
  const { title, user_id, organisation_id, status } = req.body;

  const errors = [];

  if (title !== undefined && (title.trim().length === 0)) {
    errors.push('Title cannot be empty');
  }

  if (user_id !== undefined && isNaN(parseInt(user_id))) {
    errors.push('user_id must be a valid number');
  }

  if (organisation_id !== undefined && isNaN(parseInt(organisation_id))) {
    errors.push('organisation_id must be a valid number');
  }

  if (status !== undefined && !['open', 'pending', 'closed', 'resolved'].includes(status)) {
    errors.push('Status must be one of: open, pending, closed, resolved');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: errors.join(', ')
    });
  }

  next();
};

// Validation middleware for ID parameter
export const validateId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID',
      message: 'ID must be a valid number'
    });
  }

  next();
}; 