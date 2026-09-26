import { createApp } from './app';
import { initializeDatabase } from './db/repository';

const port = Number(process.env.PORT ?? 3000);
const database = initializeDatabase();
const app = createApp(database);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});
