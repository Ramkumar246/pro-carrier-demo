import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Box } from 'lucide-react';

interface Container3DProps {
  utilization: number;
  containerType?: string;
  carrierName?: string;
}

export const Container3D: React.FC<Container3DProps> = ({
  utilization,
  containerType = '40ft HC',
  carrierName = 'MSC',
}) => {
  const [rotation, setRotation] = useState({ x: -10, y: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const getColor = () => {
    if (utilization >= 90) return { main: '#ef4444', light: '#fca5a5', dark: '#991b1b' };
    if (utilization >= 70) return { main: '#f59e0b', light: '#fcd34d', dark: '#b45309' };
    return { main: '#10b981', light: '#6ee7b7', dark: '#047857' };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setRotation((prev) => ({
      x: Math.max(-90, Math.min(90, prev.x - deltaY * 0.5)),
      y: prev.y + deltaX * 0.5,
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const colors = getColor();
  const totalBoxes = 48;
  const filledBoxes = Math.floor((utilization / 100) * totalBoxes);

  return (
    <div
      className="relative w-full flex flex-col items-center select-none"
      style={{ perspective: '1200px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        className="relative w-full cursor-grab active:cursor-grabbing"
        style={{
          transformStyle: 'preserve-3d',
          maxWidth: '520px',
          height: '200px',
        }}
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
          z: -520,
        }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        {/* Container shell */}
        <div
          className="absolute"
          style={{
            transformStyle: 'preserve-3d',
            width: '100%',
            height: '140px',
            transform: 'translateZ(0)',
          }}
        >
          {/* Front glass panel */}
          <div
            className="absolute w-full h-full border-[3px]"
            style={{
              transform: 'translateZ(220px)',
              background:
                'linear-gradient(145deg, #7dd3fc 0%, #60a5fa 30%, #3b82f6 70%, #2563eb 100%)',
              borderColor: '#2563eb',
              boxShadow: `
                rgba(0,0,0,0.15) 0px 0px 30px inset,
                rgba(255,255,255,0.2) -10px -10px 40px inset,
                rgba(0,0,0,0.3) 10px 10px 40px inset
              `,
              opacity: 0.75,
            }}
          >
            <div className="pointer-events-none absolute top-5 left-0 right-0 flex flex-col items-center text-white drop-shadow-lg">
              <span className="uppercase tracking-[0.3em] text-[10px] font-bold">
                {carrierName}
              </span>
              <span className="mt-1 text-xl font-bold tracking-wider">{containerType}</span>
            </div>
          </div>

          {/* Back wall */}
          <div
            className="absolute w-full h-full border-[3px]"
            style={{
              transform: 'translateZ(0px)',
              background: 'linear-gradient(145deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)',
              borderColor: '#1e3a8a',
              boxShadow: `
                inset 0 0 40px rgba(0,0,0,0.4),
                inset -15px -15px 30px rgba(0,0,0,0.3),
                inset 15px 15px 30px rgba(255,255,255,0.1)
              `,
            }}
          >
            <div className="absolute top-2 left-2 text-white text-lg font-bold drop-shadow-md">
              FCL-40HC
            </div>
            <div className="absolute top-7 left-2 text-blue-100 text-[9px] drop-shadow">ISO 6346</div>
          </div>

          {/* Left side */}
          <div
            className="absolute h-full border-[3px]"
            style={{
              width: '220px',
              transform: 'rotateY(-90deg)',
              transformOrigin: 'left center',
              background:
                'linear-gradient(145deg, #7dd3fc 0%, #60a5fa 30%, #3b82f6 70%, #2563eb 100%)',
              borderColor: '#2563eb',
              boxShadow: `
                inset 0 0 30px rgba(0,0,0,0.15),
                inset -10px -10px 30px rgba(255,255,255,0.15),
                inset 10px 10px 30px rgba(0,0,0,0.25)
              `,
            }}
          >
            {/* Vertical ribs */}
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full"
                style={{
                  left: `${i * 6.25}%`,
                  width: '6.25%',
                  background:
                    i % 2 === 0
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.05) 100%)'
                      : 'linear-gradient(90deg, rgba(0,0,0,0.05) 0%, rgba(255,255,255,0.08) 100%)',
                  borderRight: '1px solid rgba(255,255,255,0.1)',
                  boxShadow:
                    i % 2 === 0
                      ? 'inset 2px 0 3px rgba(255,255,255,0.12)'
                      : 'inset -2px 0 3px rgba(0,0,0,0.12)',
                }}
              />
            ))}
          </div>

          {/* Right side */}
          <div
            className="absolute h-full border-[3px]"
            style={{
              width: '220px',
              right: 0,
              transform: 'rotateY(90deg)',
              transformOrigin: 'right center',
              background:
                'linear-gradient(145deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)',
              borderColor: '#1e3a8a',
              boxShadow: `
                rgba(0,0,0,0.15) 0px 0px 30px inset,
                rgba(255,255,255,0.1) -10px -10px 30px inset,
                rgba(0,0,0,0.3) 10px 10px 30px inset
              `,
            }}
          >
            {/* Vertical ribs */}
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="absolute h-full"
                style={{
                  left: `${i * 6.25}%`,
                  width: '6.25%',
                  background:
                    i % 2 === 0
                      ? 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.08) 100%)'
                      : 'linear-gradient(90deg, rgba(0,0,0,0.08) 0%, rgba(255,255,255,0.06) 100%)',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  boxShadow:
                    i % 2 === 0
                      ? 'inset 2px 0 3px rgba(255,255,255,0.08)'
                      : 'inset -2px 0 3px rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>

          {/* Top */}
          <div
            className="absolute w-full border-[3px]"
            style={{
              height: '220px',
              transform: 'rotateX(90deg)',
              transformOrigin: 'center top',
              background:
                'linear-gradient(145deg, #7dd3fc 0%, #60a5fa 30%, #3b82f6 70%, #2563eb 100%)',
              borderColor: '#2563eb',
              boxShadow: `
                rgba(0,0,0,0.12) 0px 0px 30px inset,
                rgba(255,255,255,0.25) -15px -15px 35px inset,
                rgba(0,0,0,0.2) 15px 15px 35px inset
              `,
            }}
          >
            <div
              className="absolute inset-8 border-2 border-yellow-200/30 flex items-center justify-center rounded-sm"
              style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.15)' }}
            >
              <div className="text-yellow-100/40 text-5xl font-bold drop-shadow-lg">40'HC</div>
            </div>
          </div>

          {/* Bottom */}
          <div
            className="absolute w-full border-[3px]"
            style={{
              height: '220px',
              bottom: 0,
              transform: 'rotateX(-90deg)',
              transformOrigin: 'center bottom',
              background: 'linear-gradient(145deg, #2563eb 0%, #1e40af 50%, #1e3a8a 100%)',
              borderColor: '#1e3a8a',
              boxShadow: `
                rgba(0,0,0,0.4) 0px 0px 50px inset,
                rgba(255,255,255,0.08) -15px -15px 30px inset,
                rgba(0,0,0,0.4) 15px 15px 30px inset
              `,
            }}
          />

          {/* Cargo grid */}
          <div
            className="absolute"
            style={{
              left: '25px',
              bottom: '25px',
              width: 'calc(100% - 50px)',
              height: 'calc(100% - 50px)',
              transform: 'translateZ(25px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {[...Array(4)].map((_, layer) => (
              <div
                key={layer}
                className="absolute"
                style={{
                  width: '100%',
                  height: '23%',
                  bottom: `${layer * 25.5}%`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {[...Array(3)].map((_, row) => (
                  <div
                    key={row}
                    className="absolute w-full h-full"
                    style={{
                      transform: `translateZ(${row * 50}px)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    {[...Array(4)].map((_, col) => {
                      const boxIndex = layer * 12 + row * 4 + col;
                      const isFilled = boxIndex < filledBoxes;

                      return (
                        <motion.div
                          key={col}
                          className="absolute h-full"
                          style={{
                            width: '23%',
                            left: `${col * 25.5}%`,
                            transformStyle: 'preserve-3d',
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: isFilled ? 1 : 0, opacity: isFilled ? 1 : 0 }}
                          transition={{
                            duration: 0.5,
                            delay: boxIndex * 0.025,
                            type: 'spring',
                            stiffness: 160,
                          }}
                        >
                          <div
                            className="relative w-full h-full"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front face */}
                            <div
                              className="absolute w-full h-full border-2 border-slate-900/50"
                              style={{
                                transform: 'translateZ(22px)',
                                background: `linear-gradient(135deg, ${colors.main}, ${colors.dark})`,
                                boxShadow: `inset 0 0 20px ${colors.dark}`,
                              }}
                            >
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Box className="w-6 h-6 text-white/40" />
                              </div>
                            </div>
                            {/* Back face */}
                            <div
                              className="absolute w-full h-full border-2 border-slate-900/50"
                              style={{
                                transform: 'translateZ(-22px) rotateY(180deg)',
                                background: `linear-gradient(135deg, ${colors.dark}, ${colors.main})`,
                              }}
                            />
                            {/* Left face */}
                            <div
                              className="absolute h-full border-2 border-slate-900/50"
                              style={{
                                width: '44px',
                                transform: 'rotateY(-90deg) translateZ(22px)',
                                transformOrigin: 'left',
                                background: `linear-gradient(180deg, ${colors.main}, ${colors.dark})`,
                              }}
                            />
                            {/* Right face */}
                            <div
                              className="absolute h-full border-2 border-slate-900/50"
                              style={{
                                width: '44px',
                                transform: 'rotateY(90deg) translateZ(calc(100% - 22px))',
                                transformOrigin: 'left',
                                background: `linear-gradient(180deg, ${colors.dark}, ${colors.main})`,
                              }}
                            />
                            {/* Top face */}
                            <div
                              className="absolute w-full border-2 border-slate-800/50"
                              style={{
                                height: '44px',
                                transform: 'rotateX(90deg) translateZ(0px)',
                                transformOrigin: 'top',
                                background: `radial-gradient(circle, ${colors.light}, ${colors.main})`,
                              }}
                            />
                            {/* Bottom face */}
                            <div
                              className="absolute w-full border-2 border-slate-900/50"
                              style={{
                                height: '44px',
                                transform: 'rotateX(-90deg) translateZ(calc(100% - 0px))',
                                transformOrigin: 'top',
                                background: `linear-gradient(135deg, ${colors.dark}, ${colors.main})`,
                              }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Container3D;
