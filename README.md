# Structo - Project Management Application

## Quick Start

### Backend
```bash
cd backend
npm install
npm run seed:roles
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Environment Variables

**backend/.env**
```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

**frontend/.env**
```
REACT_APP_API_URL=http://localhost:4200
PORT=4200
```
