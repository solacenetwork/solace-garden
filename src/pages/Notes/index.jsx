import { createUUID } from '../../utils/uuid.js';
import { useLocation } from 'preact-iso';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useStorage } from '../../context/StorageContext.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { GardenAssociationSelector } from '../../components/GardenAssociationSelector.jsx';
import { createDraftAutosave } from '../../services/draftAutosave.js';
import { createGardensService } from '../../services/gardens.js';
import { createLocationsService } from '../../services/locations.js';
import {
	createNoteDraftPersistence, noteDraftFieldsEqual, noteDraftMatches,
} from '../../services/noteDraftLifecycle.js';
import {
	consumeNoteDraftReturnContext, replaceNoteDraftUrl, setNoteDraftReturnContext,
} from '../../services/noteDraftNavigation.js';
import {
	readNotesAccordionPreference, writeNotesAccordionPreference,
} from '../../services/notesAccordionPreference.js';
import { createNoteDraftsService, createNotesService } from '../../services/notes.js';
import { StorageError, ValidationError } from '../../storage/errors.js';
import { prepareNotesWorkspace } from './workspace.js';
import './style.css';

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const STATUS_TEXT = { pristine: 'Your first change will start a local draft', 'all-saved': 'All changes saved', saving: 'Saving draft…', 'draft-saved': 'Draft saved locally', error: 'Unable to save draft' };

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

export function revealNoteFeedback(field, {
	documentObject = globalThis.document,
	viewport = globalThis,
} = {}) {
	const ids = { text: 'note-text', gardenId: 'note-garden' };
	const element = documentObject?.getElementById?.(ids[field] ?? 'note-save-error');
	if (!element) return false;
	const rect = element.getBoundingClientRect?.();
	const headerBottom = documentObject?.querySelector?.('.app-header')?.getBoundingClientRect?.().bottom ?? 0;
	if (rect && (rect.top < headerBottom || rect.bottom > (viewport.innerHeight ?? Number.POSITIVE_INFINITY))) {
		element.scrollIntoView?.({
			behavior: viewport.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 'auto' : 'smooth',
			block: 'center',
			inline: 'nearest',
		});
	}
	element.focus?.({ preventScroll: true });
	return true;
}

