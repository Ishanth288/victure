
import React from 'react';
import { motion } from 'framer-motion';

interface TechCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TechCard({ children, className }: TechCardProps) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      }}
    >
      <div className="relative z-10">{children}</div>
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-xl"></div>
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-gradient-to-tr from-purple-400/20 to-pink-500/20 blur-xl"></div>
    </motion.div>
  );
}
