# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.2] - 2025-03-21

### Changed
- Moved SSE clients to a shared module for better code organization
- Improved type safety in API routes
- Enhanced error handling across the application

### Fixed
- Type errors in upload route
- SSE client management and cleanup
- Version number display in sidebar

## [3.2.1] - 2025-04-27

### Fixed
- Dropdown disables for already uploaded photo/video numbers now work reliably on /upload
- TypeScript type for UploadedItem now matches API response (type, number)
- Dropdown disables are checked on initial page load and after upload
- Improved reliability of upload page with Vercel Blob and Neon DB integration

## [3.2.0] - 2025-04-27

### Added
- Previous/Next navigation controls to media modal in team review
- Keyboard navigation for modal (left/right arrows, Escape to close)
- Instructional text for team review page
- Click-outside-to-close functionality for modal

### Changed
- Navigation controls now appear just outside the displayed media, not overlapping
- Improved modal layout and accessibility
- Responsive and visually enhanced navigation controls
- Improved grid layout and dropdown alignment on upload page

### Fixed
- Disabled dropdown options for already uploaded items on upload page
- Media counter in modal now displays correct values
- Navigation controls no longer overlap media content

## [3.0.0] - 2025-03-22

### Added
- Modal view for full-size media display
- Instructional text for user interaction
- Separate sections for photos and videos in team review

### Changed
- Reorganized team media grid layout to 5 columns
- Improved media organization with categorized sections
- Enhanced user interface with clear section headers
- Updated heading to include "Team" prefix

## [2.0.0] - 2025-03-21

### Added
- Team management functionality
- File upload system with validation
- Authentication system with JWT
- Database integration with Neon DB
- Admin dashboard interface
- Branding customization features

### Changed
- Updated to Next.js 15.3.1
- Improved error handling across API routes
- Enhanced security measures
- Optimized database queries

### Fixed
- Authentication token handling
- CORS configuration
- File upload validation
- Database connection issues

## [1.0.0] - 2025-03-20

### Added
- Initial project setup
- Basic Next.js application structure
- Database schema implementation
- Core API routes
- Basic UI components

[2.0.0]: https://github.com/yourusername/slideshow/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/yourusername/slideshow/releases/tag/v1.0.0

## [2.0.0] - 2025-04-25

### Added
- New API endpoint `/api/team-items` to fetch uploaded items for a team
- Enhanced upload page with disabled items functionality
- Visual indicators for already uploaded photos and videos
- Improved error handling with custom `UploadError` class
- Type safety improvements with dedicated types file
- Progress component for better upload status visualization

### Changed
- Darkened sidebar background for better contrast
- Updated database connection configuration for Vercel environment
- Improved team selection and item number selection UI
- Enhanced error messages and user feedback
- Refactored code organization for better maintainability

### Fixed
- Team names not populating in dropdown
- Photo and video number items not being disabled when already uploaded
- Database connection issues in serverless environment
- Type safety issues with PostgreSQL errors
- Error handling consistency across the application

### Security
- Improved SSL configuration for database connections
- Enhanced error handling to prevent information leakage

## [1.8.2] - 2025-04-24

### Changed
- Improved database reset functionality with proper table ordering
- Enhanced error handling in database operations
- Updated table truncation approach to work with limited permissions
- Implemented dependency-aware table clearing using information schema

### Fixed
- Database reset issues in production environment
- Permission-related errors during database operations
- Table dependency handling during reset operations
- Error logging and reporting in database management

## [1.7.0] - 2025-04-24

### Changed
- Reverted repository to commit `3e8120e` to address stability issues
- Updated package dependencies to latest versions
- Added new dependencies:
  - @vercel/blob for enhanced file handling
  - ts-node for TypeScript execution
- Enhanced package-lock.json with additional modules and their respective versions

### Technical Details
- Reset point includes improved package management
- Maintains core functionality with enhanced dependencies
- Preserves TypeScript execution capabilities

## [1.6.3] - 2025-03-21

### Changed
- Version bump to trigger Vercel deployment
- Updated database connection handling
- Improved environment variable configuration

## [1.6.2] - 2025-03-21

### Fixed
- Database URL parsing issues
- Environment variable configuration
- Deployment pipeline improvements

## [1.6.1] - 2025-03-21

### Added
- Automatic version management system
  - Version updates based on commit messages
  - Version information display in application
  - Build-time version generation
- Database migration system
  - Production-safe migration script
  - Vercel deployment support
  - Environment-aware table creation

