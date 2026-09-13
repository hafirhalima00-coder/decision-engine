import { app } from './server';

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Decision Engine running at http://localhost:${port}`);
});