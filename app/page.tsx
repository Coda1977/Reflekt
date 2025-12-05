export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="section-container">
        <div className="section-inner text-center">
          <h1 className="text-hero mb-6">
            Reflekt
          </h1>
          <p className="text-body max-w-2xl mx-auto mb-10">
            Digital workbook platform for organizational consultants. Create, distribute, and manage reflective workbooks for your clients.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
