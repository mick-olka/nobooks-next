import Image from "next/image";
import Link from "next/link";

type Props = { logoName: string; redirectTo?: string };

export const Logo = ({ logoName, redirectTo }: Props) => {
	return (
		<Link href={redirectTo || "/"}>
			<div className="navbar-center flex items-center">
				<Image
					alt="Logo"
					src="/images/logo1.png"
					width={80}
					height={80}
					className="w-8 h-8"
				/>
				<p className="btn-ghost btn text-xl normal-case">{logoName}</p>
			</div>
		</Link>
	);
};
