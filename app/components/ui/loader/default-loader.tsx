import { motion } from "framer-motion";
import "./loader-styles.scss";
import { cn } from "@/app/utils";

const DefaultLoaderIcon = () => {
  return (
    <div className="ldsFacebook">
      <div />
      <div />
      <div />
    </div>
  );
};

export const DefaultLoader = () => {
  return (
    <motion.div
      className={cn("w-screen h-screen flex justify-center items-center")}
      initial={{ opacity: 0, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DefaultLoaderIcon />
    </motion.div>
  );
};
