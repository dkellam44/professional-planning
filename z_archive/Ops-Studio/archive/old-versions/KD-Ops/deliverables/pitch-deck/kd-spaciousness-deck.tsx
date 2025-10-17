import React from 'react';

const SlideDecay = () => {
  const slides = [
    // Slide 1: Title / Presence
    {
      bg: '#FAF8F3',
      content: (
        <div className="flex flex-col items-center justify-center h-full px-20 text-center">
          <div className="mb-4">
            <h1 className="text-6xl mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
              David Kellam
            </h1>
            <p className="text-lg" style={{ color: '#2B2B2B', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
              Operations Support for KamalaDevi Creative
            </p>
          </div>
          
          <div className="w-24 h-px my-8" style={{ backgroundColor: '#D4B483' }}></div>
          
          <h2 className="text-5xl leading-tight mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '500' }}>
            Creating Spaciousness<br/>Through Structure
          </h2>
          
          <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center gap-2" style={{ color: '#2B2B2B', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>
            <span style={{ color: '#812D6B', fontSize: '18px' }}>✒️</span>
            <span>dkellam44@gmail.com • cal.com/davidkellam • San Diego, CA</span>
          </div>
        </div>
      )
    },
    
    // Slide 2: Alignment & Intent
    {
      bg: '#FAF8F3',
      content: (
        <div className="h-full px-16 py-12">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
            Why I'm Called to This Work
          </h2>
          
          <div className="grid grid-cols-5 gap-8">
            <div className="col-span-3" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '1.8', color: '#2B2B2B' }}>
              <p className="mb-6">
                I bring structure to creative vision—designing systems that support flow, not control it. My work lives at the intersection of operations and transformation, where logistics becomes a practice of care and efficiency creates space for emergence.
              </p>
              
              <p className="mb-6">
                With 15+ years across nonprofits, education, and creative sectors, I bring both technical precision and relational intelligence. I work best with mission-driven leaders who value integrity, emergence, and sustainable growth.
              </p>
              
              <p>
                My superpower? Seeing what's working, what's not, and designing the bridges between vision and execution that allow teams to thrive.
              </p>
            </div>
            
            <div className="col-span-2 flex items-center">
              <div className="p-8 rounded-lg" style={{ backgroundColor: '#D8A7C4' }}>
                <p className="text-center italic" style={{ fontFamily: 'Crimson Text, serif', fontSize: '16px', lineHeight: '1.6', color: '#2B2B2B' }}>
                  "Cultivating spaciousness and momentum for creative work."
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 3: How I Help
    {
      bg: '#FAF8F3',
      content: (
        <div className="h-full px-16 py-12">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
            How I Help — Systems That Learn and Support
          </h2>
          
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #D4B483' }}>
            <table className="w-full" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#812D6B', color: '#FAF8F3' }}>
                  <th className="text-left p-4 font-semibold">Focus</th>
                  <th className="text-left p-4 font-semibold">Outcome</th>
                  <th className="text-left p-4 font-semibold">Tools</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#EAE2D7' }}>
                  <td className="p-4">
                    <span style={{ color: '#D4B483', marginRight: '8px' }}>📋</span>
                    <strong>Project Coordination</strong>
                  </td>
                  <td className="p-4">Timelines met, clear communication</td>
                  <td className="p-4">Asana, Notion, Coda</td>
                </tr>
                <tr style={{ backgroundColor: '#FAF8F3' }}>
                  <td className="p-4">
                    <span style={{ color: '#D4B483', marginRight: '8px' }}>⚙️</span>
                    <strong>Systems Design</strong>
                  </td>
                  <td className="p-4">Repeatable workflows that scale</td>
                  <td className="p-4">Airtable, Make, Zapier</td>
                </tr>
                <tr style={{ backgroundColor: '#EAE2D7' }}>
                  <td className="p-4">
                    <span style={{ color: '#D4B483', marginRight: '8px' }}>🤝</span>
                    <strong>Team Support</strong>
                  </td>
                  <td className="p-4">Capacity freed for creative work</td>
                  <td className="p-4">Slack, Google Workspace</td>
                </tr>
                <tr style={{ backgroundColor: '#FAF8F3' }}>
                  <td className="p-4">
                    <span style={{ color: '#D4B483', marginRight: '8px' }}>📊</span>
                    <strong>Process Optimization</strong>
                  </td>
                  <td className="p-4">Friction reduced, flow restored</td>
                  <td className="p-4">Custom workflows, SOPs</td>
                </tr>
                <tr style={{ backgroundColor: '#EAE2D7' }}>
                  <td className="p-4">
                    <span style={{ color: '#D4B483', marginRight: '8px' }}>🎯</span>
                    <strong>Strategic Planning</strong>
                  </td>
                  <td className="p-4">Vision aligned with execution</td>
                  <td className="p-4">Quarterly planning, OKRs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    
    // Slide 4: Engagement Pathways
    {
      bg: '#FAF8F3',
      content: (
        <div className="h-full px-16 py-12">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
            How We Can Begin
          </h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-lg p-6 flex flex-col" style={{ border: '2px solid #812D6B', backgroundColor: '#FAF8F3' }}>
              <div className="text-4xl mb-4" style={{ color: '#D4B483' }}>⚡</div>
              <h3 className="text-xl mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
                Starter Sprint
              </h3>
              <p className="mb-4 flex-grow" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: '1.6', color: '#2B2B2B' }}>
                2 weeks intensive: audit current systems, identify quick wins, implement 2-3 foundational workflows
              </p>
              <div className="text-2xl font-semibold" style={{ color: '#D4B483', fontFamily: 'Inter, sans-serif' }}>
                $1,200–$1,500
              </div>
              <div className="text-xs mt-1" style={{ color: '#2B2B2B', fontFamily: 'Inter, sans-serif' }}>fixed investment</div>
            </div>
            
            <div className="rounded-lg p-6 flex flex-col" style={{ border: '2px solid #812D6B', backgroundColor: '#FAF8F3' }}>
              <div className="text-4xl mb-4" style={{ color: '#9BA88C' }}>🌿</div>
              <h3 className="text-xl mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
                Ongoing Partnership
              </h3>
              <p className="mb-4 flex-grow" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: '1.6', color: '#2B2B2B' }}>
                Monthly retainer: continuous optimization, project coordination, team support, systems evolution
              </p>
              <div className="text-2xl font-semibold" style={{ color: '#9BA88C', fontFamily: 'Inter, sans-serif' }}>
                $1,800–$2,200/mo
              </div>
              <div className="text-xs mt-1" style={{ color: '#2B2B2B', fontFamily: 'Inter, sans-serif' }}>10-15 hrs/week</div>
            </div>
            
            <div className="rounded-lg p-6 flex flex-col" style={{ border: '2px solid #812D6B', backgroundColor: '#FAF8F3' }}>
              <div className="text-4xl mb-4" style={{ color: '#A8518A' }}>🌈</div>
              <h3 className="text-xl mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
                Fractional COO
              </h3>
              <p className="mb-4 flex-grow" style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', lineHeight: '1.6', color: '#2B2B2B' }}>
                Strategic leadership: full operational oversight, team coordination, long-term systems architecture
              </p>
              <div className="text-2xl font-semibold" style={{ color: '#A8518A', fontFamily: 'Inter, sans-serif' }}>
                Custom
              </div>
              <div className="text-xs mt-1" style={{ color: '#2B2B2B', fontFamily: 'Inter, sans-serif' }}>15-25 hrs/week</div>
            </div>
          </div>
          
          <div className="mt-8 text-center" style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#2B2B2B', fontStyle: 'italic' }}>
            All engagements begin with a discovery call to ensure alignment and co-create the right pathway
          </div>
        </div>
      )
    },
    
    // Slide 5: Metrics of Relief
    {
      bg: '#EAE2D7',
      content: (
        <div className="h-full px-16 py-12">
          <h2 className="text-4xl mb-10" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
            Markers of Spaciousness
          </h2>
          
          <div className="mb-10" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '2', color: '#2B2B2B' }}>
            <div className="mb-4 flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '16px' }}>✓</span>
              <span><strong>Creative time reclaimed:</strong> Leadership spends 40%+ more time on visionary work</span>
            </div>
            <div className="mb-4 flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '16px' }}>✓</span>
              <span><strong>Decision velocity:</strong> Routine decisions happen without you; strategic ones are teed up clearly</span>
            </div>
            <div className="mb-4 flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '16px' }}>✓</span>
              <span><strong>Team clarity:</strong> Everyone knows what's next, who owns what, and where to find resources</span>
            </div>
            <div className="mb-4 flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '16px' }}>✓</span>
              <span><strong>Sustainable momentum:</strong> Projects complete on time; growth feels energizing, not exhausting</span>
            </div>
          </div>
          
          <div className="flex justify-center mt-12">
            <div className="max-w-2xl p-8 rounded-lg" style={{ backgroundColor: '#FAF8F3', border: '1px solid #D4B483' }}>
              <p className="text-center italic text-lg" style={{ fontFamily: 'Crimson Text, serif', lineHeight: '1.7', color: '#812D6B' }}>
                "The value isn't how much I do—<br/>it's how much creative time we free up."
              </p>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 6: Why I'm a Fit
    {
      bg: '#FAF8F3',
      content: (
        <div className="h-full px-16 py-12">
          <h2 className="text-4xl mb-8" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600', borderBottom: '2px solid #812D6B', paddingBottom: '12px' }}>
            Why This Collaboration Feels Right
          </h2>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-6" style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', lineHeight: '1.8', color: '#2B2B2B' }}>
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Relational approach:</strong> I design for humans, not just efficiency. Systems should support the people using them.
              </div>
            </div>
            
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Creative fluency:</strong> I understand how artists and visionaries work—the rhythms, the needs, the creative process.
              </div>
            </div>
            
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Systems thinking:</strong> I see patterns and create sustainable solutions that evolve with you.
              </div>
            </div>
            
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Integrity-driven:</strong> Work is a spiritual practice, not just deliverables. I care about doing right by people.
              </div>
            </div>
            
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Adaptive leadership:</strong> I shift between strategic thinking and tactical execution, comfortable with emergence.
              </div>
            </div>
            
            <div className="flex items-start">
              <span style={{ color: '#9BA88C', marginRight: '12px', fontSize: '18px', flexShrink: 0 }}>✦</span>
              <div>
                <strong style={{ color: '#812D6B' }}>Learning orientation:</strong> I continuously refine systems based on feedback, treating iteration as a feature.
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Slide 7: Call to Action
    {
      bg: '#FAF8F3',
      content: (
        <div className="h-full px-16 py-12 flex flex-col justify-center">
          <h2 className="text-5xl mb-10 text-center" style={{ fontFamily: 'Playfair Display, serif', color: '#812D6B', fontWeight: '600' }}>
            Let's Begin the Next Chapter
          </h2>
          
          <div className="max-w-2xl mx-auto mb-10" style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: '1.8', color: '#2B2B2B', textAlign: 'center' }}>
            <p>
              If you're ready to create more spaciousness for your creative work, I'd love to explore what collaboration might look like. Whether you're looking for a quick systems audit or deeper operational partnership, let's start with a conversation about what would serve you best.
            </p>
          </div>
          
          <div className="flex justify-center gap-6 mb-8">
            <button className="px-8 py-4 rounded-lg text-base font-semibold transition-all" 
                    style={{ 
                      backgroundColor: '#812D6B', 
                      color: '#FAF8F3',
                      fontFamily: 'Inter, sans-serif',
                      border: 'none',
                      cursor: 'pointer'
                    }}>
              📅 Schedule a Discovery Call
            </button>
            
            <button className="px-8 py-4 rounded-lg text-base font-semibold transition-all" 
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: '#812D6B',
                      fontFamily: 'Inter, sans-serif',
                      border: '2px solid #812D6B',
                      cursor: 'pointer'
                    }}>
              📧 dkellam44@gmail.com
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="h-px flex-grow" style={{ backgroundColor: '#D4B483', maxWidth: '200px' }}></div>
            <span style={{ color: '#812D6B', fontSize: '24px' }}>✒️</span>
            <div className="h-px flex-grow" style={{ backgroundColor: '#D4B483', maxWidth: '200px' }}></div>
          </div>
        </div>
      )
    }
  ];

  const [currentSlide, setCurrentSlide] = React.useState(0);

  return (
    <div className="w-full min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Slide Container - A4 Portrait ratio */}
        <div 
          className="relative shadow-2xl mx-auto overflow-hidden"
          style={{ 
            width: '595px',  // A4 width in pixels at 72 DPI
            height: '842px', // A4 height in pixels at 72 DPI
            backgroundColor: slides[currentSlide].bg
          }}
        >
          {slides[currentSlide].content}
        </div>
        
        {/* Navigation */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button 
            onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
            disabled={currentSlide === 0}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          
          <span className="text-sm font-medium" style={{ color: '#812D6B' }}>
            Slide {currentSlide + 1} of {slides.length}
          </span>
          
          <button 
            onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
            disabled={currentSlide === slides.length - 1}
            className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
        
        {/* Export Instructions */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow" style={{ border: '1px solid #D4B483' }}>
          <p className="text-sm mb-2" style={{ fontFamily: 'Inter, sans-serif', color: '#2B2B2B' }}>
            <strong style={{ color: '#812D6B' }}>To export:</strong> Use your browser's Print function (Ctrl/Cmd + P), 
            select "Save as PDF", and set margins to None. Navigate through all 7 slides and print each one separately, 
            or use a PDF merge tool.
          </p>
          <p className="text-xs" style={{ fontFamily: 'Inter, sans-serif', color: '#9BA88C' }}>
            For a fully editable version, I recommend recreating this in Canva or Google Slides using these exact specifications.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SlideDecay;