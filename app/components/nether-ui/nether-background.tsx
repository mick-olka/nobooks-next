"use client";

import { useMemo } from "react";
import "./styles.scss";

const WEEPING_VINES = "/images/nether/Invicon_Weeping_Vines.png";

const NETHER_IMAGES = [
	"/images/nether/Invicon_Crimson_Fungus.png",
	"/images/nether/Invicon_Nether_Wart.png",
	"/images/nether/Invicon_Warped_Fungus.png",
	WEEPING_VINES,
] as const;

const VERTICAL_OFFSETS = [0, 10, 36, 40] as const;

const ITEM_COUNT = 70;

const DEFAULT_SEED = 0x4e657468;

/** Seeded PRNG so server and client render the same list (avoids hydration mismatch). */
function createSeededRandom(seed: number) {
	return function next(): number {
		seed += 0x6d2b79f5;
		let t = seed;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Minute-based seed: pass from server so SSR and client agree. E.g. seed={Math.floor(Date.now() / 60000)} */
export const NetherBackground = ({
	seed = DEFAULT_SEED,
}: {
	seed?: number;
}) => {
	const items = useMemo(() => {
		const next = createSeededRandom(seed);
		return Array.from({ length: ITEM_COUNT }, (_, index) => {
			const icon = NETHER_IMAGES[Math.floor(next() * NETHER_IMAGES.length)];
			const top =
				icon === WEEPING_VINES
					? 0
					: VERTICAL_OFFSETS[Math.floor(next() * VERTICAL_OFFSETS.length)];
			return { id: index, icon, top };
		});
	}, [seed]);

	return (
		<ul className="nether-line bg-base-200">
			{items.map((item) => (
				<li
					key={item.id}
					style={{
						backgroundImage: `url(${item.icon})`,
						top: `${item.top}px`,
					}}
				/>
			))}
		</ul>
	);
};
