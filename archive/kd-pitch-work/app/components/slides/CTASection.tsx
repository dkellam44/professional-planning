export default function CTASection({ h1, body, email, calendarUrl }: { h1: string; body: string; email: string; calendarUrl: string }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-4xl text-plum mb-6">{h1}</h2>
      <p className="max-w-2xl mx-auto mb-8">{body}</p>
      <div className="flex items-center justify-center gap-4">
        <a href={calendarUrl} className="px-6 py-3 rounded-lg bg-plum text-cream font-medium no-print">📅 Schedule a Discovery Call</a>
        <a href={`mailto:${email}`} className="px-6 py-3 rounded-lg border-2 border-plum text-plum font-medium no-print">📧 {email}</a>
      </div>
    </div>
  );
}
