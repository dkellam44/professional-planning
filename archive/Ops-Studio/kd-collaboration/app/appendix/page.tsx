export const metadata = {
  title: "Appendix — KD Collaboration Pitch"
};

export default async function AppendixPage() {
  return (
    <main className="px-4 py-10 space-y-10 max-w-5xl mx-auto">
      {/* Page Title */}
      <h1 className="font-display text-5xl lg:text-7xl text-plum mb-8">Appendix</h1>

      {/* PDF Downloads Section */}
      <section id="downloads" className="bg-lavender/20 p-6 lg:p-8 rounded-2xl border-l-4 border-gold">
        <h2 className="font-display text-2xl md:text-3xl text-plum mb-6">Downloadable Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profile PDF */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-gold hover:shadow-md transition-all">
            <div className="text-4xl mb-3">📄</div>
            <h3 className="text-xl font-bold text-plum mb-2">David Kellam Profile</h3>
            <p className="text-sm text-charcoal/80 mb-4">Professional background and approach</p>
            <a
              href="/appendix/david-kellam-profile.pdf"
              download
              className="inline-block px-6 py-2 bg-plum text-white rounded-full font-semibold text-sm hover:scale-105 transition-all duration-150"
            >
              Download PDF
            </a>
          </div>

          {/* Resume PDF */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-plum hover:shadow-md transition-all">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-plum mb-2">Resume</h3>
            <p className="text-sm text-charcoal/80 mb-4">Career summary and accomplishments</p>
            <a
              href="/appendix/david-kellam-resume.pdf"
              download
              className="inline-block px-6 py-2 bg-plum text-white rounded-full font-semibold text-sm hover:scale-105 transition-all duration-150"
            >
              Download PDF
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
