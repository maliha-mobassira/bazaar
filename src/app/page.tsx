import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main style={{ padding: "40px" }}>
      <h1>Welcome to Bazaar 🚀</h1>
      <p>Production-Grade Multi-Tenant POS SaaS</p>
      <div style={{ marginTop: "20px" }}>
        <ThemeToggle />
      </div>
    </main>
  );
}