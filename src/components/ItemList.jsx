
import { useState } from 'preact/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';

export function ItemList() {
  const [name, setName] = useState('');

  const items = useLiveQuery(
    () => db.items.orderBy('createdAt').toArray(),
    []
  );

  async function addItem(e) {
    e.preventDefault();

    if (!name.trim()) return;

    await db.items.add({
      name: name.trim(),
      createdAt: Date.now()
    });

    setName('');
  }

  return (
    <div class="container py-4">
      <h2>Dexie Test</h2>

      <form onSubmit={addItem} class="d-flex gap-2 mb-3">
        <input
          class="form-control"
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="Enter an item"
        />
        <button class="btn btn-primary" type="submit">
          Add
        </button>
      </form>

      {items === undefined ? (
        <p>Loading...</p>
      ) : (
        <ul class="list-group">
          {items.map(item => (
            <li
              class="list-group-item d-flex justify-content-between"
              key={item.id}
            >
              {item.name}
              <button
                class="btn btn-sm btn-outline-danger"
                onClick={() => db.items.delete(item.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
