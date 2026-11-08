import Sortable from 'sortablejs';
import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { GardenAssociationSelector, gardenAssociationLabel } from '../../components/GardenAssociationSelector.jsx';
import { createGardensService } from '../../services/gardens.js';
import { createListItemsService, resolveListKind } from '../../services/listItems.js';
import { createLocationsService } from '../../services/locations.js';
import { StorageError, ValidationError } from '../../storage/index.js';
import { updateItemCompletion } from './completionState.js';
import './style.css';

const LISTS = {
	task: {
		title: 'Tasks',
		eyebrow: 'Garden checklist',
		description: 'Keep one practical task list for all of your gardens.',
		quickLabel: 'New task',
		quickPlaceholder: 'What needs doing?',
		addLabel: 'Add task',
		emptyTitle: 'No Tasks yet',
		emptyText: 'Add a task when there is something you want to remember or complete.',
		completedLabel: 'Completed',
		completionAction: 'Mark task complete',
		incompletionAction: 'Mark task incomplete',
		deletePrompt: 'Permanently delete this Task? This cannot be undone.',
	},
	wishlist: {
		title: 'Wish List',
		eyebrow: 'Purchasing checklist',
		description: 'Keep supplies and equipment you may want to purchase in one place.',
		quickLabel: 'New Wish List item',
		quickPlaceholder: 'What would you like to buy?',
		addLabel: 'Add item',
		emptyTitle: 'Your Wish List is empty',
		emptyText: 'Add a supply, tool, or piece of equipment you may want later.',
		completedLabel: 'Purchased',
		completionAction: 'Mark item purchased',
		incompletionAction: 'Mark item unpurchased',
		deletePrompt: 'Permanently delete this Wish List item? This cannot be undone.',
	},
};

function errorMessage(error, action) {
	if (error instanceof ValidationError) {
		return error.message;
	}
	if (error instanceof StorageError) {
		return `This item could not be ${action}. Your existing list has not been discarded.`;
	}
	return `Something unexpected prevented this item from being ${action}.`;
}

