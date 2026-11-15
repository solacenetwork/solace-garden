import { GardenBrand } from './GardenBrand';
import { HeaderToolbar } from './HeaderToolbar.jsx';

export function Header() {
	return (
		<header class="app-header">
			<div class="app-header__inner">
				<GardenBrand />
				<HeaderToolbar />
			</div>
		</header>
	);
}
