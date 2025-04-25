# Slideshow Application

A modern, team-based media management and slideshow application built with Next.js, TypeScript, and PostgreSQL.

## Features

### Media Management
- Team-based media organization
- Photo and video upload support
- Automatic file compression
- Duplicate upload prevention
- Progress tracking for uploads
- Visual indicators for uploaded items

### Slideshow
- Responsive design for all devices
- Automatic media playback
- Play/pause controls
- Volume management
- Team and item information display
- Optimized image loading

### Admin Features
- Secure admin panel
- Team management
- Media review and management
- Logo customization
- Version tracking
- Database management

### Security
- JWT-based authentication
- Secure file upload validation
- Protected admin routes
- SSL database connections
- Enhanced error handling

## Technical Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Storage**: Vercel Blob Store
- **Authentication**: JWT
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/slideshow.git
cd slideshow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your configuration:
- Database URL
- JWT secret
- Admin credentials
- Vercel Blob configuration

4. Initialize the database:
```bash
npm run db:init
```

5. Start the development server:
```bash
npm run dev
```

## Usage

### Admin Panel
1. Access the admin panel at `/admin`
2. Log in with admin credentials
3. Manage teams, media, and settings

### Uploading Media
1. Select a team from the dropdown
2. Choose photo or video number
3. Upload media files
4. Track upload progress
5. Review uploaded items

### Viewing Slideshow
1. Navigate to `/slideshow`
2. Media automatically plays in sequence
3. Use controls to pause/resume or adjust volume
4. View team and item information

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:init` - Initialize database
- `npm run db:reset` - Reset database (caution: deletes all data)

### Code Structure
```
app/
├── api/           # API routes
├── components/    # React components
├── types/         # TypeScript types
├── utils/         # Utility functions
├── admin/         # Admin pages
├── slideshow/     # Slideshow pages
└── upload/        # Upload pages
```

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository.
