let kue = require('kue');
let express = require('express');
let ui = require('kue-ui');
let app = express();


kue.createQueue();

// // create our job queue
// const jobs = kue.createQueue();

// // process video conversion jobs, 2 at a time.
// jobs.process('video conversion', 2, function (job, done) {
//   console.log('video');
//   setTimeout(done, Math.random() * 5000);
// });

// // process 10 emails at a time
// jobs.process('email', 10, function (job, done) {
//   console.log('email');
//   setTimeout(done, Math.random() * 2000);
// });

ui.setup({
  apiURL: '/api', // IMPORTANT: specify the api url
  baseURL: '/kue', // IMPORTANT: specify the base url
  updateInterval: 5000 // Optional: Fetches new data every 5000 ms
});

// Mount kue JSON api
app.use('/api', kue.app);
// Mount UI
app.use('/kue', ui.app);

app.listen(9000);
console.log('UI started on port 9000');
