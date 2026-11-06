import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useNavigationGuard } from '../../context/NavigationGuardContext.jsx';
import { useStorage } from '../../context/StorageContext.jsx';
import { createNotesService } from '../../services/notes.js';
import { StorageError, ValidationError } from '../../storage/index.js';
import './style.css';

const updatedDateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
});

function formatUpdatedDate(value) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? 'Update time unavailable'
		: updatedDateFormatter.format(date);
}

function getErrorMessage(error, action) {
	if (error instanceof ValidationError) {
		return error.message;
	}

	if (error instanceof StorageError) {
		return `Your Note could not be ${action}. Your existing data has not been discarded.`;
	}

	return `Something unexpected prevented this Note from being ${action}.`;
}

function useUnsavedNavigationWarning(isDirty) {
	const navigationGuard = useNavigationGuard();

	useEffect(() => {
		if (!isDirty) {
			return undefined;
		}

		const handleBeforeUnload = (event) => {
			event.preventDefault();
			event.returnValue = '';
		};
		const handleLinkClick = (event) => {
			const anchor = event
				.composedPath()
				.find((element) => element instanceof HTMLAnchorElement);

			if (
				!anchor ||
				anchor.origin !== globalThis.location.origin ||
				anchor.pathname === globalThis.location.pathname
			) {
				return;
			}

			if (!globalThis.confirm('Discard your unsaved Note and leave this page?')) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		};

		globalThis.addEventListener('beforeunload', handleBeforeUnload);
		globalThis.addEventListener('click', handleLinkClick, true);
		const removeHistoryBlocker = navigationGuard.setBlocker(() => true);

		return () => {
			globalThis.removeEventListener('beforeunload', handleBeforeUnload);
			globalThis.removeEventListener('click', handleLinkClick, true);
			removeHistoryBlocker();
		};
	}, [isDirty, navigationGuard]);
}

