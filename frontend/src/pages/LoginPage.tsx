import { useState } from "react";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert(`Login intentado con: ${email}`);
    };

    return (
        <div style={{ maxWidth: "400px", margin: "0 auto" }}>
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem" }}>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem" }}
                        required
                    />
                </div>
                <div>
                    <label style={{ display: "block", marginBottom: "0.5rem" }}>Contraseña:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ width: "100%", padding: "0.5rem" }}
                        required
                    />
                </div>
                <button type="submit" style={{ padding: "0.75rem", background: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>
                    Ingresar
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
