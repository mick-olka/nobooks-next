import { useEffect, useState } from "react";

export const useSectionsWithHash = () => {
	const [openSection, setOpenSection] = useState<string | null>(null);

	// Handle initial hash on mount
	useEffect(() => {
		const hash = decodeURIComponent(window.location.hash.substring(1)).trim();
		if (hash) {
			setOpenSection(hash);
		}
	}, []);

	// Driven by the native <details> "toggle" event (fired for user
	// interaction AND for programmatic `open` changes, e.g. when React closes
	// a sibling section to enforce single-open). `isOpen` reflects the
	// section's own post-toggle state, so closes are resolved against the
	// latest state functionally (idempotent no-op if some other section is
	// already the open one) instead of re-deriving intent from a stale
	// closure — that keeps cascading sibling-close events from ever
	// re-opening a section a later click already moved away from.
	const handleSectionToggle = (sectionId: string, isOpen: boolean) => {
		setOpenSection((prev) => {
			if (isOpen) {
				return sectionId;
			}
			return prev === sectionId ? null : prev;
		});
		if (isOpen) {
			window.location.hash = sectionId;
		}
	};

	return { openSection, handleSectionToggle };
};
