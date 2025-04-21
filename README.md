# Slideshow Application

A modern, team-based media slideshow application with admin controls and secure file management.

## Features

### Media Management
- Team-based media organization
- Photo and video support
- Automatic file type validation
- Secure file uploads with size limits
- Duplicate upload prevention
- Image preview functionality
- Background image customization

### Admin Features
- Secure login system
- Team management
- Logo customization (main, side, and horizontal logos)
- Background image upload with automatic resizing
- Media review and management
- Database management tools
- Version tracking

### User Interface
- Responsive design for all devices
- Modern, clean interface
- Image preview popup
- Play/pause controls
- Volume controls with mute
- Team name display
- Item information overlay

### Security
- JWT-based authentication
- Protected admin routes
- Secure file upload validation
- Input sanitization
- Secure password handling
- Protected database operations

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd slideshow
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory with the following variables:
```env
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
ADMIN_PASSWORD=your_admin_password
NEXT_PUBLIC_MAX_FILE_SIZE=10485760 # 10MB
NEXT_PUBLIC_ALLOWED_IMAGE_TYPES=image/jpeg,image/png
NEXT_PUBLIC_ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg,video/quicktime
```

4. Initialize the database:
```bash
npm run dev
# The application will automatically create necessary tables
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## Usage

### Admin Panel
1. Access the admin panel at `/admin`
2. Log in with your credentials
3. Manage teams, upload media, and customize branding

### Media Upload
1. Select a team
2. Choose files to upload
3. Files will be automatically validated and processed
4. View uploaded media in the review section

### Branding
1. Upload logos (main, side, horizontal)
2. Set background image
3. Customize team names
4. Configure media counts

## Development

### Project Structure
```
slideshow/
├── app/
│   ├── api/           # API routes
│   ├── components/    # React components
│   ├── lib/          # Utility functions
│   └── public/       # Static files
├── prisma/           # Database schema
└── types/            # TypeScript types
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Version

Current version: 1.4.0

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.
