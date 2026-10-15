
const express = require('express');
const app = express();

app.use(express.json());

let tasks = [];
let nextId = 1;

app.post('/data', (req, res) => {
  console.log(req.body);
  res.json(req.body);
});

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/new-task', (req, res) => {
  const { title, description, isDone } = req.body;

  if (
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    typeof isDone !== 'boolean'
  ) {
    return res.status(400).json({
      error: 'Données invalides'
    });
  }

  const newTask = {
    id: nextId++,
    title,
    description,
    isDone
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/update-task/:id', (req, res) => {
  const id = Number(req.params.id);

  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({
      error: 'Tâche introuvable'
    });
  }

  const { title, description, isDone } = req.body;

  if (
    typeof title !== 'string' ||
    typeof description !== 'string' ||
    typeof isDone !== 'boolean'
  ) {
    return res.status(400).json({
      error: 'Données invalides'
    });
  }

  task.title = title;
  task.description = description;
  task.isDone = isDone;

  res.json(task);
});

app.delete('/delete-task/:id', (req, res) => {
  const id = Number(req.params.id);

  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: 'Tâche introuvable'
    });
  }

  tasks.splice(index, 1);

  res.json({
    message: 'Tâche supprimée'
  });
});

app.listen(3000, () => {
  console.log('Serveur lancé sur http://localhost:3000');
});
