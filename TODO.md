# TODO - Fix MongoDB connection

- [ ] Read current backend server entry and model expectations
- [ ] Patch `server.js` to use `process.env.MONGO_URI` via `dotenv` instead of localhost
- [ ] Add connection retry + proper logging
- [ ] Ensure server still exposes `/api/analyze` and `/api/history`
- [ ] Run lint / start server and verify connection

