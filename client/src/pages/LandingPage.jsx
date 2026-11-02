import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  SearchCode,
  Sliders,
  SplitSquareVertical,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Zap,
} from 'lucide-react';
import { AnimatedShaderHero } from '../components/AnimatedShaderHero.jsx';

export function LandingPage() {
  const navigate = useNavigate();

  const handleStartRefining = () => {
    navigate('/app/workspace');
  };

  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: SearchCode,
      title: 'Intelligent Prompt Analysis',
      description:
        'Diagnose prompt blind spots including contextual ambiguity, missing edge-case constraints, and under-specified persona definitions.',
      badge: 'Diagnostics',
      color: 'violet',
    },
    {
      icon: Sliders,
      title: 'AI-Powered Refinement',
      description:
        'Generate 3 distinct structural variations: Balanced, Detailed, and Concise, optimized for maximum LLM adherence.',
      badge: 'Generation',
      color: 'cyan',
    },
    {
      icon: SplitSquareVertical,
      title: 'Side-by-Side Execution',
      description:
        'Simultaneously execute both original and refined prompt variants through the Gemini LLM engine to benchmark real-world results.',
      badge: 'Comparison',
      color: 'violet',
    },
    {
      icon: BarChart3,
      title: 'LLM Evaluation & Insights',
      description:
        'Automated scoring across Relevance, Clarity, Completeness, and Instruction Adherence with qualitative analysis summaries.',
      badge: 'Evaluation',
      color: 'cyan',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Analyze',
      subtitle: 'Identify Weaknesses',
      description:
        'Submit your raw prompt. Our diagnostic pipeline checks clarity, context density, constraints, and instructions.',
    },
    {
      number: '02',
      title: 'Refine',
      subtitle: 'Synthesize Optimized Prompts',
      description:
        'Gemini constructs 3 high-impact prompt variations tailored to your specific objective and required depth.',
    },
    {
      number: '03',
      title: 'Compare',
      subtitle: 'Benchmark Output Quality',
      description:
        'Inspect side-by-side LLM responses and review multi-dimensional evaluation metrics to confirm superiority.',
    },
  ];

  return (
    <div style={{ backgroundColor: '#09090F', color: '#f8fafc', minHeight: '100vh' }}>
      {/* Animated WebGL Shader Hero with integrated Nav extending over continuous canvas */}
      <AnimatedShaderHero
        onStartRefining={handleStartRefining}
        onExploreFeatures={handleExploreFeatures}
      />

      {/* Feature Grid Section */}
      <section id="features" style={{ padding: 'var(--spacing-3xl) 0', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-3xl)' }}>
            <span className="badge badge-violet" style={{ marginBottom: '0.75rem' }}>
              Engineered for Precision
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              Every Prompt, Elevated by Intelligence.
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Move beyond trial-and-error prompt crafting. Use structured LLM diagnostics to produce measurable output improvements.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-lg)',
            }}
          >
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              const isCyan = feat.color === 'cyan';
              return (
                <div
                  key={idx}
                  className="surface card-interactive"
                  style={{
                    padding: 'var(--spacing-xl)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '120px',
                      height: '120px',
                      background: isCyan
                        ? 'radial-gradient(circle at top right, rgba(34, 211, 238, 0.1) 0%, transparent 70%)'
                        : 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />

                  <div>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCyan ? 'rgba(34, 211, 238, 0.12)' : 'rgba(139, 92, 246, 0.12)',
                        border: `1px solid ${isCyan ? 'rgba(34, 211, 238, 0.25)' : 'rgba(139, 92, 246, 0.25)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 'var(--spacing-lg)',
                        color: isCyan ? '#22d3ee' : '#8b5cf6',
                      }}
                    >
                      <Icon size={22} />
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.65rem', color: '#ffffff' }}>
                      {feat.title}
                    </h3>

                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {feat.description}
                    </p>
                  </div>

                  <div style={{ marginTop: 'var(--spacing-lg)' }}>
                    <span className={isCyan ? 'badge badge-cyan' : 'badge badge-violet'}>
                      {feat.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section
        id="how-it-works"
        style={{
          padding: 'var(--spacing-3xl) 0',
          backgroundColor: '#0c0c14',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto var(--spacing-3xl)' }}>
            <span className="badge badge-cyan" style={{ marginBottom: '0.75rem' }}>
              Systematic Methodology
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                marginBottom: '1rem',
              }}
            >
              Analyze → Refine → Compare
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
              A seamless, three-step prompt engineering loop designed for reliable AI production performance.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--spacing-xl)',
            }}
          >
            {steps.map((st, i) => (
              <div
                key={i}
                className="surface-elevated"
                style={{
                  padding: 'var(--spacing-xl)',
                  borderRadius: 'var(--radius-md)',
                  position: 'relative',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div
                  style={{
                    fontSize: '2.5rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'rgba(139, 92, 246, 0.25)',
                    marginBottom: 'var(--spacing-sm)',
                    lineHeight: 1,
                  }}
                >
                  {st.number}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                  {st.title}
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#22d3ee', fontWeight: 600, marginBottom: '0.75rem' }}>
                  {st.subtitle}
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {st.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: 'var(--spacing-3xl) 0', textAlign: 'center' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <div
            className="surface-glass"
            style={{
              padding: 'var(--spacing-2xl)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              boxShadow: 'var(--shadow-glow-violet)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#ffffff' }}>
              Ready to Upgrade Your AI Prompts?
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', marginBottom: 'var(--spacing-xl)', lineHeight: 1.6 }}>
              Enter your prompt into the workspace, inspect real-time diagnosis, and see the difference structured prompt engineering makes.
            </p>
            <button
              onClick={handleStartRefining}
              className="btn btn-lg btn-accent"
              style={{ gap: '0.65rem', fontWeight: 600 }}
            >
              <span>Launch Prompt Workspace</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--color-border)',
          padding: 'var(--spacing-xl) 0',
          backgroundColor: '#07070B',
          fontSize: '0.875rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="#8b5cf6" />
            <span style={{ fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.02em' }}>Prompify</span>
          </div>
          <div>React 18 &bull; Express.js &bull; Google Gemini &bull; Supabase Ready</div>
        </div>
      </footer>
    </div>
  );
}

