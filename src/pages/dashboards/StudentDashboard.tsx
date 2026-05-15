import {useState, useEffect, useMemo, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {PlayCircle, ChevronRight, CheckCircle2, Loader2, Lock, Code2, Cpu, Globe, Database, Terminal, Layers, Trophy, RotateCcw, UserPlus, Trash2, X, Check,BookOpen} from 'lucide-react';
import {motion, AnimatePresence} from 'framer-motion';
import {Box, Container, Typography, Card, TextField, Button, Avatar, LinearProgress, Stack, Alert, Tabs, Tab, IconButton, Tooltip, useTheme} from '@mui/material';

import Grid from '@mui/material/Grid';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {api} from '../../services/api';
import {useTranslation} from 'react-i18next';

interface Lesson {id: string; title: any; theoryInstructions?: any; challenge?: any;}
interface Topic {title: any; lessons: Lesson[];}
interface Course {id: string; title: any; topics?: Topic[]; content?: Lesson[]; disabled?: boolean;}
interface Student { id: string; name: string; code: string; email: string; average?: number; role?: 'student' | 'teacher'; }

function StudentCard({ student, onLogin, onDelete, error }: { 
  student: Student, onLogin: (s: Student, code: string) => void, onDelete: (id: string, pin: string) => boolean, error: boolean 
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [pin, setPin] = useState("");
  const [deletePin, setDeletePin] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete(student.id, deletePin)) {
      setIsDeleting(false);
    } else {
      alert(t('auth.incorrect_pin'));
      setDeletePin("");
    }
  };

  return (
    <motion.div style={{ position: 'relative' }} whileHover={{ y: -5 }} animate={error ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.4 }}>
      <Box sx={{ position: 'absolute', top: 1.5, right: 1.5, zIndex: 10 }}>
        {!isDeleting ? (
          <IconButton onClick={(e) => { e.stopPropagation(); setIsDeleting(true); }} size="small" sx={{ bgcolor: 'transparent !important', '&:hover': { bgcolor: 'transparent !important' }, '&:hover svg': { color: 'error.main' } }}>
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}><Trash2 size={14} /></Box>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, mt:2, ml:-5 }}><Trash2 size={18} /></Box>
          </IconButton>
        ) : (
          <Stack direction="row" spacing={1} sx={{ bgcolor: 'background.paper', p: 0.5, borderRadius: '8px', border: '1px solid', borderColor: 'error.main', alignItems: 'center' }}>
            <TextField size="small" placeholder="PIN" type="password" value={deletePin} autoFocus onChange={(e) => setDeletePin(e.target.value)} slotProps={{ htmlInput: { maxLength: 4, style: { color: 'text.primary', fontSize: '12px', width: '40px', padding: '4px', textAlign: 'center' } } }} />
            <IconButton onClick={handleConfirmDelete} size="small" sx={{ color: 'success.main' }}><Check size={16} /></IconButton>
            <IconButton onClick={(e) => { e.stopPropagation(); setIsDeleting(false); }} size="small" sx={{ color: 'text.secondary' }}><X size={16} /></IconButton>
          </Stack>
        )}
      </Box>

      <Card sx={{ p: { xs: 1, md: 3}, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: {md: 10 }, border: '2px solid', borderColor: error ? 'error.main' : (theme.palette.mode === 'dark' ? '#fff' : '#000'), minWidth: 0, height: '100%', '&:hover': { borderColor: 'primary.main' } }}>
        <Avatar sx={{ width: { xs: 30, md: 60 }, height: { xs: 30, md: 60 }, bgcolor: 'primary.main', fontSize: { xs: '1rem', md: '2rem' }, fontWeight: 900, borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000' }}>{student.name.charAt(0)}</Avatar>
        <Typography variant="h6" sx={{ fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{student.name}</Typography>
        <Stack spacing={1} sx={{ width: '100%' }}>
          <TextField fullWidth type="password" placeholder="PIN" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onLogin(student, pin)} autoComplete="off"/>
          <Button variant="contained" fullWidth size="large" onClick={() => onLogin(student, pin)} startIcon={<Lock size={18} />}>{t('auth.login')}</Button>
        </Stack>
      </Card>
    </motion.div>
  );
}

const CourseIcon = ({ title }: { title: any }) => {
  const iconProps = { size: 22, color: '#a855f7' };
  const name = typeof title === 'string' ? title.toLowerCase() : (title?.ca || '').toLowerCase();
  if (name.includes('python')) return <Terminal {...iconProps} />;
  if (name.includes('react')) return <Globe {...iconProps} />;
  if (name.includes('learning') || name.includes('aprenent')) return <Cpu {...iconProps} />;
  if (name.includes('spring') || name.includes('java')) return <Layers {...iconProps} />;
  if (name.includes('base de dades') || name.includes('sql')) return <Database {...iconProps} />;
  return <Code2 {...iconProps} />;
};

export default function StudentDashboard() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dbProgress, setDbProgress] = useState<Record<string, boolean>>({});
  const [errorId, setErrorId] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'syllabus' | 'activities'>('syllabus');
  const [rankingTab, setRankingTab] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newRole, setNewRole] = useState<'student' | 'teacher'>('student');

  const lang = (i18n.language?.split('-')[0]) as 'ca' | 'es' | 'en';
  const getText = (field: any): string => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[lang] || field['ca'] || '';
  };

  const getCourseTopics = (course: Course): Topic[] => {
    if (course.topics && course.topics.length > 0) return course.topics;
    if (course.content && course.content.length > 0) return [{ title: '', lessons: course.content as Lesson[] }];
    return [];
  };
  const fetchProgress = useCallback(async (studentId: string) => {
    try {
      setActionLoading(true);
      const progressMap = await api.getStudentProgress(studentId);
      setDbProgress(progressMap);
      localStorage.setItem('mooc_global_progress', JSON.stringify(progressMap));
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('mooc_global_progress') || '{}');
      setDbProgress(local);
    } finally { setActionLoading(false); }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initData = async (isInitial = false) => {
      try {if (isInitial) setLoading(true);
        const resp = await fetch('/data.json');
        const json = await resp.json();
        if (!mounted) return;
        const jsonStudents = json.students || [];setAllCourses(json.courses || []);
        const localStudents = JSON.parse(localStorage.getItem('mooc_local_students') || '[]');
        const deletedIds = JSON.parse(localStorage.getItem('mooc_deleted_ids') || '[]');
        const merged = [...jsonStudents, ...localStudents].filter(s => !deletedIds.includes(s.id)); setStudents(merged);
        const saved = localStorage.getItem('currentStudent');
        if (saved) {const parsed = JSON.parse(saved); setSelectedStudent(parsed); await fetchProgress(parsed.id);}} catch (err) { setGlobalError('Error loading data'); } finally { if (isInitial) setLoading(false); }
    };
    initData(true);
    const onVisible = () => { if (document.visibilityState === 'visible') initData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchProgress]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPin) return;
    const newStudent = { id: `local-${Date.now()}`, name: newName, email: newEmail, code: newPin, role: newRole };
    const updatedLocal = [...JSON.parse(localStorage.getItem('mooc_local_students') || '[]'), newStudent];
    localStorage.setItem('mooc_local_students', JSON.stringify(updatedLocal));
    setStudents(prev => [...prev, newStudent]);
    setNewName(""); setNewEmail(""); setNewPin(""); setNewRole("student");
    setShowCreateForm(false);
  };

  const handleDeleteStudent = (id: string, pin: string): boolean => {
    const target = students.find(s => s.id === id);
    if (!target || target.code !== pin) return false;
    const deletedIds = JSON.parse(localStorage.getItem('mooc_deleted_ids') || '[]');
    localStorage.setItem('mooc_deleted_ids', JSON.stringify([...deletedIds, id]));
    const localOnly = JSON.parse(localStorage.getItem('mooc_local_students') || '[]');
    localStorage.setItem('mooc_local_students', JSON.stringify(localOnly.filter((s: any) => s.id !== id)));
    setStudents(prev => prev.filter(s => s.id !== id));
    if (selectedStudent?.id === id) {handleLogoutAction();}
    return true;
  };

  const handleLogin = (student: Student, pin: string) => {
    if (student.code !== pin) {
      setErrorId(student.id);
      setTimeout(() => setErrorId(null), 500);
      return; 
    }

    if (student.role === 'teacher') {
      alert("⚠️ Mode Professor: In process... Aviat podràs gestionar els teus cursos.");
    } else {
      setSelectedStudent(student);
      localStorage.setItem('currentStudent', JSON.stringify(student));
      if (typeof fetchProgress === 'function') {
        fetchProgress(student.id);
      }
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('currentStudent');
    localStorage.removeItem('mooc_global_progress');
    setSelectedStudent(null);
    setDbProgress({});
    window.dispatchEvent(new Event('auth-state-change'));
  };

  const handleResetCourse = async (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    if (!selectedStudent || !window.confirm(t('dashboard.reset_course_confirm'))) return;
    try {
      setActionLoading(true);
      await api.resetCourse(selectedStudent.id, courseId);
      const local = JSON.parse(localStorage.getItem('mooc_global_progress') || '{}');
      Object.keys(local).forEach(key => { if (key.startsWith(`${courseId}_`)) delete local[key]; });
      localStorage.setItem('mooc_global_progress', JSON.stringify(local));
      await fetchProgress(selectedStudent.id);
    } catch (err) { setGlobalError("Error reset."); } finally { setActionLoading(false); }
  };

  const getCourseProgress = useCallback((course: Course, studentId: string): number => {
    const topics = getCourseTopics(course);
    const totalLessons = topics.reduce((acc, topic) => acc + (topic.lessons?.length || 0), 0) || 0;
    if (totalLessons === 0) return 0;
    const student = students.find(s => s.id === studentId);
    if (selectedStudent?.id === studentId) {
      const done = topics.reduce((acc, topic) => acc + (topic.lessons?.filter(l => dbProgress[`${course.id}_${l.id}`]).length || 0), 0) || 0;
      return Math.round((done / totalLessons) * 100);
    }
    return student?.average || 0;
  }, [dbProgress, selectedStudent, students, getCourseTopics]);

  const getCoursePoints = useCallback((course: Course, _studentId: string): number => {
    const topics = getCourseTopics(course);
    const done = topics.reduce((acc, topic) => acc + (topic.lessons?.filter(l => l.challenge && dbProgress[`${course.id}_${l.id}`]).length || 0), 0) || 0;
    return done * 10;
  }, [dbProgress, getCourseTopics]);

  const getTotalPoints = useCallback((_studentId: string): number => {
    return allCourses.reduce((acc, course) => acc + getCoursePoints(course, _studentId), 0);
  }, [allCourses, getCoursePoints]);

  const rankedStudentsByCourse = useMemo(() => {
    const currentCourse = allCourses[rankingTab];
    if (!currentCourse) return [];
    return [...students].sort((a, b) => getCourseProgress(currentCourse, b.id) - getCourseProgress(currentCourse, a.id));
  }, [students, allCourses, rankingTab, getCourseProgress]);

  if (loading) return <Box sx={{ display: 'flex', bgcolor: 'background.default', alignItems: 'center', justifyContent: 'center', width: '100vw', height: '90vh' }}><Loader2 className="animate-spin" color={theme.palette.primary.main} size={48} /></Box>;

  return (
       <Box sx={{ bgcolor: 'background.default', color: 'text.primary', width: '100%', maxWidth: '100vw', minHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
       <Container maxWidth="xl" sx={{ pt: { xs: 2, md: 6 }, px: { xs: 3, sm: 1.5, md: 8, lg: 8 }, display: 'flex', flexDirection: 'column' }}>
         <Box sx={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: { xs: 'visible', md: 'hidden' } }}>
          {globalError && <Alert severity="error" sx={{ mb: 3, borderRadius: '1rem' }}>{globalError}</Alert>}
          
          <AnimatePresence mode="wait">
            {!selectedStudent ? (
              <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                {/* SWITCH BUTTON */}
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center', mb: 3, mt: 3 }}><Typography variant="h6" sx={{ fontWeight: 900 }}>{t('dashboard.title')}</Typography>
                  <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: '10px', p: 0.5, position: 'relative', width: '200px', height: '36px', cursor: 'pointer' }}>
                    <Box sx={{ position: 'absolute', top: 3, bottom: 3, left: newRole === 'student' ? 3 : 'calc(50% + 1px)', width: 'calc(50% - 4px)', bgcolor: 'primary.main', borderRadius: '8px', transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 0 }} />
                    <Button disableRipple onClick={() => setNewRole('student')} sx={{ flex: 1, zIndex: 1, borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: newRole === 'student' ? '#fff' : 'text.secondary', '&:hover': { bgcolor: 'transparent' } }}>{t('dashboard.role_student')}</Button>
                    <Button disableRipple onClick={() => setNewRole('teacher')} sx={{ flex: 1, zIndex: 1, borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: newRole === 'teacher' ? '#fff' : 'text.secondary', '&:hover': { bgcolor: 'transparent' } }}>{t('dashboard.role_teacher')}</Button>
                  </Box>
                </Stack>           

                {/* Mobile: scroll vertical | Desktop: dos canals (form + cards) */}
                <Box sx={{flex: 1,overflowY: 'auto',overflowX: 'hidden',pb: 2,}}>
                <Box sx={{display: 'flex',flexDirection: { xs: 'column', md: 'row' },gap: { xs: 2, md: 4 },alignItems: 'flex-start',}}>

                  {/* ── COLUMNA ESQUERRA: Formulari */}
                  <Box sx={{ width: { xs: '100%', md: '320px' }, flexShrink: 0, minWidth: 0 }}>
                    {!showCreateForm ? (
                      <Card onClick={() => setShowCreateForm(true)} sx={{p: { xs: 2, md: 4 },display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',borderRadius: { xs: 3, md: 10 },border: '2px dashed', borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000',bgcolor: 'background.paper',height: '100%', minHeight: { xs: 160, md: 210 },cursor: 'pointer', transition: 'all 0.3s ease','&:hover': { borderColor: 'primary.main', '& *': { color: 'primary.main' } }}}>
                        <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: '2px dashed', borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                          <UserPlus size={20} color={theme.palette.text.secondary} />
                        </Box>
                        <Typography variant="body1" sx={{ fontWeight: 900, color: 'text.secondary' }}>
                          {t('dashboard.create_user_title')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, textAlign: 'center' }}>
                          {t('dashboard.click_to_login')}
                        </Typography>
                      </Card>
                    ) : (
                      <Card sx={{ p: { xs: 2, md: 5 }, borderRadius: { xs: 2, md: 2.5 }, bgcolor: 'background.paper', border: '2px dashed', borderColor: 'primary.main' + '4D', height: 'fit-content' }}>
                        <Stack spacing={{ xs: 2, md: 3 }} component="form" onSubmit={(e) => {
                          e.preventDefault(); 
                          handleCreateStudent(e);
                        }}>
                          
                          {/* Header i Switcher */}
                          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                              <UserPlus size={18} color={theme.palette.primary.main} />
                              <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('dashboard.create_user_title')}</Typography>
                            </Stack>
                            <IconButton size="small" onClick={() => setShowCreateForm(false)} sx={{ color: 'text.secondary' }}><X size={18} /></IconButton>
                          </Stack>

                          {/* Selector de Rol */}
                          <Box sx={{ display: 'flex', bgcolor: 'action.hover', borderRadius: '12px', p: 0.5, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', top: 4, bottom: 4, left: newRole === 'student' ? 4 : 'calc(50% + 2px)', width: 'calc(50% - 6px)', bgcolor: 'primary.main', borderRadius: '10px', transition: 'left 0.25s ease' }} />
                            <Button type="button" disableRipple onClick={() => setNewRole('student')} sx={{ flex: 1, zIndex: 1, borderRadius: '10px', py: 0.75, fontWeight: 800, fontSize: '0.8rem', textTransform: 'none', color: newRole === 'student' ? '#fff' : 'text.secondary', '&:hover': { bgcolor: 'transparent' } }}>{t('dashboard.role_student')}</Button>
                            <Button type="button" disableRipple onClick={() => setNewRole('teacher')} sx={{ flex: 1, zIndex: 1, borderRadius: '10px', py: 0.75, fontWeight: 800, fontSize: '0.8rem', textTransform: 'none', color: newRole === 'teacher' ? '#fff' : 'text.secondary', '&:hover': { bgcolor: 'transparent' } }}>{t('dashboard.role_teacher')}</Button>
                          </Box>

                          {/* Inputs */}
                          <TextField fullWidth label={t('dashboard.name_label')} variant="filled" value={newName} onChange={e => setNewName(e.target.value)} required sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover', borderRadius: '12px' } }} />
                          <TextField fullWidth label={t('dashboard.email_label')} variant="filled" value={newEmail} onChange={e => setNewEmail(e.target.value)} required sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover', borderRadius: '12px' } }} />
                          <TextField fullWidth label={t('dashboard.pin_label')} variant="filled" type="password" value={newPin} onChange={e => setNewPin(e.target.value)} required slotProps={{ htmlInput: { maxLength: 4 } }} sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover', borderRadius: '12px' } }} />

                          <Button type="submit" variant="contained" fullWidth sx={{ borderRadius: '12px', py: 1.5, fontWeight: 800, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}>
                            {newRole === 'teacher' ? 'Registrar Professor' : 'Registrar Estudiant'}
                          </Button>
                        </Stack>
                      </Card>
                    )}
                  </Box>

                  {/* ── DIVISOR VERTICAL (només desktop) ── */}
                  <Box sx={{ display: { xs: 'none', md: 'block' }, width: '2px', height: '100%', minHeight: '500px', bgcolor: 'divider', borderRadius: 1, alignSelf: 'stretch' }} />

                  {/* ── COLUMNA DRETA: Cards ── */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{display: 'grid',gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(auto-fill, minmax(200px, 1fr))' },gap: 3,alignItems: 'start',mt:2}}>
                      {students .filter(s => newRole === 'teacher' ? s.role === 'teacher' : (s.role === 'student' || !s.role))
                        .map(s => (<Box key={s.id} sx={{ minWidth: 0 }}><StudentCard student={s} onLogin={handleLogin} onDelete={handleDeleteStudent} error={errorId === s.id} /></Box>))}
                    </Box>
                  </Box>

                </Box>
                </Box>
              </motion.div>
            ) : (
              <motion.div key="dash" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <Grid container spacing={{ xs: 2, md: 6 }}>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <Stack spacing={2} sx={{ alignItems: 'center' }}>
                      <Card sx={{ p: { xs: 2, md: 4 }, borderRadius: { xs: 2, md: 2 }, textAlign: 'center', bgcolor: 'background.paper', position: 'relative', border: '1px solid', borderColor: 'primary.main' + '33', minWidth: 0, maxWidth: '280px', width: '100%', mt: { xs: '20px', md: '30px !important' }}}>
                        {actionLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} color="secondary" />}
                        <Avatar sx={{ width: { xs: 40, md: 80 }, height: { xs: 40, md: 80 }, mx: 'auto', mb: 1, bgcolor: 'primary.main', fontWeight: 900, fontSize: { xs: '1rem', md: '2rem' } }}>{selectedStudent.name.charAt(0)}</Avatar>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, minWidth: 0, flexWrap: 'wrap' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, minWidth: 0, wordBreak: 'break-word', fontSize: { xs: '0.85rem', md: '1.25rem' } }}>{selectedStudent.name}</Typography>
                          <IconButton size="small" onClick={handleLogoutAction} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'action.hover' }, flexShrink: 0 }}>
                            <LogoutIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Box sx={{ mt: { xs: 1, md: 3 }, p: 1, bgcolor: 'action.hover', borderRadius: '1rem' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', fontSize: { xs: '1rem', md: '1rem' } }}>
                              {getTotalPoints(selectedStudent.id)} {t('dashboard.points')}
                            </Typography>
                          </Box>
                        </Box>
                      </Card>
                       
                      <Box sx={{ height: { md: '250px' }, width: '100%', display: { xs: 'none', md: 'block' } }} />
                      
                      <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: { xs: 2, md: 2.5 }, bgcolor: 'background.paper', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000', display: { xs: 'none', md: 'block' }, maxWidth: '280px', width: '100%', mt: { xs: 0, md: '-105px !important' } }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 2 }}>{t('dashboard.progress_detail')}</Typography>
                        <Stack spacing={2}>
                          {allCourses.map(course => (
                            <Box key={course.id}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                                <Typography variant="caption" sx={{ fontWeight: 600 ,fontSize: '0.8rem'}}>{getText(course.title)}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main' , fontSize: '1rem'}}>{getCourseProgress(course, selectedStudent.id)}%</Typography>
                              </Box>
                              <LinearProgress 
                                variant="determinate" 
                                value={getCourseProgress(course, selectedStudent.id)} 
                                sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }} 
                              />
                            </Box>
                          ))}
                        </Stack>
                      </Card>
                    </Stack>
                  </Grid>

                  <Grid size={{ xs: 12, md: 9}} sx={{ mt: { xs: '20px', md: '60px' } }}>
                    <AnimatePresence>
                      {expandedCourse && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setExpandedCourse(null)}
                          style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}
                        />
                      )}
                    </AnimatePresence>
                    
                    <Typography variant="h6" sx={{ fontWeight: 900, mb: { xs: 2, md: 3 } }}>{t('dashboard.my_courses')}</Typography>
                    <Grid container spacing={{ xs: 2, md: 2 }}>
                      {allCourses.map(course => (
                        <Grid key={course.id} size={{ xs: 12, md: 3 }}>
                          <Box sx={{ position: 'relative' }}>
                            {course.disabled && (
                              <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, bgcolor: 'warning.main', color: 'white', px: 1, py: 0.25, borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor:'red'}}>
                                PROXIMAMENT
                              </Box>
                            )}
                            <Card onClick={() => !course.disabled && setExpandedCourse(expandedCourse === course.id ? null : course.id)} sx={{ p: { xs: 0.75, md: 3 }, cursor: course.disabled ? 'default' : 'pointer', borderRadius: { xs: 1.5, md: 2 }, bgcolor: 'background.paper', border: '1px solid', borderColor: expandedCourse === course.id ? 'primary.main' : (theme.palette.mode === 'dark' ? '#fff' : '#000'), transition: '0.2s', minWidth: 0, minHeight: { xs: 60, md: 100 }, position: 'relative', zIndex: expandedCourse === course.id ? 50 : 0, width: '100%', opacity: course.disabled ? 0.5 : 1, filter: course.disabled ? 'grayscale(0.8)' : 'none' }}>
                              <Stack spacing={{ xs: 0.75, md: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'nowrap' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 900, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{getText(course.title)}</Typography>
                                  <Box sx={{ p: 0.5, bgcolor: 'primary.main' + '1A', borderRadius: '4px', flexShrink: 0 }}><CourseIcon title={course.title} /></Box>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', fontSize: '0.9rem' }}>{getCoursePoints(course, selectedStudent.id)} {t('dashboard.points')}</Typography>
                                  <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", flexShrink: 0 }}>
                                    <Tooltip title={t('dashboard.reset_course_tooltip')}>
                                      <IconButton onClick={(e) => handleResetCourse(e, course.id)} size="small" sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}><RotateCcw size={15} /></IconButton>
                                    </Tooltip>
                                    <ChevronRight size={15} style={{ transform: expandedCourse === course.id ? 'rotate(90deg)' : 'none', transition: '0.3s'}} />
                                  </Stack>
                                </Box>
                              </Stack>
                            </Card>
                                                        
                            <AnimatePresence>
                              {expandedCourse === course.id && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                                  <Box sx={{ bgcolor: 'background.paper', borderRadius: { xs: 1, md: 1.2 }, border: '1px solid', borderColor: 'primary.main' + '4D', maxHeight: '350px', overflowY: 'auto' }}>
                                    <Box sx={{ p: 0.5, bgcolor: 'action.hover', display: 'flex', borderRadius: '8px', m: 1, mb: 0 }}>
                                      <Button disableRipple onClick={() => setActiveTab('syllabus')} sx={{ flex: 1, borderRadius: '6px', py: 0.75, fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: activeTab === 'syllabus' ? '#fff' : 'text.secondary', bgcolor: activeTab === 'syllabus' ? 'primary.main' : 'transparent', '&:hover': { bgcolor: activeTab === 'syllabus' ? 'primary.main' : 'action.hover' } }}>{t('dashboard.syllabus')}</Button>
                                      <Button disableRipple onClick={() => setActiveTab('activities')} sx={{ flex: 1, borderRadius: '6px', py: 0.75, fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', color: activeTab === 'activities' ? '#fff' : 'text.secondary', bgcolor: activeTab === 'activities' ? 'primary.main' : 'transparent', '&:hover': { bgcolor: activeTab === 'activities' ? 'primary.main' : 'action.hover' } }}>{t('dashboard.activities')}</Button>
                                    </Box>
                                    <Box sx={{ p: 1.5 }}>
                                      <Stack spacing={2}>
                                        {getCourseTopics(course).map(topic => (
                                          <Box key={getText(topic.title)}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5, display: 'block' }}>{getText(topic.title)}</Typography>
                                            <Stack spacing={0.5}>
                                              {topic.lessons?.map(lesson => (
                                                <Box key={lesson.id} onClick={() => navigate(activeTab === 'syllabus' ? `/courses/${course.id}` : `/courses/${course.id}/${lesson.id}`)} sx={{ p: 1, borderRadius: '8px', cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' }, minWidth: 0 }}>
                                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{getText(lesson.title)}</Typography>
                                                    {activeTab === 'syllabus' ? (dbProgress[`${course.id}_${lesson.id}`] ? (<BookOpen size={16} color={theme.palette.success.main} />) : (<BookOpen size={16} color="#7c3aed" />)) : (dbProgress[`${course.id}_${lesson.id}`] ? (<CheckCircle2 size={16} color={theme.palette.success.main} />) : (<PlayCircle size={16} color={theme.palette.primary.main} />))}
                                                  </Box>
                                                  {activeTab === 'syllabus' && lesson.theoryInstructions && (<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block',fontSize: '0.65rem', opacity: 0.8 }}></Typography>)}
                                                  {activeTab === 'activities' && lesson.challenge && (<Typography variant="caption" sx={{ color: 'secondary.main', display: 'block',fontSize: '0.65rem', opacity: 0.8 }}></Typography>)}
                                                </Box>
                                              ))}
                                            </Stack>
                                          </Box>
                                        ))}
                                      </Stack>
                                    </Box>
                                  </Box>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Box sx={{display: { xs: 'flex', md: 'none' }, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 11,width: '100%',my: 4}}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '20px', justifyContent: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <Box key={`left-${i}`} component={motion.div} animate={{ opacity: [0, 1, 0], y: [0, 5, 10] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }} sx={{mt: i === 0 ? -2 : -3, display: 'flex', color: 'text.primary'}}>
                          <KeyboardArrowDownIcon sx={{ fontSize: '1.2rem' }} />
                        </Box>
                      ))}
                    </Box>
                    {/* MOBILE ── SCROLL DOWN */}
                    <Typography sx={{fontSize: '0.6rem',fontWeight: 900, letterSpacing: '0.25em',color: 'text.primary', textTransform: 'uppercase', mx: 1}}>{t('dashboard.leaderboard')}</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '20px', justifyContent: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <Box key={`right-${i}`} component={motion.div} animate={{ opacity: [0, 1, 0], y: [0, 5, 10] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}sx={{mt: i === 0 ? -2 : -3,display: 'flex', color: 'text.primary'}}>
                          <KeyboardArrowDownIcon sx={{ fontSize: '1.2rem' }} />
                        </Box>
                      ))}
                    </Box>
                  </Box>
                    
                    <Stack direction="row" spacing={1} sx={{ mb: { xs: 2, md: 2 }, alignItems: 'center', mt: { xs: 10, md: 18.5}}}>
                      <Trophy size={22} color="#ffb700" />
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>{t('dashboard.ranking_title')}</Typography>
                    </Stack>
                    <Card sx={{ borderRadius: { xs: 1, md: 2 }, bgcolor: 'background.paper', border: '1px solid', borderColor: theme.palette.mode === 'dark' ? '#fff' : '#000', overflow: 'hidden', minWidth: 0, width: '100%'}}>
                      <Tabs value={rankingTab} onChange={(_, val) => setRankingTab(val)} variant="scrollable" sx={{ bgcolor: 'action.hover', '& .MuiTabs-indicator': { bgcolor: 'primary.main' }}}>
                        {allCourses.map(c => <Tab key={c.id} label={getText(c.title)} sx={{ fontWeight: 800, textTransform: 'none', minWidth: 0, whiteSpace: 'nowrap',ml: { xs: 0, md: 15 }, fontSize: { xs: '0.7rem', md: '0.875rem' }}} />)}
                      </Tabs>
                      <Box sx={{ p: { xs: 0.5, md: 4 }, height: { xs: '150px', md: '220px' }, overflowY: 'auto', overflowX: 'hidden' }}>
                        <Stack spacing={{ xs: 0.5, md: 2 }}>
                          {rankedStudentsByCourse.map((s, idx) => {
                            const isMe = s.id === selectedStudent?.id;
                            return (
                              <Box key={s.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, py: { xs: 0.5, md: 0 } }}>
                                <Typography sx={{ width: 18, fontWeight: 900, color: idx < 3 ? '#ffb700' : 'text.secondary', flexShrink: 0, fontSize: '0.7rem' }}>{idx + 1}</Typography>
                                <Avatar sx={{ width: { xs: 18, md: 32 }, height: { xs: 20, md: 32 }, bgcolor: isMe ? 'primary.main' : 'action.disabled', flexShrink: 0, fontSize: { xs: '0.4rem', md: '0.875rem' } }}>{s.name.charAt(0)}</Avatar>
                                <Typography sx={{ flex: 1, fontWeight: isMe ? 900 : 900, color: isMe ? 'primary.main' : 'text.primary', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '1rem' }}>
                                  {s.name} {isMe && `(${t('dashboard.you')})`}
                                </Typography>
                                <Typography sx={{ fontWeight: 900, color: 'primary.main', flexShrink: 0, fontSize: '0.8rem' }}>{isMe ? getCoursePoints(allCourses[rankingTab], s.id) : getCourseProgress(allCourses[rankingTab], s.id)} {t('dashboard.points')}</Typography>
                              </Box>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Card>
                  </Grid>
                </Grid>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
}