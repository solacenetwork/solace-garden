import { useEffect, useRef, useState } from 'preact/hooks';

const WIDE_SEARCH_QUERY = '(min-width: 1024px)';

export function HeaderSearch() {
	const [isWide, setIsWide] = useState(() => globalThis.matchMedia?.(WIDE_SEARCH_QUERY).matches ?? false);
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState('');
	const [message, setMessage] = useState('');
	const trigger = useRef(null);
	const input = useRef(null);
	const panel = useRef(null);
	const focusAfterResize = useRef(false);

	useEffect(() => {
		const media = globalThis.matchMedia?.(WIDE_SEARCH_QUERY);
		if (!media) return undefined;
		const change = ({ matches }) => {
			const hadFocus = panel.current?.contains(panel.current.ownerDocument.activeElement)
				|| trigger.current === panel.current?.ownerDocument.activeElement;
			focusAfterResize.current = Boolean(hadFocus);
			setIsWide(matches);
			setIsOpen(!matches && Boolean(hadFocus));
		};
		media.addEventListener('change', change);
		return () => media.removeEventListener('change', change);
	}, []);

	useEffect(() => {
		if (isOpen || focusAfterResize.current) {
			focusAfterResize.current = false;
			input.current?.focus({ preventScroll: true });
		}
	}, [isOpen, isWide]);

	const close = () => {
		setIsOpen(false);
		trigger.current?.focus({ preventScroll: true });
	};

	return (
		<div class="header-search">
			<button
				class="header-control icon-control header-search__trigger"
				type="button"
				ref={trigger}
				hidden={isWide}
				aria-label="Search"
				title="Search"
				aria-controls="header-search-panel"
				aria-expanded={isOpen}
				onClick={() => setIsOpen((open) => !open)}
			>
				<i class="bi bi-search" aria-hidden="true"></i>
			</button>
			<form
				id="header-search-panel"
				class="header-search__panel"
				role="search"
				ref={panel}
				hidden={!isWide && !isOpen}
				onSubmit={(event) => { event.preventDefault(); setMessage("Search isn't available yet."); }}
				onKeyDown={(event) => {
					if (event.key === 'Escape' && !isWide) {
						event.preventDefault();
						event.stopPropagation();
						close();
					}
				}}
			>
				<label class="visually-hidden" for="header-search-query">Search SOLACE Garden</label>
				<input
					id="header-search-query"
					class="form-control header-search__input"
					type="search"
					placeholder="Type your search query"
					ref={input}
					value={query}
					onInput={(event) => { setQuery(event.currentTarget.value); setMessage(''); }}
				/>
				<button class="header-control icon-control" type="submit" aria-label="Go" title="Go">Go</button>
				<button class="header-control icon-control" type="button" hidden={isWide} aria-label="Close search" title="Close search" onClick={close}>
					<i class="bi bi-x-lg" aria-hidden="true"></i>
				</button>
				{message && <p class="header-search__status" role="status">{message}</p>}
			</form>
		</div>
	);
}
