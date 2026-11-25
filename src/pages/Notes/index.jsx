import { createUUID } from '../../utils/uuid.js';
import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { GardenAssociationSelector } from '../../components/GardenAssociationSelector.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import { createGardensService } from '../../services/gardens.js';
import { createLocationsService } from '../../services/locations.js';
import {
	readNotesAccordionPreference, writeNotesAccordionPreference,
} from '../../services/notesAccordionPreference.js';
import { createNoteDraftsService, createNotesService } from '../../services/notes.js';
import { StorageError, ValidationError } from '../../storage/errors.js';
import { prepareNotesWorkspace } from './workspace.js';
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
		gardens: createGardensService(storage.repositories.gardens),
		locations: createLocationsService(storage.repositories.locations),
	}), [storage]);
}

function NoteEditor({ record, draft, draftId, notes, drafts, gardens, locations }) {
	const { route } = useLocation();
	const textarea = useRef(null);
	const baseline = record?.text ?? '';
	const createdAt = useRef(draft?.createdAt);
	const [text, setText] = useState(draft?.text ?? baseline);
	const [gardenId, setGardenId] = useState(record?.gardenId ?? null);
	const [status, setStatus] = useState(draft?.text !== undefined && draft.text !== baseline ? 'draft-saved' : 'all-saved');
	const [error, setError] = useState('');
	const [saving, setSaving] = useState(false);
	const textDirty = text !== baseline;
	const associationDirty = gardenId !== (record?.gardenId ?? null);
	const dirty = textDirty || associationDirty;
	const canSave = dirty && (record !== null || text.trim().length > 0);

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
		if (!canSave || saving) return;
		setSaving(true);
		setError('');
		await autosave.flush();
		await autosave.stop();
		try {
			if (record) {
				const changes = {
					...(textDirty ? { text } : {}),
					...(associationDirty ? { gardenId } : {}),
				};
				if (!await notes.update(record.id, changes, textDirty ? { draftId } : {})) throw new Error('The Note no longer exists.');
			} else {
				await notes.create({ text, gardenId }, { draftId });
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
			<GardenAssociationSelector id="note-garden" value={gardenId} gardens={gardens} locations={locations} onChange={(value) => { setGardenId(value); setError(''); }} disabled={saving} />
			<div class="note-editor__actions note-editor__actions--split"><button class="btn-text theme-danger note-editor__button" type="button" onClick={discard} disabled={saving}>Discard draft</button><div class="note-editor__primary-actions"><button class="btn-outline note-editor__button" type="button" onClick={() => route('/notes', true)} disabled={saving}>Back to Notes</button><button class="btn-solid theme-primary note-editor__button" type="submit" disabled={!canSave || saving}><i class="bi bi-check2" aria-hidden="true"></i>{saving ? 'Saving…' : 'Save Note'}</button></div></div>
		</form>
	</section></div>;
}

function LoadingNote() { return <div class="container notes-page"><div class="notes-state" role="status"><p>Loading Note…</p></div></div>; }
function NoteLoadError({ message }) { return <div class="container notes-page"><div class="notes-state" role="alert"><h1>Note could not be opened</h1><p>{message}</p><a class="btn-solid theme-primary" href="/notes">Back to Saved Notes</a></div></div>; }

export function NewNote() {
	const { route } = useLocation();
	useEffect(() => { route(`/notes/new/${createUUID()}`, true); }, [route]);
	return <LoadingNote />;
}

export function NewNoteDraft({ params }) {
	const { drafts, notes, gardens, locations } = useNotesWorkspace();
	const draftId = params?.draftId;
	const [state, setState] = useState({ status: 'loading' });
	useEffect(() => {
		let active = true;
		Promise.all([drafts.getById(draftId), gardens.list(), locations.list()]).then(([draft, gardenRecords, locationRecords]) => active && setState({ status: 'ready', draft, gardens: gardenRecords, locations: locationRecords }), (loadError) => active && setState({ status: 'error', message: errorMessage(loadError, 'opened') }));
		return () => { active = false; };
	}, [draftId, drafts, gardens, locations]);
	if (state.status === 'loading') return <LoadingNote />;
	if (state.status === 'error') return <NoteLoadError message={state.message} />;
	if (state.draft && !state.draft.isNew) return <NoteLoadError message="This draft does not belong to a new Note." />;
	return <NoteEditor key={draftId} record={null} draft={state.draft} draftId={draftId} notes={notes} drafts={drafts} gardens={state.gardens} locations={state.locations} />;
}

export function EditNote({ params }) {
	const { drafts, notes, gardens, locations } = useNotesWorkspace();
	const noteId = params?.id;
	const [state, setState] = useState({ status: 'loading', noteId });
	useEffect(() => {
		let active = true;
		setState({ status: 'loading', noteId });
		Promise.all([notes.getById(noteId), drafts.getForNote(noteId), gardens.list(), locations.list()]).then(([record, draft, gardenRecords, locationRecords]) => active && setState(record ? { status: 'ready', noteId, record, draft, gardens: gardenRecords, locations: locationRecords } : { status: 'missing', noteId }), (loadError) => active && setState({ status: 'error', noteId, message: errorMessage(loadError, 'opened') }));
		return () => { active = false; };
	}, [drafts, gardens, locations, noteId, notes]);
	if (state.noteId !== noteId || state.status === 'loading') return <LoadingNote />;
	if (state.status === 'missing') return <NoteLoadError message="This Note may have been deleted or the address may be incorrect." />;
	if (state.status === 'error') return <NoteLoadError message={state.message} />;
	return <NoteEditor key={noteId} record={state.record} draft={state.draft} draftId={state.draft?.id ?? noteId} notes={notes} drafts={drafts} gardens={state.gardens} locations={state.locations} />;
}

function AccordionIcon() {
	return <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 5 6 6 6-6" /></svg>;
}

function NoteCard({ note, deleting, onDelete }) {
	return <article class="note-card"><a class="note-card__open" href={`/notes/${note.id}`}><span class="note-card__preview">{note.text}</span><span class="note-card__metadata">Updated {formatDate(note.updatedAt)}</span></a><button class="btn-text theme-danger note-card__delete" type="button" onClick={() => onDelete(note)} disabled={deleting}><i class="bi bi-trash3" aria-hidden="true"></i>{deleting ? 'Deleting…' : 'Delete'}</button></article>;
}

export function NotesAccordion({ label, notes, expanded, emptyMessage, groupId, deletingId, onDelete, onToggle }) {
	return <div class="accordion notes-accordion" data-notes-group={groupId}>
		<details class="accordion-item" open={expanded} onToggle={(event) => onToggle(event.currentTarget.open)}>
			<summary class="accordion-header"><span class="notes-accordion__label">{label}</span><span class="notes-accordion__count" aria-label={`${notes.length} ${notes.length === 1 ? 'Note' : 'Notes'}`}>{notes.length}</span><AccordionIcon /></summary>
			<div class="accordion-body">{notes.length > 0
				? <div class="notes-list">{notes.map((note) => <NoteCard note={note} deleting={deletingId === note.id} onDelete={onDelete} key={note.id} />)}</div>
				: <p class="notes-accordion__empty">{emptyMessage}</p>}
			</div>
		</details>
	</div>;
}

export function NotesWorkspaceView({ state, filter, filterRef, preference, deletingId, onDelete, onFilter, onClearFilter, onToggleNotes, onToggleGarden }) {
	const workspace = prepareNotesWorkspace(state.notes, state.drafts, state.gardens, filter);
	const noResults = workspace.filtering && !workspace.hasResults;
	return <>
		<div class="notes-filter"><label class="form-label" for="notes-filter">Filter Notes</label><div class="notes-filter__controls"><input id="notes-filter" class="form-control" type="search" ref={filterRef} value={filter} onInput={(event) => onFilter(event.currentTarget.value)} placeholder="Search Note text or Garden name" />{workspace.filtering && <button class="btn-outline notes-filter__clear" type="button" onClick={onClearFilter}>Clear filter</button>}</div></div>
		{state.drafts.length > 0 && workspace.drafts.length > 0 && <section class="notes-drafts" aria-labelledby="notes-drafts-title"><h2 id="notes-drafts-title">Unfinished drafts</h2><div class="notes-list">{workspace.drafts.map((draft) => <a class="note-card note-card--draft note-card__open" href={draft.isNew ? `/notes/new/${draft.id}` : `/notes/${draft.subjectId}`} key={draft.id}><span class="note-card__preview">{draft.text || 'Empty draft'}</span><span class="note-card__metadata">Draft saved {formatDate(draft.updatedAt)}</span></a>)}</div></section>}
		{noResults ? <div class="notes-state notes-state--no-results"><i class="bi bi-search notes-state__icon" aria-hidden="true"></i><h2>No matching Notes</h2><p>No saved Notes or unfinished drafts match “{filter.trim()}”.</p><button class="btn-outline notes-state__action" type="button" onClick={onClearFilter}>Clear filter</button></div> : <div class="notes-groups" aria-label="Saved Notes">
			<NotesAccordion
				label="Notes" notes={workspace.applicationNotes} groupId="notes"
				expanded={workspace.filtering && workspace.applicationNotes.length > 0 ? true : preference.notes}
				emptyMessage={workspace.filtering ? 'No application-level Notes match this filter.' : 'No application-level Notes yet. New Notes without a Garden association will appear here.'}
				deletingId={deletingId} onDelete={onDelete}
				onToggle={(expanded) => { if (!workspace.filtering) onToggleNotes(expanded); }}
			/>
			{workspace.gardenGroups.length > 0 && <section class="notes-gardens" aria-labelledby="notes-gardens-title"><h2 id="notes-gardens-title">Gardens</h2><div class="notes-gardens__groups">{workspace.gardenGroups.map(({ garden, notes }) => <NotesAccordion
				label={garden.name} notes={notes} groupId={garden.id} key={garden.id}
				expanded={workspace.filtering ? true : (preference.gardens[garden.id] ?? false)}
				emptyMessage="" deletingId={deletingId} onDelete={onDelete}
				onToggle={(expanded) => { if (!workspace.filtering) onToggleGarden(garden.id, expanded); }}
			/>)}</div></section>}
		</div>}
	</>;
}

export function Notes() {
	const { drafts, notes, gardens } = useNotesWorkspace();
	const filterInput = useRef(null);
	const [state, setState] = useState({ status: 'loading', notes: [], drafts: [], gardens: [] });
	const [deletingId, setDeletingId] = useState(null);
	const [filter, setFilter] = useState('');
	const [preference, setPreference] = useState(readNotesAccordionPreference);
	const load = async () => {
		setState((current) => ({ ...current, status: 'loading' }));
		try { const [savedNotes, savedDrafts, savedGardens] = await Promise.all([notes.list(), drafts.list(), gardens.list()]); setState({ status: 'ready', notes: savedNotes, drafts: savedDrafts, gardens: savedGardens }); }
		catch (loadError) { setState((current) => ({ ...current, status: 'error', message: errorMessage(loadError, 'loaded') })); }
	};
	useEffect(() => { void load(); }, [drafts, gardens, notes]);
	const updatePreference = (change) => {
		if (filter.trim()) return;
		setPreference((current) => {
			const next = change(current);
			writeNotesAccordionPreference(next);
			return next;
		});
	};
	const clearFilter = () => {
		setFilter('');
		filterInput.current?.focus();
	};
	const deleteNote = async (note) => {
		if (!globalThis.confirm('Permanently delete this Note? This cannot be undone.')) return;
		setDeletingId(note.id);
		try { await notes.remove(note.id); await load(); }
		catch (deleteError) { setState((current) => ({ ...current, status: 'error', message: errorMessage(deleteError, 'deleted') })); }
		finally { setDeletingId(null); }
	};
	return <section class="container notes-page" aria-labelledby="notes-title"><header class="notes-page__header"><div><p class="notes-page__eyebrow">Garden observations</p><h1 id="notes-title">Notes</h1><p>Keep plain-text observations together, whether linked to a garden or not.</p></div><a class="btn-solid theme-primary notes-page__new" href="/notes/new"><i class="bi bi-plus-lg" aria-hidden="true"></i>New Note</a></header>
		{state.status === 'error' && <div class="notes-message notes-message--error" role="alert"><span>{state.message}</span><button class="btn-outline" type="button" onClick={load}>Retry</button></div>}
		{state.status === 'loading' ? <div class="notes-state" role="status"><p>Loading Notes…</p></div> : <div><NotesWorkspaceView
			state={state} filter={filter} filterRef={filterInput} preference={preference} deletingId={deletingId}
			onDelete={deleteNote} onFilter={setFilter} onClearFilter={clearFilter}
			onToggleNotes={(expanded) => updatePreference((current) => ({ ...current, notes: expanded }))}
			onToggleGarden={(gardenId, expanded) => updatePreference((current) => ({ ...current, gardens: { ...current.gardens, [gardenId]: expanded } }))}
		/></div>}
	</section>;
}
