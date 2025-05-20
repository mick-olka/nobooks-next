interface Window {
	BuyMeACoffee: {
		init: (config: {
			username: string;
			position: string;
			x_margin: number;
			y_margin: number;
		}) => void;
	};
}
