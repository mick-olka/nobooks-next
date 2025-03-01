"use client";

import { useClickOutside } from "@/app/utils/hooks/use-click-outside";
import Link from "next/link";
import { useRef } from "react";

type Props = { links: { name: string; href: string }[] };

export const Menu = ({ links }: Props) => {
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    if (dropdownRef.current) {
      dropdownRef.current.open = false;
    }
  };
  useClickOutside(
    dropdownRef as unknown as React.RefObject<HTMLElement>,
    closeDropdown
  );
  return (
    <>
      <details className="navbar-start dropdown" ref={dropdownRef}>
        <summary className="btn m-1 btn-ghost btn-circle">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <title>Меню</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
        </summary>
        <ul className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow">
          {links.map((link) => (
            <li
              key={link.name}
              onClick={closeDropdown}
              onKeyUp={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  closeDropdown();
                }
              }}
            >
              <Link href={link.href}>{link.name}</Link>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
};
