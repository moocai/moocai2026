import { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Button, CircularProgress, Stack, useTheme, alpha, Drawer
} from '@mui/material';
import { BookOpen, ChevronDown, ChevronRight, Code2, CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

type I18nField = { ca: string; es: string; en: string };

interface SubTopic {
  subtitle: I18nField | string;
  text: I18nField | string;
  exampleCode: string;
}

interface Lesson {
  id: string;
  title: I18nField | string;
  description: I18nField | string;
  theoryInstructions: I18nField | string;
  challenge: I18nField | string;
  solution: string;
  subTopics?: SubTopic[];
}

interface Course {
  id: string;
  title: I18nField | string;
  description: I18nField | string;
  content: Lesson[];
  disabled?: boolean;
}

interface DataStructure { courses: Course[]; }

export default function CourseLessons() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [apiData, setApiData] = useState<DataStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const reSyncProgress = useCallback(() => {
    setProgress(JSON.parse(localStorage.getItem('mooc_global_progress') || '{}'));
  }, []);
  useEffect(() => {
    reSyncProgress();
    window.addEventListener('lessonProgressUpdated', reSyncProgress);
    return () => window.removeEventListener('lessonProgressUpdated', reSyncProgress);
  }, [reSyncProgress]);
  const course = apiData?.courses?.find(c => c.id === courseId);
  const defaultLessonId = course?.content?.[0]?.id ?? null;
  const activeId = activeLessonId ?? defaultLessonId;

  const lang = (i18n.language?.split('-')[0] as keyof I18nField) || 'ca';
  const getText = (field: I18nField | string | undefined): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ca'] || '';
  };

  useEffect(() => {
    fetch('/data.json')
      .then(res => res.json())
      .then(json => { setApiData(json); setLoading(false); })
      .catch(err => { console.error("Error:", err); setLoading(false); });
  }, []);


  if (loading) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <CircularProgress color="primary" />
    </Box>
  );

  if (!course) return <Typography>{t('lesson.course_not_found')}</Typography>;
  if (course.disabled) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'red', gap: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: 'red', bgcolor: 'error.main', px: 4, py: 1.5, borderRadius: 2, textAlign: 'center' }}>
        PROPERAMENT
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, bgcolor: 'background.default', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', height: '100%' }}>

        {/* LEFT SIDEBAR - Accordion Syllabus */}
        <Box sx={{
          width: { md: '24%', lg: '22%', xl: '18%' },
          minWidth: { md: 240, lg: 280 },
          maxWidth: { md: 340, lg: 380, xl: 400 },
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'block' },
          bgcolor: 'background.paper',
          pt: 4,
        }}>
          <Box sx={{ px: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BookOpen size={30} color={theme.palette.primary.main} />
              <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary' }}>
                {t('lesson.syllabus')}
              </Typography>
            </Box>
          </Box>
          {course.content?.map((lesson, index) => (
            <Accordion key={lesson.id} disableGutters elevation={0} sx={{
              '&:before': { display: 'none' },
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: 'transparent',
            }}>
              <AccordionSummary expandIcon={<ChevronDown size={30} />} sx={{
                px: 2, minHeight: 48,
                '& .MuiAccordionSummary-content': { my: 0 },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.5) }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                    {String(index + 1).padStart(2, '0')}
                  </Typography>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                    {getText(lesson.title)}
                  </Typography>
                  {progress[`${courseId}_${lesson.id}`] && (
                    <CheckCircle2 size={16} color={theme.palette.success.main} />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pb: 2, pt: 1 }}>
                <Stack spacing={0.5}>
                  {lesson.subTopics?.map((sub, i) => (
                    <Button
                      key={i}
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        const el = document.getElementById(`sub-${lesson.id}-${i}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disableRipple sx={{justifyContent: 'flEx-start',fontSize: '1rem', color: 'text.secondary',textTransform: 'none', minWidth: 0, borderRadius: 1, '&:hover': { color: '#149eca', bgcolor: alpha('#149eca', 0.06) }}}>
                      {getText(sub.subtitle)}
                    </Button>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* CENTRAL COLUMN - Reading Content */}
        <Box sx={{
          flex: '1 1 auto',
          minWidth: 0,
          maxWidth: { md: 'none' },
          px: { xs: 3, md: 6 },
          py: 6,
          overflowY: 'auto',
          height: 'calc(100vh - 64px)',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 3 }
        }}>
          {/* Mobile syllabus toggle */}
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 3 }}>
            <Button
              onClick={() => setMobileSyllabusOpen(true)}
              variant="outlined"
              size="small"
              startIcon={<BookOpen size={16} />}
              sx={{ fontWeight: 700, borderRadius: 2, textTransform: 'none' }}
            >
              {t('lesson.syllabus')}
            </Button>
          </Box>

          {/* Mobile syllabus drawer */}
          <Drawer
            open={mobileSyllabusOpen}
            onClose={() => setMobileSyllabusOpen(false)}
            anchor="left"
            slotProps={{ paper: { sx: { width: 280, pt: 4, bgcolor: 'background.paper' } } }}
          >
            <Box component="aside">
            <Box sx={{ px: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookOpen size={30} color={theme.palette.primary.main} />
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'text.secondary', flex: 1 }}>
                  {t('lesson.syllabus')}
                </Typography>
                <Box component="button" onClick={() => setMobileSyllabusOpen(false)} sx={{ border: 'none', bgcolor: 'transparent', cursor: 'pointer', display: 'flex', p: 0.5, borderRadius: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                  <X size={24} />
                </Box>
              </Box>
            </Box>
            {course.content?.map((lesson, index) => (
              <Accordion key={lesson.id} disableGutters elevation={0} sx={{
                '&:before': { display: 'none' },
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'transparent',
              }}>
                <AccordionSummary expandIcon={<ChevronDown size={30} />} sx={{
                  px: 2, minHeight: 48,
                  '& .MuiAccordionSummary-content': { my: 0 },
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.5) }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {String(index + 1).padStart(2, '0')}
                    </Typography>
                    <Typography sx={{ fontSize: '1rem', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>
                      {getText(lesson.title)}
                    </Typography>
                    {progress[`${courseId}_${lesson.id}`] && (
                      <CheckCircle2 size={16} color={theme.palette.success.main} />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pb: 2, pt: 1 }}>
                  <Stack spacing={0.5}>
                    {lesson.subTopics?.map((sub, i) => (
                      <Button
                        key={i}
                        onClick={() => {
                          setActiveLessonId(lesson.id);
                          setMobileSyllabusOpen(false);
                          const el = document.getElementById(`sub-${lesson.id}-${i}`);
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        disableRipple sx={{ justifyContent: 'flex-start', fontSize: '1rem', color: 'text.secondary', textTransform: 'none', minWidth: 0, borderRadius: 1, '&:hover': { color: '#149eca', bgcolor: alpha('#149eca', 0.06) } }}>
                        {getText(sub.subtitle)}
                      </Button>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            ))}
            </Box>
          </Drawer>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Breadcrumb */}
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mb: 3, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <RouterLink to="/" style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>{t('lesson.academy')}</RouterLink>
              <ChevronRight size={12} />
              <span style={{ fontWeight: 800 }}>{getText(course.title)}</span>
            </Typography>

            {/* Course Title */}
            <Typography variant="h2" sx={{
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '3rem' },
              letterSpacing: '-0.03em',
              mb: 2,
              lineHeight: 1.1
            }}>
              {getText(course.title)}
            </Typography>

            {/* Course Description */}
            <Typography sx={{
              color: 'text.secondary',
              fontSize: '1.4rem',
              lineHeight: 1.7,
              mb: 6,
              maxWidth: '900px'
            }}>
              {getText(course.description)}
            </Typography>

            {/* Lesson List */}
            {course.content?.filter(l => l.id === activeId).map((lesson, index) => (
              <motion.div
                key={lesson.id}
                id={`lesson-${lesson.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
              >
                <Box sx={{ mb: 8 }}>
                  {/* Lesson Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box sx={{ width: 6, height: 28, bgcolor: 'primary.main', borderRadius: 2, flexShrink: 0 }} />
                    <Typography variant="h4" sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.3rem', md: '1.5rem' },
                      letterSpacing: '-0.02em'
                    }}>
                      {getText(lesson.title)}
                    </Typography>
                    {progress[`${courseId}_${lesson.id}`] && (
                      <CheckCircle2 size={20} color={theme.palette.success.main} />
                    )}
                  </Box>

                  {/* Sub-topics */}
                  {lesson.subTopics?.map((sub, i) => (
                    <Box key={i} id={`sub-${lesson.id}-${i}`} sx={{ mb: 5 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '1.15rem', mb: 1.5, color: '#149eca' }}>
                        {getText(sub.subtitle)}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '1rem', lineHeight: 1.8, mb: 2.5, whiteSpace: 'pre-line'}}>
                        {getText(sub.text)}
                      </Typography>
                      {sub.exampleCode && (
                        <Box sx={{ bgcolor: '#1a1d23', border: '1px solid', borderColor: '#30363d', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ px: 2.5, py: 1.25, bgcolor: '#23272f', borderBottom: '1px solid #30363d', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Code2 size={14} color="#8b949e" />
                            <Typography sx={{ fontSize: '0.65rem', color: '#8b949e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Example
                            </Typography>
                          </Box>
                          <Box sx={{ p: 3, overflow: 'auto' }}>
                            <Typography sx={{ fontFamily: "'Fira Code', 'Consolas', monospace", fontSize: '0.9rem', color: '#7ee787', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                              {sub.exampleCode}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  ))}

                  {/* Start Challenge */}
                  <Button
                    component={RouterLink}
                    to={`/courses/${courseId}/${lesson.id}`}
                    variant="contained"
                    sx={{ fontWeight: 700, borderRadius: 2, px: 4, py: 1.5, mt: 2 }}
                  >
                    Start Challenge
                  </Button>
                </Box>
              </motion.div>
            ))}
          </motion.div>
        </Box>

        {/* RIGHT COLUMN - Anchor Links & Challenge */}
        <Box sx={{
          width: { md: '22%', lg: '20%', xl: '18%' },
          minWidth: { md: 200, lg: 220 },
          maxWidth: { md: 260, lg: 300, xl: 340 },
          flexShrink: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', md: 'block' },
          bgcolor: 'background.paper',
          pt: 4,
          px: 2,
          pb: 2,
        }}>
          {/* On this page */}
          <Typography sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'text.secondary',
            mb: 2
          }}>
            On this page
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 5 }}>
            {course.content?.filter(l => l.id === activeId).map((lesson) => (
                <Box key={lesson.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'text.primary',
                    flex: 1,
                  }}>
                    {getText(lesson.title)}
                  </Typography>
                  {progress[`${courseId}_${lesson.id}`] ? (
                    <CheckCircle2 size={14} color={theme.palette.success.main} />
                  ) : (
                    <Code2 size={14} color={theme.palette.primary.main} />
                  )}
                </Box>
                <Stack spacing={0.25} sx={{ ml: 1.5, mt: 0.25 }}>
                  {lesson.subTopics?.map((sub, i) => (
                    <Button
                      key={i}
                      onClick={() => {
                        setActiveLessonId(lesson.id);
                        const el = document.getElementById(`sub-${lesson.id}-${i}`);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      disableRipple
                      sx={{
                        justifyContent: 'flex-start',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: 'text.secondary',
                        textTransform: 'none',
                        py: 0.2,
                        px: 0,
                        minWidth: 0,
                        '&:hover': { color: '#149eca', bgcolor: 'transparent' }
                      }}
                    >
                      {getText(sub.subtitle)}
                    </Button>
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
