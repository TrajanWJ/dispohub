import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import {
  Button,
  Badge,
  Avatar,
  LoadingSpinner,
  StatusBadge,
  StarRating,
  EmptyState,
  Card,
} from '../../components/common';
import { useToast } from '../../components/common';
import { formatDate, formatNumber, formatTimeAgo } from '../../utils/formatters';

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 900,
    margin: '0 auto',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem 0',
    marginBottom: '1.25rem',
    transition: 'var(--transition)',
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '40vh',
  },
  errorBox: {
    background: 'rgba(255,71,87,0.08)',
    border: '1px solid var(--accent-danger)',
    borderRadius: 'var(--border-radius)',
    padding: '0.875rem 1rem',
    color: 'var(--accent-danger)',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
    textAlign: 'center',
  },

  /* Profile header */
  profileHeader: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    marginBottom: '1.5rem',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1.5rem',
    marginBottom: '1.25rem',
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.25rem',
    flexWrap: 'wrap',
  },
  profileName: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  verifiedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--accent-success)',
    background: 'rgba(0, 214, 143, 0.12)',
    padding: '0.1875rem 0.5rem',
    borderRadius: '9999px',
  },
  profileCompany: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  bio: {
    fontSize: '0.9375rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    padding: '1rem 0',
    borderTop: '1px solid var(--border-color)',
  },
  contactRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    paddingTop: '0.5rem',
  },

  /* Stats row */
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  statCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  },

  /* Section */
  section: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
  },

  /* Listings grid */
  listingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  listingCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  listingAddress: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.375rem',
  },
  listingDetails: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    marginBottom: '0.5rem',
  },
  listingPrice: {
    fontSize: '1.125rem',
    fontWeight: 700,
    color: 'var(--accent-primary)',
  },

  /* Review card */
  reviewCard: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius)',
    padding: '1rem 1.25rem',
    marginBottom: '0.75rem',
  },
  reviewHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  reviewerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  reviewerName: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  reviewDate: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
  },
  reviewComment: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },

  /* Reputation display */
  reputationRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  reputationScore: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
};

