export function noteDraftFieldsEqual(first, second) {
	return first.text === second.text && first.gardenId === second.gardenId;
}

export function noteDraftMatches(draft, { draftId, noteId = null, fields }) {
	return Boolean(draft)
		&& draft.id === draftId
		&& draft.subjectId === noteId
		&& draft.isNew === (noteId === null)
		&& noteDraftFieldsEqual(draft, fields);
}

export function createNoteDraftPersistence({
	drafts,
	draftId,
	noteId = null,
	baseline,
	initialDraft = null,
	onEstablished = () => {},
}) {
	let record = initialDraft;

	return Object.freeze({
		getRecord() {
			return record;
		},

		async persist(fields) {
			if (noteDraftFieldsEqual(fields, baseline)) {
				if (record) await drafts.remove(record.id);
				record = null;
				return null;
			}

			const wasEstablished = Boolean(record);
			const saved = await drafts.save({
				id: record?.id ?? draftId,
				noteId,
				text: fields.text,
				gardenId: fields.gardenId,
				createdAt: record?.createdAt,
			});
			record = saved;
			if (!wasEstablished) onEstablished(saved);
			return saved;
		},

		async discard() {
			if (record) await drafts.remove(record.id);
			record = null;
		},
	});
}
