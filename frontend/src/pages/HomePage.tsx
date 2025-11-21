import { useEffect, useState } from "react";
import api from "../api";

const HomePage = () => {
    const [message, setMessage] = useState<string>("Cargando estado del backend...");

    useEffect(() => {
        api
            .get("/")
            .then((res) => {
                setMessage(res.data);
            })
            .catch((err) => {
                console.error(err);
                setMessage("Error conectando con el backend");
            });
    }, []);

    return (
        <div>
            <h1>Bienvenido al Gestor de Exámenes Ocupacionales</h1>
            <div
                style={{
                    marginTop: "2rem",
                    padding: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                }}
            >
                <h3>Status de conexión con backend:</h3>
                <pre style={{ background: "#f5f5f5", padding: "0.5rem" }}>{message}</pre>
            </div>
        </div>
    );
};

export default HomePage;