export function NoteEditor({ record, draft, requestedDraftId, isFreshRoute = false, notes, drafts, gardens, locations }) {
	const { route } = useLocation();
	const textarea = useRef(null);
	const recoveredGardenUnavailable = Boolean(
		draft?.gardenId && !gardens.some(({ id }) => id === draft.gardenId),
	);
	const baseline = useRef({ text: record?.text ?? '', gardenId: record?.gardenId ?? null }).current;
	const initialFields = useRef(draft
		? { text: draft.text, gardenId: recoveredGardenUnavailable ? null : draft.gardenId }
		: { ...baseline }).current;
	const draftId = useRef(draft?.id ?? requestedDraftId ?? createUUID()).current;
	const fieldsRef = useRef(initialFields);
	const pendingFeedbackField = useRef(undefined);
	const [text, setText] = useState(initialFields.text);
	const [gardenId, setGardenId] = useState(initialFields.gardenId);
	const [status, setStatus] = useState(draft ? 'draft-saved' : (record ? 'all-saved' : 'pristine'));
	const [error, setError] = useState('');
	const [autosaveError, setAutosaveError] = useState('');
	const [saving, setSaving] = useState(false);
	const [establishedId, setEstablishedId] = useState(draft?.id ?? null);
	const [feedbackRequest, setFeedbackRequest] = useState(0);
	const textDirty = text !== baseline.text;
	const associationDirty = gardenId !== baseline.gardenId;
	const dirty = textDirty || associationDirty;
	const canSave = dirty && !saving;

	const persistence = useMemo(() => createNoteDraftPersistence({
		drafts,
		draftId,
		noteId: record?.id ?? null,
		baseline,
		initialDraft: draft,
		onEstablished: (saved) => {
			setEstablishedId(saved.id);
			if (isFreshRoute) replaceNoteDraftUrl(`/notes/new/${saved.id}`);
		},
	}), [draft?.id, drafts, record?.id]);

	const autosave = useMemo(() => createDraftAutosave({
		write: async (value) => {
			const saved = await persistence.persist(value ?? baseline);
			setEstablishedId(saved?.id ?? null);
		},
		onStatus: (nextStatus, saveError) => {
			setStatus(nextStatus);
			if (saveError) setAutosaveError('Your latest changes could not be saved as a recoverable draft. They remain in this editor; try again before leaving.');
			else if (nextStatus === 'draft-saved' || nextStatus === 'all-saved') setAutosaveError('');
		},
	}), [persistence]);

	useEffect(() => {
		if (!recoveredGardenUnavailable) return;
		autosave.schedule(noteDraftFieldsEqual(initialFields, baseline) ? null : initialFields);
	}, [autosave, recoveredGardenUnavailable]);

	useEffect(() => {
		textarea.current?.focus();
		const flushBeforeReload = () => { void autosave.flush(); };
		globalThis.addEventListener?.('beforeunload', flushBeforeReload);
		return () => {
			globalThis.removeEventListener?.('beforeunload', flushBeforeReload);
			void autosave.flush();
		};
	}, [autosave]);

	useEffect(() => {
		if (!feedbackRequest || saving || pendingFeedbackField.current === undefined) return;
		const field = pendingFeedbackField.current;
		pendingFeedbackField.current = undefined;
		revealNoteFeedback(field);
	}, [feedbackRequest, saving]);

	function scheduleFields(next) {
		fieldsRef.current = next;
		autosave.schedule(noteDraftFieldsEqual(next, baseline) ? null : next);
	}

	function showSaveError(message, field = null) {
		setError(message);
		pendingFeedbackField.current = field;
		setFeedbackRequest((current) => current + 1);
	}

	const save = async (event) => {
		event.preventDefault();
		if (!dirty || saving) return;
		const snapshot = { ...fieldsRef.current };
		if (!snapshot.text.trim()) {
			textarea.current?.setCustomValidity('Enter Note text before saving.');
			showSaveError('Enter Note text before saving.', 'text');
			return;
		}
		textarea.current?.setCustomValidity('');
		setSaving(true);
		setError('');
		await autosave.flush();
		await autosave.stop();
		try {
			const activeDraftId = persistence.getRecord()?.id;
			if (record) {
				const changes = {
					...(snapshot.text !== baseline.text ? { text: snapshot.text } : {}),
					...(snapshot.gardenId !== baseline.gardenId ? { gardenId: snapshot.gardenId } : {}),
				};
				if (!await notes.update(record.id, changes, activeDraftId ? { draftId: activeDraftId } : {})) throw new Error('The Note no longer exists.');
			} else {
				await notes.create(snapshot, activeDraftId ? { draftId: activeDraftId } : {});
			}
			route('/notes', true);
		} catch (saveError) {
			setSaving(false);
			showSaveError(errorMessage(saveError, 'saved'), ['text', 'gardenId'].includes(saveError?.field) ? saveError.field : null);
			autosave.schedule(snapshot);
			void autosave.flush();
		}
	};

	const discard = async () => {
		if (!globalThis.confirm('Discard this recoverable draft?')) return;
		const snapshot = { ...fieldsRef.current };
		setSaving(true);
		setError('');
		await autosave.stop();
		try {
			await persistence.discard();
			setEstablishedId(null);
			if (record) {
				fieldsRef.current = { ...baseline };
				setText(baseline.text);
				setGardenId(baseline.gardenId);
				setStatus('all-saved');
				setAutosaveError('');
				setSaving(false);
			} else route('/notes', true);
		} catch (discardError) {
			setError(errorMessage(discardError, 'discarded'));
			setStatus('error');
			setSaving(false);
			if (!noteDraftFieldsEqual(snapshot, baseline)) {
				autosave.schedule(snapshot);
				void autosave.flush();
			}
		}
	};

	const leave = async () => {
		if (saving) return;
		setSaving(true);
		setError('');
		await autosave.flush();
		const snapshot = { ...fieldsRef.current };
		const hasChanges = !noteDraftFieldsEqual(snapshot, baseline);
		try {
			const persisted = await drafts.getById(draftId);
			const persistenceComplete = hasChanges
				? noteDraftMatches(persisted, { draftId, noteId: record?.id ?? null, fields: snapshot })
				: persisted === null;
			if (!persistenceComplete) {
				setAutosaveError('Your latest changes could not be saved as a recoverable draft. Try again before returning to Notes.');
				setSaving(false);
				return;
			}
			await autosave.stop();
			if (hasChanges) setNoteDraftReturnContext(draftId);
			route('/notes', true);
		} catch (leaveError) {
			setAutosaveError(errorMessage(leaveError, 'saved'));
			setSaving(false);
		}
	};

	return <section class="workspace-page notes-page notes-page--editing" aria-labelledby="note-editor-title">
		<PageHeader
			eyebrow={record ? 'Edit Note' : 'New Note'}
			title={record ? 'Update your Note' : 'Capture a Note'}
			titleId="note-editor-title"
			status={<p class={`note-editor__draft-status note-editor__draft-status--${status}`} role="status">{STATUS_TEXT[status]}</p>}
		/>
		<div class="page-content"><section class="note-editor">
		{error && <div id="note-save-error" class="notes-message notes-message--error" role="alert" tabIndex="-1"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{error}</span></div>}
		{autosaveError && <div class="notes-message notes-message--error" role="alert"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i><span>{autosaveError}</span></div>}
		<form class="note-editor__form" onSubmit={save}>
			<div class="form-field"><label class="form-label" for="note-text">Note</label><textarea id="note-text" class="form-control note-editor__textarea" ref={textarea} rows="12" required disabled={saving} value={text} onInvalid={(event) => { event.currentTarget.setCustomValidity('Enter Note text before saving.'); showSaveError('Enter Note text before saving.', 'text'); }} onInput={(event) => { const value = event.currentTarget.value; event.currentTarget.setCustomValidity(''); setText(value); setError(''); scheduleFields({ ...fieldsRef.current, text: value }); }} aria-describedby="note-text-help note-draft-help"></textarea><p class="form-text" id="note-text-help">Plain text only. Line breaks and spacing are preserved.</p><p class="form-text" id="note-draft-help">Drafts stay local until you explicitly save the Note.</p></div>
			<GardenAssociationSelector id="note-garden" value={gardenId} gardens={gardens} locations={locations} onChange={(value) => { setGardenId(value); setError(''); scheduleFields({ ...fieldsRef.current, gardenId: value }); }} disabled={saving} />
			{recoveredGardenUnavailable && <div class="notes-message notes-message--info note-editor__association-recovery" role="status"><i class="bi bi-info-circle" aria-hidden="true"></i><span>The Garden previously associated with this draft no longer exists. You can select another Garden or leave this Note unlinked.</span></div>}
			<div class="note-editor__actions note-editor__actions--split"><button class="btn-text theme-danger note-editor__button" type="button" onClick={discard} disabled={saving}>{establishedId ? 'Discard draft' : 'Discard'}</button><div class="note-editor__primary-actions"><button class="btn-outline note-editor__button" type="button" onClick={leave} disabled={saving}>Back to Notes</button><button class="btn-solid theme-primary note-editor__button" type="submit" disabled={!canSave}><i class="bi bi-check2" aria-hidden="true"></i>{saving ? 'Saving…' : 'Save Note'}</button></div></div>
		</form>
		</section></div>
	</section>;
}

