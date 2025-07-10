import { TicketService } from '../services/ticketService.js';
import { 
  sendSuccess, 
  sendCreated, 
  sendNoContent, 
  sendNotFound, 
  sendForbidden,
  sendValidationError,
  handleError 
} from '../utils/responseHandler.js';
import { controllerWrapper } from '../utils/controllerWrapper.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

// Get all tickets with filtering and pagination
export const getTickets = controllerWrapper(async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  
  // Users can see all tickets from their organization
  const organisationId = req.user.organisationId;
  
  const result = await TicketService.getTickets(
    { status, organisation_id: organisationId }, 
    limit, 
    offset
  );
  
  sendSuccess(res, result, 'Tickets retrieved successfully');
});

// Get a specific ticket by ID
export const getTicketById = controllerWrapper(async (req, res) => {
  const { id } = req.params;
  const organisationId = req.user.organisationId;
  
  try {
    const ticket = await TicketService.getTicketById(id);
    
    // Ensure user can only access tickets from their organization
    if (ticket.organisation_id !== organisationId) {
      throw new ForbiddenError('Access denied. You can only view tickets from your organization.');
    }
    
    sendSuccess(res, { ticket }, 'Ticket retrieved successfully');
  } catch (error) {
    return handleError(res, error);
  }
});

// Create a new ticket
export const createTicket = controllerWrapper(async (req, res) => {
  const { title, description, status = 'open' } = req.body;

  // Basic validation - TicketService will handle detailed validation
  if (!title) {
    return sendValidationError(res, 'Title is required', 'title');
  }

  // Users can only create tickets for themselves in their organization
  const userId = req.user.id;
  const organisationId = req.user.organisationId;

  try {
    const ticket = await TicketService.createTicket({
      title,
      description,
      user_id: userId,
      organisation_id: organisationId,
      status
    });
    
    sendCreated(res, { ticket }, 'Ticket created successfully');
  } catch (error) {
    return handleError(res, error);
  }
});

// Update a ticket
export const updateTicket = controllerWrapper(async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const organisationId = req.user.organisationId;

  try {
    // First check if the ticket belongs to the user's organization
    const existingTicket = await TicketService.getTicketById(id);
    if (existingTicket.organisation_id !== organisationId) {
      throw new ForbiddenError('Access denied. You can only update tickets from your organization.');
    }

    const ticket = await TicketService.updateTicket(id, {
      title,
      description,
      status,
      organisation_id: organisationId // Ensure user can't change organisation
    });
    
    sendSuccess(res, { ticket }, 'Ticket updated successfully');
  } catch (error) {
    return handleError(res, error);
  }
});

// Delete a ticket
export const deleteTicket = controllerWrapper(async (req, res) => {
  const { id } = req.params;
  const organisationId = req.user.organisationId;

  try {
    // First check if the ticket belongs to the user's organization
    const existingTicket = await TicketService.getTicketById(id);
    if (existingTicket.organisation_id !== organisationId) {
      throw new ForbiddenError('Access denied. You can only delete tickets from your organization.');
    }

    await TicketService.deleteTicket(id);
    sendNoContent(res);
  } catch (error) {
    return handleError(res, error);
  }
}); 