import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import {
  Button,
  Badge,
  LoadingSpinner,
  EmptyState,
  SearchBar,
} from '../../components/common';

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  page: {
    padding: '1.5rem 2rem',
    maxWidth: 1100,
    margin: '0 auto',
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
  },

  /* Hero header */
  hero: {
    textAlign: 'center',
    marginBottom: '2rem',
    padding: '2rem 0 1rem',
  },
  heroTitle: {
    fontSize: '2rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    letterSpacing: '-0.02em',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-info))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSubtitle: {
    fontSize: '1.0625rem',
    color: 'var(--text-secondary)',
    maxWidth: 560,
    margin: '0 auto',
    lineHeight: 1.6,
  },

  /* Toolbar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
  },
  searchWrap: {
    flex: 1,
    minWidth: 200,
  },

  /* Category pills */
  pillsRow: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
    marginBottom: '1.5rem',
  },
  pill: {
    padding: '0.375rem 0.875rem',
    fontSize: '0.8125rem',
    fontWeight: 500,
    borderRadius: '9999px',
    border: '1px solid var(--border-color)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    whiteSpace: 'nowrap',
  },
  pillActive: {
    background: 'var(--accent-primary)',
    color: '#fff',
    borderColor: 'var(--accent-primary)',
  },

  /* Course grid */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },

  /* Course card */
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    overflow: 'hidden',
    transition: 'var(--transition)',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },
  cardTop: {
    height: 6,
    width: '100%',
  },
  cardBody: {
    padding: '1.25rem 1.5rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  cardCategory: {
    marginBottom: '0.75rem',
  },
  cardTitle: {
    fontSize: '1.0625rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
    lineHeight: 1.4,
  },
  cardDescription: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    marginBottom: '1rem',
    flex: 1,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-color)',
  },
  cardAuthor: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
  },
  cardReadTime: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cardFooter: {
    padding: '0.875rem 1.5rem',
    borderTop: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)',
  },

  /* Results count */
  resultCount: {
    fontSize: '0.8125rem',
    color: 'var(--text-muted)',
    marginBottom: '1rem',
  },
};

/* ============================================================
   CATEGORY CONFIG
   ============================================================ */

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Fundamentals', value: 'fundamentals' },
  { label: 'Lead Generation', value: 'lead_generation' },
  { label: 'Deal Analysis', value: 'deal_analysis' },
  { label: 'Networking', value: 'networking' },
  { label: 'Legal', value: 'legal' },
  { label: 'Growth', value: 'growth' },
];

const categoryColors = {
  fundamentals: { bg: 'rgba(108, 92, 231, 0.12)', color: 'var(--accent-primary)', bar: 'var(--accent-primary)' },
  lead_generation: { bg: 'rgba(0, 214, 143, 0.12)', color: 'var(--accent-success)', bar: 'var(--accent-success)' },
  deal_analysis: { bg: 'rgba(52, 152, 219, 0.12)', color: 'var(--accent-info)', bar: 'var(--accent-info)' },
  networking: { bg: 'rgba(255, 170, 0, 0.12)', color: 'var(--accent-warning)', bar: 'var(--accent-warning)' },
  legal: { bg: 'rgba(255, 71, 87, 0.12)', color: 'var(--accent-danger)', bar: 'var(--accent-danger)' },
  growth: { bg: 'rgba(0, 184, 148, 0.12)', color: '#00b894', bar: '#00b894' },
};

function getCategoryStyle(category) {
  return categoryColors[category] || categoryColors.fundamentals;
}

function formatCategoryLabel(category) {
  if (!category) return 'General';
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ============================================================
   COURSES PAGE
   ============================================================ */

export default function CoursesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/education/courses');
      const data = res.data;
      setCourses(data.courses || data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  /* Filtered courses */
  const filteredCourses = useMemo(() => {
    let result = courses;

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(
        (c) => c.category === activeCategory || c.category?.toLowerCase().replace(/\s+/g, '_') === activeCategory
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.author?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [courses, activeCategory, search]);

  return (
    <div style={styles.page}>
      {/* Hero header */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>
          <span style={styles.heroAccent}>DispoHub</span> Academy
        </h1>
        <p style={styles.heroSubtitle}>
          Master wholesale real estate with expert-crafted courses. From deal
          analysis to lead generation, level up your investing game.
        </p>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Search */}
      <div style={styles.toolbar}>
        <div style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search courses by title, topic, or author..."
          />
        </div>
      </div>

      {/* Category pills */}
      <div style={styles.pillsRow}>
        {categories.map((cat) => (
          <button
            key={cat.value}
            style={{
              ...styles.pill,
              ...(activeCategory === cat.value ? styles.pillActive : {}),
            }}
            onClick={() => setActiveCategory(cat.value)}
            onMouseEnter={(e) => {
              if (activeCategory !== cat.value) {
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeCategory !== cat.value) {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div style={styles.loadingWrap}>
          <LoadingSpinner size={48} />
        </div>
      ) : filteredCourses.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={'\uD83D\uDCDA'}
          title="No Courses Found"
          message={
            search || activeCategory !== 'all'
              ? 'Try adjusting your search or category filter to find what you are looking for.'
              : 'New courses are being developed. Check back soon for expert content.'
          }
          action={
            (search || activeCategory !== 'all') && (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Result count */}
          <div style={styles.resultCount}>
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
          </div>

          {/* Course grid */}
          <div style={styles.grid}>
            {filteredCourses.map((course) => {
              const catStyle = getCategoryStyle(course.category);
              return (
                <div
                  key={course._id || course.id}
                  style={styles.card}
                  onClick={() => navigate(`/education/${course._id || course.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Color top bar */}
                  <div style={{ ...styles.cardTop, background: catStyle.bar }} />

                  <div style={styles.cardBody}>
                    {/* Category badge */}
                    <div style={styles.cardCategory}>
                      <Badge
                        variant="neutral"
                        style={{ background: catStyle.bg, color: catStyle.color }}
                      >
                        {formatCategoryLabel(course.category)}
                      </Badge>
                    </div>

                    {/* Title */}
                    <div style={styles.cardTitle}>{course.title}</div>

                    {/* Description */}
                    <div style={styles.cardDescription}>
                      {course.description || course.contentPreview || ''}
                    </div>

                    {/* Meta */}
                    <div style={styles.cardMeta}>
                      <span style={styles.cardAuthor}>
                        By {course.author || 'DispoHub Team'}
                      </span>
                      <span style={styles.cardReadTime}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {course.readTime || '5 min read'}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={styles.cardFooter}>
                    <Button variant="primary" size="sm" fullWidth>
                      Start Learning
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
