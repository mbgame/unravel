# User Stories

## Epic 1: Authentication & Onboarding

### US-001 — Guest Play
**As a** new visitor  
**I want to** play the game without creating an account  
**So that** I can try the game before committing to sign up  

**Acceptance Criteria:**
- [ ] Guest can access first 5 levels without an account
- [ ] Guest progress is stored in localStorage
- [ ] Guest is prompted to create account after completing level 5
- [ ] Guest progress is preserved after account creation

---

### US-002 — User Registration
**As a** new player  
**I want to** create an account with username and password  
**So that** my progress and scores are saved permanently  

**Acceptance Criteria:**
- [ ] Registration form has: username (3-32 chars), email, password (min 8 chars)
- [ ] Duplicate username/email shows clear error
- [ ] After registration, user is automatically logged in
- [ ] Welcome animation plays on first login

---

### US-003 — User Login
**As a** returning player  
**I want to** log into my account  
**So that** I can access my saved progress and scores  

**Acceptance Criteria:**
- [ ] Login with email + password
- [ ] "Remember me" checkbox keeps session for 7 days
- [ ] Wrong credentials show a generic error (no hint about what's wrong)
- [ ] Redirect to where user was before login

---

### US-004 — Password Reset
**As a** player who forgot their password  
**I want to** reset my password via email  
**So that** I can regain access to my account  

**Acceptance Criteria:**
- [ ] "Forgot password" link on login page
- [ ] Email with reset link is sent within 30 seconds
- [ ] Reset link expires after 1 hour
- [ ] Success message after password change

---

## Epic 2: Core Game

### US-005 — View Level List
**As a** player  
**I want to** see all available levels with difficulty indicators  
**So that** I can choose what to play next  

**Acceptance Criteria:**
- [ ] Levels displayed as cards with: name, difficulty stars (1-5), best score (if played), lock state
- [ ] Locked levels show lock icon (need previous level complete)
- [ ] Completed levels show star rating
- [ ] Smooth scroll through level grid
- [ ] Daily challenge highlighted at top

---

### US-006 — Play a Level
**As a** player  
**I want to** load and play a knot puzzle level  
**So that** I can enjoy the game  

**Acceptance Criteria:**
- [ ] Level loads within 2 seconds on 4G
- [ ] 3D knot is visible and centered on screen
- [ ] Timer starts automatically
- [ ] Move counter visible
- [ ] Pause button accessible

---

### US-007 — Rotate the Knot
**As a** player  
**I want to** rotate the 3D knot by dragging  
**So that** I can see it from different angles  

**Acceptance Criteria:**
- [ ] Single finger drag rotates the knot on X and Y axes
- [ ] Two finger pinch zooms in/out (within limits: 0.5x - 2x)
- [ ] Rotation is smooth at 60fps
- [ ] Knot doesn't fly off screen
- [ ] Inertia: knot continues to rotate slightly after release

---

### US-008 — Untangle a Crossing
**As a** player  
**I want to** tap/drag a string segment to move it through a crossing point  
**So that** I can untangle the knot  

**Acceptance Criteria:**
- [ ] Tapping a string selects/highlights it
- [ ] Dragging a selected segment moves it
- [ ] Invalid moves are blocked with a subtle shake animation
- [ ] Valid untangle triggers satisfying animation + haptic
- [ ] Move counter increments on each valid move

---

### US-009 — Complete a Level
**As a** player  
**I want to** see a celebration when I untangle the knot  
**So that** I feel rewarded for solving the puzzle  

**Acceptance Criteria:**
- [ ] Timer stops when knot is fully untangled
- [ ] Confetti/particle explosion animation plays
- [ ] Score breakdown shows: time, moves, hints, total score
- [ ] Star rating displayed (1-3 stars based on score)
- [ ] Options: Next Level, Replay, Menu
- [ ] Score submitted to backend automatically

---

### US-010 — Use a Hint
**As a** player  
**I want to** get a hint when I'm stuck  
**So that** I can continue without rage quitting  

**Acceptance Criteria:**
- [ ] Hint button shows next optimal move (highlights which string to move)
- [ ] 3 hints available per level
- [ ] Each hint costs -100 points from final score
- [ ] After 3 hints: "Show Solution" option available (0 score, no leaderboard submission)

---

### US-011 — Pause Game
**As a** player  
**I want to** pause the game  
**So that** I can take a break without losing progress  

**Acceptance Criteria:**
- [ ] Pause button always visible during gameplay
- [ ] Timer pauses immediately
- [ ] Pause menu: Resume, Restart, Settings, Quit to Menu
- [ ] Game state preserved when paused

---

### US-012 — Restart a Level
**As a** player  
**I want to** restart a level from scratch  
**So that** I can try a different approach  

**Acceptance Criteria:**
- [ ] Restart confirmation dialog prevents accidental restart
- [ ] Knot resets to initial tangled state
- [ ] Timer and move counter reset to zero
- [ ] Previous score is not affected (scores are best-score only)

---

## Epic 3: Progression & Scoring

### US-013 — View My Scores
**As a** player  
**I want to** see my best score for each level  
**So that** I can track my improvement  

**Acceptance Criteria:**
- [ ] Profile page shows all levels with best score and completion date
- [ ] Visual progress bar showing % of levels completed
- [ ] Total score, total levels completed, best rank visible

---

### US-014 — Submit Score to Leaderboard
**As a** player  
**I want to** see my rank on the global leaderboard  
**So that** I can compete with other players  

**Acceptance Criteria:**
- [ ] Score auto-submitted after level complete (if logged in)
- [ ] Global leaderboard for each level (top 100)
- [ ] My rank shown even if not in top 100
- [ ] Leaderboard shows: rank, username, score, time

---

### US-015 — Daily Challenge
**As a** player  
**I want to** play a special daily challenge  
**So that** I have a reason to return every day  

**Acceptance Criteria:**
- [ ] New challenge available every day at midnight UTC
- [ ] Special "DAILY" badge on challenge card
- [ ] Separate daily challenge leaderboard
- [ ] Countdown timer to next challenge
- [ ] Streak counter (consecutive days played)

---

### US-016 — Earn Achievements
**As a** player  
**I want to** unlock achievements for special accomplishments  
**So that** I have extra goals to pursue  

**Acceptance Criteria:**
Achievement examples:
- "First Untangle" — Complete your first level
- "Speed Demon" — Complete a level in under 30 seconds
- "Perfectionist" — Complete a level with 0 hints, under par moves and par time
- "Streak Master" — 7-day daily challenge streak
- "Centurion" — Complete 100 levels
- [ ] Achievement unlocked notification appears in-game
- [ ] Achievement gallery in profile page

---

## Epic 4: Settings & Accessibility

### US-017 — Adjust Graphics Quality
**As a** player on a lower-end device  
**I want to** lower graphics quality  
**So that** the game runs smoothly  

**Acceptance Criteria:**
- [ ] Settings: Auto (default), Low, Medium, High
- [ ] Auto detects device capability on first launch
- [ ] Changes apply without restart
- [ ] Low mode: reduced particles, lower resolution, simplified geometry

---

### US-018 — Toggle Sound & Music
**As a** player  
**I want to** turn off sound effects and/or music independently  
**So that** I can play in quiet environments  

**Acceptance Criteria:**
- [ ] Separate toggles for SFX and Music
- [ ] Settings persist across sessions (localStorage)
- [ ] Quick mute icon accessible during gameplay

---

### US-019 — Haptic Feedback
**As a** player on mobile  
**I want to** feel haptic feedback when untangling strings  
**So that** the interaction feels satisfying  

**Acceptance Criteria:**
- [ ] Subtle vibration on valid move
- [ ] Longer vibration on level complete
- [ ] Setting to disable haptics
- [ ] Graceful fallback on devices without Vibration API

---

## Epic 5: PWA & Offline

### US-020 — Install as PWA
**As a** player  
**I want to** add the game to my home screen  
**So that** I can access it like a native app  

**Acceptance Criteria:**
- [ ] Web manifest configured with icons, name, theme color
- [ ] "Add to Home Screen" prompt appears after 2 plays
- [ ] App launches in standalone mode (no browser UI)
- [ ] Splash screen displays during load

---

### US-021 — Play Offline
**As a** player  
**I want to** play levels that I've already loaded even without internet  
**So that** I can play anywhere  

**Acceptance Criteria:**
- [ ] Service worker caches first 10 levels on first load
- [ ] Offline mode banner shown when no connection
- [ ] Scores cached locally and synced when back online
- [ ] Leaderboard shows "unavailable offline" message