function optionalValue(value) {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function editFields(item) {
	return {
		text: item.text,
		quantity: item.quantity ?? '',
		notes: item.notes ?? '',
		url: item.url ?? '',
		gardenId: item.gardenId ?? null,
	};
}

export function Lists() {
	const { path } = useLocation();
	const kind = resolveListKind(path);
	const config = LISTS[kind];
	const storage = useStorage();
	const lists = useMemo(
		() => createListItemsService(storage.repositories.listItems),
		[storage],
	);
	const gardens = useMemo(() => createGardensService(storage.repositories.gardens), [storage]);
	const locations = useMemo(() => createLocationsService(storage.repositories.locations), [storage]);
	const listElement = useRef(null);
	const quickInput = useRef(null);
	const requestId = useRef(0);
	const [state, setState] = useState({ kind, status: 'loading', items: [] });
	const [quickText, setQuickText] = useState('');
	const [editingId, setEditingId] = useState(null);
	const [fields, setFields] = useState(null);
	const [pendingId, setPendingId] = useState(null);
	const [adding, setAdding] = useState(false);
	const [reordering, setReordering] = useState(false);
	const [message, setMessage] = useState('');
	const routePending = state.kind !== kind;

	const loadItems = useCallback(async (showLoading = true) => {
		const currentRequest = ++requestId.current;
		if (showLoading) {
			setState((current) => ({ ...current, kind, status: 'loading' }));
		}

		try {
			const [items, gardenRecords, locationRecords] = await Promise.all([
				lists.list(kind), gardens.list(), locations.list(),
			]);
			if (currentRequest === requestId.current) {
				setState({ kind, status: 'ready', items, gardens: gardenRecords, locations: locationRecords });
			}
			return items;
		} catch (error) {
			if (currentRequest === requestId.current) {
				setState((current) => ({ ...current, kind, status: 'error' }));
				setMessage(errorMessage(error, 'loaded'));
			}
			return null;
		}
	}, [gardens, kind, lists, locations]);

	useEffect(() => {
		setQuickText('');
		setEditingId(null);
		setFields(null);
		setMessage('');
		void loadItems();
	}, [loadItems]);

	const persistOrder = useCallback(async (nextItems) => {
		if (reordering) {
			return;
		}

		const previousItems = state.items;
		setItemsState(nextItems);
		setReordering(true);
		setMessage('');

		try {
			const persisted = await lists.reorder(
				kind,
				nextItems.map(({ id }) => id),
			);
			setItemsState(persisted);
		} catch (error) {
			setItemsState(previousItems);
			setMessage(errorMessage(error, 'reordered'));
		} finally {
			setReordering(false);
		}
	}, [kind, lists, reordering, state.items]);

	useEffect(() => {
		if (
			routePending ||
			state.status !== 'ready' ||
			state.items.length < 2 ||
			!listElement.current ||
			reordering
		) {
			return undefined;
		}

		const sortable = new Sortable(listElement.current, {
			animation: 150,
			draggable: '[data-list-item]',
			handle: '.lists-item__drag',
			ghostClass: 'lists-item--dragging',
			onEnd({ oldIndex, newIndex }) {
				if (
					oldIndex === undefined ||
					newIndex === undefined ||
					oldIndex === newIndex
				) {
					return;
				}

				const nextItems = [...state.items];
				const [moved] = nextItems.splice(oldIndex, 1);
				nextItems.splice(newIndex, 0, moved);
				void persistOrder(nextItems);
			},
		});

		return () => sortable.destroy();
	}, [persistOrder, reordering, routePending, state.items, state.status]);

	function setItemsState(items) {
		setState((current) => ({ ...current, kind, status: 'ready', items }));
	}

	function setItemCompletion(id, completed) {
		setState((current) => current.kind === kind
			? {
				...current,
				items: updateItemCompletion(current.items, id, completed),
			}
			: current
		);
	}

	async function addItem(event) {
		event.preventDefault();
		if (adding) {
			return;
		}

		setAdding(true);
		setMessage('');
		try {
			await lists.create(kind, { text: quickText.trim() });
			setQuickText('');
			await loadItems(false);
			quickInput.current?.focus();
		} catch (error) {
			setMessage(errorMessage(error, 'added'));
		} finally {
			setAdding(false);
		}
	}

	async function toggleCompleted(item, completed) {
		setPendingId(item.id);
		setMessage('');
		setItemCompletion(item.id, completed);
		try {
			if (!await lists.setCompleted(item.id, completed)) {
				throw new Error('The list item no longer exists.');
			}
		} catch (error) {
			setItemCompletion(item.id, item.completed);
			setMessage(errorMessage(error, 'updated'));
		} finally {
			setPendingId(null);
		}
	}

	function beginEdit(item) {
		setEditingId(item.id);
		setFields(editFields(item));
		setMessage('');
	}

	function cancelEdit() {
		setEditingId(null);
		setFields(null);
		setMessage('');
	}

	async function saveEdit(event, item) {
		event.preventDefault();
		setPendingId(item.id);
		setMessage('');

		const changes = {
			text: fields.text.trim(),
			gardenId: fields.gardenId,
			...(kind === 'wishlist' ? {
				quantity: optionalValue(fields.quantity),
				notes: optionalValue(fields.notes),
				url: optionalValue(fields.url),
			} : {}),
		};

		try {
			if (!await lists.update(item.id, kind, changes)) {
				throw new Error('The list item no longer exists.');
			}
			setEditingId(null);
			setFields(null);
			await loadItems(false);
		} catch (error) {
			setMessage(errorMessage(error, 'saved'));
		} finally {
			setPendingId(null);
		}
	}

	async function deleteItem(item) {
		if (!globalThis.confirm(config.deletePrompt)) {
			return;
		}

		setPendingId(item.id);
		setMessage('');
		try {
			await lists.remove(item.id);
			if (editingId === item.id) {
				cancelEdit();
			}
			await loadItems(false);
		} catch (error) {
			setMessage(errorMessage(error, 'deleted'));
		} finally {
			setPendingId(null);
		}
	}

	function moveItem(index, offset) {
		const target = index + offset;
		if (target < 0 || target >= state.items.length || reordering) {
			return;
		}

		const nextItems = [...state.items];
		const [moved] = nextItems.splice(index, 1);
		nextItems.splice(target, 0, moved);
		void persistOrder(nextItems);
	}

	return (
		<section class="container lists-page" aria-labelledby="lists-title">
			<header class="lists-page__header">
				<p class="lists-page__eyebrow">{config.eyebrow}</p>
				<h1 id="lists-title">{config.title}</h1>
				<p>{config.description}</p>
			</header>

			<nav aria-label="Lists workspace">
				<ul class="nav nav-tabs lists-tabs">
					<li class="nav-item">
						<a
							class={`nav-link${kind === 'task' ? ' active' : ''}`}
							href="/tasks"
							aria-current={kind === 'task' ? 'page' : undefined}
						>
							<i class="bi bi-check2-square" aria-hidden="true"></i>
							Tasks
						</a>
					</li>
					<li class="nav-item">
						<a
							class={`nav-link${kind === 'wishlist' ? ' active' : ''}`}
							href="/wishlist"
							aria-current={kind === 'wishlist' ? 'page' : undefined}
						>
							<i class="bi bi-bag-heart" aria-hidden="true"></i>
							Wish List
						</a>
					</li>
				</ul>
			</nav>

			<form class="lists-quick-add" autoComplete="off" onSubmit={addItem}>
				<label class="form-label" for="lists-quick-text">
					{config.quickLabel}
				</label>
				<div class="lists-quick-add__controls">
					<input
						id="lists-quick-text"
						class="form-control"
						type="text"
						autoComplete="off"
						maxlength="200"
						placeholder={config.quickPlaceholder}
						value={routePending ? '' : quickText}
						ref={quickInput}
						onInput={(event) => setQuickText(event.currentTarget.value)}
						disabled={adding || routePending}
					/>
					<button
						class="btn-solid theme-primary"
						type="submit"
						disabled={adding || routePending}
					>
						<i class="bi bi-plus-lg" aria-hidden="true"></i>
						{adding ? 'Adding…' : config.addLabel}
					</button>
				</div>
			</form>

			{!routePending && message && (
				<div class="lists-message" role="alert">
					<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
					<span>{message}</span>
					{state.status === 'error' && (
						<button
							class="btn-outline"
							type="button"
							onClick={() => loadItems()}
						>
							Retry
						</button>
					)}
				</div>
			)}

			{routePending || state.status === 'loading' ? (
				<div class="lists-state" role="status">Loading {config.title}…</div>
			) : state.items.length === 0 ? (
				<div class="lists-state">
					<i class="bi bi-list-check" aria-hidden="true"></i>
					<h2>{config.emptyTitle}</h2>
					<p>{config.emptyText}</p>
				</div>
			) : (
				<ol class="lists-list" ref={listElement} aria-label={config.title}>
					{state.items.map((item, index) => (
						<li
							class={`lists-item${item.completed ? ' lists-item--completed' : ''}`}
							key={item.id}
							data-list-item
						>
							{editingId === item.id ? (
								<form
									class="lists-edit"
									autoComplete="off"
									onSubmit={(event) => saveEdit(event, item)}
								>
									<div class="form-field">
										<label class="form-label" for={`list-text-${item.id}`}>
											Item
										</label>
										<input
											id={`list-text-${item.id}`}
											class="form-control"
											type="text"
											autoComplete="off"
											maxlength="200"
											value={fields.text}
											onInput={(event) => setFields({
												...fields,
												text: event.currentTarget.value,
											})}
										/>
									</div>
									<GardenAssociationSelector
										id={`list-garden-${item.id}`}
										value={fields.gardenId}
										gardens={state.gardens}
										locations={state.locations}
										onChange={(gardenId) => setFields({ ...fields, gardenId })}
										disabled={pendingId === item.id}
									/>
									{kind === 'wishlist' && (
										<>
											<div class="lists-edit__grid">
												<div class="form-field">
													<label class="form-label" for={`list-quantity-${item.id}`}>
														Quantity <span>(optional)</span>
													</label>
													<input
														id={`list-quantity-${item.id}`}
														class="form-control"
														type="text"
														autoComplete="off"
														maxlength="100"
														value={fields.quantity}
														onInput={(event) => setFields({
															...fields,
															quantity: event.currentTarget.value,
														})}
													/>
												</div>
												<div class="form-field">
													<label class="form-label" for={`list-url-${item.id}`}>
														Product URL <span>(optional)</span>
													</label>
													<input
														id={`list-url-${item.id}`}
														class="form-control"
														type="url"
														autoComplete="off"
														maxlength="2048"
														placeholder="https://example.com/item"
														value={fields.url}
														onInput={(event) => setFields({
															...fields,
															url: event.currentTarget.value,
														})}
													/>
												</div>
											</div>
											<div class="form-field">
												<label class="form-label" for={`list-notes-${item.id}`}>
													Notes <span>(optional)</span>
												</label>
												<textarea
													id={`list-notes-${item.id}`}
													class="form-control"
													autoComplete="off"
													rows="3"
													maxlength="1000"
													value={fields.notes}
													onInput={(event) => setFields({
														...fields,
														notes: event.currentTarget.value,
													})}
												></textarea>
											</div>
										</>
									)}
									<div class="lists-edit__actions">
										<button
											class="btn-outline"
											type="button"
											onClick={cancelEdit}
											disabled={pendingId === item.id}
										>
											Cancel
										</button>
										<button
											class="btn-solid theme-primary"
											type="submit"
											disabled={pendingId === item.id}
										>
											{pendingId === item.id ? 'Saving…' : 'Save'}
										</button>
									</div>
								</form>
							) : (
								<>
									<span
										class="lists-item__drag"
										title="Drag to reorder"
										aria-hidden="true"
									>
										<i class="bi bi-grip-vertical"></i>
									</span>
									<input
										class="check lists-item__check"
										type="checkbox"
										checked={item.completed}
										disabled={pendingId === item.id || reordering}
										aria-label={`${
											item.completed
												? config.incompletionAction
												: config.completionAction
										}: ${item.text}`}
										onChange={(event) => toggleCompleted(item, event.currentTarget.checked)}
									/>
									<div class="lists-item__content">
										<div class="lists-item__title-row">
											<span class="lists-item__text">{item.text}</span>
											{item.completed && (
												<span class="badge theme-success">
													{config.completedLabel}
												</span>
											)}
										</div>
										{item.gardenId && (() => {
											const garden = state.gardens.find(({ id }) => id === item.gardenId);
											return garden ? <a class="lists-item__garden" href={`/gardens/${garden.id}`}>
												<i class="bi bi-tree" aria-hidden="true"></i>{gardenAssociationLabel(garden, state.locations)}
											</a> : null;
										})()}
										{kind === 'wishlist' &&
											(item.quantity || item.notes || item.url) && (
												<div class="lists-item__details">
													{item.quantity && (
														<span><strong>Quantity:</strong> {item.quantity}</span>
													)}
													{item.notes && <span>{item.notes}</span>}
													{item.url && (
														<a href={item.url} target="_blank" rel="noreferrer">
															<i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>
															Product link
														</a>
													)}
												</div>
											)}
									</div>
									<div class="lists-item__actions">
										<button
											class="btn-text lists-item__order"
											type="button"
											aria-label={`Move ${item.text} up`}
											title="Move up"
											disabled={index === 0 || reordering}
											onClick={() => moveItem(index, -1)}
										>
											<i class="bi bi-arrow-up" aria-hidden="true"></i>
										</button>
										<button
											class="btn-text lists-item__order"
											type="button"
											aria-label={`Move ${item.text} down`}
											title="Move down"
											disabled={index === state.items.length - 1 || reordering}
											onClick={() => moveItem(index, 1)}
										>
											<i class="bi bi-arrow-down" aria-hidden="true"></i>
										</button>
										<button
											class="btn-text"
											type="button"
											onClick={() => beginEdit(item)}
											disabled={pendingId === item.id || reordering}
										>
											<i class="bi bi-pencil" aria-hidden="true"></i>
											Edit
										</button>
										<button
											class="btn-text theme-danger"
											type="button"
											onClick={() => deleteItem(item)}
											disabled={pendingId === item.id || reordering}
										>
											<i class="bi bi-trash3" aria-hidden="true"></i>
											{pendingId === item.id ? 'Working…' : 'Delete'}
										</button>
									</div>
								</>
							)}
						</li>
					))}
				</ol>
			)}
		</section>
	);
}
