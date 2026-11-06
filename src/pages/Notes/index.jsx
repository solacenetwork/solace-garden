import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { createNotesService } from '../../services/notes.js';
import { StorageError, ValidationError } from '../../storage/index.js';
import './style.css';

const updatedDateFormatter = new Intl.DateTimeFormat(undefined, {
	dateStyle: 'medium',
	timeStyle: 'short',
});

function sortNotes(notes) {
	return [...notes].sort((first, second) =>
		String(second.updatedAt ?? '').localeCompare(String(first.updatedAt ?? '')),
	);
}

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

		return () => {
			globalThis.removeEventListener('beforeunload', handleBeforeUnload);
			globalThis.removeEventListener('click', handleLinkClick, true);
		};
	}, [isDirty]);
}

function NoteEditor({ editor, onCancel, onSaved, service }) {
	const textarea = useRef(null);
	const [text, setText] = useState(editor.record?.text ?? '');
	const [errorMessage, setErrorMessage] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const initialText = editor.record?.text ?? '';
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
			if (editor.record) {
				const savedChanges = await service.update(editor.record.id, { text });
				if (!savedChanges) {
					setErrorMessage('This Note could not be found. Return to the list and reload Notes.');
					return;
				}

				onSaved({ ...editor.record, ...savedChanges });
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
					<p class="notes-page__eyebrow">{editor.record ? 'Edit Note' : 'New Note'}</p>
					<h1 id="note-editor-title">
						{editor.record ? 'Update your Note' : 'Capture a Note'}
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
							{editor.record?.gardenId
								? `Linked garden: ${editor.record.gardenId}`
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

export function Notes() {
	const storage = useStorage();
	const service = useMemo(
		() => createNotesService(storage.repositories.notes),
		[storage],
	);
	const [notes, setNotes] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState('');
	const [notice, setNotice] = useState('');
	const [editor, setEditor] = useState(null);
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

	const saveNote = (savedNote) => {
		setNotes((current) =>
			sortNotes([
				savedNote,
				...current.filter((note) => note.id !== savedNote.id),
			]),
		);
		setEditor(null);
		setNotice('Note saved.');
		setErrorMessage('');
	};

	const deleteNote = async (note) => {
		if (!globalThis.confirm('Permanently delete this Note? This cannot be undone.')) {
			return;
		}

		setDeletingId(note.id);
		setErrorMessage('');
		setNotice('');

		try {
			if (!(await service.remove(note.id))) {
				setErrorMessage('This Note could not be found. Reload Notes before trying again.');
				return;
			}

			setNotes((current) => current.filter(({ id }) => id !== note.id));
			setNotice('Note deleted.');
		} catch (error) {
			setErrorMessage(getErrorMessage(error, 'deleted'));
		} finally {
			setDeletingId(null);
		}
	};

	if (editor) {
		return (
			<div class="container notes-page notes-page--editing">
				<NoteEditor
					editor={editor}
					onCancel={() => setEditor(null)}
					onSaved={saveNote}
					service={service}
				/>
			</div>
		);
	}

	return (
		<section class="container notes-page" aria-labelledby="notes-title">
			<header class="notes-page__header">
				<div>
					<p class="notes-page__eyebrow">Garden observations</p>
					<h1 id="notes-title">Notes</h1>
					<p>Keep plain-text observations together, whether linked to a garden or not.</p>
				</div>
				<button
					class="btn-solid theme-primary notes-page__new"
					type="button"
					onClick={() => {
						setEditor({ record: null });
						setNotice('');
					}}
				>
					<i class="bi bi-plus-lg" aria-hidden="true"></i>
					New Note
				</button>
			</header>

			{notice && (
				<div class="notes-message notes-message--success" role="status">
					<i class="bi bi-check-circle" aria-hidden="true"></i>
					<span>{notice}</span>
				</div>
			)}
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
					<button
						class="btn-solid theme-primary notes-state__action"
						type="button"
						onClick={() => setEditor({ record: null })}
					>
						Create your first Note
					</button>
				</div>
			) : (
				<div class="notes-list" aria-label="Saved Notes">
					{notes.map((note) => (
						<article class="note-card" key={note.id}>
							<button
								class="note-card__open"
								type="button"
								onClick={() => {
									setEditor({ record: note });
									setNotice('');
								}}
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
							</button>
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

