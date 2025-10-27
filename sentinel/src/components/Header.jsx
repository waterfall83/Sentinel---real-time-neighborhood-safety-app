export default function Header() {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "60px",
                backgroundColor: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                zIndex: 1000,
                fontWeight: "bold",
                fontSize: "18px",
            }}
        >
            Sentinel
        </div>
    );
}
