import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import { createNoteDraftsService, createNotesService } from '../../services/notes.js';
import { StorageError, ValidationError } from '../../storage/index.js';
import './style.css';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const STATUS_TEXT = { 'all-saved': 'All changes saved', saving: 'Saving draft…', 'draft-saved': 'Draft saved locally', error: 'Unable to save draft' };

function formatDate(value) {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? 'Update time unavailable' : dateFormatter.format(date);
}

function errorMessage(error, action) {
	if (error instanceof ValidationError) return error.message;
	if (error instanceof StorageError) return `Your Note could not be ${action}. Your existing data has not been discarded.`;
	return `Something unexpected prevented this Note from being ${action}.`;
}

function useNotesWorkspace() {
	const storage = useStorage();
	return useMemo(() => ({
		notes: createNotesService(storage.repositories.notes),
		drafts: createNoteDraftsService(storage.repositories.drafts),
	}), [storage]);
}

function NoteEditor({ record, draft, draftId, notes, drafts }) {
	const { route } = useLocation();
	const textarea = useRef(null);
	const baseline = record?.text ?? '';
	const createdAt = useRef(draft?.createdAt);
	const [text, setText] = useState(draft?.text ?? baseline);
	const [status, setStatus] = useState(draft?.text !== undefined && draft.text !== baseline ? 'draft-saved' : 'all-saved');
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);
	const dirty = text !== baseline;

	const autosave = useMemo(() => createDraftAutosave({
		write: async (value) => {
			if (value === null) {
				await drafts.remove(draftId);
				createdAt.current = undefined;
				return;
			}
			const saved = await drafts.save({ id: draftId, noteId: record?.id ?? null, text: value, createdAt: createdAt.current });
			createdAt.current = saved.createdAt;
		},
		onStatus: setStatus,
	}), [draftId, drafts, record?.id]);

	useEffect(() => {
		textarea.current?.focus();
		return () => { void autosave.flush(); };
	}, [autosave]);

	const save = async (event) => {
		event.preventDefault();
		if (!dirty || saving) return;
		setSaving(true);
		setError('');
		await autosave.flush();
		await autosave.stop();
		try {
			if (record) {
				if (!await notes.update(record.id, { text }, { draftId })) throw new Error('The Note no longer exists.');
			} else {
				await notes.create({ text, gardenId: null }, { draftId });
			}
			route('/notes', true);
		} catch (saveError) {
			setError(errorMessage(saveError, 'saved'));
			autosave.schedule(text);
			void autosave.flush();
			setSaving(false);
		}
	};

	const discard = async () => {
		if (!globalThis.confirm('Discard this recoverable draft?')) return;
		setError('');
		await autosave.stop();
		try {
			await drafts.remove(draftId);
			createdAt.current = undefined;
			if (record) {
				setText(baseline);
				setStatus('all-saved');
			} else route('/notes', true);
		} catch (discardError) {
			setError(errorMessage(discardError, 'discarded'));
			setStatus('error');
		}
	};

	return <div class="container notes-page notes-page--editing"><section class="note-editor" aria-labelledby="note-editor-title">
		<header class="note-editor__header"><p class="notes-page__eyebrow">{record ? 'Edit Note' : 'New Note'}</p><h1 id="note-editor-title">{record ? 'Update your Note' : 'Capture a Note'}</h1><p class={`note-editor__draft-status note-editor__draft-status--${status}`} role="status">{STATUS_TEXT[status]}</p></header>
		{error && <div class="notes-message notes-message--error" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{error}</span></div>}
		<form class="note-editor__form" onSubmit={save}>
			<div class="form-field"><label class="form-label" for="note-text">Note</label><textarea id="note-text" class="form-control note-editor__textarea" ref={textarea} rows="12" value={text} onInput={(event) => { const value = event.currentTarget.value; setText(value); setError(''); autosave.schedule(value === baseline ? null : value); }} aria-describedby="note-text-help note-draft-help"></textarea><p class="form-text" id="note-text-help">Plain text only. Line breaks and spacing are preserved.</p><p class="form-text" id="note-draft-help">Drafts stay local until you explicitly save the Note.</p></div>
			<div class="form-field"><label class="form-label" for="note-garden">Garden association</label><select id="note-garden" class="form-control" disabled><option>{record?.gardenId ? `Linked garden: ${record.gardenId}` : 'No garden'}</option></select></div>
			<div class="note-editor__actions note-editor__actions--split"><button class="btn-text theme-danger note-editor__button" type="button" onClick={discard} disabled={saving}>Discard draft</button><div class="note-editor__primary-actions"><button class="btn-outline note-editor__button" type="button" onClick={() => route('/notes', true)} disabled={saving}>Back to Notes</button><button class="btn-solid theme-primary note-editor__button" type="submit" disabled={!dirty || saving}><i class="bi bi-check2" aria-hidden="true"></i>{saving ? 'Saving…' : 'Save Note'}</button></div></div>
		</form>
	</section></div>;
}

function LoadingNote() { return <div class="container notes-page"><div class="notes-state" role="status"><p>Loading Note…</p></div></div>; }
function NoteLoadError({ message }) { return <div class="container notes-page"><div class="notes-state" role="alert"><h1>Note could not be opened</h1><p>{message}</p><a class="btn-solid theme-primary" href="/notes">Back to Saved Notes</a></div></div>; }

