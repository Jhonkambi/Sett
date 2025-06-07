const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'queries.json');

function readQueries() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (err) {
    console.error('Error reading data:', err);
    return [];
  }
}

function writeQueries(queries) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(queries, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing data:', err);
  }
}

function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

app.get('/api/queries', (req, res) => {
  const queries = readQueries();
  res.json(queries);
});

app.post('/api/queries', (req, res) => {
  const queries = readQueries();
  const newQuery = req.body;
  if (!newQuery) return res.status(400).json({ error: 'No query data provided' });
  newQuery.id = generateId();
  queries.push(newQuery);
  writeQueries(queries);
  res.status(201).json(newQuery);
});

app.put('/api/queries/:id', (req, res) => {
  const queries = readQueries();
  const queryId = req.params.id;
  const updatedQuery = req.body;

  const index = queries.findIndex(q => q.id === queryId);
  if (index === -1) return res.status(404).json({ error: 'Query not found' });

  queries[index] = { ...updatedQuery, id: queryId };
  writeQueries(queries);
  res.json(queries[index]);
});

app.delete('/api/queries/:id', (req, res) => {
  let queries = readQueries();
  const queryId = req.params.id;

  const initialCount = queries.length;
  queries = queries.filter(q => q.id !== queryId);

  if (queries.length === initialCount) return res.status(404).json({ error: 'Query not found' });

  writeQueries(queries);
  res.json({ message: 'Deleted successfully' });
});

app.post('/api/queries/deleteMany', (req, res) => {
  let queries = readQueries();
  const ids = req.body.ids;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids list' });

  queries = queries.filter(q => !ids.includes(q.id));
  writeQueries(queries);
  res.json({ message: 'Deleted selected queries' });
});

app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});

