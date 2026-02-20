import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { Button, Badge, LoadingSpinner } from '../../components/common';
import { useToast } from '../../components/common';

/* ============================================================
   STYLES
   ============================================================ */

const styles = {
  /* Progress bar at top */
  progressBar: {
    position: 'fixed',
    top: 0,
    left: 0,
    height: 3,
    background: 'var(--accent-primary)',
    zIndex: 999,
    transition: 'width 0.1s linear',
  },

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
    textAlign: 'center',
  },

  /* Back button */
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
    marginBottom: '1.5rem',
    transition: 'var(--transition)',
  },

  /* Layout */
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 260px',
    gap: '2rem',
    alignItems: 'flex-start',
  },
  mainColumn: {
    minWidth: 0,
  },
  sidebar: {
    position: 'sticky',
    top: '1.5rem',
  },

  /* Course header */
  header: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    marginBottom: '1.5rem',
  },
  headerCategory: {
    marginBottom: '0.75rem',
  },
  headerTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.3,
    marginBottom: '0.75rem',
    letterSpacing: '-0.01em',
  },
  headerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    flexWrap: 'wrap',
    marginBottom: '1rem',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem',
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  headerDescription: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
  },

  /* Article content */
  article: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem 2.5rem',
    marginBottom: '1.5rem',
  },
  articleContent: {
    fontSize: '0.9375rem',
    color: 'var(--text-primary)',
    lineHeight: 1.8,
  },
  paragraph: {
    marginBottom: '1.25rem',
  },
  sectionHeading: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '2rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid var(--border-color)',
  },

  /* Table of contents (sidebar) */
  tocCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    marginBottom: '1rem',
  },
  tocTitle: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '0.75rem',
  },
  tocList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  tocItem: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    padding: '0.375rem 0.5rem',
    borderLeft: '2px solid transparent',
    cursor: 'pointer',
    transition: 'var(--transition)',
    marginBottom: '0.125rem',
    borderRadius: '0 var(--border-radius) var(--border-radius) 0',
  },
  tocItemActive: {
    color: 'var(--accent-primary)',
    borderLeftColor: 'var(--accent-primary)',
    background: 'rgba(108, 92, 231, 0.06)',
    fontWeight: 600,
  },

  /* Complete button */
  completeCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.25rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  completedBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.625rem',
    background: 'rgba(0, 214, 143, 0.1)',
    borderRadius: 'var(--border-radius)',
    color: 'var(--accent-success)',
    fontSize: '0.875rem',
    fontWeight: 600,
  },

  /* Related courses */
  relatedSection: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '1.5rem 2rem',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  relatedTitle: {
    fontSize: '1.0625rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: '0.5rem',
  },
  relatedDesc: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginBottom: '1rem',
  },

  /* Responsive fallback for sidebar */
  sidebarMobile: {
    display: 'none',
  },
};

/* ============================================================
   CATEGORY CONFIG
   ============================================================ */

const categoryColors = {
  fundamentals: { bg: 'rgba(108, 92, 231, 0.12)', color: 'var(--accent-primary)' },
  lead_generation: { bg: 'rgba(0, 214, 143, 0.12)', color: 'var(--accent-success)' },
  deal_analysis: { bg: 'rgba(52, 152, 219, 0.12)', color: 'var(--accent-info)' },
  networking: { bg: 'rgba(255, 170, 0, 0.12)', color: 'var(--accent-warning)' },
  legal: { bg: 'rgba(255, 71, 87, 0.12)', color: 'var(--accent-danger)' },
  growth: { bg: 'rgba(0, 184, 148, 0.12)', color: '#00b894' },
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
   HELPERS
   ============================================================ */

function extractSections(content) {
  if (!content) return [];
  const lines = content.split('\n');
  const sections = [];
  for (const line of lines) {
    // Match numbered sections like "1. Title" or "## Title"
    const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
    const headerMatch = line.match(/^#{1,3}\s+(.+)/);
    if (numberedMatch) {
      sections.push({
        id: `section-${numberedMatch[1]}`,
        label: numberedMatch[2].trim(),
        number: numberedMatch[1],
      });
    } else if (headerMatch) {
      const id = headerMatch[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      sections.push({
        id: `section-${id}`,
        label: headerMatch[1].trim(),
        number: null,
      });
    }
  }
  return sections;
}

function renderContent(content) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let sectionCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    // Check for numbered section headers (e.g., "1. Title")
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    const headerMatch = trimmed.match(/^#{1,3}\s+(.+)/);

    if (numberedMatch) {
      sectionCounter++;
      elements.push(
        <h2
          key={`heading-${i}`}
          id={`section-${numberedMatch[1]}`}
          style={styles.sectionHeading}
        >
          {numberedMatch[1]}. {numberedMatch[2]}
        </h2>
      );
    } else if (headerMatch) {
      const id = headerMatch[1]
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      elements.push(
        <h2
          key={`heading-${i}`}
          id={`section-${id}`}
          style={styles.sectionHeading}
        >
          {headerMatch[1]}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Collect consecutive bullet points
      const bullets = [trimmed.substring(2)];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim().startsWith('* '))) {
        bullets.push(lines[j].trim().substring(2));
        j++;
      }
      elements.push(
        <ul
          key={`list-${i}`}
          style={{
            paddingLeft: '1.5rem',
            marginBottom: '1.25rem',
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}
        >
          {bullets.map((bullet, idx) => (
            <li key={idx} style={{ marginBottom: '0.375rem' }}>
              {bullet}
            </li>
          ))}
        </ul>
      );
      i = j - 1; // Skip processed lines
    } else {
      elements.push(
        <p key={`p-${i}`} style={styles.paragraph}>
          {trimmed}
        </p>
      );
    }
  }

  return elements;
}

/* ============================================================
   LOCAL STORAGE HELPERS
   ============================================================ */

const COMPLETED_KEY = 'dispohub_completed_courses';

function getCompletedCourses() {
  try {
    return JSON.parse(localStorage.getItem(COMPLETED_KEY) || '[]');
  } catch {
    return [];
  }
}

function markCourseComplete(courseId) {
  const completed = getCompletedCourses();
  if (!completed.includes(courseId)) {
    completed.push(courseId);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed));
  }
}

