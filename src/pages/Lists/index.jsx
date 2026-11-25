import Sortable from 'sortablejs';
import { useLocation } from 'preact-iso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { GardenAssociationSelector, gardenAssociationLabel } from '../../components/GardenAssociationSelector.jsx';
import { createGardensService } from '../../services/gardens.js';
import { createListItemsService, resolveListKind } from '../../services/listItems.js';
import { createLocationsService } from '../../services/locations.js';
import {
	readListAccordionPreference,
	writeListAccordionPreference,
} from '../../services/listAccordionPreference.js';
import { StorageError, ValidationError } from '../../storage/errors.js';
import {
	deriveListCollections,
	reconstructListOrder,
	updateItemCompletion,
} from './completionState.js';
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
	const { path, url } = useLocation();
	const kind = resolveListKind(path);
	const config = LISTS[kind];
	const storage = useStorage();
	const lists = useMemo(
		() => createListItemsService(storage.repositories.listItems),
		[storage],
	);
	const gardens = useMemo(() => createGardensService(storage.repositories.gardens), [storage]);
	const locations = useMemo(() => createLocationsService(storage.repositories.locations), [storage]);
	const outstandingElement = useRef(null);
	const completedElement = useRef(null);
	const quickInput = useRef(null);
	const requestId = useRef(0);
	const operationRef = useRef(null);
	const [state, setState] = useState({ kind, status: 'loading', items: [] });
	const [quickText, setQuickText] = useState('');
	const [quickError, setQuickError] = useState('');
	const [editingId, setEditingId] = useState(null);
	const [fields, setFields] = useState(null);
	const [fieldErrors, setFieldErrors] = useState({});
	const [pendingId, setPendingId] = useState(null);
	const [adding, setAdding] = useState(false);
	const [reordering, setReordering] = useState(false);
	const [message, setMessage] = useState('');
	const [accordionPreference, setAccordionPreference] = useState(readListAccordionPreference);
	const routePending = state.kind !== kind;
	const collections = state.status === 'ready'
		? deriveListCollections(state.items)
		: { outstanding: [], completed: [] };
	const accordionExpanded = accordionPreference[kind] ?? false;

	// A fragment requests the existing quick-add field without changing the
	// list route or introducing a second editor. Wait until route reuse enables it.
	useEffect(() => {
		if (url?.endsWith('#lists-quick-text') && !routePending && !adding) {
			quickInput.current?.focus();
		}
	}, [url, routePending, adding]);

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
		setQuickError('');
		setEditingId(null);
		setFields(null);
		setFieldErrors({});
		setMessage('');
		void loadItems();
	}, [loadItems]);

	const persistOrder = useCallback(async (nextItems) => {
		if (operationRef.current) {
			return;
		}

		const previousItems = state.items;
		operationRef.current = 'reorder';
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
			operationRef.current = null;
		}
	}, [kind, lists, reordering, state.items]);

	useEffect(() => {
		if (
			routePending ||
			state.status !== 'ready' ||
			reordering ||
			operationRef.current ||
			editingId
		) {
			return undefined;
		}

		const sortables = [];
		const setup = (element, collection) => {
			if (!element || element.querySelectorAll('[data-list-item]').length < 2) return;
			sortables.push(new Sortable(element, {
				animation: 150,
				draggable: '[data-list-item]',
				handle: '.lists-item__drag',
				ghostClass: 'lists-item--dragging',
				onEnd({ oldIndex, newIndex }) {
					if (operationRef.current || oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;
					const source = deriveListCollections(state.items)[collection];
					const reordered = [...source];
					const [moved] = reordered.splice(oldIndex, 1);
					reordered.splice(newIndex, 0, moved);
					const nextItems = reconstructListOrder(state.items, collection, reordered);
					void persistOrder(nextItems);
				},
			}));
		};
		setup(outstandingElement.current, 'outstanding');
		if (accordionExpanded) setup(completedElement.current, 'completed');
		return () => sortables.forEach((sortable) => sortable.destroy());
	}, [accordionExpanded, editingId, persistOrder, reordering, routePending, state.items, state.status]);

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
		if (operationRef.current || adding || editingId) {
			return;
		}

		const text = quickText.trim();
		if (!text || text.length > 200) {
			setQuickError('Item text must contain 1 to 200 characters.');
			quickInput.current?.focus();
			return;
		}

		operationRef.current = 'add';
		setAdding(true);
		setMessage('');
		setQuickError('');
		try {
			await lists.create(kind, { text });
			setQuickText('');
			await loadItems(false);
			quickInput.current?.focus();
		} catch (error) {
			if (error instanceof ValidationError) setQuickError(error.field === 'text' ? error.message : '');
			setMessage(errorMessage(error, 'added'));
		} finally {
			setAdding(false);
			operationRef.current = null;
		}
	}

	async function toggleCompleted(item, completed) {
		if (operationRef.current || editingId) return;
		operationRef.current = `completion:${item.id}`;
		setPendingId(item.id);
		setMessage('');
		setItemCompletion(item.id, completed);
		try {
			if (!await lists.setCompleted(item.id, completed)) {
				throw new Error('The list item no longer exists.');
			}
			requestAnimationFrame(() => {
				const target = document.getElementById(`list-check-${item.id}`);
				target?.focus();
			});
		} catch (error) {
			setItemCompletion(item.id, item.completed);
			setMessage(errorMessage(error, 'updated'));
		} finally {
			setPendingId(null);
			operationRef.current = null;
		}
	}

	function beginEdit(item) {
		if (operationRef.current || editingId) return;
		setEditingId(item.id);
		setFields(editFields(item));
		setFieldErrors({});
		setMessage('');
		requestAnimationFrame(() => {
			document.getElementById(`list-text-${item.id}`)?.focus();
		});
	}

	function cancelEdit() {
		if (operationRef.current) return;
		const id = editingId;
		setEditingId(null);
		setFields(null);
		setFieldErrors({});
		setMessage('');
		requestAnimationFrame(() => {
			document.getElementById(`list-edit-${id}`)?.focus();
		});
	}

	async function saveEdit(event, item) {
		event.preventDefault();
		if (operationRef.current) return;
		const text = fields.text.trim();
		if (!text || text.length > 200) {
			setFieldErrors({ text: 'Item text must contain 1 to 200 characters.' });
			requestAnimationFrame(() => document.getElementById(`list-text-${item.id}`)?.focus());
			return;
		}
		operationRef.current = `save:${item.id}`;
		setPendingId(item.id);
		setMessage('');
		setFieldErrors({});

		const changes = {
			text,
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
			requestAnimationFrame(() => document.getElementById(`list-edit-${item.id}`)?.focus());
		} catch (error) {
			if (error instanceof ValidationError && error.field) {
				setFieldErrors({ [error.field]: error.message });
				requestAnimationFrame(() => document.getElementById(
					error.field === 'text' ? `list-text-${item.id}`
						: error.field === 'gardenId' ? `list-garden-${item.id}`
							: `list-${error.field}-${item.id}`,
				)?.focus());
			}
			setMessage(errorMessage(error, 'saved'));
		} finally {
			setPendingId(null);
			operationRef.current = null;
		}
	}

	async function deleteItem(item) {
		if (operationRef.current || editingId) return;
		if (!globalThis.confirm(config.deletePrompt)) {
			return;
		}

		operationRef.current = `delete:${item.id}`;
		setPendingId(item.id);
		setMessage('');
		try {
			await lists.remove(item.id);
			if (editingId === item.id) {
				cancelEdit();
			}
			await loadItems(false);
			requestAnimationFrame(() => {
				const remaining = document.querySelector('.lists-item__edit');
				(remaining ?? quickInput.current)?.focus();
			});
		} catch (error) {
			setMessage(errorMessage(error, 'deleted'));
		} finally {
			setPendingId(null);
			operationRef.current = null;
		}
	}

	function moveItem(collection, index, offset) {
		const target = index + offset;
		const source = deriveListCollections(state.items)[collection];
		if (target < 0 || target >= source.length || operationRef.current) {
			return;
		}

		const reordered = [...source];
		const [moved] = reordered.splice(index, 1);
		reordered.splice(target, 0, moved);
		const nextItems = reconstructListOrder(state.items, collection, reordered);
		void persistOrder(nextItems);
	}

	function toggleAccordion(expanded) {
		setAccordionPreference((current) => {
			const next = { ...current, [kind]: expanded };
			writeListAccordionPreference(next);
			return next;
		});
	}

	function renderListItem(item, collection, index) {
		const collectionItems = deriveListCollections(state.items)[collection];
		const isEditing = editingId === item.id;
		const rowPending = pendingId === item.id;
		return (
			<li class={`lists-item${item.completed ? ' lists-item--completed' : ''}`} key={item.id} data-list-item>
				{isEditing ? (
					<form class="lists-edit" autoComplete="off" noValidate onSubmit={(event) => saveEdit(event, item)}>
						<div class="form-field">
							<label class="form-label" for={`list-text-${item.id}`}>Item</label>
							<input
								id={`list-text-${item.id}`}
								class={`form-control${fieldErrors.text ? ' is-invalid' : ''}`}
								type="text"
								autoComplete="off"
								required
								maxlength="200"
								disabled={rowPending}
								value={fields.text}
								aria-invalid={fieldErrors.text ? 'true' : undefined}
								aria-describedby={fieldErrors.text ? `list-text-error-${item.id}` : undefined}
								onInput={(event) => {
									setFields({ ...fields, text: event.currentTarget.value });
									setFieldErrors({ ...fieldErrors, text: '' });
								}}
							/>
							{fieldErrors.text && <div id={`list-text-error-${item.id}`} class="invalid-feedback">{fieldErrors.text}</div>}
						</div>
						<GardenAssociationSelector
							id={`list-garden-${item.id}`}
							value={fields.gardenId}
							gardens={state.gardens}
							locations={state.locations}
							onChange={(gardenId) => setFields({ ...fields, gardenId })}
							disabled={rowPending}
						/>
						{kind === 'wishlist' && (
							<>
								<div class="lists-edit__grid">
									<div class="form-field">
										<label class="form-label" for={`list-quantity-${item.id}`}>Quantity <span>(optional)</span></label>
										<input
											id={`list-quantity-${item.id}`}
											class={`form-control${fieldErrors.quantity ? ' is-invalid' : ''}`}
											type="text"
											autoComplete="off"
											maxlength="100"
											disabled={rowPending}
											value={fields.quantity}
											aria-invalid={fieldErrors.quantity ? 'true' : undefined}
											aria-describedby={fieldErrors.quantity ? `list-quantity-error-${item.id}` : undefined}
											onInput={(event) => {
												setFields({ ...fields, quantity: event.currentTarget.value });
												setFieldErrors({ ...fieldErrors, quantity: '' });
											}}
										/>
										{fieldErrors.quantity && <div id={`list-quantity-error-${item.id}`} class="invalid-feedback">{fieldErrors.quantity}</div>}
									</div>
									<div class="form-field">
										<label class="form-label" for={`list-url-${item.id}`}>Product URL <span>(optional)</span></label>
										<input
											id={`list-url-${item.id}`}
											class={`form-control${fieldErrors.url ? ' is-invalid' : ''}`}
											type="url"
											autoComplete="off"
											maxlength="2048"
											placeholder="https://example.com/item"
											disabled={rowPending}
											value={fields.url}
											aria-invalid={fieldErrors.url ? 'true' : undefined}
											aria-describedby={fieldErrors.url ? `list-url-error-${item.id}` : undefined}
											onInput={(event) => {
												setFields({ ...fields, url: event.currentTarget.value });
												setFieldErrors({ ...fieldErrors, url: '' });
											}}
										/>
										{fieldErrors.url && <div id={`list-url-error-${item.id}`} class="invalid-feedback">{fieldErrors.url}</div>}
									</div>
								</div>
								<div class="form-field">
									<label class="form-label" for={`list-notes-${item.id}`}>Notes <span>(optional)</span></label>
									<textarea
										id={`list-notes-${item.id}`}
										class={`form-control${fieldErrors.notes ? ' is-invalid' : ''}`}
										autoComplete="off"
										rows="3"
										maxlength="1000"
										disabled={rowPending}
										value={fields.notes}
										aria-invalid={fieldErrors.notes ? 'true' : undefined}
										aria-describedby={fieldErrors.notes ? `list-notes-error-${item.id}` : undefined}
										onInput={(event) => {
											setFields({ ...fields, notes: event.currentTarget.value });
											setFieldErrors({ ...fieldErrors, notes: '' });
										}}
									></textarea>
									{fieldErrors.notes && <div id={`list-notes-error-${item.id}`} class="invalid-feedback">{fieldErrors.notes}</div>}
								</div>
							</>
						)}
						<div class="lists-edit__actions">
							<button class="btn-outline" type="button" onClick={cancelEdit} disabled={rowPending}>Cancel</button>
							<button class="btn-solid theme-primary" type="submit" disabled={rowPending}>{rowPending ? 'Saving…' : 'Save'}</button>
						</div>
					</form>
				) : (
					<>
						<span class="lists-item__drag" title="Drag to reorder" aria-hidden="true"><i class="bi bi-grip-vertical"></i></span>
						<input
							id={`list-check-${item.id}`}
							class="check lists-item__check"
							type="checkbox"
							checked={item.completed}
							disabled={rowPending || reordering || Boolean(editingId) || Boolean(operationRef.current)}
							aria-label={`${item.completed ? config.incompletionAction : config.completionAction}: ${item.text}`}
							onChange={(event) => toggleCompleted(item, event.currentTarget.checked)}
						/>
						<div class="lists-item__content">
							<div class="lists-item__title-row">
								<span class="lists-item__text">{item.text}</span>
								{item.completed && <span class="badge theme-success">{config.completedLabel}</span>}
							</div>
							{item.gardenId && (() => {
								const garden = state.gardens.find(({ id }) => id === item.gardenId);
								return garden ? <a class="lists-item__garden" href={`/gardens/${garden.id}`}>
									<i class="bi bi-tree" aria-hidden="true"></i>{gardenAssociationLabel(garden, state.locations)}
								</a> : null;
							})()}
							{kind === 'wishlist' && (item.quantity || item.notes || item.url) && (
								<div class="lists-item__details">
									{item.quantity && <span><strong>Quantity:</strong> {item.quantity}</span>}
									{item.notes && <span>{item.notes}</span>}
									{item.url && <a href={item.url} target="_blank" rel="noreferrer"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i>Product link</a>}
								</div>
							)}
						</div>
						<div class="lists-item__actions">
							<button class="btn-text lists-item__order" type="button" aria-label={`Move ${item.text} up`} title="Move up" disabled={index === 0 || reordering || Boolean(editingId) || Boolean(operationRef.current)} onClick={() => moveItem(collection, index, -1)}>
								<i class="bi bi-arrow-up" aria-hidden="true"></i>
							</button>
							<button class="btn-text lists-item__order" type="button" aria-label={`Move ${item.text} down`} title="Move down" disabled={index === collectionItems.length - 1 || reordering || Boolean(editingId) || Boolean(operationRef.current)} onClick={() => moveItem(collection, index, 1)}>
								<i class="bi bi-arrow-down" aria-hidden="true"></i>
							</button>
							<button id={`list-edit-${item.id}`} class="btn-text lists-item__edit" type="button" onClick={() => beginEdit(item)} disabled={rowPending || reordering || Boolean(editingId) || Boolean(operationRef.current)}>
								<i class="bi bi-pencil" aria-hidden="true"></i>Edit
							</button>
							<button class="btn-text theme-danger" type="button" onClick={() => deleteItem(item)} disabled={rowPending || reordering || Boolean(editingId) || Boolean(operationRef.current)}>
								<i class="bi bi-trash3" aria-hidden="true"></i>{rowPending ? 'Working…' : 'Delete'}
							</button>
						</div>
					</>
				)}
			</li>
		);
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

			<form class="lists-quick-add" autoComplete="off" noValidate onSubmit={addItem}>
				<label class="form-label" for="lists-quick-text">
					{config.quickLabel}
				</label>
				<div class="lists-quick-add__controls">
					<input
						id="lists-quick-text"
						class={`form-control${quickError ? ' is-invalid' : ''}`}
						type="text"
						autoComplete="off"
						maxlength="200"
						placeholder={config.quickPlaceholder}
						value={routePending ? '' : quickText}
						ref={quickInput}
						aria-invalid={quickError ? 'true' : undefined}
						aria-describedby={quickError ? 'lists-quick-text-error' : undefined}
						onInput={(event) => {
							setQuickText(event.currentTarget.value);
							setQuickError('');
						}}
						disabled={adding || routePending || Boolean(editingId) || Boolean(operationRef.current)}
					/>
					<button
						class="btn-solid theme-primary"
						type="submit"
						disabled={adding || routePending || Boolean(editingId) || Boolean(operationRef.current)}
					>
						<i class="bi bi-plus-lg" aria-hidden="true"></i>
						{adding ? 'Adding…' : config.addLabel}
					</button>
				</div>
				{quickError && <div id="lists-quick-text-error" class="invalid-feedback">{quickError}</div>}
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
				<div class="lists-collections">
					{collections.outstanding.length === 0 ? (
						<div class="lists-state lists-state--all-completed">
							<i class="bi bi-check2-circle" aria-hidden="true"></i>
							<h2>No outstanding items</h2>
							<p>All {kind === 'task' ? 'tasks are completed' : 'Wish List items are purchased'}.</p>
						</div>
					) : (
						<ol class="lists-list" ref={outstandingElement} aria-label={`Outstanding ${config.title}`}>
							{collections.outstanding.map((item, index) => renderListItem(item, 'outstanding', index))}
						</ol>
					)}
					{collections.completed.length > 0 && (
						<div class="accordion lists-accordion" data-lists-group={kind}>
							<details class="accordion-item" open={accordionExpanded} onToggle={(event) => toggleAccordion(event.currentTarget.open)}>
								<summary class="accordion-header">
									<span class="lists-accordion__label">{config.completedLabel}</span>
									<span class="lists-accordion__count" aria-label={`${collections.completed.length} ${kind === 'task' ? 'completed tasks' : 'purchased items'}`}>{collections.completed.length}</span>
								</summary>
								<div class="accordion-body">
									<ol class="lists-list" ref={completedElement} aria-label={config.completedLabel}>
										{collections.completed.map((item, index) => renderListItem(item, 'completed', index))}
									</ol>
								</div>
							</details>
						</div>
					)}
				</div>
			)}
		</section>
	);
}
