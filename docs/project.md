# MOOC React 2026

Plataforma d'aprenentatge online per a desenvolupadors, construïda amb tecnologies modernes del 2026.

---

## 1. Dependències Clau

### Per què Vite?

| Característica | Benefici |
|----------------|----------|
| **Build ràpid** | Utilitza esbuild i Rollup per compilacions 10-100x més ràpides que webpack |
| **HMR instantani** | Actualització en calent immediata sense recarregar la pàgina |
| **Experiència de desenvolupament** | Configuració mínima, funciona out-of-the-box |
| **Optimització de producció** | Bundle size optimitzat automàticament |

### Per què React?

- **Componentització**: Reutilització de codi amb components modulars
- **Virtual DOM**: Renderitzat eficient amb diferència mínima
- **Ecosistema**: Major llibreria de llibreries i comunitat activa
- **Hooks**: Lògica d'estat reutilitzable amb `useState`, `useEffect`, `useCallback`, etc.

### Per què Material UI (MUI)?

- **Components professionals**: Botons, cards, formularis, navegació llestos per usar
- **Disseny system**: Tots els components segueixen Material Design
- **Personalització**: Tema propi (dark mode, colors de la marca)
- **Accessibilitat**: Components accessibles per defecte

---

## 2. Arquitectura de Fitxers

### Estructura General

```
src/
├── main.tsx                    # Punt d'entrada de l'aplicació
├── App.tsx                     # Router principal i configuració
├── index.css                   # Estils globals
├── components/                 # Components reutilitzables
│   ├── Header.tsx              # Barra de navegació amb autenticació
│   ├── Hero.tsx                # Secció hero amb typewriter i estadístiques
│   ├── Footer.tsx              #Peu de pàgina amb enllaços
│   ├── CourseCard.tsx          # Targeta de curs per a la llista
│   ├── ParticlesBackground.tsx # Fons interactiu amb Canvas
│   └── ui/                     # Components UI personalitzats
│       ├── Card.tsx            # Wrapper de Card MUI
│       └── badge.tsx           # Badge/etiqueta per nivell
├── pages/                      # Pàgines principals
│   ├── Home.tsx                # Pàgina principal amb llistat de cursos
│   ├── courses/
│   │   ├── CourseLessons.tsx  # Llista de lliçons d'un curs
│   │   └── LessonPage.tsx     # Editor de codi interactiu
│   └── dashboards/
│       └── StudentDashboard.tsx  # Àrea personal de l'estudiant
├── services/                     # Capa d'accés a dades
│   ├── api.ts                    # Client Axios + gestió de progrés
│   ├── authService.ts            # Autenticació (API + fallback local)
│   └── courseService.ts          # Gestió de cursos i lliçons
├── theme/                        # Configuració del tema
│   └── theme.ts                  # Tema MUI dark personalitzat
└── types/                        # Definicions de Tipus TypeScript
    └── index.ts                  # Interfícies per a Course, Lesson, Student
```

### Responsabilitat de Cada Fitxer