function LoadingNote() { return <div class="container notes-page"><div class="notes-state" role="status"><p>Loading Note…</p></div></div>; }
function NoteLoadError({ message }) { return <div class="container notes-page"><div class="notes-state" role="alert"><h1>Note could not be opened</h1><p>{message}</p><a class="btn-solid theme-primary" href="/notes">Back to Saved Notes</a></div></div>; }

export function NewNote() {
	const { drafts, notes, gardens, locations } = useNotesWorkspace();
	const [state, setState] = useState({ status: 'loading' });
	useEffect(() => {
		let active = true;
		Promise.all([gardens.list(), locations.list()]).then(([gardenRecords, locationRecords]) => active && setState({ status: 'ready', gardens: gardenRecords, locations: locationRecords }), (loadError) => active && setState({ status: 'error', message: errorMessage(loadError, 'opened') }));
		return () => { active = false; };
	}, [gardens, locations]);
	if (state.status === 'loading') return <LoadingNote />;
	if (state.status === 'error') return <NoteLoadError message={state.message} />;
	return <NoteEditor record={null} draft={null} isFreshRoute notes={notes} drafts={drafts} gardens={state.gardens} locations={state.locations} />;
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
	return <NoteEditor key={draftId} record={null} draft={state.draft} requestedDraftId={draftId} notes={notes} drafts={drafts} gardens={state.gardens} locations={state.locations} />;
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
	return <NoteEditor key={noteId} record={state.record} draft={state.draft} notes={notes} drafts={drafts} gardens={state.gardens} locations={state.locations} />;
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

export function DraftsAccordion({ drafts, expanded, highlightedDraftId, expansionLocked, onUserToggle }) {
	return <div class="accordion notes-accordion notes-drafts" data-notes-group="drafts">
		<details class="accordion-item" open={expanded}>
			<summary class="accordion-header" onClick={(event) => {
				event.preventDefault();
				if (expansionLocked) {
					return;
				}
				onUserToggle(!event.currentTarget.parentElement.open);
			}}><span class="notes-accordion__label">Unfinished drafts</span><span class="notes-accordion__count" aria-label={`${drafts.length} ${drafts.length === 1 ? 'draft' : 'drafts'}`}>{drafts.length}</span><AccordionIcon /></summary>
			<div class="accordion-body notes-drafts__body"><div class="notes-drafts__list">{drafts.map((draft) => {
				const highlighted = draft.id === highlightedDraftId;
				return <a class={`notes-draft-row${highlighted ? ' notes-draft-row--highlighted' : ''}`} href={draft.isNew ? `/notes/new/${draft.id}` : `/notes/${draft.subjectId}`} key={draft.id} data-draft-id={draft.id}>
					<span class="notes-draft-row__content"><span class="notes-draft-row__preview">{draft.text || 'Empty draft'}</span><span class="notes-draft-row__metadata">Draft saved {formatDate(draft.updatedAt)}</span>{highlighted && <span class="visually-hidden">Draft just saved</span>}</span>
					<span class="notes-draft-row__resume">Resume <i class="bi bi-arrow-right" aria-hidden="true"></i></span>
				</a>;
			})}</div></div>
		</details>
	</div>;
}

export function NotesWorkspaceView({ state, filter, filterRef, preference, highlightedDraftId, contextualExpansionActive, deletingId, onDelete, onFilter, onClearFilter, onDraftsUserToggle, onToggleNotes, onToggleGarden }) {
	const workspace = prepareNotesWorkspace(state.notes, state.drafts, state.gardens, filter);
	const noResults = workspace.filtering && !workspace.hasResults;
	const contextualDraftExists = Boolean(highlightedDraftId && state.drafts.some(({ id }) => id === highlightedDraftId));
	return <>
		<div class="notes-filter"><label class="form-label" for="notes-filter">Filter Notes</label><div class="notes-filter__controls"><input id="notes-filter" class="form-control" type="search" ref={filterRef} value={filter} onInput={(event) => onFilter(event.currentTarget.value)} placeholder="Search Note text or Garden name" />{workspace.filtering && <button class="btn-outline notes-filter__clear" type="button" onClick={onClearFilter}>Clear filter</button>}</div></div>
		{state.drafts.length > 0 && workspace.drafts.length > 0 && <DraftsAccordion
			drafts={workspace.drafts} highlightedDraftId={contextualDraftExists ? highlightedDraftId : null}
			expanded={(workspace.filtering && workspace.drafts.length > 0) || (contextualDraftExists && contextualExpansionActive) || preference.drafts}
			expansionLocked={workspace.filtering}
			onUserToggle={onDraftsUserToggle}
		/>}
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
	const returnContext = useRef(consumeNoteDraftReturnContext()).current;
	const [contextualExpansionActive, setContextualExpansionActive] = useState(Boolean(returnContext?.draftId));
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
	return <section class="workspace-page notes-page" aria-labelledby="notes-title">
		<PageHeader
			eyebrow="Garden observations"
			title="Notes"
			titleId="notes-title"
			description="Keep plain-text observations together, whether linked to a garden or not."
			actions={<a class="btn-solid theme-primary notes-page__new" href="/notes/new"><i class="bi bi-plus-lg" aria-hidden="true"></i>New Note</a>}
		/>
		<div class="page-content notes-content">
		{state.status === 'error' && <div class="notes-message notes-message--error" role="alert"><span>{state.message}</span><button class="btn-outline" type="button" onClick={load}>Retry</button></div>}
		{state.status === 'loading' ? <div class="notes-state" role="status"><p>Loading Notes…</p></div> : <div><NotesWorkspaceView
			state={state} filter={filter} filterRef={filterInput} preference={preference} highlightedDraftId={returnContext?.draftId} contextualExpansionActive={contextualExpansionActive} deletingId={deletingId}
			onDelete={deleteNote} onFilter={setFilter} onClearFilter={clearFilter}
			onDraftsUserToggle={(expanded) => {
				setContextualExpansionActive(false);
				updatePreference((current) => ({ ...current, drafts: expanded }));
			}}
			onToggleNotes={(expanded) => updatePreference((current) => ({ ...current, notes: expanded }))}
			onToggleGarden={(gardenId, expanded) => updatePreference((current) => ({ ...current, gardens: { ...current.gardens, [gardenId]: expanded } }))}
		/></div>}
		</div>
	</section>;
}
