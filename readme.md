# Crypto Watcher (Assignment 3 Part 2)

Full-stack web application with MongoDB and CRUD functionality.

## Database
- MongoDB
- Database: `crypto_watcher`
- Collections:
  - `assets`
  - `contacts`

## Features
- Web UI доступен по `/`
- CRUD для assets через интерфейс (Create / Update / Delete)
- Contact form сохраняет сообщения в MongoDB
- Filtering, sorting, projection в API

## API Routes
### Assets
- GET `/api/assets`
- GET `/api/assets/:id`
- POST `/api/assets`
- PUT `/api/assets/:id`
- DELETE `/api/assets/:id`

### Contacts
- POST `/api/contacts`

## Environment Variables
Create `.env` locally (do not push to GitHub):
