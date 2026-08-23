# Changelog

All notable changes to Trakka are recorded in this changelog

## [0.5.1] Hotfix: Optimising DB calls and serving content - 2026-08-23

Reduction in DB calls to optimise for cost

### Fixed

- Reduced image sizes
- Reduced number of authentication calls
- Reduced database queries scope to only content that is required
- Reduced Sentry monitoring frequency

## [0.5.0] Onboarding, SEO, Sessions Logging - 2026-08-10

A big update to the onboarding process making it more interactive. Session logging now includes Cooperative games, Solo games and Expansions. New site content for improved SEO.

### Added

- New onboarding process. Some sections are still WIP
- Favourite games management on user’s account
- Major SEO content overhaul
- Cooperative, Solo games and Expansions logging (Note: Results are only viewable on Recent Games currently)
- PostHog integration for site analytics

### Changed

- Filled in content on FAQ page. Accessible from main landing page

### Fixed

- Sidebar no longer reloads on every navigation
- Logged in users no longer see a loading spinner and a flash of the landing page when accessing the site
- Caching correctly applied to filtered views on Recent Games page
- Improved security and reduced duplicated auth checks on certain pages
- Missing thumbnails on certain games
- Newly added SuperAdmins now receive existing notifications from the tribe. Converse logic applies for removed SuperAdmins

## [0.4.0] Anonymous Users - 2026-07-19

### Added

- Create anonymous user when adding new sessions. Anonymous users are tagged to each tribe
- Ability to claim anonymous users by existing members
- Ability to record sessions where there is a team variant

### Changed

- Redesigned Tribe settings page with anonymous user management
- Redesigned player Accounts page including placeholder features
- Removed Settings from player context menu
- Team mode games render with different design on recent games
- Added new filters for competitive vs. cooperative games and rated vs unrated games (note: no function to input cooperative games or unrated games at the moment yet)

### Fixed

- Field indicators when user does not enter details during session creation
- Newly added sessions do not immediately show up on the Recent Games page due to cache invalidation error
- Changed pagination data pulling logic on Recent Games to improve performance
- UI fix for dashboard view on mobile: Timeframe container no longer spills over

## [0.3.0] Landing Page - 2026-07-01

### Added

- “Edit mode” button allows SuperAdmins and Admins to edit games in their tribes that they were not a part of
- You can now login with your username

### Changed:

- Redesigned landing page
- Create new tribe popup now sets user as the default SuperAdmin and has new default tribe image

### Fixed

- Loading spinner no longer appears on every site navigation
- Tribe sharing link no longer deletes when a new user signs up using it
- Image uploader now stores images in .webp, and new default avatars for player selection

## [0.2.0] Fixes - 2026-06-16

### Added

- Introduce caching to improve site performance
- Redesigned “Recent Games” page

### Changed

- Activity log content now links to tribe that you joined or session that you played
- README for repo updated
- Tribes: Popular games cards now link to respective game on Games tab

### Fixed

- Improved performance by switching to smaller images on searches
- Recent Games: Filter calculations now make sense
- Create Session: Recent tribe bubbles now displays the most recent tribes the user added sessions to
- Create Session: Player dropdown now automatically shows when player field is selected
- Tribes: Games tab search bars now no longer automatically open keyboard when clicked
- Tribes: Recent sessions now displays the latest session at the top
- Tribes: Recent sessions date for yesterday was showing as “-1 day”
- Tribes: Recent sessions removed game icon on mobile view
- Tribes: Recent sessions increased the threshold for game name truncation on desktop view

## [0.1.0] Feature Ready - 2026-05-10

### Changed

- Redesigned “Complexity vs. Win Rate” chart
- Tribes “Player Stats” tab, Recent sessions now shows all games played
- Tribe invite links are now reusable. Not unique to each individual invited
- Tribe invite inbox now provides live updates

### Fixed

- UI fixes to tribes pages
- Updated error with calculated WPA on games before 20 Feb 2026
- Error page previously could not redirect back to homepage or dashboard

---

## [0.0.7] Complete Tribes View - 2026-04-16

### Added

- Users can now edit sessions from recent games page
- Dashboard page updated to follow the same design language as rest of the site
- Games view on Tribes page

### Fixed

