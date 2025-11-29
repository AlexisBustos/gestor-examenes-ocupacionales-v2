import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes';
import batteriesRouter from './modules/batteries/batteries.routes';
import configRouter from './modules/config/config.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// CLAVE: Todas las rutas empezarán por /api
// Ejemplo real: http://localhost:3000/api/batteries
app.use('/api/batteries', batteriesRouter);
app.use('/api/config', configRouter);
app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});