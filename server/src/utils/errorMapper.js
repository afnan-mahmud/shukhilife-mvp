function mapMongooseError(err) {
  // Duplicate key error
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return { status: 409, message: `Duplicate value for "${field}".` };
  }

  // Validation error
  if (err && err.name === 'ValidationError') {
    const details = Object.values(err.errors || {}).map(e => e.message).join('; ');
    return { status: 400, message: details || 'Validation failed.' };
  }

  // Cast errors and others
  if (err && err.name === 'CastError') {
    return { status: 400, message: `Invalid ${err.path}: ${String(err.value)}.` };
  }

  return { status: 500, message: 'Internal server error.' };
}

module.exports = { mapMongooseError };
