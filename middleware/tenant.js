const validateTenantAccess = (req, res, next) => {
  const requestedTenantId = req.body.tenantId || req.query.tenantId || req.params.tenantId;

  if (requestedTenantId && parseInt(requestedTenantId) !== req.user.tenantId) {
    return res.status(403).json({
      responseCode: 'E',
      responseMessage: 'Access denied for this tenant'
    });
  }

  next();
};

const extractTenantId = (req, res, next) => {
  // Extract tenant ID from various sources
  const tenantId = req.user?.tenantId || req.body?.tenantId || req.query?.tenantId || req.params?.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({
      responseCode: 'E',
      responseMessage: 'Tenant ID is required'
    });
  }

  req.tenantId = parseInt(tenantId);
  next();
};

module.exports = {
  validateTenantAccess,
  extractTenantId
};