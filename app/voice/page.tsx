import { PageTransitionWrapper } from "../components";
import { constants } from "../utils";

export default function VoicePage() {
	return (
		<PageTransitionWrapper>
			<div className="hero min-h-[calc(100vh-64px)] bg-black">
				<iframe
					height="100%"
					id="no-boobs-voice"
					src={constants.VOICE_URL}
					title="no boobs voice"
					width="100%"
				/>
			</div>
		</PageTransitionWrapper>
	);
}
