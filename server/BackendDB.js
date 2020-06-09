const level = require('level')
var express = require('express');
var fs = require("fs");
const yargs = require('yargs');

const DBfile = './frameripper.db'

var app = express();
app.use(express.json())

app.get('/startjpgtranscode', function (req, res) {
  //Do ffmpeg stuff
  getProjects(db).then(function(projects) {
    res.status(200).json({'projects': projects})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/abortjpgtranscode', function (req, res) {
  //Do ffmpeg stuff
  getProjects(db).then(function(projects) {
    res.status(200).json({'projects': projects})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/startpngtranscode', function (req, res) {
  //Do ffmpeg stuff
  getProjects(db).then(function(projects) {
    res.status(200).json({'projects': projects})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/abortpngtranscode', function (req, res) {
  //Do ffmpeg stuff
  getProjects(db).then(function(projects) {
    res.status(200).json({'projects': projects})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/projects', function (req, res) {
  getProjects(db).then(function(projects) {
    res.status(200).json({'projects': projects})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/projects', function (req, res) {
  setProjects(db, req.body.projects).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/currentproject', function (req, res) {
  getCurrentProject(db).then(function(project) {
    res.status(200).json({'currentProject': project})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/currentproject', function (req, res) {
  setCurrentProject(db, req.body.project).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/currentsettings', function (req, res) {
  getSettings(db).then(function(settings) {
    res.status(200).json(settings)
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/currentsettings', function (req, res) {
  getSettings(db, req.body.settings).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/numframes', function (req, res) {
  getNumFrames(db).then(function(numFrames) {
    res.status(200).json({'numFrames': numFrames})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/numframes', function (req, res) {
  setNumFrames(db, req.body.numFrames).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/frameslist', function (req, res) {
  getFramesList(db).then(function(framesList) {
    res.status(200).json({'framesList': framesList})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/frameslist', function (req, res) {
  setFramesList(db, req.body.framesList).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.put('/deleteproject', function (req, res) {
  deleteProject(db, req.body.project).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/currentframe', function (req, res) {
  getCurrentFrame().then(function(frame) {
    res.status(200).json({'currentFrame': frame})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})

app.get('/istranscodingcomplete', function (req, res) {
  isTranscodingComplete().then(function(complete) {
    res.status(200).json({'complete': complete})
  }).catch(function(err) {
    res.status(400).json({'error': err})
  })
})


const openDB = () => {
  const db = level(DBfile, { valueEncoding: 'json' });
  return db;
}

const getProjects = db => {
  return new Promise((resolve, reject) => {
    db.get('/projects').then((err, value) => {
      if (err) reject(err);
      return resolve(value);
    })
  })
}

const setProjects = (db, projects) => {
  return new Promise((resolve, reject) => {
    db.set('/projects', projects).then((err, value) => {
      if (err) reject(err);
      else resolve(null);
    })
  })
}

const getCurrentProject = db => {
  return new Promise((resolve, reject) => {
    db.get('/currentProject').then((err, value) => {
      if (err) reject(err);
      return resolve(value);
    })
  })
}

const setCurrentProject = (db, project) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    db.set('/currentProject', project).then((err, value) => {
      if (err) reject(err);
      else resolve(null);
    })
  })
}

const getSettings = (db, project) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    prefix = db.get('/project/'+project+'/prefix').then((err, value) => {
      if (err) reject(err);
      return value;
    })
    frameOffset = db.get('/project/'+project+'/frameOffset').then((err, value) => {
      if (err) reject(err);
      return value;
    })
    resolve({'prefix': prefix, 'frameOffset': frameOffset});
  })
}

const setSettings = (db, project, prefix, frameOffset) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/prefix', prefix).then((err, value) => {
      if (err) reject(err);
    })
    db.get('/project/'+project+'/frameOffset', frameOffset).then((err, value) => {
      if (err) reject(err);
    })
    resolve(null);
  })
}


const getNumFrames = (db, project) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    numFrames = db.get('/project/'+project+'/numFrames').then((err, value) => {
      if (err) reject(err);
      return value;
    })
    resolve(numFrames);
  })
}

const setNumFrames = (db, project, numFrames) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/numFrames', numFrames).then((err, value) => {
      if (err) reject(err);
    })
    resolve(null);
  })
}

const getFramesList = (db, project) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    framesList = db.get('/project/'+project+'/framesList').then((err, value) => {
      if (err) reject(err);
      return value;
    })
    resolve(framesList);
  })
}

const setFramesList = (db, project, framesList) => {
  return new Promise((resolve, reject) => {
    exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/framesList', framesList).then((err, value) => {
      if (err) reject(err);
    })
    resolve(null);
  })
}

const deleteProject = (db, project) => {
  return new Promise((resolve, reject) => {
    projects = getProjects(db).then(projects => {
        return projects;
    });
    exists = projects.includes(project)
    if (!exists) reject('Project doesn\'t exist');
    db.del('/project/'+project+'/prefix').then((err, value) => {
      if (err) reject(err);
    })
    db.del('/project/'+project+'/frameOffset').then((err, value) => {
      if (err) reject(err);
    })
    db.del('/project/'+project+'/numFrames').then((err, value) => {
      if (err) reject(err);
    })
    db.del('/project/'+project+'/framesList').then((err, value) => {
      if (err) reject(err);
    })
    projects = projects.filter((value, index, arr) => {
        return value !== project;
    })
    resolve(null);
  })
}

const runFFmpegPNG = framesList => {

  const ffmpeg = spawn("ffmpeg", ["options"]);

  ffmpeg.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
  });

  ffmpeg.stderr.on("data", data => {
      console.log(`stderr: ${data}`);
  });

  ffmpeg.on('error', (error) => {
      console.log(`error: ${error.message}`);
  });

  ffmpeg.on("close", code => {
      console.log(`child process exited with code ${code}`);
  });
}

const runFFmpegPNG = framesList => {

  for (frame of framesList) {
    const ffmpeg = spawn("ffmpeg", ["options"]);

    ffmpeg.stdout.on("data", data => {
        console.log(`stdout: ${data}`);
    });

    ffmpeg.stderr.on("data", data => {
        console.log(`stderr: ${data}`);
    });

    ffmpeg.on('error', (error) => {
        console.log(`error: ${error.message}`);
    });

    ffmpeg.on("close", code => {
        console.log(`child process exited with code ${code}`);
    });
  }
}

var db = openDB();

/* Credits: https://nodejs.org/en/knowledge/command-line/how-to-parse-command-line-arguments/ */
const argv = yargs
    .command('frameripper', 'Extracts select PNG frames from a video', {
        jpgpath: {
            description: 'Base folder where JPG files of projects will be placed',
            alias: 'j',
            type: 'string',
            demandOption: true
        },
        pngpath: {
            description: 'Base folder where resulting PNG files will be placed',
            alias: 'p',
            type: 'string',
            demandOption: true
        }
    }))
    .option('test', {
        alias: 't',
        description: 'Run frameripper in test mode. Doesn\'t run any ffmpeg commands.',
        type: 'boolean',
    })
    .help()
    .alias('help', 'h')
    .usage('Usage: $0 --jpgpath JPGFOLDER --pngpath PNGFOLDER')
    .argv;

if (argv.test) {
  var testing = true;
}
else {
  var testing = false;
}
