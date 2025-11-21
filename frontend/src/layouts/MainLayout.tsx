import { Outlet, Link } from "react-router-dom";

const MainLayout = () => {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <header
                style={{
                    background: "#333",
                    color: "#fff",
                    padding: "1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>GEO v2</div>
                <nav>
                    <Link to="/" style={{ color: "#fff", marginRight: "1rem", textDecoration: "none" }}>
                        Home
                    </Link>
                    <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
                        Login
                    </Link>
                </nav>
            </header>
            <main style={{ flex: 1, padding: "2rem" }}>
                <Outlet />
            </main>
            <footer style={{ textAlign: "center", padding: "1rem", background: "#f0f0f0" }}>
                &copy; {new Date().getFullYear()} Gestor de Exámenes Ocupacionales
            </footer>
        </div>
    );
};

export default MainLayout;
