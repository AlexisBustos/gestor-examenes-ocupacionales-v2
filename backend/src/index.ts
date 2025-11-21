import app from "./config/app";
import healthRouter from "./routes/health.routes";

const PORT = process.env.PORT || 3000;

// Rutas
app.use("/health", healthRouter);

// Mantener ruta raíz existente
app.get("/", (req, res) => {
  res.send("Backend funcionando correctamente 🚀");
});

// Documentación de estructura (comentario)
/*
  Estructura del Backend:
  - src/config: Configuración de la app (Express, CORS, Env)
  - src/routes: Definición de rutas (endpoints)
  - src/controllers: Lógica de negocio de los endpoints
  - src/services: Lógica compleja y acceso a datos
  - src/middlewares: Middlewares personalizados
*/

app.listen(PORT, () => {
  console.log(`Servidor backend iniciado en puerto ${PORT}`);
});
