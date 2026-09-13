import { complaintService } from './complaintService.js'

export const feedbackService = {
  async submitFeedback(complaintId, rating, comment, citizenName) {
    return complaintService.submitFeedback(complaintId, rating, comment, citizenName)
  },
}

