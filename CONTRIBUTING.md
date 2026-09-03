# Contributing to MediKiosk

Thank you for your interest in contributing to MediKiosk! This document provides guidelines and instructions for contributing to the project.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on improving patient care and healthcare accessibility
- Follow medical ethics and data privacy guidelines

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git
- Code editor (VS Code recommended)

### Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/medikiosk-frontend.git
cd medikiosk-frontend

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/medikiosk-frontend.git
```

### Install Dependencies
```bash
npm install
```

### Setup Development Environment
```bash
# Copy environment template
cp .env.example .env.local

# Configure your local database
# Edit .env.local with your settings

# Push database schema
npx drizzle-kit push

# Run development server
npm run dev
```

---

## Development Workflow

### 1. Create a Branch
```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Convention
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 2. Make Changes

#### Code Style
- Use TypeScript for all new code
- Follow existing code patterns
- Use Tailwind CSS for styling
- Add comments for complex logic
- Keep functions small and focused

#### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Type definitions
interface MyComponentProps {
  title: string;
  onSubmit: () => void;
}

// 3. Component
export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [state, setState] = useState<string>('');

  const handleClick = () => {
    // Handler logic
  };

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### Naming Conventions
- Components: PascalCase (`PatientQueue.tsx`)
- Functions: camelCase (`handleSubmit`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- Files: kebab-case for utilities (`api-client.ts`)

### 3. Test Your Changes
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build test
npm run build

# Run development server and manually test
npm run dev
```

### 4. Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add patient queue filtering"
# or
git commit -m "fix: resolve token generation race condition"
```

#### Commit Message Format
```
<type>: <short description>

<optional longer description>

<optional footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add Ayurveda question bank support"
git commit -m "fix: prevent duplicate token generation"
git commit -m "docs: update API client documentation"
```

### 5. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request
1. Go to your fork on GitHub
2. Click "Pull Request"
3. Select base: `main` and compare: `feature/your-feature-name`
4. Fill in PR template:
   - Description of changes
   - Related issue number (if applicable)
   - Screenshots (for UI changes)
   - Testing performed

---

## What to Contribute

### High-Priority Areas
- 🌍 **Language Support** - Add new language translations
- ♿ **Accessibility** - Improve screen reader support, keyboard navigation
- 📱 **Mobile Optimization** - Better responsive design
- 🧪 **Testing** - Add unit tests, integration tests
- 📊 **Performance** - Optimize bundle size, load times
- 🎨 **UI/UX** - Enhance visual design, user flows

### Feature Requests
Before implementing a new feature:
1. Open an issue describing the feature
2. Wait for maintainer feedback
3. Get approval before starting work
4. Reference the issue in your PR

### Bug Reports
When reporting bugs:
1. **Search existing issues** first
2. Provide:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Browser/OS info
   - Error messages/logs

### Documentation
- Fix typos and grammar
- Add missing documentation
- Improve code examples
- Update outdated information

---

## Project Structure Guidelines

### Adding New Pages
```bash
# Create page in app router
src/app/your-page/page.tsx
```

### Adding New Components
```bash
# Reusable UI components
src/components/ui/your-component.tsx

# Feature-specific components
src/components/kiosk/your-component.tsx
src/components/doctor/your-component.tsx
src/components/admin/your-component.tsx
```

### Adding New API Routes
```bash
# Create API route
src/app/api/your-route/route.ts
```

### Adding Database Tables
1. Update schema: `src/db/schema.ts`
2. Push changes: `npx drizzle-kit push`
3. Document in README

---

## Testing Guidelines

### Manual Testing Checklist
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Test with different screen sizes
- [ ] Test with keyboard navigation
- [ ] Test with screen reader (NVDA, VoiceOver)
- [ ] Test in high-contrast mode

### Unit Testing (Future)
We plan to add Jest/Vitest for unit testing. Example:
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

---

## Design System

### Colors
- Primary: Blue (`bg-blue-600`)
- Success: Green (`bg-green-600`)
- Warning: Orange (`bg-orange-600`)
- Error: Red (`bg-red-600`)
- Neutral: Gray (`bg-gray-900`, `text-gray-600`)

### Typography
- Headings: `font-bold`
- Body: `font-normal`
- Labels: `font-medium`
- Code: `font-mono`

### Spacing
- Use Tailwind spacing scale: `p-4`, `m-6`, `gap-8`
- Consistent padding: `p-6` for cards, `p-8` for sections

### Components
- Buttons: Use `<Button>` from `@/components/ui/button`
- Forms: Large inputs with clear labels
- Cards: Rounded corners `rounded-xl`, shadow `shadow-lg`

---

## Review Process

### What We Look For
- ✅ Code follows existing patterns
- ✅ No TypeScript errors
- ✅ Build succeeds
- ✅ UI is accessible
- ✅ Changes are well-documented
- ✅ Commit messages are clear

### Review Timeline
- Initial review: 1-3 days
- Follow-up reviews: 1-2 days
- Merge: After approval + passing CI

### After Approval
1. Maintainer may request changes
2. Make requested updates
3. Push to same branch
4. Re-review happens automatically
5. Once approved, maintainer merges

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Questions?

- 📧 Email: sih26047@example.com
- 💬 GitHub Issues: For technical questions
- 📖 Documentation: Check README.md and DEPLOYMENT.md first

---

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project credits

Thank you for contributing to MediKiosk and improving healthcare accessibility in India! 🙏

---

**Last Updated:** 2026  
**Version:** 1.0