function NoteEditor({ record, onCancel, onSaved, service }) {
	const textarea = useRef(null);
	const [text, setText] = useState(record?.text ?? '');
	const [errorMessage, setErrorMessage] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const initialText = record?.text ?? '';
	const isDirty = text !== initialText;

	useUnsavedNavigationWarning(isDirty);

	useEffect(() => {
		textarea.current?.focus();
	}, []);

	const cancel = () => {
		if (
			isDirty &&
			!globalThis.confirm('Discard the changes to this Note?')
		) {
			return;
		}

		onCancel();
	};

	const save = async (event) => {
		event.preventDefault();
		if (!isDirty || isSaving) {
			return;
		}

		setIsSaving(true);
		setErrorMessage('');

		try {
			if (record) {
				const savedChanges = await service.update(record.id, { text });
				if (!savedChanges) {
					setErrorMessage('This Note could not be found. Return to the list and reload Notes.');
					return;
				}

				onSaved({ ...record, ...savedChanges });
			} else {
				onSaved(await service.create({ text, gardenId: null }));
			}
		} catch (error) {
			setErrorMessage(getErrorMessage(error, 'saved'));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<section class="note-editor" aria-labelledby="note-editor-title">
			<header class="note-editor__header">
				<div>
					<p class="notes-page__eyebrow">{record ? 'Edit Note' : 'New Note'}</p>
					<h1 id="note-editor-title">
						{record ? 'Update your Note' : 'Capture a Note'}
					</h1>
				</div>
			</header>

			{errorMessage && (
				<div class="notes-message notes-message--error" role="alert">
					<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
					<span>{errorMessage}</span>
				</div>
			)}

			<form class="note-editor__form" onSubmit={save}>
				<div class="form-field">
					<label class="form-label" for="note-text">Note</label>
					<textarea
						id="note-text"
						class="form-control note-editor__textarea"
						ref={textarea}
						rows="12"
						value={text}
						onInput={(event) => {
							setText(event.currentTarget.value);
							setErrorMessage('');
						}}
						aria-describedby="note-text-help"
					></textarea>
					<p class="form-text" id="note-text-help">
						Plain text only. Line breaks and spacing are preserved.
					</p>
				</div>

				<div class="form-field">
					<label class="form-label" for="note-garden">Garden association</label>
					<select
						id="note-garden"
						class="form-control"
						disabled
						aria-describedby="note-garden-help"
					>
						<option>
							{record?.gardenId
								? `Linked garden: ${record.gardenId}`
								: 'No garden'}
						</option>
					</select>
					<p class="form-text" id="note-garden-help">
						Garden linking will become available after Gardens can be created.
					</p>
				</div>

				<div class="note-editor__actions">
					<button
						class="btn-outline note-editor__button"
						type="button"
						onClick={cancel}
						disabled={isSaving}
					>
						Cancel
					</button>
					<button
						class="btn-solid theme-primary note-editor__button"
						type="submit"
						disabled={!isDirty || isSaving}
					>
						<i class="bi bi-check2" aria-hidden="true"></i>
						{isSaving ? 'Saving…' : 'Save Note'}
					</button>
				</div>
			</form>
		</section>
	);
}

function useNotesService() {
	const storage = useStorage();
	return useMemo(
		() => createNotesService(storage.repositories.notes),
		[storage],
	);
}

function NotesEditorPage({ record, service }) {
	const { route } = useLocation();
	const returnToNotes = () => route('/notes', true);

	return (
		<div class="container notes-page notes-page--editing">
			<NoteEditor
				key={record?.id ?? 'new'}
				record={record}
				onCancel={returnToNotes}
				onSaved={returnToNotes}
				service={service}
			/>
		</div>
	);
}

export function NewNote() {
	const service = useNotesService();
	return <NotesEditorPage record={null} service={service} />;
}

export function EditNote({ params }) {
	const service = useNotesService();
	const noteId = params?.id;
	const [loadState, setLoadState] = useState({ status: 'loading', noteId });
	const [loadAttempt, setLoadAttempt] = useState(0);

	useEffect(() => {
		let active = true;
		setLoadState({ status: 'loading', noteId });

		service.getById(noteId).then(
			(record) => {
				if (!active) {
					return;
				}

				setLoadState(record
					? { status: 'ready', noteId, record }
					: { status: 'missing', noteId });
			},
			(error) => {
				if (!active) {
					return;
				}

				setLoadState({
					status: 'error',
					noteId,
					message: error instanceof ValidationError
						? 'This Note address is invalid.'
						: getErrorMessage(error, 'opened'),
				});
			},
		);

		return () => {
			active = false;
		};
	}, [loadAttempt, noteId, service]);

	if (loadState.noteId === noteId && loadState.status === 'ready') {
		return (
			<NotesEditorPage
				key={loadState.record.id}
				record={loadState.record}
				service={service}
			/>
		);
	}

	if (loadState.noteId !== noteId || loadState.status === 'loading') {
		return (
			<div class="container notes-page">
				<div class="notes-state" role="status">
					<i class="bi bi-hourglass-split" aria-hidden="true"></i>
					<p>Loading Note…</p>
				</div>
			</div>
		);
	}

	const isMissing = loadState.status === 'missing';
	return (
		<div class="container notes-page">
			<div class="notes-state" role="alert">
				<span class="notes-state__icon" aria-hidden="true">
					<i class={`bi bi-${isMissing ? 'journal-x' : 'exclamation-triangle'}`}></i>
				</span>
				<h1>{isMissing ? 'Note not found' : 'Note could not be opened'}</h1>
				<p>
					{isMissing
						? 'This Note may have been deleted or the address may be incorrect.'
						: loadState.message}
				</p>
				<div class="note-editor__actions">
					{!isMissing && (
						<button
							class="btn-outline note-editor__button"
							type="button"
							onClick={() => setLoadAttempt((attempt) => attempt + 1)}
						>
							Retry
						</button>
					)}
					<a class="btn-solid theme-primary note-editor__button" href="/notes">
						Back to Saved Notes
					</a>
				</div>
			</div>
		</div>
	);
}

export function Notes() {
	const service = useNotesService();
	const [notes, setNotes] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [deletingId, setDeletingId] = useState(null);

	const loadNotes = async () => {
		setIsLoading(true);
		setErrorMessage('');

		try {
			setNotes(await service.list());
		} catch (error) {
			setErrorMessage(getErrorMessage(error, 'loaded'));
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		let active = true;

		service.list().then(
			(loadedNotes) => {
				if (active) {
					setNotes(loadedNotes);
					setIsLoading(false);
				}
			},
			(error) => {
				if (active) {
					setErrorMessage(getErrorMessage(error, 'loaded'));
					setIsLoading(false);
				}
			},
		);

		return () => {
			active = false;
		};
	}, [service]);

	const deleteNote = async (note) => {
		if (!globalThis.confirm('Permanently delete this Note? This cannot be undone.')) {
			return;
		}

		setDeletingId(note.id);
		setErrorMessage('');

		try {
			if (!(await service.remove(note.id))) {
				setErrorMessage('This Note could not be found. Reload Notes before trying again.');
				return;
			}

			setNotes((current) => current.filter(({ id }) => id !== note.id));
		} catch (error) {
			setErrorMessage(getErrorMessage(error, 'deleted'));
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<section class="container notes-page" aria-labelledby="notes-title">
			<header class="notes-page__header">
				<div>
					<p class="notes-page__eyebrow">Garden observations</p>
					<h1 id="notes-title">Notes</h1>
					<p>Keep plain-text observations together, whether linked to a garden or not.</p>
				</div>
				<a
					class="btn-solid theme-primary notes-page__new"
					href="/notes/new"
				>
					<i class="bi bi-plus-lg" aria-hidden="true"></i>
					New Note
				</a>
			</header>

			{errorMessage && (
				<div class="notes-message notes-message--error" role="alert">
					<i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
					<span>{errorMessage}</span>
					<button class="btn-outline" type="button" onClick={loadNotes}>
						Retry
					</button>
				</div>
			)}

			{isLoading ? (
				<div class="notes-state" role="status">
					<i class="bi bi-hourglass-split" aria-hidden="true"></i>
					<p>Loading Notes…</p>
				</div>
			) : notes.length === 0 ? (
				<div class="notes-state">
					<span class="notes-state__icon" aria-hidden="true">
						<i class="bi bi-journal-plus"></i>
					</span>
					<h2>No Notes yet</h2>
					<p>Capture an observation, reminder, or idea from your garden.</p>
					<a
						class="btn-solid theme-primary notes-state__action"
						href="/notes/new"
					>
						Create your first Note
					</a>
				</div>
			) : (
				<div class="notes-list" aria-label="Saved Notes">
					{notes.map((note) => (
						<article class="note-card" key={note.id}>
							<a
								class="note-card__open"
								href={`/notes/${note.id}`}
							>
								<span class="note-card__preview">{note.text}</span>
								<span class="note-card__metadata">
									<span>Updated {formatUpdatedDate(note.updatedAt)}</span>
									{note.gardenId && (
										<span class="note-card__garden">
											<i class="bi bi-link-45deg" aria-hidden="true"></i>
											Linked garden
										</span>
									)}
								</span>
							</a>
							<button
								class="btn-text theme-danger note-card__delete"
								type="button"
								onClick={() => deleteNote(note)}
								disabled={deletingId === note.id}
							>
								<i class="bi bi-trash3" aria-hidden="true"></i>
								{deletingId === note.id ? 'Deleting…' : 'Delete'}
							</button>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