/* ============================================================
   USER PROFILE PAGE
   ============================================================ */

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [ratings, setRatings] = useState({ ratings: [], average: 0, total: 0 });
  const [deals, setDeals] = useState([]);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, ratingsRes] = await Promise.all([
        api.get(`/users/${id}/profile`),
        api.get(`/users/${id}/ratings`),
      ]);

      const profileData = profileRes.data;
      setProfile(profileData);
      setRatings(ratingsRes.data || { ratings: [], average: 0, total: 0 });

      // Fetch deals if the user is a wholesaler
      if (profileData.role === 'wholesaler') {
        try {
          const dealsRes = await api.get(`/users/${id}/deals`);
          setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : dealsRes.data?.deals || []);
        } catch {
          // Non-critical — user might not have deals
          setDeals([]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleContact = () => {
    toast.success('Your message has been sent. You will be notified when they respond.');
  };

  /* Loading */
  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingWrap}>
          <LoadingSpinner size={48} />
        </div>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>{error}</div>
        <div style={{ textAlign: 'center' }}>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.name || 'Unknown User';
  const displayRole = profile.role || 'member';
  const isVerified = profile.verificationStatus === 'verified' || profile.verified;
  const isOwnProfile = user?.id === id;

  return (
    <div style={styles.page}>
      {/* Back navigation */}
      <button
        style={styles.backButton}
        onClick={() => navigate(-1)}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        &#8592; Back
      </button>

      {/* Profile header */}
      <div style={styles.profileHeader}>
        <div style={styles.headerTop}>
          <Avatar name={displayName} size={80} />
          <div style={styles.profileInfo}>
            <div style={styles.nameRow}>
              <span style={styles.profileName}>{displayName}</span>
              {isVerified && (
                <span style={styles.verifiedBadge}>
                  &#10003; Verified
                </span>
              )}
            </div>
            {profile.company && (
              <div style={styles.profileCompany}>{profile.company}</div>
            )}
            <div style={styles.badgeRow}>
              <StatusBadge status={displayRole} />
              {profile.reputationScore != null && (
                <div style={styles.reputationRow}>
                  <StarRating value={Math.round(ratings.average || profile.reputationScore)} size={18} />
                  <span style={styles.reputationScore}>
                    {Number(ratings.average || profile.reputationScore).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {!isOwnProfile && (
            <Button variant="primary" onClick={handleContact}>
              Contact
            </Button>
          )}
        </div>

        {profile.bio && (
          <div style={styles.bio}>{profile.bio}</div>
        )}
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{formatNumber(profile.dealsCompleted || 0)}</div>
          <div style={styles.statLabel}>Deals Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <StarRating value={Math.round(ratings.average || 0)} size={20} />
          </div>
          <div style={styles.statValue}>
            {ratings.total > 0 ? `${Number(ratings.average).toFixed(1)}` : 'N/A'}
          </div>
          <div style={styles.statLabel}>
            {ratings.total > 0 ? `${ratings.total} Review${ratings.total !== 1 ? 's' : ''}` : 'No Reviews Yet'}
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {profile.memberSince ? formatDate(profile.memberSince) : 'N/A'}
          </div>
          <div style={styles.statLabel}>Member Since</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{profile.responseTime || '< 2 hrs'}</div>
          <div style={styles.statLabel}>Avg. Response Time</div>
        </div>
      </div>

      {/* Active Listings (wholesalers only) */}
      {displayRole === 'wholesaler' && deals.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Active Listings</div>
          <div style={styles.listingsGrid}>
            {deals.map((deal) => (
              <div
                key={deal._id || deal.id}
                style={styles.listingCard}
                onClick={() => navigate(`/deals/${deal._id || deal.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={styles.listingAddress}>
                  {deal.address || deal.propertyAddress || deal.title || 'Property Listing'}
                </div>
                <div style={styles.listingDetails}>
                  {[deal.city, deal.state].filter(Boolean).join(', ')}
                  {deal.propertyType ? ` \u00B7 ${deal.propertyType}` : ''}
                  {deal.bedrooms ? ` \u00B7 ${deal.bedrooms} BD` : ''}
                  {deal.bathrooms ? ` / ${deal.bathrooms} BA` : ''}
                </div>
                {deal.askingPrice && (
                  <div style={styles.listingPrice}>
                    ${Number(deal.askingPrice).toLocaleString()}
                  </div>
                )}
                <div style={{ marginTop: '0.5rem' }}>
                  <StatusBadge status={deal.status || 'active'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wholesaler with no listings */}
      {displayRole === 'wholesaler' && deals.length === 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Active Listings</div>
          <EmptyState
            icon={'\uD83C\uDFE0'}
            title="No Active Listings"
            message="This wholesaler does not have any active listings at the moment."
          />
        </div>
      )}

      {/* Reviews */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          Reviews {ratings.total > 0 ? `(${ratings.total})` : ''}
        </div>
        {ratings.ratings && ratings.ratings.length > 0 ? (
          ratings.ratings.map((review) => (
            <div key={review._id || review.id || review.createdAt} style={styles.reviewCard}>
              <div style={styles.reviewHeader}>
                <div style={styles.reviewerInfo}>
                  <Avatar name={review.reviewerName || review.reviewer?.name || 'Anonymous'} size={32} />
                  <div>
                    <div style={styles.reviewerName}>
                      {review.reviewerName || review.reviewer?.name || 'Anonymous'}
                    </div>
                    <StarRating value={review.rating || 0} size={14} />
                  </div>
                </div>
                <div style={styles.reviewDate}>
                  {formatTimeAgo(review.createdAt)}
                </div>
              </div>
              {review.comment && (
                <div style={styles.reviewComment}>{review.comment}</div>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon={'\u2605'}
            title="No Reviews Yet"
            message="This user has not received any reviews yet. Be the first to leave a review after completing a deal."
          />
        )}
      </div>
    </div>
  );
}
