import cors from 'cors';
import express from 'express';

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Stacc Escali API is running.'
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
