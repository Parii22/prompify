import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';
import { LandingNav } from './LandingNav.jsx';

/**
 * Animated Shader Hero adapted to AI Prompt Refinement Assistant
 * Uses WebGL2 canvas with violet (#8B5CF6) and cyan (#22D3EE) deep space shader.
 */
export function AnimatedShaderHero({ onStartRefining, onExploreFeatures }) {
  const canvasRef = useRef(null);
  const [webglSupported, setWebglSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setWebglSupported(false);
      return;
    }

    let gl;
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglSupported(false);
      return;
    }

    const vsSource = `#version 300 es
    precision highp float;
    in vec4 position;
    void main() {
      gl_Position = position;
    }`;

    // Customized Violet / Cyan cosmic prompt matrix shader
    const fsSource = `#version 300 es
    precision highp float;
    out vec4 O;
    uniform vec2 resolution;
    uniform float time;
    uniform vec2 touch;
    uniform vec2 move;

    #define FC gl_FragCoord.xy
    #define T time
    #define R resolution
    #define MN min(R.x, R.y)

    float rnd(vec2 p) {
      p = fract(p * vec2(12.9898, 78.233));
      p += dot(p, p + 34.56);
      return fract(p.x * p.y);
    }

    float noise(in vec2 p) {
      vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
      float a = rnd(i);
      float b = rnd(i + vec2(1.0, 0.0));
      float c = rnd(i + vec2(0.0, 1.0));
      float d = rnd(i + 1.0);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    float fbm(vec2 p) {
      float t = 0.0, a = 1.0;
      mat2 m = mat2(1.0, -0.5, 0.2, 1.2);
      for (int i = 0; i < 5; i++) {
        t += a * noise(p);
        p *= 2.0 * m;
        a *= 0.5;
      }
      return t;
    }

    float clouds(vec2 p) {
      float d = 1.0, t = 0.0;
      for (float i = 0.0; i < 3.0; i++) {
        float a = d * fbm(i * 10.0 + p.x * 0.2 + 0.2 * (1.0 + i) * p.y + d + i * i + p);
        t = mix(t, d, a);
        d = a;
        p *= 2.0 / (i + 1.0);
      }
      return t;
    }

    void main(void) {
      vec2 uv = (FC - 0.5 * R) / MN;
      vec2 st = uv * vec2(2.0, 1.0);
      vec3 col = vec3(0.035, 0.035, 0.059); // Base dark #09090F

      float bg = clouds(vec2(st.x + T * 0.35, -st.y));
      uv *= 1.0 - 0.25 * (sin(T * 0.18) * 0.5 + 0.5);

      for (float i = 1.0; i < 11.0; i++) {
        uv += 0.09 * cos(i * vec2(0.1 + 0.01 * i, 0.8) + i * i + T * 0.35 + 0.1 * uv.x);
        vec2 p = uv;
        float d = length(p);

        // Violet-Cyan spectral harmonic oscillation
        col += 0.0013 / max(d, 0.001) * (cos(sin(i) * vec3(0.8, 1.8, 3.2)) + 1.0);
        float b = noise(i + p + bg * 1.5);
        col += 0.0018 * b / length(max(p, vec2(b * p.x * 0.02, p.y)));

        // Deep violet and electric cyan nebulae mix
        col = mix(col, vec3(bg * 0.14, bg * 0.08, bg * 0.28), d * 0.85);
      }

      O = vec4(clamp(col, 0.0, 1.0), 1.0);
    }`;

    const compileShader = (type, source) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.warn('Hero shader error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) {
      setWebglSupported(false);
      return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false);
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]),
      gl.STATIC_DRAW
    );

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    const resolutionLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');
    const touchLoc = gl.getUniformLocation(program, 'touch');
    const moveLoc = gl.getUniformLocation(program, 'move');

    let animationFrameId;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let mouse = [0, 0];
    let movement = [0, 0];

    const resize = () => {
      if (!canvas) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse = [(e.clientX - rect.left) * dpr, (rect.height - (e.clientY - rect.top)) * dpr];
      movement = [e.movementX || 0, e.movementY || 0];
    };

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    resize();

    const startTime = performance.now();
    let isDisposed = false;

    const render = (now) => {
      if (isDisposed) return;
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      gl.uniform2f(resolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(timeLoc, (now - startTime) * 0.001);
      gl.uniform2f(touchLoc, mouse[0], mouse[1]);
      gl.uniform2f(moveLoc, movement[0], movement[1]);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      if (gl) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      }
    };
  }, []);

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden',
        backgroundColor: '#09090F',
      }}
    >
      {/* WebGL Canvas fills 100% of hero including navbar background */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: webglSupported ? 0.95 : 0,
          transition: 'opacity 0.6s ease',
        }}
      />

      {/* Ambient Cosmic Atmosphere extending continuously behind navbar into hero */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 120% 75% at 50% 20%, rgba(139, 92, 246, 0.25) 0%, rgba(34, 211, 238, 0.12) 40%, rgba(9, 9, 15, 0.6) 75%, #09090F 100%)',
        }}
      />

      {/* Embedded Navbar sitting directly on top of continuous hero shader */}
      <LandingNav />

      {/* Hero Foreground Content */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          maxWidth: '960px',
          paddingTop: '110px',
          paddingBottom: 'var(--spacing-3xl)',
          margin: 'auto',
        }}
      >
        {/* Trust / Category Badge */}
        <div style={{ marginBottom: 'var(--spacing-lg)', display: 'inline-block' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.45rem 1rem',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              color: '#c4b5fd',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)',
            }}
          >
            <Sparkles size={15} style={{ color: '#22d3ee' }} />
            <span>AI-Powered Prompt Engineering Platform</span>
          </div>
        </div>

        {/* Primary Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.25rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: 'var(--spacing-lg)',
            color: '#f8fafc',
          }}
        >
          Turn Better Prompts Into <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #c4b5fd 0%, #8b5cf6 50%, #22d3ee 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 35px rgba(139, 92, 246, 0.35))',
            }}
          >
            Better AI Results.
          </span>
        </h1>

        {/* Supporting Subtitle */}
        <p
          style={{
            fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            maxWidth: '680px',
            margin: '0 auto var(--spacing-2xl)',
            fontWeight: 400,
          }}
        >
          Analyze, refine and compare your prompts with AI-powered intelligence.
          Diagnose weaknesses, generate optimized variants, and benchmark output quality side-by-side.
        </p>

        {/* Action CTAs */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--spacing-md)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <button
            onClick={onStartRefining}
            className="btn btn-lg btn-primary"
            style={{
              gap: '0.65rem',
              padding: '0.9rem 2.2rem',
              fontSize: '1.05rem',
              fontWeight: 600,
            }}
          >
            <span>Start Refining</span>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onExploreFeatures}
            className="btn btn-lg btn-secondary"
            style={{
              gap: '0.65rem',
              padding: '0.9rem 2rem',
              fontSize: '1.05rem',
            }}
          >
            <Compass size={18} style={{ color: 'var(--color-accent-secondary)' }} />
            <span>Explore Features</span>
          </button>
        </div>

        {/* Sub-CTA micro-copy */}
        <div
          style={{
            marginTop: 'var(--spacing-xl)',
            fontSize: '0.85rem',
            color: 'var(--color-text-faint)',
            display: 'flex',
            justifyContent: 'center',
            gap: 'var(--spacing-lg)',
            flexWrap: 'wrap',
          }}
        >
          <span>✓ Zero setup required</span>
          <span>✓ Side-by-side comparison</span>
          <span>✓ Multi-metric evaluation</span>
        </div>
      </div>
    </section>
  );
}

