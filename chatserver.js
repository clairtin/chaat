const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const users = new Set();

io.on('connection', (socket) => {
  socket.on('join', (username, color) => {
    users.add({ id: socket.id, username, color });

    // Приветственное сообщение
    const welcomeMessage = users.size === 1
      ? 'Добро пожаловать. Вы первый в чате.'
      : `Добро пожаловать, ${username}! В чате уже присутствуют: ${[...users].map(user => user.username).join(', ')}.`;

    io.to(socket.id).emit('message', {
      username: 'Сервер',
      message: welcomeMessage,
      color: 'red' // цвет сервера
    });

    // Сообщение о присоединении нового пользователя
    io.emit('message', {
      username: 'Сервер',
      message: `К нам присоединился ${username}.`,
      color: 'red'
    });

    // Отправить обновленный список пользователей
    io.emit('updateUsers', Array.from(users));
  });

  socket.on('disconnect', () => {
    const user = [...users].find(u => u.id === socket.id);

    if (user) {
      users.delete(user);

      // Сообщение о выходе пользователя
      io.emit('message', {
        username: 'Сервер',
        message: `${user.username} нас покинул.`,
        color: 'red'
      });

      // Отправить обновленный список пользователей
      io.emit('updateUsers', Array.from(users));
    }
  });

  socket.on('message', (data) => {
    io.emit('message', { ...data, color: [...users].find(u => u.id === socket.id).color });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
