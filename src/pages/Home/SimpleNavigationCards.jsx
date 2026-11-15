import { simpleCardIds } from '../../navigation.js';
import { findRouteById } from '../../routes.js';

const simpleCards = simpleCardIds.map(findRouteById);
const displayLabels = { wishlist: 'Wishlist', plants: 'Plant DB' };

const labelFor = (destination) =>
	displayLabels[destination.id] ?? destination.label;

export function SimpleNavigationCards() {
	return (
		<nav class="simple-navigation" aria-label="Garden navigation">
			{simpleCards.map((destination, index) => (
				<a
					class={`simple-navigation__card${index === 0 ? ' simple-navigation__card--featured' : ''}`}
					href={destination.path}
					key={destination.id}
					data-simple-destination={destination.id}
				>
					<i class={`bi bi-${destination.icon}`} aria-hidden="true"></i>
					<span>{labelFor(destination)}</span>
				</a>
			))}
		</nav>
	);
}
