fetch('http://localhost:3000/api/characters/sync', { method: 'POST' })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
