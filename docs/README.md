# Journal AI Documentation

Welcome to the Journal AI comprehensive documentation. This documentation covers all aspects of the project, from installation and setup to development, deployment, and security.

## Documentation Index

### Getting Started
- **[Overview](overview.md)** - Project overview, features, and use cases
- **[Installation Guide](installation.md)** - Step-by-step installation instructions
- **[User Guide](user-guide.md)** - How to use the application

### Technical Documentation
- **[Architecture](architecture.md)** - System architecture and design decisions
- **[API Reference](api-reference.md)** - Complete API documentation
- **[Database Schema](database-schema.md)** - Database structure and relationships
- **[Development Guide](development.md)** - Development setup and guidelines
 - **[PWA Guide](pwa.md)** - Install UX, splash, offline, and assets
 - **[Testing Guide](testing.md)** - Playwright setup and coverage

### Mobile App
- **[Mobile App](mobile-app.md)** - Android client overview and features
- **[Mobile Notifications](mobile-notifications.md)** - Notification architecture and debugging
- **[Mobile Build & Release](mobile-build-release.md)** - Building APKs and staging downloads
- **[Mobile Quick Start](mobile-quickstart.md)** - Fast setup and verification

### Planning
- **[Improvement Plan](improvement-plan.md)** - Ideas and suggestions for future work

### Operations
- **[Deployment Guide](deployment.md)** - Production deployment instructions
- **[Security](security.md)** - Security best practices and considerations
- **[Troubleshooting](troubleshooting.md)** - Common issues and solutions

### Contributing
- **[Contributing Guide](contributing.md)** - How to contribute to the project

## Quick Links

- [Gitea Repository](http://10.0.0.129:3000/charles/journal-ai)
- [Main README](../README.md)
- [Docker Compose Configuration](../docker-compose.yml)

### PWA & Testing
- PWA: install button in menu, maskable icons, offline app shell, animated splash (5s minimum)
- E2E tests (Playwright): run `cd frontend && npx playwright install && npm run test:e2e`

## Support

For issues or questions:
- Check the [Troubleshooting Guide](troubleshooting.md)
- Review backend logs: `docker compose logs backend`
- Review frontend logs: `docker compose logs frontend`

---

**💙 Remember**: This journal is your safe space. Write freely, reflect honestly, and be kind to yourself.

