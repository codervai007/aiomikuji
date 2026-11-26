"use client";
import { useEffect, useRef, useState, type ReactNode, type PointerEvent } from "react";
import { animate, motion, useMotionTemplate, useMotionValue, useSpring } from "motion/react";

const SPRING = { damping: 30, stiffness: 120, mass: 1.6 };

type Props = {
  imageSrc?: string;
  altText?: string;
  captionText?: string;
  containerHeight?: string;
  containerWidth?: string;
  imageHeight?: string;
  imageWidth?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  /** 0–1: strength of the light glare that follows the pointer. */
  glare?: number;
  /** 0–1: strength of the drop shadow while hovered. */
  shadow?: number;
  showTooltip?: boolean;
  /** Shown when the card is flipped (tap / click to flip). */
  backContent?: ReactNode;
  /** Optional controlled flip state. */
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  radius?: number;
  className?: string;
  children?: ReactNode;
};

/** A card that tilts toward the pointer, with glare, depth layers and an optional flip side. */
export default function TiltedCard({
  imageSrc,
  altText = "",
  captionText = "",
  containerHeight = "300px",
  containerWidth = "100%",
  imageHeight = "300px",
  imageWidth = "300px",
  rotateAmplitude = 14,
  scaleOnHover = 1.1,
  glare = 0,
  shadow = 0,
  showTooltip = false,
  backContent,
  flipped,
  onFlip,
  radius = 18,
  className = "",
  children,
}: Props) {
  const rotateX = useSpring(useMotionValue(0), SPRING);
  const rotateY = useSpring(useMotionValue(0), SPRING);
  const scale = useSpring(1, SPRING);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareOpacity = useSpring(0, SPRING);
  const tipX = useMotionValue(0);
  const tipY = useMotionValue(0);
  const tipOpacity = useSpring(0);
  const [hover, setHover] = useState(false);
  const [innerFlip, setInnerFlip] = useState(false);
  const isFlipped = flipped ?? innerFlip;
  // Flip in two halves (turn to edge-on, swap the face, turn back) and only ever render one face.
  // Real 3D back faces show mirrored on iPhone Safari, where the shadow filter flattens 3D.
  const [side, setSide] = useState(isFlipped);
  const flipRot = useMotionValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let stop = false;
    const out = animate(flipRot, 90, { duration: 0.18, ease: "easeIn" });
    out.then(() => {
      if (stop) return;
      setSide(isFlipped);
      flipRot.set(-90);
      animate(flipRot, 0, { type: "spring", stiffness: 260, damping: 22 });
    });
    return () => {
      stop = true;
      out.stop();
    };
  }, [isFlipped]); // eslint-disable-line react-hooks/exhaustive-deps

  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,${glare}) 0%, rgba(255,255,255,0) 55%)`;

  const onMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ox = e.clientX - r.left - r.width / 2;
    const oy = e.clientY - r.top - r.height / 2;
    rotateX.set((oy / (r.height / 2)) * -rotateAmplitude);
    rotateY.set((ox / (r.width / 2)) * rotateAmplitude);
    glareX.set(((e.clientX - r.left) / r.width) * 100);
    glareY.set(((e.clientY - r.top) / r.height) * 100);
    tipX.set(e.clientX - r.left);
    tipY.set(e.clientY - r.top);
  };
  const onEnter = () => {
    setHover(true);
    scale.set(scaleOnHover);
    glareOpacity.set(1);
    tipOpacity.set(1);
  };
  const onLeave = () => {
    setHover(false);
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
    glareOpacity.set(0);
    tipOpacity.set(0);
  };
  const flip = () => {
    if (!backContent) return;
    const next = !isFlipped;
    if (flipped === undefined) setInnerFlip(next);
    onFlip?.(next);
  };

  return (
    <figure
      className={`tc ${className}`}
      style={{ width: containerWidth, height: containerHeight }}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onClick={flip}
    >
      <motion.div
        className="tc-inner"
        style={{
          width: imageWidth,
          height: imageHeight,
          rotateX,
          rotateY,
          scale,
          filter: shadow > 0 && hover ? `drop-shadow(0 28px 40px rgba(0,0,0,${shadow}))` : `drop-shadow(0 12px 24px rgba(0,0,0,${shadow * 0.6}))`,
        }}
      >
        <motion.div className="tc-flip" style={{ rotateY: flipRot }}>
          <div className="tc-face tc-front" style={{ borderRadius: radius, display: side && backContent ? "none" : undefined }}>
            {imageSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt={altText} className="tc-img" style={{ borderRadius: radius }} />
            )}
            {children}
            {glare > 0 && <motion.div className="tc-glare" style={{ background: glareBg, opacity: glareOpacity, borderRadius: radius }} />}
          </div>
          {backContent && side && (
            <div className="tc-face tc-back" style={{ borderRadius: radius }}>
              {backContent}
              {glare > 0 && <motion.div className="tc-glare" style={{ background: glareBg, opacity: glareOpacity, borderRadius: radius }} />}
            </div>
          )}
        </motion.div>
      </motion.div>
      {showTooltip && captionText && (
        <motion.figcaption className="tc-tip" style={{ x: tipX, y: tipY, opacity: tipOpacity }}>
          {captionText}
        </motion.figcaption>
      )}
    </figure>
  );
}

/** Content that floats above the card face by `depth` pixels as it tilts. */
export function TiltedCardLayer({ depth = 30, children }: { depth?: number; children?: ReactNode }) {
  return (
    <div className="tc-layer" style={{ transform: `translateZ(${depth}px)` }}>
      {children}
    </div>
  );
}