- Create session page no longer allows you to select the same user twice
- H2H tribes view now removes player when clearing the search
- Tribe notifications only show 1 dot on mobile view
- Sidebar tribes now arranged in alphabetical order
- Tribe complexity chart not showing properly rendering players
- WPA over time chart was covering the player legend
- Player award badges popover appear to the left instead of above now
- Stopped game junction tables from adding new entries if game already exists
- Number increasing animation now displays decimal places

### Changed

- Search bar in sidebar now works to filter joined tribes
- Removed collapsible tribes in sidebar and made the create tribe button more obvious
- Tribe players Win Rate over time graph now uses historical snapshot rather than point in time calculations
- Removed star rating component from Recent Games

---

## [0.0.6] Tribe Stats - 2026-03-26

### Added

- Tribe statistics are LIVE!
- New Stats cards for “Gaming Hours” and “Unique Games” for tribes
- New complexity vs. win rate graph for tribes
- New historical sessions displaying sessions played broken down by complexity and player count
- New pie chart displaying sessions played broken down by complexity and player count
- New metric WPA for tribes

### Fixed

- Changed colour of tribe settings button on dark mode to something more visible
- Recent games tiebreakers in non-winners places ordered wrongly
- Optimised BGG search bar to show loading when user changes query
- Update conflicting logic for tiebreakers for creating sessions

### Changed

- New design for activity log
- Leaderboard in tribes only shows players who have at least 4 games played
- Leaderboard and Recent Games sections in tribes are now scrollable and show more is hidden until the bottom
- Changed the medal colours and added a tag to indicate your position on the leaderboard in tribes

### Security

- Performed deep security scan

---

## [0.0.5] New Tribes Page - 2026-02-20

### Added

- New Tribes page
- Added top loading bar to indicate when pages are loading
- Updated site theme to match new colour scheme
- Error and 404 pages
- Site optimisation

### Fixed

- Adding a new session now triggers notification in activity log for all involved players
- Adding a new session now redirects to “/recent-games”
- Adding a new session disables the Save button to prevent multiple submissions
- Footer was not appearing at the bottom for some pages
- Positions for new sessions were not accounting for ties

### Changed

- Changed how positions and ties are displayed
- Replaced position icons on dashboard recent games to “dice style” number of players
- Changed player input to new version in New Tribe Creation and Edit Tribes
- Game names now scrollable in “Game Performance” on Dashboard

---

## [0.0.4] Revamp New Session - 2026-01-24

### Added

- Revamped the look and basic functionality for creating a new session
- New "Session Added" and "Tribe Request Result" notifications for users
- (placeholder) Global search bar replaces "Welcome To ..." message

### Fixed

- Group icons on sidebar now fully circle
- Scaling issues on tribe profile pictures cropped to center
- Plus symbol for create tribe icon in sidebar fixed on light mode
- Prevent tribes from being automatically created when selecting default profile pictures in tribe creation window
- Request to join tribe page now disables upon clicking to prevent - multiple requests from being sent
- Footer is no longer blocked by sidebar

### Changed

- Unified tribe sharing button to header, removed sharing button from individual tribes page
- Tribe selection in sidebar will show notification symbol for tribe requests
- Notifications for users is now an "Activity Log"
- Changed "Lost" on Recent Games and Recent Activity components to reflect position in the game
- Homepage now redirects to dashboard if user is logged in
- Reduced padding on mobile view for more real estate

---

## [0.0.3] - 2025-12-24

### Added

- Generic invite button to join site
- Group invite button with custom link for users to request to join group
- Rate sessions using star rating system on Recent Games page
- Feedback button at bottom right

### Fixed

- Unable to scroll on tribe creation dialog window
- Mobile site for tribe and user pages
- Mobile site optimisation for group creation dialogue and player control component
- Unable to remove users from tribes

### Changed

- Default avatars for tribes
- Button to create new tribe on sidebar close

### Security

- Upgraded NEXT to 15.4.10 due to security vulnerability

---

## [0.0.2] - 2025-12-04

### Added

- Tribes - Create tribes for gaming groups and management
- User Profile - Update your user profile

### Fixed

- When adding a new session, limit groups to only those where users have at least "Editor" permission
- Added checkbox for exact match for games

### Changed

- Added group information to recent games

### Security

- Upgraded NEXT to 15.4.8 due to security vulnerability

---

## [0.0.1] - 2025-10-29

### Added

- Authentication with Email and Password
- Session logging with BGG game details and scores
- Recent games tracker with time frame filter
- User performance dashboard with game results
