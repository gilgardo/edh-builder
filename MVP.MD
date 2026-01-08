# EDH Builder - Minimum Viable Product Specification

## Product Vision
EDH Builder is a collaborative platform for Magic: The Gathering Commander deck building that brings version control concepts to deck construction. Players can create, share, review, and collaboratively improve decks through a git-inspired workflow.

## Core Value Proposition
- **Solo Builders**: Create and refine Commander decks with intelligent card search and validation
- **Deck Reviewers**: Discover and analyze community decks with detailed insights
- **Collaborators**: Work together on decks through suggestions, branches, and merge workflows

---

## MVP Feature Set

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Users can create accounts and build basic decks

#### 1.1 Authentication & User Profiles
- **Sign up/Login** via email, Google, Discord, or GitHub
- **User Profile** with:
  - Display name and avatar
  - Deck collection overview
  - Public/private profile toggle
- **Session management** with NextAuth v5

#### 1.2 Card Search & Display
- **Card Search Engine**
  - Search by name, color, type, mana cost
  - Filters: Commander legal, color identity, card type, CMC range
  - Real-time search with debouncing (300ms)
  - Scryfall API integration with local caching
- **Card Display Component**
  - Card image preview on hover
  - Detailed view modal with:
    - Full text, rulings, legality
    - Mana cost breakdown
    - Price information (optional)
  - Mobile-optimized card viewer

#### 1.3 Deck Builder
- **Create New Deck**
  - Select commander (legendary creature validation)
  - Auto-detect color identity from commander
  - Name, description, and format selection
  - Public/private visibility toggle
- **Deck Editor Interface**
  - Split view: Card search (left) | Deck list (right)
  - Categories: Commander, Creatures, Instants, Sorceries, Artifacts, Enchantments, Planeswalkers, Lands
  - Card counter (99/99 + 1 commander)
  - Color identity validation (real-time)
  - Duplicate prevention (except basic lands)
  - Drag-and-drop card organization
- **Mana Curve Visualization**
  - Bar chart of CMC distribution
  - Color breakdown by card type
- **Quick Stats**
  - Average CMC
  - Color distribution
  - Card type breakdown

### Phase 2: Discovery & Community (Weeks 4-5)
**Goal**: Users can explore and interact with community decks

#### 2.1 Deck Gallery
- **Browse Decks**
  - Grid/list view toggle
  - Filters:
    - Commander color identity
    - Deck tags/archetypes
    - Date added, popularity
    - User (by creator)
  - Sort: Most recent, most viewed, most liked
  - Infinite scroll pagination
- **Deck Preview Cards**
  - Commander image
  - Deck name and creator
  - Color identity badges
  - View/like count
  - Last updated date

#### 2.2 Deck Details Page
- **Overview Tab**
  - Full deck list with card images
  - Mana curve and statistics
  - Deck description and strategy notes
  - Commander spotlight
  - Tags/archetypes
- **Action Bar**
  - Like/unlike deck
  - Clone deck (copy to own collection)
  - Share link with social media preview
  - Export options (text list, CSV, Archidekt format)
- **Comments Section**
  - Top-level comments only (no threading in MVP)
  - Markdown support
  - Edit/delete own comments
  - Sort by newest/oldest

### Phase 3: Collaboration Core (Weeks 6-8)
**Goal**: Git-inspired collaboration workflow

#### 3.1 Deck Collaboration Model
- **Collaboration Roles**
  - **Owner**: Full control, can delete deck, manage collaborators
  - **Editor**: Can create suggestions, approve changes
  - **Viewer**: Can view private decks, leave comments
- **Invite System**
  - Invite by username or email
  - Pending invitations list
  - Accept/decline invitations
  - Remove collaborators (owner only)

#### 3.2 Suggestions System (Core Innovation)
- **Create Suggestion**
  - Select cards to add/remove/swap
  - Write description and rationale
  - Tag suggestion type: Optimization, Budget, Theme, Combo, etc.
  - Submit for review
- **Suggestion Card**
  - Shows proposed changes with diff view:
    - ➕ Cards to add (with image preview)
    - ➖ Cards to remove (with image preview)
    - 🔄 Swaps (side-by-side comparison)
  - Change rationale and discussion
  - Status: Pending, Approved, Rejected, Implemented
- **Review Suggestions**
  - Owner/editors can:
    - Approve (merges changes to main deck)
    - Reject with comment
    - Request modifications
  - Discussion thread per suggestion
  - Notification system for status changes

