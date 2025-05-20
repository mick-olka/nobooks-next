import type { ReactNode } from "react";
import { cn } from "../utils";

type Props = {
	children: ReactNode;
	onClick?: () => void;
	className?: string;
};
export const StartButton = ({ children, className, onClick }: Props) => {
	return (
		<button
			type="button"
			onClick={onClick}
			tabIndex={0}
			className={cn(
				"w-64 h-40 mt-4 shadow-md rounded-lg overflow-hidden relative transform transition-transform hover:scale-105 inset-0 bg-indigo-500 flex items-center justify-center",
				className,
			)}
		>
			<h3 className="text-white font-bold text-lg">{children}</h3>
		</button>
	);
};
