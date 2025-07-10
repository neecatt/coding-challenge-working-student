// Validation middleware for ticket creation
export const validateCreateTicket = (req, res, next) => {
  const { title } = req.body;

  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Missing required fields: title',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Validation middleware for ticket update
export const validateUpdateTicket = (req, res, next) => {
  const { title, user_id, status } = req.body;

  const errors = [];

  if (title !== undefined && (title.trim().length === 0)) {
    errors.push('Title cannot be empty');
  }

  if (user_id !== undefined && isNaN(parseInt(user_id))) {
    errors.push('user_id must be a valid number');
  }

  if (status !== undefined && !['open', 'pending', 'in_progress', 'closed', 'resolved'].includes(status)) {
    errors.push('Status must be one of: open, pending, in_progress, closed, resolved');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: errors,
      timestamp: new Date().toISOString()
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
      error: 'VALIDATION_ERROR',
      message: 'ID must be a valid number',
      field: 'id',
      timestamp: new Date().toISOString()
    });
  }

  next();
};

// Generic validation middleware for required fields
export const validateRequiredFields = (requiredFields) => {
  return (req, res, next) => {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!req.body[field] || (typeof req.body[field] === 'string' && req.body[field].trim().length === 0)) {
        errors.push(`${field} is required`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Missing required fields',
        details: errors,
        missingFields: requiredFields.filter(field => !req.body[field]),
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

// Email validation middleware
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        field: 'email',
        timestamp: new Date().toISOString()
      });
    }
  }

  next();
}; 