### Changed
- Database schema consolidation
  - Moved schema initialization to migration script
  - Improved table creation order
  - Added proper foreign key constraints
- Build process updates
  - Added version update step to build process
  - Integrated database migration into build
  - Added Vercel configuration

### Fixed
- Database initialization issues
  - Fixed team_id column references
  - Corrected table creation order
  - Resolved schema conflicts
- Version management
  - Added proper version tracking
  - Improved build information display
  - Enhanced error handling

## [1.6.0] - 2025-03-20

### Added
- Team-based functionality
  - Team creation and management
  - Team-specific media items
  - Team settings and preferences
- Enhanced media management
  - Improved upload handling
  - Better file type validation
  - Progress tracking

### Changed
- UI improvements
  - Modern gradient-based design
  - Enhanced navigation
  - Better mobile responsiveness
- Database structure
  - Added teams table
  - Updated media items schema
  - Improved settings management

### Fixed
- Authentication issues
- Media upload errors
- Database connection problems

## [1.5.0] - 2025-03-19

### Added
- Initial release
  - Basic slideshow functionality
  - Media upload support
  - User authentication
  - Admin panel
  - Settings management

[1.6.1]: https://github.com/yourusername/slideshow/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/yourusername/slideshow/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/yourusername/slideshow/releases/tag/v1.5.0

## [1.4.0] - 2025-03-21

### Added
- Background image upload functionality with automatic resizing to 1920x1080
- Image preview popup for media items in the review page
- Enhanced database initialization with proper table creation
- Improved error handling and logging across API routes
- Better UI feedback for uploads and operations

### Changed
- Updated database connection handling to use connection pool properly
- Improved file upload validation and error messages
- Enhanced media API routes with better error handling and response formatting
- Updated admin interface with better organization and user feedback
- Improved image and video handling in the review page

### Fixed
- Fixed database connection issues in API routes
- Resolved image preview functionality in the review page
- Corrected table column references in SQL queries
- Fixed file path handling for uploaded media
- Improved error handling for missing files and database operations

### Security
- Enhanced error messages to avoid exposing sensitive information
- Improved file type validation for uploads
- Better handling of database connection credentials

## [1.3.1] - Previous Version
- Initial release with basic functionality

## [1.3.3] - 2025-03-20

### Added
- Admin panel with secure login
- Logo management system (upload main and side logos)
- Delete all media functionality with confirmation modal
- File upload security features
  - File type validation
  - File size limits
  - Filename sanitization
- JWT-based authentication for admin routes
- Responsive sidebar/navigation
- Play/pause controls for slideshow
- Volume controls with mute functionality
- Version number display in sidebar
- Tooltips for navigation items
- Mobile and tablet responsive design
- Team name normalization (removing "team" prefix/suffix)
- Standard case formatting for team names

### Security
- Input sanitization for file uploads
- Secure password handling
- Protected admin routes
- JWT token implementation
- Secure cookie handling
- File type restrictions
- File size limitations

### Changed
- Updated sidebar to be 75px wide
- Improved navigation with icon-only design
- Enhanced mobile/tablet layout
- Optimized media controls placement
- Reorganized sidebar layout for better mobile experience
- Grouped play/pause and volume controls in mobile view
- Added menu-branding container for logos and version
- Implemented 90-degree rotation for menu-branding on mobile/tablet

### Fixed
- Controlled input handling in admin panel
- File input reset functionality
- Navigation tooltip positioning
- Mobile layout issues
- Authentication state management
- Logo sizing and positioning issues
- Sidebar layout consistency across devices
- Menu-branding container positioning

## [1.1.0] - 2025-03-21
### Added
- Added version number display in sidebar
- Implemented version API endpoint
- Added photo and video number tracking in database
- Added uploaded items tracking to prevent duplicate uploads
- Enhanced slideshow overlay with team name and item information

## [0.1.0] - 2025-03-20
### Added
- Initial release
- Basic slideshow functionality
- Media upload system
- Admin panel for configuration
- Team-based media organization

## [3.1.0] - 2025-05-04

### Changed
- Improved slideshow media responsiveness and layout for all devices
- Ensured images and videos are always contained within the viewport
- Centered media items vertically and horizontally on desktop
- Fixed video controls overflowing on mobile landscape
- Unified and modernized caption and team name display
- Updated versioning system to ensure sidebar always shows the correct version

### Fixed
- Addressed gaps and overflow issues between navigation, media, and captions
- Resolved issues with media sizing on both mobile and desktop
- Fixed version number not updating automatically in the sidebar 