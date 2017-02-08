let kue = require('kue'),
    express = require('express');

// create our job queue

let jobs = kue.createQueue();

function create() {
    let name = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];
    jobs.create('video conversion', {
        title: 'converting ' + name + "'s to avi",
        user: 1,
        frames: 200
    }).save();
    setTimeout(create, Math.random() * 3000 | 0);
}

create();

function create2() {
    let name = ['tobi', 'loki', 'jane', 'manny'][Math.random() * 4 | 0];
    jobs.create('email', {
        title: 'emailing ' + name + '',
        body: 'hello'
    }).save();
    setTimeout(create2, Math.random() * 1000 | 0);
}

create2();
