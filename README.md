# Slideshow Application

A modern, responsive slideshow application built with Next.js, designed for team-based media presentations. This application provides a seamless experience for uploading, managing, and displaying team photos and videos in a professional slideshow format.

## Features

### Media Management
- Team-based media organization
- Support for both photos and videos
- Automatic media randomization
- Responsive media display across all devices
- Centered media items with proper aspect ratio maintenance
- Unified caption and team name display

### Upload System
- Secure file upload with validation
- Duplicate upload prevention
- Progress tracking
- File type and size restrictions
- Team-specific upload tracking
- Visual indicators for uploaded items

### User Interface
- Modern, gradient-based design
- Responsive sidebar/top navigation
- Mobile and tablet optimized layout
- Play/pause controls
- Volume controls with mute functionality
- Keyboard navigation support
- Tooltips for better UX

### Admin Features
- Secure admin panel
- Logo management system
- Media deletion with confirmation
- Team management
- Settings configuration
- Version tracking

## Technical Stack

- **Framework**: Next.js 15.3.1
- **Language**: TypeScript
- **Database**: Neon DB (PostgreSQL)
- **Storage**: Vercel Blob
- **Authentication**: JWT
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **File Handling**: @vercel/blob
- **Rate Limiting**: @upstash/ratelimit

## Getting Started

### Prerequisites
- Node.js (Latest LTS version)
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
Edit `.env.local` with your configuration values.

4. Run the development server:
```bash
npm run dev
```

### Environment Variables

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token
- `JWT_SECRET`: Secret for JWT authentication
- `NEXT_PUBLIC_API_URL`: API URL for the application

## Deployment

The application is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/yourusername/slideshow/tags).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and blob storage
- Neon DB for serverless PostgreSQL
- All contributors who have helped shape this project

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

Built with ❤️ using Next.js
