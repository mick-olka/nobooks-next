import { useState } from "react";

import { useEffect } from "react";

export const useSectionsWithHash = () => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Handle initial hash on mount
  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.substring(1)).trim();
    if (hash) {
      setOpenSection(hash);
    }
  }, []);

  const handleSectionClick = (sectionId: string) => {
    setOpenSection(openSection === sectionId ? null : sectionId);
    window.location.hash = sectionId;
  };

  return { openSection, handleSectionClick };
};
