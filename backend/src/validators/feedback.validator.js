const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate Citizen Feedback Submission
 * POST /api/complaints/:id/feedback
 */
const validateFeedback = (req) => {
  const errors = [];
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!id || !UUID_REGEX.test(id)) {
    errors.push('A valid complaint ID (UUID) is required in the URL parameter.');
  }

  const numRating = Number(rating);
  if (rating === undefined || rating === null || isNaN(numRating) || !Number.isInteger(numRating)) {
    errors.push('Rating is required and must be an integer.');
  } else if (numRating < 1 || numRating > 5) {
    errors.push('Rating must be between 1 and 5 stars.');
  }

  if (comment !== undefined && comment !== null) {
    if (typeof comment !== 'string') {
      errors.push('Comment must be a string.');
    } else if (comment.length > 2000) {
      errors.push('Comment cannot exceed 2000 characters.');
    }
  }

  return errors;
};

module.exports = {
  validateFeedback,
};

