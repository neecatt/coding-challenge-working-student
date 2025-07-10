// Query builder utility for ticket operations
export const buildTicketQuery = (filters = {}) => {
  const { status, organisation_id, user_id } = filters;
  
  // Base query for tickets with joins
  const baseQuery = `
    SELECT 
      t.id,
      t.title,
      t.description,
      t.status,
      t.created_at,
      t.user_id,
      t.organisation_id,
      u.name as user_name,
      o.name as organisation_name
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    JOIN organisation o ON t.organisation_id = o.id
  `;
  
  // Base count query
  const baseCountQuery = `SELECT COUNT(*) as total FROM tickets t`;
  
  const whereConditions = [];
  const queryParams = [];

  // Add filters
  if (status) {
    whereConditions.push('t.status = $1');
    queryParams.push(status);
  }

  if (organisation_id) {
    whereConditions.push('t.organisation_id = $' + (queryParams.length + 1));
    queryParams.push(parseInt(organisation_id));
  }

  if (user_id) {
    whereConditions.push('t.user_id = $' + (queryParams.length + 1));
    queryParams.push(parseInt(user_id));
  }

  // Build WHERE clause
  const whereClause = whereConditions.length > 0 
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  return {
    baseQuery,
    baseCountQuery,
    whereClause,
    queryParams,
    whereConditions
  };
};

// Build paginated query
export const buildPaginatedQuery = (filters, limit = 50, offset = 0) => {
  const { baseQuery, baseCountQuery, whereClause, queryParams } = buildTicketQuery(filters);
  
  // Add WHERE clause to both queries
  const query = whereClause ? `${baseQuery} ${whereClause}` : baseQuery;
  const countQuery = whereClause ? `${baseCountQuery} ${whereClause}` : baseCountQuery;
  
  // Add ordering and pagination
  const finalQuery = `${query} ORDER BY t.created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  const finalParams = [...queryParams, parseInt(limit), parseInt(offset)];
  
  return {
    query: finalQuery,
    countQuery,
    params: finalParams,
    countParams: queryParams
  };
};

// Build single ticket query
export const buildSingleTicketQuery = (ticketId) => {
  const { baseQuery } = buildTicketQuery();
  const query = `${baseQuery} WHERE t.id = $1`;
  
  return {
    query,
    params: [parseInt(ticketId)]
  };
};

// Build ticket with specific ID query
export const buildTicketByIdQuery = (ticketId) => {
  return buildSingleTicketQuery(ticketId);
}; 