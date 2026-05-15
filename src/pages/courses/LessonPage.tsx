import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Terminal, Play, CheckCircle2, Zap, Save, Trophy, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Typography, Button, IconButton, alpha, CircularProgress, useTheme, useMediaQuery } from '@mui/material';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

interface Lesson { id: string; title: string | { ca: string; es: string; en: string }; description: string | { ca: string; es: string; en: string }; challenge: string | { ca: string; es: string; en: string }; initialCode: string | { ca: string; es: string; en: string }; solution: string | { ca: string; es: string; en: string }; exerciseInstructions?: string | { ca: string; es: string; en: string }; theoryInstructions?: string | { ca: string; es: string; en: string }; subTopics?: { subtitle: string | { ca: string; es: string; en: string }; text: string | { ca: string; es: string; en: string }; exampleCode: string; }[]; }
interface Course { id: string; title: string | { ca: string; es: string; en: string }; content: Lesson[]; }
interface Student { id: string; name: string; }
interface DataStructure { courses: Course[]; students: Student[]; }
type Mode = 'normal' | 'drill' | 'assist' | 'hackathon';

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mounted, setMounted] = useState(false);
  const [apiData, setApiData] = useState<DataStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [userInput, setUserInput] = useState("");
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'pass' | 'fail'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [wasSavedInSession, setWasSavedInSession] = useState(false);
  const [currentMode, setCurrentMode] = useState<Mode>('normal');
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hackathonPoints, setHackathonPoints] = useState(0);
  const [fadeKey, setFadeKey] = useState(0);
  const [hasAttemptedRun, setHasAttemptedRun] = useState(false);
  const [assistsLeft, setAssistsLeft] = useState(3);
  const [showResultModal, setShowResultModal] = useState(false);

  const lang = (i18n.language?.split('-')[0]) as 'ca' | 'es' | 'en';
  const getText = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ca'] || '';
  };

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('currentStudent');
    if (saved) setCurrentUser(JSON.parse(saved));
    fetch('/data.json').then(res => res.json()).then(json => { setApiData(json); setLoading(false); }).catch(err => { console.error("Error:", err); setLoading(false); });
  }, []);

  const course = apiData?.courses?.find((c) => c.id === courseId);
  const baseLesson = course?.content?.find((l) => l.id === lessonId);
  const currentLessonIndex = course?.content?.findIndex((l) => l.id === lessonId) ?? -1;

  const goToLesson = (index: number) => {
    if (!course?.content?.[index]) return;
    setFadeKey(prev => prev + 1);
    navigate(`/courses/${courseId}/${course.content[index].id}`);
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  const handlePrevious = () => { if (currentLessonIndex > 0) goToLesson(currentLessonIndex - 1); };
  const handleNext = () => {
    if (course) navigate(`/courses/${course.id}`);
  };
  const codeStorageKey = currentUser ? `code_${currentUser.id}_${courseId}_${lessonId}` : `temp_code_${lessonId}`;
  const getGlobalProgressKey = () => `${courseId}_${lessonId}`;

  useEffect(() => {
    if (mounted && baseLesson) {
      const savedCode = localStorage.getItem(codeStorageKey);
      setUserInput(savedCode || getText(baseLesson.initialCode) || '');
      const globalProgress = JSON.parse(localStorage.getItem('mooc_global_progress') || '{}');
      const key = getGlobalProgressKey();
      if (globalProgress[key]) setStatus('pass'); else setStatus('idle');
      setConsoleOutput([]); setHintVisible(false); setTimer(60); setIsTimerActive(false); setIsDirty(false); setWasSavedInSession(false); setHasAttemptedRun(false); setAssistsLeft(3); setShowResultModal(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [baseLesson, mounted, currentUser, courseId, lessonId]);

  useEffect(() => {
    if (currentMode === 'drill' && isTimerActive && timer > 0 && status !== 'pass') {
      timerRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0 && currentMode === 'drill' && status !== 'fail') {
      setStatus('fail'); setIsTimerActive(false);
      if (!hasAttemptedRun) window.alert("⏰ Temps esgotat! Has de executar el codi per completar el drill.");
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerActive, timer, currentMode, status]);

  const handleSaveProgress = async (isAutoSaveOnPass = false) => {
    if (!currentUser || !courseId || !lessonId) return;
    setIsSaving(true);
    try {
      const globalProgress = JSON.parse(localStorage.getItem('mooc_global_progress') || '{}');
      const key = getGlobalProgressKey();
      const wasAlreadyComplete = globalProgress[key] === true;
      localStorage.setItem(codeStorageKey, userInput);
      if (isAutoSaveOnPass) {
        globalProgress[key] = true;
        localStorage.setItem('mooc_global_progress', JSON.stringify(globalProgress));
        if (!wasAlreadyComplete) {
          const currentPoints = parseInt(localStorage.getItem(`points_${currentUser.id}`) || '0');
          const newPoints = currentPoints + 10;
          localStorage.setItem(`points_${currentUser.id}`, newPoints.toString());
          setConsoleOutput(p => [...p, `🏆 +10 Punts! (Total: ${newPoints})`]);
        }
      }
      setIsDirty(false); setWasSavedInSession(true);
      setConsoleOutput(p => [...p, "💾 Sincronitzat!"]);
      await api.postProgress({ studentId: currentUser.id, courseId, lessonId, status: globalProgress[key] || false });
      window.dispatchEvent(new Event('lessonProgressUpdated'));
    } catch (err) { setConsoleOutput(p => [...p, "⚠️ Error local"]); } 
    finally { setIsSaving(false); }
  };

  const handleStartDrill = () => {
    setTimer(60);
    setIsTimerActive(true);
    setHasAttemptedRun(false);
    setConsoleOutput(prev => [...prev, "⏱️ DRILL ACTIVAT! Tens 60 segons!"]);
  };

  const handleRunTests = () => {
    if (currentMode === 'drill' && !isTimerActive && status !== 'pass') return;
    setHasAttemptedRun(true);
    setConsoleOutput(["[SISTEMA]: Executant..."]);
    const cleanUser = userInput.replace(/\s+/g, '').trim();
    const cleanSol = getText(baseLesson?.solution).replace(/\s+/g, '').trim() || "";
    setTimeout(() => {
      const passed = cleanUser.includes(cleanSol);
      if (passed) {
        setStatus('pass'); setIsTimerActive(false); setConsoleOutput(p => [...p, "✅ COMPLETAT! Molt bé, pots continuar!"]);
        if (currentMode === 'hackathon') setHackathonPoints(pts => pts + 150);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
        handleSaveProgress(true);
      } else { setStatus('fail'); setConsoleOutput(p => [...p, "❌ Revisa el codi"]); }
      if (courseId === 'Python') {
        if (currentUser) {
          const key = `mooc_submissions_${courseId}_${lessonId}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          existing.unshift({ studentId: currentUser.id, studentName: currentUser.name, passed, timestamp: Date.now() });
          localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
        }
        setShowResultModal(true);
      }
    }, 800);
  };

  if (loading) return <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}><CircularProgress color="secondary" /></Box>;
  if (!mounted || !course || !baseLesson) return null;

  const globalProgress = course?.content?.reduce((acc, lesson) => acc + (JSON.parse(localStorage.getItem('mooc_global_progress') || '{}')[`${courseId}_${lesson.id}`] ? 1 : 0), 0) ?? 0;
  const progressPercent = course?.content?.length ? (globalProgress / course.content.length) * 100 : 0;

  // MOBILE LAYOUT - Optimized for xs
 if (isMobile) {
  return (
    <Box sx={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden' }}>
      {progressPercent > 0 && <Box sx={{ height: 4, bgcolor: 'action.hover' }}><Box sx={{ height: '100%', width: `${progressPercent}%`, bgcolor: 'primary.main' }} /></Box>}
      
      {/* Header */}
      <Box sx={{ height: 48, borderColor: 'divider', display: 'flex', alignItems: 'center', px: 1, justifyContent: 'space-between', flexShrink: 0,mt:10}}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}><ChevronLeft /></IconButton>
        </Box>
        <Box sx={{ display: 'flex', bgcolor: 'action.hover', p: 0.25, borderRadius: 1 }}>
          {(['normal', 'drill', 'assist', 'hackathon'] as Mode[]).map((m) => (
            <Button key={m} onClick={() => { setCurrentMode(m); setTimer(60); setIsTimerActive(false); setAssistsLeft(3); setHintVisible(false); }} sx={{ px: 1, py: 0.20, fontSize: 9, minWidth: 28, bgcolor: currentMode === m ? 'primary.main' : 'transparent', color: currentMode === m ? 'white' : 'text.secondary' }}>{m.toUpperCase()}</Button>
          ))}
        </Box>
        <Button onClick={() => handleSaveProgress(status === 'pass')} disabled={isSaving} sx={{ minWidth: 80, fontSize: 9, color: 'primary.main', fontWeight: 700 }}>{isSaving ? '...' : wasSavedInSession ? t('lesson.saved') : t('lesson.save')}</Button>
      </Box>

      {/* Content - Vertical Stack */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>

        {/* 1r: ENUNCIAT */}
        <Box sx={{ width: '100%', bgcolor: 'background.paper', p: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0}}>
          <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.5, color: 'primary.main' }}>{t('lesson.your_challenge')}</Typography>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{getText(baseLesson.challenge)}</Typography>
          </Box>
        </Box>

        {/* 2n: RENDER (Editor) */}
        <Box sx={{ flex: courseId === 'Python' ? 1 : 'unset', height: courseId === 'Python' ? 'auto' : 170, display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e', width: '100%', flexShrink: 0 }}>
        <Box sx={{ height: 28, px: 1.5, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333' }}>
          <Typography sx={{ fontSize: 10, color: '#888', fontWeight: 600 }}>{t('lesson.app_file')}</Typography>
          {currentMode === 'drill' && !isTimerActive && status !== 'pass' && (
            <Button onClick={handleStartDrill} size="small" sx={{ minWidth: 44, minHeight: 18, fontSize: 8, bgcolor: '#6366f1', color: '#fff', fontWeight: 700, px: 1, borderRadius: 0.5, '&:hover': { bgcolor: '#4f46e5' } }}>▶ START</Button>
          )}
          {currentMode === 'drill' && isTimerActive && (
            <Typography sx={{ fontSize: 9, color: '#a5b4fc', fontWeight: 700 }}>{timer}s</Typography>
          )}
        </Box>
        <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
          {courseId === 'Python' && showResultModal ? (
            <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: '#1e1e1e', display: 'flex', flexDirection: 'column', p: 1.5 }}>
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {consoleOutput.map((line, i) => (
                  <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: '0.85rem', mb: 0.5, color: line.includes('✅') || line.includes('🏆') || line.includes('💾') ? '#4ade80' : line.includes('❌') || line.includes('Revisa') ? '#f87171' : line.includes('SISTEMA') ? '#60a5fa' : '#aaa' }}>{'>'} {line}</Typography>
                ))}
                  {(() => {
                    const raw: any[] = JSON.parse(localStorage.getItem(`mooc_submissions_${courseId}_${lessonId}`) || '[]');
                    const others = raw.filter(s => s.studentId !== currentUser?.id).slice(0, 5);
                    if (others.length === 0) return null;
                    return (
                      <>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', mt: 2, mb: 1, borderTop: '1px solid #333', pt: 1 }}>ALTRES ESTUDIANTS:</Typography>
                        {others.map((s: any, i: number) => (
                          <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: s.passed ? '#4ade80' : '#f87171', mb: 0.25 }}>{s.passed ? '✅' : '❌'} {s.studentName}</Typography>
                        ))}
                      </>
                    );
                  })()}
              </Box>
            </Box>
          ) : (
            <textarea 
              value={userInput} 
              onChange={(e) => { setUserInput(e.target.value); setIsDirty(true); }} 
              style={{ width: '100%', height: '100%', background: 'transparent', color: '#b5e853', fontFamily: "'Fira Code', monospace", border: 'none', resize: 'none', fontSize: '0.85rem', outline: 'none' }} 
            />
          )}
        </Box>
      </Box>

        {courseId !== 'Python' && (
        /* 3r: PROMPT (Console) */
        <Box sx={{ height: 170, display: 'flex', flexDirection: 'column', width: '100%', bgcolor: '#000', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Box sx={{ height: 22, px: 1.5, bgcolor: '#111', display: 'flex', alignItems: 'center' }}>
          <Terminal size={10} style={{ opacity: 0.4, marginRight: 4, color: '#fff' }} />
          <Typography sx={{ fontSize: 8, color: '#888', fontWeight: 600 }}>CONSOLE</Typography>
        </Box>
        <Box sx={{ p: 1, overflowY: 'auto', flex: 1 }}>
          {consoleOutput.length === 0 && <Typography sx={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>{`// ${t('lesson.waiting_execution')}`}</Typography>}
          {consoleOutput.map((line, i) => (
            <Typography key={i} sx={{ fontSize: 9, mb: 0.2, fontFamily: 'monospace', color: line.includes('✅') ? '#4ade80' : line.includes('❌') ? '#f87171' : '#aaa' }}>
              {'>'} {line}
            </Typography>
          ))}
          {status === 'pass' && (
            <Typography sx={{ fontSize: 9, mt: 0.5, fontFamily: 'monospace', color: '#4ade80' }}>
              {'>'} Molt bé! Ja pots passar al següent →
            </Typography>
          )}
        </Box>
      </Box>
      )}

        {/* BOTONS ESTIL */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, height: 70, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'background.paper', px: 2 }}>
        <IconButton onClick={handlePrevious} disabled={currentLessonIndex <= 0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
          <ChevronLeft size={20}/>
        </IconButton>
        <Button onClick={handleRunTests} variant="contained" fullWidth sx={{fontWeight: 900, borderRadius: 1, fontSize: 13 }}>{t('lesson.run')}</Button>
        <IconButton onClick={handleNext} disabled={!course} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1 }}>
          <ChevronRight size={20}/>
        </IconButton>
      </Box>

      </Box>
    </Box>
  );
}

  // DESKTOP LAYOUT - 3 Columns
  return (
    <Box sx={{ position: 'fixed', inset: 0, height: '91.5vh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', color: 'text.primary', overflow: 'hidden' , mt: 10}}>
      {/* Progress */}
      {progressPercent > 0 && <Box sx={{ height: 4, flexShrink: 0, bgcolor: 'action.hover' }}><Box sx={{ height: '100%', width: `${progressPercent}%`, bgcolor: 'primary.main' }} /></Box>}
      
      {/* Header - reduced height */}
      <Box sx={{ height: 48, flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', px: 3, justifyContent: 'space-between', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}><ChevronLeft /></IconButton>
          <Typography sx={{ fontSize: 15, fontWeight: 900, color: 'primary.main' }}>{getText(course.title).toUpperCase()}</Typography>
        </Box>
        <Box sx={{ display: 'flex', bgcolor: 'action.hover', p: 0.5, borderRadius: 2 }}>
          {(['normal', 'drill', 'assist', 'hackathon'] as Mode[]).map((m) => (
            <Button key={m} onClick={() => { setCurrentMode(m); setTimer(60); setIsTimerActive(false); setAssistsLeft(3); setHintVisible(false); }}
              sx={{ px: 1.5, py: 0.25, fontSize: 9, minWidth: 32, minHeight: 28, bgcolor: currentMode === m ? 'primary.main' : 'transparent', color: 'text.primary' }}>
              {m === 'drill' && <Zap size={8} />} {m.toUpperCase()}
            </Button>
          ))}
        </Box>
        <Button onClick={() => handleSaveProgress(status === 'pass')} disabled={isSaving} variant="contained" sx={{ minWidth: 100, minHeight: 32, fontSize: 10 }}>
          {isSaving ? '...' : isDirty ? <><Save size={10}/> {t('lesson.save')}</> : wasSavedInSession ? <><CheckCircle2 size={10}/> {t('lesson.saved')}</> : <><AlertCircle size={10}/> {t('lesson.pending')}</>}
        </Button>
      </Box>

      {/* 3 Columnas Desktop - reduced heights */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {/* COLUMNA 1: Enunciat (18%) */}
        <Box sx={{ width: '20%', borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto'}}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, mb: 3 , mt:3 }}>{getText(baseLesson.title)}</Typography>
            <Typography sx={{ fontSize: '1rem', color: 'text.secondary', lineHeight: 2, mb: 2 }}>{getText(baseLesson.exerciseInstructions) || t('lesson.no_instructions')}</Typography>
            <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1, border: '3px solid', borderColor: alpha(theme.palette.primary.main, 0.5), mt:5}}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>{t('lesson.objective')}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '1rem' }}>{getText(baseLesson.challenge)}</Typography>
            </Box>
            {currentMode === 'drill' && (
              <Box>
                {isTimerActive ? (
                  <Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace', color: timer <= 10 ? '#f87171' : '#a5b4fc' }}>{timer}s</Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>Temps restant</Typography>
                  </Box>
                ) : status === 'pass' ? (
                  <Typography sx={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 700 }}>✅ DRILL COMPLETAT!</Typography>
                ) : null}
                {status === 'fail' && !isTimerActive && (
                  <Typography sx={{ fontSize: '0.7rem', color: '#f87171', mt: 0.5 }}>❌ Temps esgotat — prem START per reintentar</Typography>
                )}
              </Box>
            )}
            {currentMode === 'assist' && (
            <Button fullWidth onClick={() => { if (hintVisible) { setHintVisible(false); } else if (assistsLeft > 0) { setHintVisible(true); setAssistsLeft(a => a - 1); } }} disabled={assistsLeft === 0 && !hintVisible} sx={{ fontSize: '0.75rem', mb: 1.5, minHeight: 32 }}>
              {hintVisible ? t('lesson.hide_hint') : `💡 ${t('lesson.need_help')} (${assistsLeft})`}
            </Button>
          )}
            <AnimatePresence>{hintVisible && <motion.div initial={{opacity:0}} animate={{opacity:1}}><Box sx={{ p: 1.5, bgcolor: alpha('#3b82f6',0.1), borderRadius: 1.5, fontSize: '0.75rem', color: '#93c5fd' }}>💡 {getText(baseLesson.solution).slice(0,16)}...</Box></motion.div>}</AnimatePresence>
          </Box>
          {/* Estat de punts - reduced */}
          <Box sx={{ p: 2, bgcolor: alpha('#fbbf24',0.08), borderTop: '1px solid #fbbf24', textAlign: 'center' }}>
            <Trophy size={24} color="#f59e0b" style={{display:'block', margin:'0 auto 4px'}} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>{t('lesson.points_label')}</Typography>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 900 }}>{currentMode === 'hackathon' ? `+${hackathonPoints}` : '10'}</Typography>
          </Box>
        </Box>

        {/* COLUMNA 2: Editor (57%) - reduced header */}
        <Box ref={contentRef} sx={{ flex: courseId === 'Python' ? 1 : 'unset', width: courseId === 'Python' ? '80%' : '40%', display: 'flex', flexDirection: 'column', bgcolor: '#1e1e1e', minHeight: 0 }}>
          <Box sx={{ height: 40, px: 2, bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontSize: 11, color: '#888', fontWeight: 500 }}>{t('lesson.app_file')}</Typography>
              {currentMode === 'drill' && !isTimerActive && status !== 'pass' && (
                <Button onClick={handleStartDrill} size="small" sx={{ minWidth: 50, minHeight: 20, fontSize: 9, bgcolor: '#6366f1', color: '#fff', fontWeight: 700, px: 1, borderRadius: 0.5, '&:hover': { bgcolor: '#4f46e5' } }}>▶ START</Button>
              )}
              {currentMode === 'drill' && isTimerActive && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: alpha('#6366f1',0.3), px: 1, borderRadius: 0.5 }}><Typography sx={{ fontSize: 10, color: '#a5b4fc' }}>{timer}s</Typography></Box>}
            </Box>
            <Button onClick={handleRunTests} startIcon={<Play size={10} fill="#000"/>} sx={{ bgcolor: '#fff', color: '#000', height: 28, fontSize: 10, fontWeight: 700, px: 2, borderRadius: 1 }}>{t('lesson.run')}</Button>
          </Box>
          <motion.div key={fadeKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', position: 'relative' }}>
            {courseId === 'Python' && showResultModal ? (
              <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, bgcolor: '#1e1e1e', display: 'flex', flexDirection: 'column', p: 2 }}>
                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                  {consoleOutput.map((line, i) => (
                    <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: '0.9rem', mb: 0.5, color: line.includes('✅') || line.includes('🏆') || line.includes('💾') ? '#4ade80' : line.includes('❌') || line.includes('Revisa') ? '#f87171' : line.includes('SISTEMA') ? '#60a5fa' : '#aaa' }}>{'>'} {line}</Typography>
                  ))}
                  {(() => {
                    const raw: any[] = JSON.parse(localStorage.getItem(`mooc_submissions_${courseId}_${lessonId}`) || '[]');
                    const others = raw.filter(s => s.studentId !== currentUser?.id).slice(0, 5);
                    if (others.length === 0) return null;
                    return (
                      <>
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#888', mt: 2, mb: 1, borderTop: '1px solid #333', pt: 1 }}>ALTRES ESTUDIANTS:</Typography>
                        {others.map((s: any, i: number) => (
                          <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: s.passed ? '#4ade80' : '#f87171', mb: 0.25 }}>{s.passed ? '✅' : '❌'} {s.studentName}</Typography>
                        ))}
                      </>
                    );
                  })()}
                </Box>
              </Box>
            ) : (
              <textarea value={userInput} onChange={(e) => { setUserInput(e.target.value); setIsDirty(true); setWasSavedInSession(false); }}
                style={{ flex: 1, background: 'transparent', color: '#b5e853', fontFamily: "'Fira Code', 'Consolas', monospace", padding: '1rem', border: 'none', outline: 'none', resize: 'none', fontSize: '0.9rem', lineHeight: 1.6, minHeight: 0 }} />
            )}
          </motion.div>
        </Box>

        {courseId !== 'Python' && (
        /* COLUMNA 3: Console (25%) - reduced header */
        <Box sx={{ width: '40%', borderLeft: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', minHeight: 0 }}>
          <Box sx={{ height: 40, px: 2, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Terminal size={14} style={{opacity: 0.4, marginRight: 6}} />
            <Typography sx={{ fontSize: 11, fontWeight: 500, color: 'text.secondary' }}>{t('lesson.debug_console')}</Typography>
          </Box>
          <Box sx={{ flex: 1, p: 2, overflowY: 'auto' }}>
            {consoleOutput.length === 0 && <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: 'text.disabled' }}>{`// ${t('lesson.run_code')}`}</Typography>}
            {consoleOutput.map((line, i) => (
              <Typography key={i} sx={{ fontFamily: 'monospace', fontSize: 11, mb: 0.5, color: line.includes('✅') || line.includes('🏆') || line.includes('💾') ? 'success.main' : line.includes('❌') ? 'error.main' : 'text.secondary' }}>{'> '} {line}</Typography>
            ))}
            <AnimatePresence>
              {wasSavedInSession && status === 'pass' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '1rem' }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 1.5, textAlign: 'center', bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                    <Typography sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>{t('lesson.lesson_completed')}</Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
        )}
      </Box>

      {/* Footer Desktop - reduced */}
      <Box sx={{ height: 56, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'background.paper' }}>
        <Button onClick={handlePrevious} disabled={currentLessonIndex <= 0} variant="outlined" sx={{ minWidth: 120, minHeight: 36, fontSize: '0.85rem' }}><ChevronLeft size={18}/> {t('lesson.previous')}</Button>
        <Button onClick={handleNext} disabled={!course} variant="outlined" sx={{ minWidth: 120, minHeight: 36, fontSize: '0.85rem' }}>{t('lesson.next')} <ChevronRight size={18}/></Button>
      </Box>
    </Box>
  );
}