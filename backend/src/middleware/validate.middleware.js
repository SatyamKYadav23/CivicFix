const AppError = require('../utils/appError');

/**
 * Higher-order middleware to run validator functions
 * @param {Function} validatorFn - Function receiving req and returning array of error strings
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const errors = validatorFn(req);
    if (errors && errors.length > 0) {
      return next(new AppError('Validation Error', 400, errors));
    }
    next();
  };
};

module.exports = validate;

