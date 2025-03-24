
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HoverInfoCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  className?: string;
}

export function HoverInfoCard({ title, description, icon, className = '' }: HoverInfoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-6 cursor-pointer ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-4">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">{title}</h3>
          <AnimatePresence>
            {isHovered ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">{description}</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 0, height: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-neutral-600 dark:text-neutral-300">{description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
    </motion.div>
  );
}