function isCourseCompleted(courseId) {
  return getCompletedCourses().includes(courseId);
}

/* ============================================================
   COURSE DETAIL PAGE
   ============================================================ */

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTocItem, setActiveTocItem] = useState(null);

  const articleRef = useRef(null);

  /* Fetch course */
  const fetchCourse = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/education/courses/${id}`);
      const data = res.data.course || res.data;
      setCourse(data);
      setCompleted(isCourseCompleted(data._id || data.id || id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  /* Scroll progress tracking */
  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const scrolled = window.scrollY;
      const progress = Math.min((scrolled / docHeight) * 100, 100);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Active TOC tracking via intersection */
  const sections = useMemo(() => {
    if (!course?.content) return [];
    return extractSections(course.content);
  }, [course?.content]);

  useEffect(() => {
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTocItem(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px' }
    );

    // Observe after a short delay so DOM is ready
    const timer = setTimeout(() => {
      sections.forEach((section) => {
        const el = document.getElementById(section.id);
        if (el) observer.observe(el);
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [sections]);

  /* Mark complete handler */
  const handleMarkComplete = () => {
    const courseId = course?._id || course?.id || id;
    markCourseComplete(courseId);
    setCompleted(true);
    toast.success('Course marked as complete. Great work!');
  };

  /* Scroll to section */
  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          <Button variant="secondary" onClick={() => navigate('/education')}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const catStyle = getCategoryStyle(course.category);

  return (
    <>
      {/* Scroll progress bar */}
      <div style={{ ...styles.progressBar, width: `${scrollProgress}%` }} />

      <div style={styles.page}>
        {/* Back button */}
        <button
          style={styles.backButton}
          onClick={() => navigate('/education')}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          &#8592; Back to Courses
        </button>

        <div style={styles.layout}>
          {/* Main column */}
          <div style={styles.mainColumn}>
            {/* Course header */}
            <div style={styles.header}>
              <div style={styles.headerCategory}>
                <Badge
                  variant="neutral"
                  style={{ background: catStyle.bg, color: catStyle.color }}
                >
                  {formatCategoryLabel(course.category)}
                </Badge>
              </div>

              <h1 style={styles.headerTitle}>{course.title}</h1>

              <div style={styles.headerMeta}>
                <span style={styles.metaItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {course.author || 'DispoHub Team'}
                </span>
                <span style={styles.metaItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {course.readTime || '5 min read'}
                </span>
              </div>

              {course.description && (
                <div style={styles.headerDescription}>{course.description}</div>
              )}
            </div>

            {/* Article content */}
            <div style={styles.article} ref={articleRef}>
              <div style={styles.articleContent}>
                {renderContent(course.content)}
              </div>
            </div>

            {/* Related courses */}
            <div style={styles.relatedSection}>
              <div style={styles.relatedTitle}>Continue Your Learning Journey</div>
              <div style={styles.relatedDesc}>
                Explore more courses to deepen your wholesale real estate expertise
              </div>
              <Button variant="primary" onClick={() => navigate('/education')}>
                Browse All Courses
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={styles.sidebar}>
            {/* Table of contents */}
            {sections.length > 0 && (
              <div style={styles.tocCard}>
                <div style={styles.tocTitle}>Table of Contents</div>
                <ul style={styles.tocList}>
                  {sections.map((section) => (
                    <li
                      key={section.id}
                      style={{
                        ...styles.tocItem,
                        ...(activeTocItem === section.id ? styles.tocItemActive : {}),
                      }}
                      onClick={() => scrollToSection(section.id)}
                      onMouseEnter={(e) => {
                        if (activeTocItem !== section.id) {
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeTocItem !== section.id) {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.background = 'transparent';
                        }
                      }}
                    >
                      {section.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Complete button */}
            <div style={styles.completeCard}>
              {completed ? (
                <div style={styles.completedBanner}>
                  &#10003; Course Completed
                </div>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleMarkComplete}
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