#### 3.3 Deck Version History
- **Version Timeline**
  - List all deck changes with timestamps
  - Show what changed (cards added/removed)
  - Authored by (user who made change)
  - Rollback capability (owner only)
- **Compare Versions**
  - Side-by-side diff view
  - Highlight changes in card list
  - Statistics comparison

---

## User Flows

### Flow 1: First-Time Deck Creation
1. User signs up → Sees empty dashboard
2. Clicks "Create Deck" → Commander selection modal
3. Searches for commander → Selects "Atraxa, Praetors' Voice"
4. Enters deck name "Atraxa Superfriends"
5. Lands in deck editor with card search
6. Searches "planeswalker" → Filters to 4-color identity
7. Adds cards one by one, sees counter update (15/99)
8. Continues until complete → Clicks "Save Deck"
9. Redirected to deck details page with share options

### Flow 2: Discovering & Cloning a Deck
1. User navigates to "Explore Decks"
2. Filters by "5-Color" → Sorts by "Most Popular"
3. Clicks on interesting deck thumbnail
4. Reads description and strategy notes
5. Likes the deck → Clicks "Clone Deck"
6. Confirmation modal: "Save to your collection?"
7. Deck copied → Redirected to own deck editor
8. Makes personal modifications → Saves

### Flow 3: Collaborative Deck Building
1. Owner creates deck "Competitive Yuriko"
2. Clicks "Manage Collaborators" → Invites friend by username
3. Friend receives notification → Accepts invitation
4. Friend views deck → Clicks "Suggest Changes"
5. Friend creates suggestion:
   - Remove: "Coiling Oracle" (too slow)
   - Add: "Brainstorm" (better card draw)
   - Rationale: "Improves deck velocity for cEDH"
6. Owner receives notification → Reviews suggestion
7. Owner approves → Changes merge to main deck
8. Version history shows: "Suggestion by @friend implemented"
9. Deck updated, both users notified

### Flow 4: Mobile Deck Review
1. User opens app on phone while commuting
2. Browses trending decks in portrait mode
3. Taps deck card → Full-screen deck view
4. Swipes through card images (Instagram-style)
5. Taps card for details modal
6. Leaves quick comment: "Love this combo!"
7. Likes deck → Adds to favorites
8. Shares deck link to Discord server

---

## Technical Requirements

### Performance Targets
- **Initial Load**: < 2 seconds (LCP)
- **Card Search**: < 300ms response time
- **Deck Save**: < 1 second
- **Image Loading**: Progressive with blur placeholders
- **Mobile Performance**: 60 FPS scrolling

### Responsive Design Breakpoints
```css
/* Mobile First Approach */
- xs: 0-639px (1 column, stacked layout)
- sm: 640-767px (1-2 columns)
- md: 768-1023px (2 columns, compact search)
- lg: 1024-1279px (2-3 columns, split editor)
- xl: 1280px+ (3 columns, full features)
```

### Data Validation
- **Deck Rules**
  - Exactly 1 commander (or 2 if partner)
  - Exactly 99 other cards
  - No banned cards in Commander format
  - Color identity matches commander
  - No duplicates except basic lands
- **Suggestion Rules**
  - Must maintain 100 card count
  - Must maintain color identity
  - Cannot remove commander
  - Maximum 10 cards per suggestion

### Database Considerations
- **Deck Storage**: 
  - Main deck stored as JSON array of card IDs
  - Categorization stored separately for flexibility
  - Full-text search on deck names/descriptions
- **Caching Strategy**:
  - Redis for card data (Scryfall responses)
  - TTL: 7 days for card data
  - Invalidation on Scryfall updates
- **Indexing**:
  - User decks (user_id, created_at)
  - Public decks (visibility, popularity_score)
  - Collaborations (deck_id, user_id, role)

---

## Design System

### Component Hierarchy
```
Page Layouts (Responsive Containers)
├── Navigation (Sticky Header)
├── Content Areas (Flexbox/Grid)
│   ├── Primary Panel (Main Content)
│   ├── Secondary Panel (Sidebar)
│   └── Tertiary Panel (Filters/Tools)
└── Modals & Overlays (Portals)
```

### Key Components

#### Card Component States
- **Default**: Border with color identity
- **Hover**: Elevated shadow, image preview popup
- **Selected**: Highlighted border, checkmark
- **Disabled**: Grayscale, not legal indicator
- **Loading**: Skeleton with shimmer

