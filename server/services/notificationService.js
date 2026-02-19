import { createNotification } from '../models/Notification.js';

export async function notifyNewOffer(wholesalerId, dealId, investorName, amount) {
  return createNotification({
    userId: wholesalerId,
    type: 'offer_received',
    title: 'New Offer Received',
    message: `${investorName} offered $${amount.toLocaleString()} on your deal`,
    relatedId: dealId,
    relatedType: 'deal'
  });
}

export async function notifyOfferAccepted(investorId, dealId, dealAddress) {
  return createNotification({
    userId: investorId,
    type: 'offer_accepted',
    title: 'Offer Accepted!',
    message: `Your offer on ${dealAddress} has been accepted`,
    relatedId: dealId,
    relatedType: 'deal'
  });
}

export async function notifyOfferRejected(investorId, dealId, dealAddress) {
  return createNotification({
    userId: investorId,
    type: 'offer_rejected',
    title: 'Offer Rejected',
    message: `Your offer on ${dealAddress} was not accepted`,
    relatedId: dealId,
    relatedType: 'deal'
  });
}

export async function notifyDealApproved(wholesalerId, dealId, dealAddress) {
  return createNotification({
    userId: wholesalerId,
    type: 'deal_approved',
    title: 'Deal Approved',
    message: `Your listing at ${dealAddress} is now live on the marketplace`,
    relatedId: dealId,
    relatedType: 'deal'
  });
}

export async function notifyNewMatch(investorId, dealId, matchPercentage) {
  return createNotification({
    userId: investorId,
    type: 'new_match',
    title: 'New Deal Match',
    message: `A new deal matches ${matchPercentage}% of your preferences`,
    relatedId: dealId,
    relatedType: 'deal'
  });
}

export async function notifyReviewReceived(userId, reviewerName, score) {
  return createNotification({
    userId,
    type: 'review_received',
    title: 'New Review',
    message: `${reviewerName} left you a ${score}-star review`,
    relatedId: userId,
    relatedType: 'user'
  });
}

export async function notifyTransactionUpdate(userId, transactionId, newStatus) {
  return createNotification({
    userId,
    type: 'transaction_update',
    title: 'Transaction Update',
    message: `Transaction status changed to: ${newStatus.replace(/_/g, ' ')}`,
    relatedId: transactionId,
    relatedType: 'transaction'
  });
}
