const VALID_TRANSITIONS = {
  escrow_funded: ['under_review'],
  under_review: ['closing', 'cancelled', 'disputed'],
  closing: ['completed', 'cancelled', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['closing', 'cancelled']
};

export function canTransition(currentStatus, newStatus) {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

export function transitionEscrow(transaction, newStatus) {
  if (!canTransition(transaction.status, newStatus)) {
    throw new Error(`Invalid transition: ${transaction.status} → ${newStatus}`);
  }
  return {
    ...transaction,
    status: newStatus,
    ...(newStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}),
    updatedAt: new Date().toISOString()
  };
}

export function getAvailableTransitions(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] || [];
}
