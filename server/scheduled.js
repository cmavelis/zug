var cron = require('node-cron');
const { spawn } = require('child_process');
const treeKill = require('tree-kill');

function createServer() {
  const newServer = spawn('yarn', ['start']);
  newServer.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  newServer.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  newServer.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  newServer.on('error', (err) => {
    console.error('Error while killing server:', err);
  });
  return newServer;
}

let server = createServer();

cron.schedule('* * 48 * *', async () => {
  console.log('48 hours have passed, killing server');
  treeKill(server.pid, 'SIGKILL', (err) => {
    if (err) {
      console.error('Error killing server:', err);
    } else {
      server = createServer();
    }
  });
});
