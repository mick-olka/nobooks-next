"use client";

import { useRouter } from "next/navigation";

export const BackBtn = ({ isAdmin }: { isAdmin?: boolean }) => {
	const router = useRouter();

	const handleClick = () => {
		// if (window.history.length > 2) {
		// 	if (isAdmin) {
		// 		router.back();
		// 	} else router.back();
		// } else {
		router.push("/wiki");
		// }
	};

	return (
		<button
			type="button"
			className="btn btn-link text-2xl"
			onClick={handleClick}
		>
			{"< Назад"}
		</button>
	);
};