#### Deck Card (Gallery Item)
```jsx
<DeckCard>
  <CommanderImage /> // Rounded top, aspect 16:9
  <DeckInfo>
    <Title />
    <Creator />
    <ColorIdentity /> // Mana symbol row
    <Stats /> // Views, likes, cards
  </DeckInfo>
  <ActionBar /> // Clone, like, share icons
</DeckCard>
```

#### Suggestion Card
```jsx
<SuggestionCard>
  <Header>
    <Avatar />
    <Author />
    <Timestamp />
    <StatusBadge />
  </Header>
  <ChangesList>
    <AddedCards /> // Green bg, + icon
    <RemovedCards /> // Red bg, - icon
    <SwappedCards /> // Blue bg, ↔️ icon
  </ChangesList>
  <Rationale /> // Markdown content
  <ActionBar>
    <ApproveButton />
    <RejectButton />
    <DiscussButton />
  </ActionBar>
</SuggestionCard>
```

### Color System
- **MTG Colors**: Use semantic classes (bg-mtg-white-500)
- **UI Colors**: CSS variables for theming
- **Gradients**: Guild-based for multi-color decks
- **Accessibility**: WCAG AA contrast ratios minimum

### Typography Scale
```css
- Display: 3rem (48px) - Hero headers
- H1: 2.25rem (36px) - Page titles
- H2: 1.875rem (30px) - Section headers
- H3: 1.5rem (24px) - Card titles
- Body: 1rem (16px) - Default text
- Small: 0.875rem (14px) - Captions, labels
- Tiny: 0.75rem (12px) - Timestamps, counts
```

### Spacing System (Tailwind)
- **Micro**: 0.25rem (4px) - Tight spacing
- **Small**: 0.5rem (8px) - Compact elements
- **Base**: 1rem (16px) - Default spacing
- **Medium**: 1.5rem (24px) - Section gaps
- **Large**: 2rem (32px) - Major divisions
- **XL**: 3rem (48px) - Page sections

---

## Mobile-First Approach

### Critical Mobile Features
1. **Touch-Optimized**
   - Minimum tap target: 44x44px
   - Swipe gestures for navigation
   - Long-press for quick actions
2. **Progressive Disclosure**
   - Collapsed sections by default
   - Expandable card details
   - Bottom sheets for actions
3. **Offline Capability**
   - Cache user's decks locally
   - Queue suggestions when offline
   - Sync on reconnection
4. **Performance**
   - Lazy load images below fold
   - Virtual scrolling for long lists
   - Reduced animations on low-end devices

### Responsive Patterns

#### Deck Editor
- **Mobile (< 768px)**:
  - Single column stack
  - Floating action button for search toggle
  - Full-screen card modal
  - Swipeable categories
- **Tablet (768-1023px)**:
  - Side-by-side when landscape
  - Collapsible search panel
  - Persistent category tabs
- **Desktop (1024px+)**:
  - Three-column layout
  - Persistent search sidebar
  - Inline card previews
  - Keyboard shortcuts enabled

#### Deck Gallery
- **Mobile**: 1 card per row, infinite scroll
- **Tablet**: 2-3 cards per row, grid
- **Desktop**: 4-5 cards per row, hover effects

---

## API Endpoints (RESTful)

### Decks
```
GET    /api/decks                    # List decks (paginated, filtered)
POST   /api/decks                    # Create new deck
GET    /api/decks/:id                # Get deck details
PUT    /api/decks/:id                # Update deck
DELETE /api/decks/:id                # Delete deck
POST   /api/decks/:id/clone          # Clone deck to own collection
GET    /api/decks/:id/versions       # Get version history
POST   /api/decks/:id/rollback       # Rollback to version
```

### Collaborations
```
GET    /api/decks/:id/collaborators      # List collaborators
POST   /api/decks/:id/collaborators      # Invite collaborator
DELETE /api/decks/:id/collaborators/:uid # Remove collaborator
PATCH  /api/decks/:id/collaborators/:uid # Update role
```

### Suggestions
```
GET    /api/decks/:id/suggestions         # List suggestions
POST   /api/decks/:id/suggestions         # Create suggestion
GET    /api/suggestions/:suggestionId     # Get suggestion details
PATCH  /api/suggestions/:suggestionId     # Update status (approve/reject)
DELETE /api/suggestions/:suggestionId     # Delete suggestion
```

### Cards
```
GET    /api/cards                   # Search cards (Scryfall proxy)
GET    /api/cards/:scryfallId       # Get card details
GET    /api/cards/random            # Random card (for inspiration)
```