| Fitxer | Responsabilitat |
|--------|-----------------|
| `main.tsx` | Inicialitza React amb `BrowserRouter`, `ThemeProvider` de MUI i `StrictMode` |
| `App.tsx` | Defineix les rutes amb `react-router-dom` (`/`, `/courses/:id`, `/courses/:id/:lessonId`, `/dashboards/student`) |
| `Header.tsx` | Navegació responsive, botó d'accés alumnes, estat d'autenticació |
| `Hero.tsx` | Secció d'inici amb efecte typewriter, comptador de cursos/estudiants, fons de partícules |
| `CourseCard.tsx` | Targeta visual per a cada curs amb imatge, nivell, durada i instructor |
| `Footer.tsx` | Enllaços de navegació, xarxes socials, any de copyright |
| `ParticlesBackground.tsx` | Canvas interactiu amb partícules que reaccionen al mouse |
| `Home.tsx` | Carrega cursos des de `courseService`, mostra `CourseCard` en grid |
| `CourseLessons.tsx` | Llista les lliçons d'un curs des de `data.json` |
| `LessonPage.tsx` | Editor de codi amb modes (normal, drill, assist, hackathon), consola, temporitzador, validació |
| `StudentDashboard.tsx` | Login per estudiants, progrés per curs, ranking, selecció de curs |
| `api.ts` | Client Axios amb fallback local, sincronització progrés (localStorage + API) |
| `authService.ts` | Login/logout amb API real o `data.json` local com a fallback |
| `courseService.ts` | CRUD de cursos, lliçons, enviament de reptes |
| `theme.ts` | Tema MUI dark amb colors personalitzats (primary: #a855f7) |
| `types/index.ts` | Interfícies TypeScript: `Course`, `Lesson`, `Student`, `DataStructure` |

---

## 3. Flux de Dades

### Diagrama de Renderitzat

```
index.html
    │
    ▼
main.tsx (ReactDOM.createRoot)
    │
    ├── <BrowserRouter> ──▶ Historial del navegador
    ├── <ThemeProvider>  ──▶ Context de tema MUI
    │
    ▼
App.tsx (Routes)
    │
    ├── /                    ──▶ Home.tsx
    │                            │
    │                            ▼
    │                       courseService.getAllCourses()
    │                            │
    │                            ▼
    │                       [Course[]]
    │                            │
    │                            ▼
    │                       CourseCard × N
    │
    ├── /courses/:courseId     ──▶ CourseLessons.tsx
    │                              │
    │                              ▼
    │                         fetch('/data.json')
    │                              │
    │                              ▼
    │                         [Lesson[]]
    │
    ├── /courses/:courseId/:lessonId  ──▶ LessonPage.tsx
    │                                        │
    │                                        ├── fetch('/data.json')
    │                                        ├── localStorage (codi usuari)
    │                                        ├── api.postProgress()
    │                                        └── Validació de solució
    │
    └── /dashboards/student     ──▶ StudentDashboard.tsx
                                       │
                                       ├── authService.login()
                                       ├── api.getStudentProgress()
                                       └── Càlcul de progrés per curs
```

### Com Reben Dades els Components MUI

Els components de MUI reben dades a través de:

1. **Props directes**: `<Button variant="contained">Text</Button>`
2. **Props d'estil** (sx): `<Box sx={{ bgcolor: '#0f0a1e' }}>`
3. **Theme Provider**: Tots els fills tenen accés a `theme.palette.primary.main`
4. **Dades dinàmiques**: Passades des del pare via props o hooks

**Exemple** (`CourseCard.tsx`):
```tsx
interface Course {
  id: string;
  title: string;
  level: string;
  // ...
}

export function CourseCard({ course, index }: CourseCardProps) {
  // Dades rebudes com a props
  // Renderitzat amb MUI Card, Typography, Box
}
```

---

## 4. Integració d'APIs

### Crides Externes (fetch / axios)

#### `api.ts` - Gestió de Progrés

```typescript
// Endpoints utilitzats:
GET  /api/progress/{studentId}    → Obtenir progrés de l'estudiant
POST /api/progress                 → Guardar progrés d'una lliçó
DELETE /api/progress/{studentId}/{courseId}  → Reiniciar curs
```

**Gestió de Resposta**:
- **Èxit**: Actualitza `localStorage` + estat de React
- **Error (API Offline)**: Fa servir dades locals de `localStorage`
- **Sincronització híbrida**: Fusiona dades locals i remotes (API té preferència)

#### `authService.ts` - Autenticació

```typescript
// Endpoints utilitzats:
POST /api/users/auth/login/     → Login usuari
POST /api/users/auth/logout/    → Logout usuari
GET  /api/users/me/settings/     → Obtenir dades de l'usuari
```

**Gestió de Resposta**:
- **Èxit**: Guarda token i usuari a `localStorage`
- **Error**: Fa fallback a `data.json` local per a desenvolupament

#### `courseService.ts` - Cursos i Lliçons

```typescript
// Endpoints utilitzats:
GET  /api/v1/courses/                              → Llistat de cursos
GET  /api/v1/courses/{slug}/                       → Detalls d'un curs
GET  /api/v1/courses/{slug}/topics/                → Lliçons del curs
GET  /api/v1/courses/{slug}/students/              → Estudiants del curs
POST /api/v1/courses/{slug}/topics/{topic}/problems/{problem}/submissions/  → Enviar solució
```

**Gestió de Resposta**:
- **Èxit**: Retorna `Course[]`, `Lesson[]`, `Student[]`
- **Error**: Carrega `data.json` des de `/public/` com a fallback local

### Font de Dades Local (Fallback)

Quan l'API no està disponible, l'aplicació carrega `public/data.json`:

```json
{
  "courses": [...],
  "students": [...]
}
```

**Flux**:
1. L'aplicació intenta cridar l'API
2. Si falla, mostra un warning a consola
3. Carrega automàticament el fitxer local
4. L'usuari pot continuar utilitzant l'app en mode "proves"

---

## 5. Estat de React

### useState - Gestió Local

| Component | Estat | Propòsit |
|-----------|-------|----------|
| `Home` | `coursesList`, `loading` | Llistat de cursos i estat de càrrega |
| `LessonPage` | `userInput`, `status`, `consoleOutput` | Codi de l'usuari, resultat de tests, sortida de consola |
| `StudentDashboard` | `selectedStudent`, `dbProgress`, `expandedCourse` | Usuari actiu, progrés per curs, curs expandit |
| `Hero` | `apiStats` | Comptador de cursos/estudiants |

### useEffect - Efectes Secundaris

```tsx
// Exemple: Carregar cursos en muntar el component
useEffect(() => {
  const fetchCourses = async () => {
    const data = await courseService.getAllCourses();
    setCoursesList(data);
  };
  fetchCourses();
}, []);
```

### useCallback - Funcions Optimitzades

```tsx
const fetchProgress = useCallback(async (studentId: string) => {
  const progressMap = await api.getStudentProgress(studentId);
  setDbProgress(progressMap);
}, []);
```

---

## 6. Instal·lació i Execució

### Requisits

- Node.js 18+
- npm o yarn

### Comandes

```bash
# Instal·lar dependències
npm install

# Executar en desenvolupament
npm run dev

# Construir per producció
npm run build

# Previsualitzar producció
npm run preview
```

### Variables d'Entorn

Crea un fitxer `.env` si cal:

```env
VITE_API_URL=http://localhost:8080/api
```

---

## 7. Tecnologies Utilitzades

| Categoria | Llibreria | Versió |
|------------|-----------|--------|
| **Framework** | React | 18.3.1 |
| **Build** | Vite | 6.0.0 |
| **UI** | @mui/material | 9.0.0 |
| **Estils** | @emotion/react | 11.14.0 |
| **HTTP** | axios | 1.15.0 |
| **Routing** | react-router-dom | 6.30.3 |
| **Animacions** | framer-motion | 12.38.0 |
| **Icons** | lucide-react | 0.577.0 |
| **Tipus** | TypeScript | 5.5.0 |

---

## 8. Modes de la Lliçó (`LessonPage.tsx`)

| Mode | Descripció |
|------|------------|
| **Normal** | Mode estàndard, l'estudiant pot practicar lliurement |
| **Drill** | Temporitzador de 60 segons, repte ràpid |
| **Assist** | Pistes disponibles per a principiants |
| **Hackathon** | Punts extres (150 pts) per completar reptes |

---

## 9. Estructura del Tema

El tema MUI dark està definit a `src/theme/theme.ts`:

```typescript
{
  palette: {
    mode: 'dark',
    primary: { main: '#a855f7' },    // Violeta
    secondary: { main: '#ec4899' },  // Rosa
    background: { default: '#0f0a1e' }
  }
}
```

---

# Documentació de Components

## `src/components/Header.tsx` — Barra de Navegació

**Responsabilitat:** Barra de navegació principal amb menú responsive, autenticació i selector d'idioma.

**Props:** Cap (exportat com a component directe)

**Funcionalitats:**
- **Logo:** Enllaça a `/` amb imatge rotada en mòbil
- **Menú Desktop:** Cursos (scroll suau), Accedir/Progrés (login state), selector d'idioma (CA/ES/EN), ThemeToggle
- **Menú Mòbil:** Overlay animat amb Framer Motion, mateixes opcions en vertical
- **Autenticació:** Detecta `token` i `currentStudent` al localStorage, escolta events `auth-state-change`
- **Logout:** Neteja localStorage i redirigeix a `/`
- **Scroll:** `scrollToDynamic()` fa scroll suau a seccions específiques, navegant a Home si cal

**Dependències:** react-router-dom, @mui/material, @mui/icons-material, framer-motion, lucide-react, i18next, ThemeToggleButton, authService

---

## `src/components/Hero.tsx` — Secció Hero Principal

**Responsabilitat:** Secció d'inici espectacular amb efecte typewriter, estadístiques en viu i fons de partícules.

**Props:** Cap

**Components interns:**
- **Typewriter:** Efecte d'escriptura/borrat amb llistat de tecnologies (`React`, `Python`, `SpringBoot`, `Machine Learning`). Velocitats d'escriptura (150ms) i borrat (60ms) amb pausa de 4s entre paraules.

**Funcionalitats:**
- **Typewriter animat:** Paraules que s'escriuen i s'esborren en bucle
- **Estadístiques dinàmiques:** Polling cada 5s a `/data.json` per mostrar nombre d'estudiants i cursos actius
- **Fons de partícules:** Canvas interactiu via `ParticlesBackground`
- **Indicador de scroll:** Chevrons animats a banda i banda amb text "FES SCROLL"

**Dependències:** @mui/material, framer-motion, i18next, ParticlesBackground

---

## `src/components/Footer.tsx` — Peu de Pàgina

**Responsabilitat:** Footer complet amb informació de marca, enllaços de navegació i xarxes socials.

**Props:** Cap

**Components interns:**
- **FooterLink:** Enllaç reutilitzable que suporta `to` (React Router) i `href` (enllaç extern)

**Seccions:**
- **Logo & Tagline:** Logo rotat, "MOOC 2026" i descripció de la plataforma
- **Explora:** Enllaços a Cursos i Accedir
- **Comunitat:** Enllaç a Telegram
- **Connecta:** Icones socials (TL)
- **Copyright:** Any dinàmic via `new Date().getFullYear()`

**Dependències:** @mui/material, framer-motion, react-router-dom, i18next

---

## `src/components/CourseCard.tsx` — Targeta de Curs

**Responsabilitat:** Targeta visual per a cada curs amb imatge, títol, descripció i botó d'inscripció.

**Props:**
- `course: Course` - Dades del curs (id, title, description, image, level, duration, instructor, disabled, logoSize/Width/Height)
- `index: number` - Índex per a l'animació d'entrada escalonada

**Funcionalitats:**
- **Animació:** Framer Motion amb `whileInView` i retards basats en `index`
- **Localització:** Suporta títols i descripcions multiidioma (`{ca, es, en}`)
- **Hover:** Elevació amb ombra violeta i canvi de color de borde
- **Curs deshabilitat:** Mostra etiqueta "PROPERAMENT", opacitat reduïda, hover desactivat
- **Inscripció:** Verifica autenticació abans de navegar a `/dashboards/student`
- **Icona animada:** Fletxa `ArrowRight` que es mou en bucle

**Dependències:** @mui/material, framer-motion, react-router-dom, lucide-react, i18next, ui/Card

---

## `src/components/ParticlesBackground.tsx` — Fons de Partícules

**Responsabilitat:** Fons interactiu amb partícules que reaccionen al moviment del ratolí, renderitzat amb Canvas.

**Props:** Cap

**Components interns:**
- **Particle (classe):** Cada partícula té posició, velocitat, mida, color i densitat. Mètodes:
  - `draw(ctx)`: Dibuixa la partícula al canvas
  - `update(mouse)`: Aplica física de repulsió (reacció al ratolí) i retorn a posició base

**Funcionament:**
- Genera partícules proporcionals a la mida de la pantalla (`(width * height) / 5500`)
- Cada partícula té moviment aleatori lent (`vx/vy`) i rebota en els límits
- El ratolí crea un radi de repulsió que empeny les partícules
- Connexions: Dibuixa línies entre partícules properes (<180px) amb opacitat basada en distància
- Colors adaptatius al tema (blanc sobre fosc, negre sobre clar)
- `requestAnimationFrame` per a animació fluida
- Responsiu: es re-inicialitza en resize

**Dependències:** @mui/material (useTheme)

---

## `src/components/ThemeToggleButton.tsx` — Botó de Mode Clar/Fosc

**Responsabilitat:** Interruptor per canviar entre mode clar i fosc.

**Props:** Cap

**Funcionament:**
- Obté el mode actual (`dark`/`light`) i la funció `toggleTheme` del `ThemeContext`
- Mostra icona `Sun` en mode fosc, `Moon` en mode clar
- Efecte hover amb color primari

**Dependències:** @mui/material, lucide-react, theme/ThemeContext

---

## `src/components/LanguageSwitcher.tsx` — Canviador d'Idioma

**Responsabilitat:** Botons per canviar entre català, castellà i anglès.

**Props:** Cap

**Funcionament:**
- Mostra 3 botons (CA, ES, EN) en un Stack horitzontal
- L'idioma actiu es ressalta amb color primari
- Utilitza `i18n.changeLanguage()` de react-i18next

**Dependències:** @mui/material, react-i18next

---

## `src/components/ui/Card.tsx` — Components UI: Card

**Responsabilitat:** Wrapper personalitzat dels components Card de MUI amb estil consistent.

**Components exportats:**
- **Card:** Wrapper de `MuiCard` amb borderRadius, backdropFilter, vores, ombres i hover
- **CardHeader:** Header amb estils de títol i subtítol
- **CardTitle:** Typography variant h2 amb pes 800
- **CardDescription:** Typography variant body2 amb color secundari
- **CardContent:** Content amb padding consistent

**Dependències:** @mui/material

---

## `src/components/ui/badge.tsx` — Component Badge

**Responsabilitat:** Etiqueta/badge reusable amb modes estàndard i outline.

**Props:**
- `children: string` - Text del badge
- `mode?: 'standard' | 'outline'` - Estil (per defecte 'standard')
- `sx?: SxProps<Theme>` - Estils addicionals

**Funcionament:**
- Standard: Fons primari translúcid, text primari
- Outline: Transparent, text secundari, vora divider

**Dependències:** @mui/material (Chip)

---

# Documentació de Pàgines

## `src/pages/Home.tsx` — Pàgina Principal

**Responsabilitat:** Pàgina d'inici amb Hero, llistat de cursos i secció de features.

**Estats locals:**
- `coursesList: Course[]` - Llistat de cursos carregats del servei
- `loading: boolean` - Estat de càrrega

**Seccions:**
1. **Header** - Barra de navegació
2. **Hero** - Secció principal amb typewriter i estadístiques
3. **Cursos Destacats** - Grid de `CourseCard` carregat des de `courseService.getAllCourses()` amb recàrrega automàtica al tornar la pestanya al focus (`visibilitychange`)
4. **Per què triar MOOC 2026?** - 6 targetes de features amb icona, títol i descripció localitzats
5. **Footer** - Peu de pàgina

**Dependències:** @mui/material, framer-motion, react-i18next, components/*, services/courseService

---

## `src/pages/courses/CourseLessons.tsx` — Lliçons d'un Curs

**Responsabilitat:** Pàgina de detall d'un curs amb llistat de lliçons, temari interactiu i navegació.

**Params URL:** `courseId` (ex: "Python")

**Layout de 3 columnes (Desktop):**
- **Esquerra (22%):** Accordion syllabus amb lliçons i sub-topics. Cada lliçó mostra check si completada
- **Centre (flex):** Contingut de la lliçó activa: títol, subtítols, text, exemples de codi, botó "Start Challenge"
- **Dreta (22%):** Navegació ràpida "On this page" amb enllaços als sub-topics

**Funcionalitats:**
- Càrrega de dades des de `/data.json`
- Suport multiidioma complet (títols, descripcions, subtítols, textos)
- Progrés sincronitzat via localStorage (`mooc_global_progress`) amb events `lessonProgressUpdated`
- Cursos deshabilitats mostren pantalla "PROPERAMENT"
- Breadcrumb de navegació (Home > Curs)
- Blocs de codi amb estil VS Code (fons fosc, sintaxi verda)

**Dependències:** @mui/material, react-router-dom, framer-motion, lucide-react, i18next

---

## `src/pages/courses/${courseId}/${lesson.id}/LessonTopic.tsx` — Teoria de la Lliçó

**Responsabilitat:** Pàgina de teoria d'una lliçó específica amb explicació i objectiu.

**Params URL:** `courseId`, `lessonId`

**Layout de 2 columnes (Desktop):**
- **Esquerra (50%):** Índex de la lliçó actual amb estil de sidebar (fons resaltat, borde esquerra primari)
- **Dreta (50%):** Contingut teòric: títol, descripció, explicació (`theoryInstructions`), objectiu/repte

**Funcionalitats:**
- Càrrega de dades des de `/data.json`
- Animació d'entrada amb Framer Motion (opacity + translateY)
- Suport multiidioma
- Navegació Anterior/Següent entre lliçons
- Botó "Go to activity" que navega a l'editor de codi (`LessonPage`)
- Responsive: en mòbil es mostra en vertical

**Dependències:** @mui/material, react-router-dom, framer-motion, lucide-react, i18next

---

## `src/pages/courses/LessonPage.tsx` — Editor de Codi Interactiu

**Responsabilitat:** Entorn d'aprenentatge amb editor de codi, tests, modes de joc i feedback visual.

**Params URL:** `courseId`, `lessonId`

**Modes de la lliçó:**
- **Normal:** Mode estàndard d'edició
- **Drill:** Temporitzador de 60s (repte ràpid)
- **Assist:** 3 pistes disponibles
- **Hackathon:** 150 punts extra per completar

**Layout Desktop (3 columnes):**
- **Col 1 (20%):** Enunciat, objectiu, temporitzador (drill), pistes (assist), punts
- **Col 2 (57%):** Editor de codi (textarea amb sintaxi verda), botó RUN
- **Col 3 (23%):** Consola de sortida amb feedback

**Layout Mòbil:** Stack vertical amb navegació inferior fixa

**Funcionalitats clau:**
- **Editor:** Textarea amb estil de terminal (fons negre, text verd `#b5e853`)
- **Tests:** Compara codi de l'usuari amb la solució (remove espaïs + includes)
- **Confetti:** Animació en completar la lliçó (canvas-confetti)
- **Progrés:** Guarda a localStorage + intenta sincronitzar amb API
- **Punts:** +10 per lliçó completada, +150 en mode hackathon
- **Submissions (Python):** Guarda últimes 50 submissions al localStorage i mostra resultats d'altres estudiants
- **Navegació:** Anterior/Següent entre lliçons

**Dependències:** @mui/material, react-router-dom, framer-motion, lucide-react, canvas-confetti, i18next, services/api

---

## `src/pages/dashboards/StudentDashboard.tsx` — Panell de l'Estudiant

**Responsabilitat:** Àrea personal amb login, registre, progrés per curs, rànquing i gestió d'estudiants.

**Components interns:**
- **StudentCard:** Targeta amb avatar, nom, camp PIN i botó de login. Inclou opció d'eliminar usuari (amb confirmació de PIN)
- **CourseIcon:** Retorna icona Lucide segons el nom del curs (Python→Terminal, React→Globe, ML→Cpu, Spring→Layers, SQL→Database)

**Estats:**
- `selectedStudent` - Estudiant loguejat
- `dbProgress` - Progrés de lliçons (Record<string, boolean>)
- `students` - Llistat d'estudiants (API + locals)
- `errorId` - ID de l'estudiant amb error de PIN
- `expandedCourse` - Curs expandit per veure detalls
- `activeTab` - 'syllabus' | 'activities'
- `rankingTab` - Curs seleccionat al rànquing

**Funcionalitats:**
- **Login:** Validació per PIN (codi de 4 dígits), suport per a role student/teacher
- **Registre:** Formulari per crear usuaris locals (guardats a localStorage)
- **Eliminació:** Soft-delete amb IDs guardats a `mooc_deleted_ids`
- **Progrés:** Barres de progrés per curs, punts totals, estats de lliçons
- **Rànquing:** Tabs per curs, llistat ordenat per progrés, usuari actiu destacat
- **Expansió de curs:** Modal inline amb syllabus o laboratori, navegació a lliçons
- **Reset de curs:** Reinicia progrés d'un curs específic

**Dependències:** @mui/material, react-router-dom, framer-motion, lucide-react, i18next, services/api

---

# Documentació de Serveis

## `src/services/api.ts` — Client HTTP i Gestió de Progrés

**Responsabilitat:** Capa d'accés a dades per gestionar el progrés dels estudiants amb sincronització híbrida (API + localStorage).

**Base URL:** `http://localhost:8080/api`

**Mètodes:**
- `getStudentProgress(studentId)` - Obté progrés fusionant dades locals + API (API té preferència)
- `postProgress(data)` - Desa progrés localment i intenta sincronitzar amb API
- `resetCourse(studentId, courseId)` - Reinicia progrés d'un curs (local + API)

**Estratègia de sincronització:**
1. Guarda sempre a localStorage primer
2. Intenta enviar a API
3. Si API falla, retorna `{status: 200, data: 'saved_locally'}`
4. En get, fusiona: `{...localData, ...apiData}` (API guanya)

**Dependències:** axios

---

## `src/services/authService.ts` — Servei d'Autenticació

**Responsabilitat:** Gestiona login, logout i obtenció de dades d'usuari.

**Base URL:** `http://localhost:8080/api`

**Mètodes:**
- `login(credentials)` - Login amb API real o fallback a `data.json` local
- `logout()` - Logout a API + neteja de localStorage
- `getMe()` - Obté dades de l'usuari (API o localStorage)
- `getCurrentUser()` - Obté usuari del localStorage (síncron)

**Fallback local:**
Quan l'API no està disponible, busca a `data.json` un estudiant amb email i code coincidents. Genera un `fake-jwt-token`.

**Dependències:** axios

---

## `src/services/courseService.ts` — Servei de Cursos

**Responsabilitat:** CRUD de cursos, lliçons, estudiants i enviament de solucions.

**Base URL:** `http://localhost:8080/api/v1`

**Mètodes:**
- `getAllCourses()` - Llistat de cursos (API → fallback local)
- `getCourseBySlug(slug)` - Detalls d'un curs per ID
- `getCourseLessons(slug)` - Lliçons d'un curs (mapeja topics a Lessons)
- `getCourseStudents(slug)` - Estudiants d'un curs
- `submitChallenge(courseSlug, topicSlug, problemSlug, code)` - Envia solució

**Interceptors Axios:**
- Afegeix `Authorization: Token <token>` a totes les peticions

**Fallback local:**
Tots els mètodes capturen errors i carreguen `/data.json` com a alternativa.

**Dependències:** axios, types

---

# Documentació del Tema

## `src/theme/theme.ts` — Configuració del Tema MUI

**Responsabilitat:** Defineix el tema de Material UI amb suport per mode clar i fosc.

**Colors:**
- **Primary:** `#8400ff` (violeta) amb variants light `#c084fc` i dark `#8400ff`
- **Secondary:** `#ec4899` (rosa)
- **Mode fosc:** Fons `#0a0a0a`, paper `#141414`, text blanc
- **Mode clar:** Fons `#ffffff`, paper `#ffffff`, text `#1a1a1a`

**Tipografia:** Font family "Inter", "Roboto", sans-serif

**Components personalitzats:**
- `MuiCssBaseline`: Transicions suaus en canvi de tema
- `MuiCard`: BackdropFilter, border dinàmic segons mode

**Exportacions:**
- `getTheme(mode)` - Crea tema per a un mode concret
- `default` - Tema fosc per defecte

**Dependències:** @mui/material

---

## `src/theme/ThemeContext.tsx` — Context de Tema (Clar/Fosc)

**Responsabilitat:** Provider de context que gestiona el mode clar/fosc i el persisteix a localStorage.

**API pública:**
- `useThemeMode()` → `{ mode, toggleTheme, setMode }`
- `ThemeProvider` - Component que envolta l'app

**Funcionament:**
- Llegeix `mooc-theme-mode` del localStorage per inicialitzar
- Per defecte: `'dark'`
- `toggleTheme()` alterna entre 'dark' i 'light'
- Persisteix a localStorage en cada canvi
- Proporciona el tema MUI via `MuiThemeProvider`
- Inclou `CssBaseline` per estils base consistents

**Dependències:** @mui/material, theme/theme

---

# Documentació de Tipus

## `src/types/index.ts` — Interfícies TypeScript

**Responsabilitat:** Defineix tots els tipus i interfícies del projecte.

**Interfícies:**
- **Course:** id, title (multiidioma), description, image, level, duration, instructor, icon, logoSize/Width/Height, content (Lesson[])
- **Lesson:** id, title, description, instructions, challenge, initialCode, solution, duration
- **CourseProgress:** courseName, progress, lastLesson
- **StudentActivity:** id, studentName, action, timestamp
- **Student:** id, name, email, code, courses_progress, progress, lastActivity
- **DataStructure:** courses[], students[] (estructura completa de data.json)

**Dependències:** Cap (TypeScript pur)

---

# Documentació de Llibreries

## `src/lib/utils.ts` — Utilitats

**Responsabilitat:** Proporciona funcions auxiliars reutilitzables.

**Funcions:**
- `sx(...inputs)` - Combina múltiples propietats `sx` de MUI en una de sola. Filtra valors null/undefined/boolean i retorna un array de SxProps vàlid.

**Dependències:** @mui/material (SxProps, Theme)

---

# Documentació de Traduccions

## `src/locales` — Traduccions CA,ES,EN

**Responsabilitat:** Fitxer de traduccions en català per a react-i18next.

**Seccions:**
- `auth` - Textos d'autenticació (login, logout, accés, PIN)
- `dashboard` - Panell d'estudiant (títols, botons, rànquing, temari)
- `home` - Pàgina principal (cursos destacats, features)
- `hero` - Secció hero (subtítol, estadístiques, scroll)
- `footer` - Peu de pàgina (explora, comunitat, connecta)
- `course` - Textos de curs (enroll, by)
- `common` - Errors comuns
- `lesson` - Editor de codi (syllabus, run, debug, completat, punts)

**Dependències:** Cap (exporta objecte JS)
