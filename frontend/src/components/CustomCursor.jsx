import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CustomCursor = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updateMousePosition = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", updateMousePosition);
        return () => window.removeEventListener("mousemove", updateMousePosition);
    }, []);

    return (
        <>
            <motion.div 
                className="fixed top-0 left-0 w-32 h-32 rounded-full pointer-events-none z-[9999] mix-blend-screen"
                animate={{ 
                    x: mousePosition.x - 64, 
                    y: mousePosition.y - 64 
                }}
                transition={{ type: "tween", ease: "backOut", duration: 0.15 }}
                style={{ 
                    background: 'radial-gradient(circle, rgba(255,90,0,0.4) 0%, rgba(162,0,255,0.1) 40%, transparent 70%)' 
                }}
            />
            <motion.div 
                className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full pointer-events-none z-[10000] shadow-[0_0_10px_#ff5a00]"
                animate={{ 
                    x: mousePosition.x - 8, 
                    y: mousePosition.y - 8 
                }}
                transition={{ type: "tween", ease: "linear", duration: 0 }}
            />
        </>
    );
};

export default CustomCursor;
