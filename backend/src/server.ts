import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import router from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// CLAVE: Montar rutas con prefijo /api
app.use('/api', router);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
