import { PageTransitionWrapper } from "../components";
import { constants } from "../utils";

export default function MapPage() {
	return (
		<PageTransitionWrapper>
			<div className="hero min-h-[calc(100vh-64px)] bg-black">
				<iframe
					height="100%"
					id="no-boobs-map"
					src={constants.MAP_URL}
					title="no boobs map"
					width="100%"
				/>
			</div>
			{/* <Navigate to={"/in-progress"} /> */}
		</PageTransitionWrapper>
	);
}