### User
```
GET    /api/user/profile            # Current user profile
PATCH  /api/user/profile            # Update profile
GET    /api/user/decks              # User's decks
GET    /api/user/favorites          # Favorited decks
GET    /api/user/collaborations     # Collaborative decks
GET    /api/user/notifications      # Notifications
```

---

## Data Models (Prisma Schema)

### Core Entities
```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  image         String?
  createdAt     DateTime @default(now())
  
  decks         Deck[]
  suggestions   Suggestion[]
  collaborations Collaboration[]
  comments      Comment[]
  likes         DeckLike[]
}

model Deck {
  id              String   @id @default(cuid())
  name            String
  description     String?
  commanderId     String   // Scryfall ID
  commanderName   String
  colorIdentity   String[] // ["W", "U", "B", "R", "G"]
  cards           Json     // Array of {scryfallId, quantity, category}
  isPublic        Boolean  @default(true)
  tags            String[]
  
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  collaborators   Collaboration[]
  suggestions     Suggestion[]
  versions        DeckVersion[]
  comments        Comment[]
  likes           DeckLike[]
  
  viewCount       Int      @default(0)
  likeCount       Int      @default(0)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId, isPublic])
  @@index([colorIdentity])
}

model Collaboration {
  id        String   @id @default(cuid())
  role      String   // "owner" | "editor" | "viewer"
  
  deckId    String
  deck      Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  createdAt DateTime @default(now())
  
  @@unique([deckId, userId])
}

model Suggestion {
  id            String   @id @default(cuid())
  description   String
  type          String   // "optimization" | "budget" | "theme" | "combo"
  status        String   @default("pending") // "pending" | "approved" | "rejected" | "implemented"
  
  changes       Json     // {add: [...], remove: [...], swap: [{from, to}]}
  
  deckId        String
  deck          Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
  
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
  
  discussion    Comment[]
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([deckId, status])
}

model DeckVersion {
  id          String   @id @default(cuid())
  versionNum  Int
  changes     Json     // What changed
  changeType  String   // "create" | "edit" | "suggestion_merge" | "rollback"
  
  deckId      String
  deck        Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
  
  authorId    String
  
  createdAt   DateTime @default(now())
  
  @@index([deckId, versionNum])
}

model Comment {
  id            String      @id @default(cuid())
  content       String
  
  authorId      String
  author        User        @relation(fields: [authorId], references: [id])
  
  deckId        String?
  deck          Deck?       @relation(fields: [deckId], references: [id], onDelete: Cascade)
  
  suggestionId  String?
  suggestion    Suggestion? @relation(fields: [suggestionId], references: [id], onDelete: Cascade)
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  @@index([deckId])
  @@index([suggestionId])
}

model DeckLike {
  id        String   @id @default(cuid())
  
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  
  deckId    String
  deck      Deck     @relation(fields: [deckId], references: [id], onDelete: Cascade)
  
  createdAt DateTime @default(now())
  
  @@unique([userId, deckId])
}
```

---

## Out of Scope for MVP

### Explicitly NOT Included
- ❌ **Deck Testing/Simulator**: Playtesting with probability calculators
- ❌ **AI Suggestions**: ML-powered card recommendations
- ❌ **Video Content**: Embedded gameplay or deck techs
- ❌ **Trading/Marketplace**: Buying/selling cards
- ❌ **Tournament Tracking**: Event results and standings
- ❌ **Mobile Apps**: Native iOS/Android (PWA only)
- ❌ **Real-time Collaboration**: Live editing like Google Docs
- ❌ **Advanced Analytics**: Deep deck statistics and meta analysis
- ❌ **Collection Management**: Personal card inventory tracking
- ❌ **Custom Card Printing**: Proxy generation
- ❌ **Deck Ratings/Reviews**: Star ratings or formal reviews
- ❌ **Private Messaging**: DMs between users (use comments only)
- ❌ **Deck Tournaments**: Organized play features
- ❌ **Internationalization**: English only for MVP

### Considered for Post-MVP (Phase 4+)
- 🔮 **Deck Forking**: Create independent copies with link to original
- 🔮 **Suggestion Templates**: Reusable change patterns
- 🔮 **Activity Feed**: Social feed of deck updates
- 🔮 **Deck Tags & Archetypes**: Categorization system
- 🔮 **Budget Tracking**: Total deck cost from TCGPlayer/CK
- 🔮 **Deck Comparison**: Side-by-side deck diff tool
- 🔮 **Advanced Filters**: Complex search queries
- 🔮 **API for Third Parties**: Public API for integrations
- 🔮 **Webhooks**: Discord/Slack notifications

---

