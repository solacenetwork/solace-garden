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
    <div className="container py-4">
      <h2>Dexie Test</h2>

      <form onSubmit={addItem} className="d-flex gap-2 mb-3">
        <input
          className="form-control"
          value={name}
          onInput={(e) => setName(e.currentTarget.value)}
          placeholder="Enter an item"
        />
        <button className="btn btn-solid theme-primary" type="submit">
          Add
        </button>
      </form>

      {items === undefined ? (
        <p>Loading...</p>
      ) : (
        <ul className="list-group">
          {items.map(item => (
            <li
              className="list-group-item d-flex justify-content-between"
              key={item.id}
            >
              {item.name}
              <button
                className="btn btn-outline theme-danger"
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
