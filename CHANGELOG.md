# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2024-04-22

### Added
- Next.js Image component integration for optimized image loading
- Automatic image optimization and responsive sizing
- Improved LCP (Largest Contentful Paint) performance
- Enhanced image loading with priority loading for above-the-fold content
- Better image error handling and fallbacks

### Changed
- Replaced all `<img>` tags with Next.js `<Image>` components
- Updated background image handling to use Next.js Image component
- Improved image preview in admin panel
- Enhanced image loading performance across all pages
- Updated version number to follow semantic versioning standards

### Fixed
- Resolved LCP warnings for image loading
- Fixed image sizing issues in slideshow
- Improved image aspect ratio handling
- Enhanced responsive image behavior
- Fixed background image loading performance

## [1.5.0] - 2024-04-21

### Added
- Integrated authentication directly into admin panel
- Enhanced media upload tracking system
- Improved photo and video number selection interface
- Added visual indicators for uploaded items

### Changed
- Removed separate login page
- Updated middleware to protect only admin routes
- Improved database connection handling
- Enhanced error handling and logging

### Fixed
- Fixed database connection issues in API routes
- Corrected table name references in queries
- Improved response handling for uploaded items

## [1.4.0] - 2024-03-21

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

## [1.3.3] - 2024-03-20

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

## [1.1.0] - 2024-03-21
### Added
- Added version number display in sidebar
- Implemented version API endpoint
- Added photo and video number tracking in database
- Added uploaded items tracking to prevent duplicate uploads
- Enhanced slideshow overlay with team name and item information

## [0.1.0] - 2024-03-20
### Added
- Initial release
- Basic slideshow functionality
- Media upload system
- Admin panel for configuration
- Team-based media organization 