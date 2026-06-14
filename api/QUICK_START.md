# 🚀 Negin Heal API - Quick Start Guide

## ✅ Installation Complete!

Your professional NestJS API is ready to use. Here's how to get started:

## 🏃‍♂️ Quick Start

### 1. Start MongoDB
```bash
# Option A: Using Homebrew (macOS)
brew services start mongodb-community

# Option B: Using Docker
docker run -d -p 27017:27017 --name negin-heal-mongo mongo:7.0

# Option C: Using Docker Compose (includes MongoDB + Mongo Express)
docker-compose up -d
```

### 2. Start the API
```bash
# Development mode (with hot reload)
npm run start:dev

# Or use the startup script
./start.sh
```

### 3. Test the API
```bash
# Test health endpoint
node test-api.js

# Or use curl
curl http://localhost:3000/api/v1/health
```

## 🌐 API Endpoints

### REST API
- **Base URL**: `http://localhost:3000/api/v1`
- **Health Check**: `GET /health`
- **Animals**: `GET|POST /animals`
- **Animal by ID**: `GET /animals/:id`

### GraphQL
- **Playground**: `http://localhost:3000/graphql`
- **Schema**: Auto-generated in memory

## 📊 Database Management

### MongoDB Compass (GUI)
- **Connection**: `mongodb://localhost:27017`
- **Database**: `negin-heal`

### Mongo Express (Web UI)
- **URL**: `http://localhost:8081` (if using Docker Compose)
- **Username**: `admin`
- **Password**: `admin`

## 🧪 Example API Calls

### Create an Animal (REST)
```bash
curl -X POST http://localhost:3000/api/v1/animals \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Whiskers",
    "species": "Mouse",
    "breed": "C57BL/6",
    "age": 6,
    "gender": "male",
    "healthStatus": "healthy",
    "tags": ["research", "experimental-group"]
  }'
```

### Get All Animals (REST)
```bash
curl "http://localhost:3000/api/v1/animals"
```

### GraphQL Query
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { animalList { _id name species healthStatus } }"
  }'
```

## 📁 Project Structure

```
api/
├── src/
│   ├── common/           # Shared utilities
│   ├── database/         # MongoDB schemas
│   ├── modules/          # Feature modules
│   │   ├── animal/       # Animal records
│   │   └── health/       # Health checks
│   ├── app.module.ts     # Root module
│   └── main.ts           # Entry point
├── examples/             # API examples
├── docker-compose.yml    # Docker setup
└── README.md            # Full documentation
```

## 🔧 Configuration

Edit `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/negin-heal
PORT=3000
NODE_ENV=development
```

## 📚 Documentation

- **Full README**: `README.md`
- **REST Examples**: `examples/rest-examples.http`
- **GraphQL Examples**: `examples/graphql-examples.md`
- **Docker Setup**: `docker-compose.yml`

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run start:dev
```

### Build Issues
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🎯 Next Steps

1. **Explore the API**: Use the GraphQL playground at `http://localhost:3000/graphql`
2. **Test REST endpoints**: Use the examples in `examples/rest-examples.http`
3. **Add your data**: Create animals and track their health
4. **Monitor**: Check health endpoint and logs
5. **Customize**: Modify schemas and add new features

## 🆘 Support

- Check the full `README.md` for detailed documentation
- Review `examples/` directory for usage patterns
- Check logs in `logs/app.log` for debugging

---

**🎉 Your Negin Heal API is ready for production use!**
