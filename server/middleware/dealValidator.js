import { PROPERTY_TYPES } from '../config/constants.js';

export function validateDeal(req, res, next) {
  const { address, city, state, askingPrice, propertyType } = req.body;
  const errors = [];

  if (!address || address.trim().length < 5) errors.push('Address is required (min 5 chars)');
  if (!city || city.trim().length < 2) errors.push('City is required');
  if (!state || state.trim().length !== 2) errors.push('State must be 2-letter code');
  if (!askingPrice || askingPrice <= 0) errors.push('Asking price must be positive');
  if (propertyType && !PROPERTY_TYPES.includes(propertyType)) {
    errors.push(`Property type must be one of: ${PROPERTY_TYPES.join(', ')}`);
  }

  if (errors.length > 0) return res.status(400).json({ errors });
  next();
}
