# Contributing Guide

Thank you for your interest in contributing to Journal AI! This guide will help you get started.

## How to Contribute

### Reporting Bugs

**Before reporting**:
- Check existing issues on GitHub
- Search closed issues for similar reports
- Reproduce the issue locally

**When reporting**:
- Provide clear description
- Include steps to reproduce
- Attach relevant logs
- Specify environment (OS, Docker version, etc.)
- Add screenshots if applicable

**Bug report template**:

```markdown
**Description**
Clear description of the bug

**Steps to Reproduce**
1. Step one
2. Step two
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Windows 10]
- Docker: [e.g., 24.0]
- Browser: [e.g., Chrome 120]

**Logs**
```
Paste relevant logs here
```

**Additional Context**
Any other relevant information
```

### Suggesting Features

**Feature request template**:

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why this feature would be useful

**Proposed Solution**
How it could be implemented

**Alternatives**
Other solutions you've considered

**Additional Context**
Any other relevant information
```

### Contributing Code

**Getting started**:

1. **Fork the repository**

2. **Create a feature branch**:

```bash
git checkout -b feature/my-feature
```

3. **Make your changes**

4. **Test thoroughly**

5. **Commit your changes**:

```bash
git commit -m "Add: feature description"
```

6. **Push to your fork**:

```bash
git push origin feature/my-feature
```

7. **Create Pull Request**

### Code Standards

#### JavaScript/Node.js

- Use ES6+ syntax
- Follow existing code style
- Add comments for complex logic
- Use meaningful variable names
- Handle errors properly

```javascript
// ✅ Good
const createEntry = async (title, content) => {
  try {
    const response = await axios.post('/api/entries', { title, content });
    return response.data;
  } catch (err) {
    console.error('Error creating entry:', err);
    throw err;
  }
};

// ❌ Bad
const fn = async (t, c) => {
  try { return (await axios.post('/api/entries', {title:t, content:c})).data; }
  catch (e) { console.log(e); }
};
```

#### React

- Use functional components
- Use hooks properly
- Keep components focused
- Extract reusable logic

```javascript
// ✅ Good
const EntryCard = ({ entry, onDelete }) => {
  const handleDelete = () => {
    if (confirm('Delete entry?')) {
      onDelete(entry.id);
    }
  };
  
  return (
    <div className="entry-card">
      <h3>{entry.title}</h3>
      <p>{entry.content}</p>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
};

// ❌ Bad
class EntryCard extends React.Component {
  // Too verbose for simple components
}
```

#### SQL

- Use parameterized queries
- No hard-coded values
- Add indexes for performance

```javascript
// ✅ Good
await pool.query('SELECT * FROM entries WHERE id = $1', [entryId]);

// ❌ Bad
await pool.query(`SELECT * FROM entries WHERE id = ${entryId}`);
```

### Commit Messages

**Format**:

```
Type: Description

Optional longer description
```

**Types**:
- `Add`: New feature
- `Fix`: Bug fix
- `Update`: Changes to existing code
- `Remove`: Removing code/features
- `Docs`: Documentation updates
- `Style`: Code style changes
- `Refactor`: Code refactoring
- `Test`: Adding tests
- `Chore`: Maintenance tasks

**Examples**:

```bash
git commit -m "Add: Voice-to-text transcription"
git commit -m "Fix: Email sending for Gmail accounts"
git commit -m "Update: Improve AI response quality"
git commit -m "Docs: Add deployment guide"
```

### Pull Request Guidelines

**Before submitting**:

- [ ] Code follows existing style
- [ ] Tests pass (if applicable)
- [ ] No linter errors
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] Changes are documented

**PR template**:

```markdown
## Description
What this PR does

## Changes Made
- Changed X to Y
- Added Z feature
- Fixed bug in A

## Testing
How to test these changes

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Development Setup

See [Development Guide](development.md) for setup instructions.

### Testing

**Test your changes**:

```bash
# Backend tests (if applicable)
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Manual testing
# Start services and test all features
docker-compose up
```

### Documentation

**Update documentation** for:

- New features
- Changed behavior
- New dependencies
- Configuration changes
- API changes

### Issues and Discussions

**Good issues to work on**:

- Labeled "good first issue"
- Labeled "help wanted"
- Recent bugs
- Priority features

**Ask questions**:

- GitHub Discussions
- Open an issue
- Check existing documentation

## Code of Conduct

### Our Standards

**Positive behavior**:
- Welcoming and inclusive
- Respectful of differing opinions
- Graceful acceptance of criticism
- Focus on community benefit

**Unacceptable behavior**:
- Harassment or discrimination
- Personal attacks
- Inappropriate comments
- Other unprofessional conduct

### Enforcement

Violations can result in:
- Warning
- Temporary ban
- Permanent ban

### Reporting Issues

Contact project maintainers privately to report violations.

## Project Structure

```
journal-ai/
├── backend/           # Express API
├── frontend/          # React app
├── nginx/             # Reverse proxy
├── docs/              # Documentation
├── docker-compose.yml # Orchestration
└── README.md          # Main readme
```

## Areas for Contribution

### High Priority

- [ ] User authentication
- [ ] Multi-user support
- [ ] Dark mode
- [ ] Entry search improvements
- [ ] Export to PDF
- [ ] Mobile app (React Native)

### Medium Priority

- [ ] Entry tags
- [ ] Entry categories
- [ ] Photo attachments
- [ ] Mood tracking
- [ ] Reminders
- [ ] Analytics dashboard

### Low Priority

- [ ] Themes
- [ ] Custom AI prompts
- [ ] Entry templates
- [ ] Collaboration features
- [ ] Integration with other services

### Documentation

- [ ] API documentation
- [ ] More examples
- [ ] Video tutorials
- [ ] Deployment guides
- [ ] Testing guides

### Infrastructure

- [ ] CI/CD pipeline
- [ ] Automated testing
- [ ] Docker optimization
- [ ] Performance improvements
- [ ] Security enhancements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open an issue
- Start a discussion
- Contact maintainers

---

**Thank you for contributing! Your help makes this project better for everyone.** 💙

