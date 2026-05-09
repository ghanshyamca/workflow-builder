const formatValidationDetails = (details = []) => details.map((detail) => ({
  field: detail.context?.label || detail.path.join('.'),
  message: detail.message,
}));

const validateRequest = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      details: formatValidationDetails(error.details),
    });
  }

  req[source] = value;
  return next();
};

module.exports = validateRequest;