export function NewNote() {
	const { route } = useLocation();
	useEffect(() => { route(`/notes/new/${globalThis.crypto.randomUUID()}`, true); }, [route]);
	return <LoadingNote />;
}

export function NewNoteDraft({ params }) {
	const { drafts, notes } = useNotesWorkspace();
	const draftId = params?.draftId;
	const [state, setState] = useState({ status: 'loading' });
	useEffect(() => {
		let active = true;
		drafts.getById(draftId).then((draft) => active && setState({ status: 'ready', draft }), (loadError) => active && setState({ status: 'error', message: errorMessage(loadError, 'opened') }));
		return () => { active = false; };
	}, [draftId, drafts]);
	if (state.status === 'loading') return <LoadingNote />;
	if (state.status === 'error') return <NoteLoadError message={state.message} />;
	if (state.draft && !state.draft.isNew) return <NoteLoadError message="This draft does not belong to a new Note." />;
	return <NoteEditor key={draftId} record={null} draft={state.draft} draftId={draftId} notes={notes} drafts={drafts} />;
}

export function EditNote({ params }) {
	const { drafts, notes } = useNotesWorkspace();
	const noteId = params?.id;
	const [state, setState] = useState({ status: 'loading', noteId });
	useEffect(() => {
		let active = true;
		setState({ status: 'loading', noteId });
		Promise.all([notes.getById(noteId), drafts.getForNote(noteId)]).then(([record, draft]) => active && setState(record ? { status: 'ready', noteId, record, draft } : { status: 'missing', noteId }), (loadError) => active && setState({ status: 'error', noteId, message: errorMessage(loadError, 'opened') }));
		return () => { active = false; };
	}, [drafts, noteId, notes]);
	if (state.noteId !== noteId || state.status === 'loading') return <LoadingNote />;
	if (state.status === 'missing') return <NoteLoadError message="This Note may have been deleted or the address may be incorrect." />;
	if (state.status === 'error') return <NoteLoadError message={state.message} />;
	return <NoteEditor key={noteId} record={state.record} draft={state.draft} draftId={state.draft?.id ?? noteId} notes={notes} drafts={drafts} />;
}

export function Notes() {
	const { drafts, notes } = useNotesWorkspace();
	const [state, setState] = useState({ status: 'loading', notes: [], drafts: [] });
	const [deletingId, setDeletingId] = useState(null);
	const load = async () => {
		setState((current) => ({ ...current, status: 'loading' }));
		try { const [savedNotes, savedDrafts] = await Promise.all([notes.list(), drafts.list()]); setState({ status: 'ready', notes: savedNotes, drafts: savedDrafts }); }
		catch (loadError) { setState((current) => ({ ...current, status: 'error', message: errorMessage(loadError, 'loaded') })); }
	};
	useEffect(() => { void load(); }, [drafts, notes]);
	const deleteNote = async (note) => {
		if (!globalThis.confirm('Permanently delete this Note? This cannot be undone.')) return;
		setDeletingId(note.id);
		try { await notes.remove(note.id); await load(); }
		catch (deleteError) { setState((current) => ({ ...current, status: 'error', message: errorMessage(deleteError, 'deleted') })); }
		finally { setDeletingId(null); }
	};
	return <section class="container notes-page" aria-labelledby="notes-title"><header class="notes-page__header"><div><p class="notes-page__eyebrow">Garden observations</p><h1 id="notes-title">Notes</h1><p>Keep plain-text observations together, whether linked to a garden or not.</p></div><a class="btn-solid theme-primary notes-page__new" href="/notes/new"><i class="bi bi-plus-lg" aria-hidden="true"></i>New Note</a></header>
		{state.status === 'error' && <div class="notes-message notes-message--error" role="alert"><span>{state.message}</span><button class="btn-outline" type="button" onClick={load}>Retry</button></div>}
		{state.status === 'loading' ? <div class="notes-state" role="status"><p>Loading Notes…</p></div> : <>
			{state.drafts.length > 0 && <section class="notes-drafts" aria-labelledby="notes-drafts-title"><h2 id="notes-drafts-title">Unfinished drafts</h2><div class="notes-list">{state.drafts.map((draft) => <a class="note-card note-card--draft note-card__open" href={draft.isNew ? `/notes/new/${draft.id}` : `/notes/${draft.subjectId}`} key={draft.id}><span class="note-card__preview">{draft.text || 'Empty draft'}</span><span class="note-card__metadata">Draft saved {formatDate(draft.updatedAt)}</span></a>)}</div></section>}
			{state.notes.length === 0 ? <div class="notes-state"><h2>No saved Notes yet</h2><p>Start a new Note or return to an unfinished draft.</p></div> : <div class="notes-list" aria-label="Saved Notes">{state.notes.map((note) => <article class="note-card" key={note.id}><a class="note-card__open" href={`/notes/${note.id}`}><span class="note-card__preview">{note.text}</span><span class="note-card__metadata">Updated {formatDate(note.updatedAt)}</span></a><button class="btn-text theme-danger note-card__delete" type="button" onClick={() => deleteNote(note)} disabled={deletingId === note.id}><i class="bi bi-trash3" aria-hidden="true"></i>{deletingId === note.id ? 'Deleting…' : 'Delete'}</button></article>)}</div>}
		</>}
	</section>;
}