## Success Metrics

### Launch Targets (3 Months Post-MVP)
- **User Acquisition**
  - 1,000 registered users
  - 500 active deck builders (created ≥1 deck)
  - 20% month-over-month growth
- **Engagement**
  - 2,500 decks created
  - 200 collaborative decks (with ≥2 collaborators)
  - 500 suggestions submitted
  - 60% suggestion approval rate
  - Average 3.5 sessions per user per week
- **Technical**
  - 99.5% uptime
  - <2s page load time (95th percentile)
  - <5% error rate on API calls
  - 80+ Lighthouse performance score

### Key Performance Indicators (KPIs)
- **Daily Active Users (DAU)**: Target 15% of registered users
- **Deck Creation Rate**: 2.5 decks per active user
- **Collaboration Rate**: 20% of decks have collaborators
- **Suggestion Throughput**: Average 48h from submit to review
- **Retention**: 40% 7-day retention, 25% 30-day retention

---

## Development Timeline

### Week 1-3: Foundation
- [ ] Project setup (Next.js 15, TypeScript, Tailwind v4)
- [ ] Authentication (NextAuth v5, providers)
- [ ] Database schema (Prisma, migrations)
- [ ] Card search API integration (Scryfall)
- [ ] Basic deck builder UI
- [ ] Card display components
- [ ] Deck validation logic

### Week 4-5: Discovery
- [ ] Deck gallery with filters
- [ ] Deck details page
- [ ] Like/clone functionality
- [ ] Comments system
- [ ] User profiles
- [ ] Search optimization
- [ ] Image caching strategy

### Week 6-8: Collaboration
- [ ] Collaboration invite system
- [ ] Role management
- [ ] Suggestion creation UI
- [ ] Suggestion review workflow
- [ ] Version history
- [ ] Diff visualization
- [ ] Notification system
- [ ] Mobile responsive polish

### Week 9: Polish & Launch
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Error boundaries
- [ ] Loading states
- [ ] Empty states
- [ ] User onboarding flow
- [ ] Documentation
- [ ] Beta testing
- [ ] Production deployment

---

## Risk Assessment

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Scryfall API rate limits | High | Implement aggressive caching, queue system |
| Large deck image loading | Medium | Lazy loading, WebP format, CDN |
| Concurrent edit conflicts | High | Optimistic locking, conflict resolution UI |
| Database performance at scale | Medium | Proper indexing, query optimization, read replicas |

### Product Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Low adoption of collaboration | High | Strong onboarding, clear value prop, templates |
| Suggestion spam/abuse | Medium | Rate limiting, reporting system, moderation tools |
| Complex UX overwhelming users | Medium | Progressive disclosure, guided tours, tooltips |
| Competition from established tools | High | Focus on unique collaboration angle, better UX |

---

## Go-to-Market Strategy

### Launch Channels
1. **Reddit**: r/EDH, r/CompetitiveEDH posts showcasing collaboration
2. **Discord**: MTG Commander servers, announce in deck-building channels
3. **YouTube**: Partner with Commander content creators for reviews
4. **Twitter/X**: Tweet deck showcases, use #MTGCommander hashtag
5. **Magic: The Gathering Forums**: Official WotC forums announcement

### Launch Content
- **Blog Post**: "Version Control for Your Commander Decks"
- **Video Tutorial**: "Building Your First Collaborative Deck"
- **Sample Decks**: Pre-built collaborative decks showing workflow
- **Infographic**: "How Deck Suggestions Work"

### Early Adopter Incentives
- "Founding Builder" badge for first 100 users
- Featured deck spotlight for early high-quality submissions
- Priority support during beta period

---

## Conclusion

This MVP focuses on the core value proposition: **collaborative, version-controlled deck building**. By combining traditional deck construction with git-inspired workflows, EDH Builder differentiates itself in a crowded market.

The phased approach ensures we ship a complete, polished experience in each phase rather than half-baked features. The mobile-first, responsive design ensures accessibility across devices, critical for a community-focused platform.

**Next Steps**:
1. Review and approve this MVP spec
2. Create detailed UI mockups for key flows
3. Set up project infrastructure (repo, CI/CD, staging)
4. Begin Phase 1 development
5. Weekly progress reviews and iteration

**Questions to Resolve Before Development**:
- Which OAuth providers are highest priority? (Recommend: Google + Discord)
- Should we implement real-time notifications or email-only for MVP?
- What's our hosting budget for image CDN? (Affects storage strategy)
- Do we need GDPR compliance for EU users? (Affects data retention)
