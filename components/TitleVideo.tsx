"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Burning title clip for the result screen: the intro plays once, then a seamless loop.
 * The clips have a black background. Each frame is drawn through WebGL, which turns the black
 * transparent (brightness becomes alpha). That works in every browser, iPhone Safari included,
 * unlike transparent video formats or CSS blend modes. Without WebGL, the video is shown with a
 * CSS screen blend; if a clip can't play at all, `fallback` (the CSS fire text) is shown.
 */
export function TitleVideo({ slug, label, fallback }: { slug: string; label: string; fallback: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "loop">("intro");
  const [failed, setFailed] = useState(false);
  const [noGl, setNoGl] = useState(false);
  const vid = useRef<HTMLVideoElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);

  // WebGL drawing loop (runs for both the intro and the loop video).
  useEffect(() => {
    const canvas = cvs.current;
    if (!canvas || noGl) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setNoGl(true);
      return;
    }
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 p;varying vec2 u;void main(){u=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}"));
    gl.attachShader(
      prog,
      sh(
        gl.FRAGMENT_SHADER,
        // alpha from brightness; colour stays as is (premultiplied), which looks like a "screen" blend
        "precision mediump float;varying vec2 u;uniform sampler2D t;void main(){vec3 c=texture2D(t,u).rgb;float m=max(c.r,max(c.g,c.b));float a=smoothstep(.07,.42,m);vec2 d=(u-.5)/vec2(.5,.5);float e=1.-smoothstep(.72,1.,length(d*vec2(.86,.9)));gl_FragColor=vec4(c*e*min(1.,a*1.15+.0),a*e);}",
      ),
    );
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      setNoGl(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.clearColor(0, 0, 0, 0);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const v = vid.current;
      if (!v || v.readyState < 2 || !v.videoWidth) return;
      if (canvas.width !== v.videoWidth) {
        canvas.width = v.videoWidth;
        canvas.height = v.videoHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, v);
      } catch {
        cancelAnimationFrame(raf);
        setNoGl(true);
        return;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [noGl]);

  // Switch from the intro to the loop.
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    v.src = `/media/title/${slug}-${phase}.mp4`;
    v.loop = phase === "loop";
    void v.play().catch(() => {});
  }, [phase, slug]);

  if (failed) return <>{fallback}</>;
  return (
    <div className={noGl ? "titlevid blend" : "titlevid gl"} role="img" aria-label={label}>
      <video
        ref={vid}
        muted
        playsInline
        autoPlay
        preload="auto"
        crossOrigin="anonymous"
        onEnded={() => phase === "intro" && setPhase("loop")}
        onError={() => setFailed(true)}
      />
      {!noGl && <canvas ref={cvs} />}
    </div>
  );
}
