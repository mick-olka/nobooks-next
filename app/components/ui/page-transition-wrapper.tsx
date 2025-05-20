"use client";
import { cn } from "@/app/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const pageVariants = {
	initial: { opacity: 0, x: -0 },
	in: { opacity: 1, x: 0 },
	out: { opacity: 0, x: 0 },
};

type Props = {
	children: ReactNode;
	className?: string;
	animate?: keyof typeof pageVariants;
	initial?: keyof typeof pageVariants;
	exit?: keyof typeof pageVariants;
};

export const PageTransitionWrapper = ({
	children,
	className,
	animate = "in",
	initial = "initial",
	exit = "out",
}: Props) => {
	return (
		<motion.section
			className={cn(className)}
			initial={initial}
			animate={animate}
			exit={exit}
			variants={pageVariants}
			transition={{ duration: 0.5 }}
		>
			{children}
		</motion.section>
	);
};
