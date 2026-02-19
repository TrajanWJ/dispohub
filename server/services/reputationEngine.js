export function calculateReputation(ratings) {
  if (!ratings.length) return 0;
  const weights = { communication: 0.25, dealQuality: 0.35, professionalism: 0.25, timeliness: 0.15 };
  let totalWeightedScore = 0;

  for (const rating of ratings) {
    let ratingScore = 0;
    for (const [category, weight] of Object.entries(weights)) {
      ratingScore += (rating.categories?.[category] || rating.score) * weight;
    }
    totalWeightedScore += ratingScore;
  }

  return Math.round((totalWeightedScore / ratings.length) * 20) / 20;
}

export function getReputationBreakdown(ratings) {
  if (!ratings.length) return { overall: 0, categories: {}, totalReviews: 0 };
  const categories = { communication: 0, dealQuality: 0, professionalism: 0, timeliness: 0 };

  for (const rating of ratings) {
    for (const cat of Object.keys(categories)) {
      categories[cat] += (rating.categories?.[cat] || rating.score);
    }
  }

  for (const cat of Object.keys(categories)) {
    categories[cat] = Math.round((categories[cat] / ratings.length) * 10) / 10;
  }

  return {
    overall: calculateReputation(ratings),
    categories,
    totalReviews: ratings.length
  };
}
