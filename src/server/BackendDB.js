const level = require('level')
var express = require('express');
var fs = require("fs");
var path = require("path");
const yargs = require('yargs');
const child_process = require('child_process');
var moment = require('moment');
var winston = require('winston');
var glob = require('glob');

const homedir = require('os').homedir();
fs.mkdirSync(path.join(homedir, ".frameripper"), { recursive: true })
const DBfile = path.join(homedir, ".frameripper", "frameripper.db");
const logfile = path.join(homedir, ".frameripper", `frameripper_${moment().format('YYYY-MM-DD-HH-mm-ss')}.log`);

//const logger = pino({name: 'frameripper', level: 'trace'}, pino.destination({dest: logfile, minLength: 4096, sync: true}));
const logger = winston.createLogger({
  level: 'debug',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: logfile })
  ]
});

var JPGcomplete = false;
var PNGcomplete = false;

var ffmpeg = null;
var ffmpeg_running = false;
var default_null = '(null/undefined)';

logger.debug({time: moment().format(), app_subsystem: 'program_entry_point', app_file: '/server/BackendDB.js'});

var app = express();
app.use(express.json())

app.get('/startjpgtranscode', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/startjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    runFFmpegJPG();
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/startjpgtranscode', app_request: 'get', app_status: 200});
  res.json({ok:true});
})

app.get('/abortjpgtranscode', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/abortjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
      res.json({ok:true})
    } else {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': 'ffmpeg is not running'})
    }
  } else {
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
    res.json({ok:true})
  }
})

app.get('/startpngtranscode', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/startpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    runFFmpegPNG();
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/startpngtranscode', app_request: 'get', app_status: 200});
  res.json({ok:true});
})

app.get('/abortpngtranscode', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/abortpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
      res.json({ok:true})
    } else {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': 'ffmpeg is not running'})
    }
  } else {
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
    res.json({ok:true})
  }
})

app.get('/projects', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    getProjects(db).then(function(projects) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': projects}});
      res.status(200).json({'projects': projects})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    var projects = ['Big-Buck-Bunny.mp4', 'Crab-Rave.mp4', 'FooBar2000test.mp4'];
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': null}});
    res.status(200).json({'projects': projects})
  }
})

app.put('/projects', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.put(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    setProjects(db, req.body.projects).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'put', app_status: 200});
      res.json({ok:true})
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'put', app_status: 200});
    res.json({ok:true})
  }
})

app.get('/currentproject', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    getCurrentProject(db).then(function(project) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': project}});
      res.status(200).json({'currentProject': project})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    var project = 'Big-Buck-Bunny.mp4';
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': null}});
    res.status(200).json({'currentProject': project})
  }
})

app.put('/currentproject', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.put(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    setCurrentProject(db, req.body.project).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'put', app_status: 200});
  res.json({ok:true})
})

app.get('/currentsettings', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    getSettings(db).then(function(settings) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
      res.status(200).json(settings)
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    var settings = {prefix: 'bbb', frameOffset: -2};
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
    res.status(200).json(settings)
  }
})

app.put('/currentsettings', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.put(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    setSettings(db, project req.body.settings.prefix, req.body.settings.frameOffset).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'put', app_status: 200});
  res.json({ok:true})
})

app.get('/numframes', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    getNumFrames(db).then(function(numFrames) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
      res.status(200).json({'numFrames': numFrames})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    var numFrames = 23;
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
    res.status(200).json({'numFrames': numFrames})
  }
})

app.put('/numframes', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.put(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    setNumFrames(db, req.body.numFrames).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'put', app_status: 200});
  res.json({ok:true})
})

app.get('/frameslist', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    getFramesList(db).then(function(framesList) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
      res.status(200).json({'framesList': framesList})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    var framesList = [0, 1, 3, 4, 5, 6, 14, 16, 22];
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
    res.status(200).json({'framesList': framesList})
  }
})

app.put('/frameslist', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      return project;
    }).catch(function(err) => {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
    setFramesList(db, req.body.framesList).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'put', app_status: 200});
  res.json({ok:true})
})

app.put('/deleteproject', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.put(\'/deleteproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    deleteProject(db, req.body.project).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'put', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  }
  logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'put', app_status: 200});
  res.json({ok:true})
})

var ticker_jpg = 0;
app.get('/istranscodingjpgcomplete', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingjpgcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    isTranscodingJPGComplete().then(function(complete) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': complete})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    ticker_jpg += 1;
    var complete = (ticker_jpg % 50 === 0) ? true : false;
    console.log(`ticker_jpg = ${ticker_jpg}`);
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete, 'ticker': ticker_jpg}});
    res.status(200).json({'complete': complete})
  }
})

var ticker_png = 0;
app.get('/istranscodingpngcomplete', function (req, res) {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingpngcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    isTranscodingPNGComplete().then(function(complete) {
      logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': complete})
    }).catch(function(err) {
      logger.error({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 400, app_response: {'error': err.stack}});
      res.status(400).json({'error': err.toString()})
    })
  } else {
    ticker_png += 1;
    var complete = (ticker_png % 50 === 0) ? true : false;
    console.log(`ticker_png = ${ticker_png}`);
    logger.verbose({time: moment().format(), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete, 'ticker': ticker_png}});
    res.status(200).json({'complete': complete})
  }
})


const isTranscodingJPGComplete = () => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const isTranscodingJPGComplete = () => {', app_file: '/server/BackendDB.js'});
  return JPGcomplete === true;
}

const isTranscodingPNGComplete = () => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const isTranscodingPNGComplete = () => {', app_file: '/server/BackendDB.js'});
  return PNGcomplete === true;
}

const openDB = () => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const openDB = () => {', app_file: '/server/BackendDB.js'});
  logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'open', app_file: DBfile});
  const db = level(DBfile, { valueEncoding: 'json' });
  return db;
}

const getProjects = db => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const getProjects = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.get('/projects').then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: true, '/projects': value}});
      return resolve(value);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const setProjects = (db, projects) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const setProjects = (db, projects) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.put('/projects', projects).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: projects || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: projects || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const getCurrentProject = db => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const getCurrentProject = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.get('/currentProject').then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_response: {success: true, '/currentProject': value}});
      return resolve(value);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_value: value || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const setCurrentProject = (db, project) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const setCurrentProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
        logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
    }
    db.put('/currentProject', project).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const getSettings = (db, project) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const getSettings = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
        logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
    }
    var prefix = db.get('/project/'+project+'/prefix').then(value => {
      return value;
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
    var frameOffset = db.get('/project/'+project+'/frameOffset').then((err, value) => {
      return value;
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
    logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: true, [`/project/${project}/prefix`]: prefix}});
    logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: true, [`/project/${project}/frameOffset`]: frameOffset}});
    resolve({'prefix': prefix, 'frameOffset': frameOffset});
  })
}

const setSettings = (db, project, prefix, frameOffset) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const setSettings = (db, project, prefix, frameOffset) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/prefix', prefix).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: true}});
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
    db.put('/project/'+project+'/frameOffset', frameOffset).then((value) => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}


const getNumFrames = (db, project) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const getNumFrames = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    var numFrames = db.get('/project/'+project+'/numFrames').then(value => {
      return value;
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
    logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: true, [`/project/${project}/numFrames`]: numFrames}});
    resolve(numFrames);
  })
}

const setNumFrames = (db, project, numFrames) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const setNumFrames = (db, project, numFrames) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
        return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/numFrames', numFrames).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const getFramesList = (db, project) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const getFramesList = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    var framesList = db.get('/project/'+project+'/framesList').then(value => {
      return value;
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
    logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: true, [`/project/${project}/framesList`]: framesList}});
    resolve(framesList);
  })
}

const setFramesList = (db, project, framesList) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const setFramesList = (db, project, framesList) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
        return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/framesList', framesList).then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const deleteProject = (db, project) => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const deleteProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects;
    }).catch(err => {
      reject(err);
    }).includes(project);
    if (!exists) {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }

    db.del('/project/'+project+'/prefix').then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: true}});
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })

    db.del('/project/'+project+'/frameOffset').then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: true}});
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })

    db.del('/project/'+project+'/numFrames').then(value => {
    logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: true}});
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack}});
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })

    db.del('/project/'+project+'/framesList').then(value => {
      logger.verbose({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: true}});
      projects = projects.filter((value, index, arr) => {
        return value !== project;
      })
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format(), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack}});
      reject(err);
    })
  })
}

const runFFmpegJPG = () => {
  const settings = getSettings(db).then(settings => {
    return settings;
  }).catch(err => {
    throw err;
  })
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const runFFmpegJPG = framesList => {', app_file: '/server/BackendDB.js'});
  JPGcomplete = false;

  const currentProject = getCurrentProject(db).then(currentProject => {
    return currentProject;
  }).catch(err => {
    throw err;
  })

  if (!argv.testServer) {
    // Wipe all the image files from the directory before transcoding
    var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.jpg"));
    logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'glob', app_fileList: files});
    for (const file of files) {
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'del', app_file: file});
      fs.unlinkSync(file);
    }

    var video_arg = path.join(argv.videopath, currentProject)
    const args = ["-i", video_arg, "-nostdin", "-y", "-vf", "fps=1", settings.prefix+"%06d.jpg"]
    logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'spawn', options: args});
    //var options = "-i argv.videopath/filename -nostdin -y -vf fps=1 prefix%06d.jpg" (jpgdir)
    ffmpeg = child_process.spawn({"cwd": path.join(argv.jpgpath, currentProject)},  "ffmpeg", args, {
      cwd: argv.jpgdir
    });
    ffmpeg_running = true;

    ffmpeg.stdout.on("data", data => {
        logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stdout', output: data});
    });

    ffmpeg.stderr.on("data", data => {
        logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stderr', output: data});
    });

    ffmpeg.on('error', (error) => {
        //error.message
        logger.error({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'error', output: error});
    });

    ffmpeg.on("close", code => {
        logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'close', output: code});
        JPGcomplete = true;
        ffmpeg_running = false;
    });
  } else {
    setTimeout(function() {
      JPGcomplete = true;
      ffmpeg_running = false;
    }, 5000);
  }
}

const runFFmpegPNG = () => {
  logger.debug({time: moment().format(), app_subsystem: 'function_call', app_func: 'const runFFmpegPNG = framesList => {', app_file: '/server/BackendDB.js'});
  PNGcomplete = false;

  const framesList = getFramesList(db).then(function(framesList) {
    return framesList;
  }).catch(err => {
    throw err;
  })
  const currentProject = getCurrentProject(db).then(currentProject => {
    return currentProject;
  }).catch(err => {
    throw err;
  })
  const settings = getSettings(db).then(settings => {
    return settings;
  }).catch(err => {
    throw err;
  })

  if (!argv.testServer) {
    // Wipe all the image files from the directory before transcoding
    var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.png"));
    logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
    for (const file of files) {
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'del', app_file: file});
      fs.unlinkSync(file);
    }

    /* "select='eq(n\\,franemumber-offset)+eq(n\\,franemumber-offset)'"*/
    var select_arg = "select='" //eq(n\\,franemumber-offset)+eq(n\\,franemumber-offset)'";
    for (const frame of framesList) {
      select_arg += `eq(n\\,${frame}-${settings.frameOffset})+`
    }
    select_arg = select_arg.substring(0,select_arg.length-1) + "'";
    var video_arg = path.join(argv.videopath, currentProject)
    const args = ["-i", video_arg, "-nostdin", "-y", "-vf", select_arg, "-vsync", "0", settings.prefix+"%06d.png"]
    logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'spawn', options: args});
    ffmpeg = child_process.spawn({"cwd": path.join(argv.pngpath, currentProject)}, "ffmpeg", args, {
        cwd: argv.pngdir
    });

    ffmpeg_running = true;

    ffmpeg.stdout.on("data", data => {
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stdout', output: data});
    });

    ffmpeg.stderr.on("data", data => {
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stderr', output: data});
    });

    ffmpeg.on('error', (error) => {
      logger.error({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'error', output: error});
    });

    ffmpeg.on("close", code => {
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'close', output: code});
      // Rename all the numbers from 1,2,3 to the actual frame numbers.
      var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.png"));
      logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
      for (var i = 0; i < files.length; i++) {
        // filename plus the image path and current project is guarrenteed to be at least 10 characters long
        var renamed_file = files[i].substr(0, files[i].length-10) + ('000000'+framesList[i]).slice(-6) + files[i].substr(files[i].length-4);
        fs.renameSync(files[i], renamed_file)
        logger.verbose({time: moment().format(), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'rename', app_oldfile: files[i], app_newfile: renamed_file});
      }
      PNGcomplete = true;
      ffmpeg_running = false;
    });
  } else {
    setTimeout(function() {
      JPGcomplete = true;
      ffmpeg_running = false;
    }, 5000);
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
        },
        videopath: {
            description: 'Base folder where video files are located',
            alias: 'v',
            type: 'string',
            demandOption: true
        }
    })
    .option('test-client', {
        alias: 'c',
        description: 'Run frameripper in client test mode. Doesn\'t run server-side functions.',
        type: 'boolean',
    })
    .option('test-server', {
        alias: 's',
        description: 'Run frameripper in server test mode. Doesn\'t run ffmpeg or filesystem operations.',
        type: 'boolean',
    })
    .option('port', {
        alias: 'p',
        description: 'Alternative port number to listen on (default 3030).',
        type: 'number',
    })
    .help()
    .alias('help', 'h')
    .usage('Usage: $0 --argv.jpgpath JPGFOLDER --argv.pngpath PNGFOLDER')
    .argv;

console.log(`Logging to "${logfile}"`)
try {
  if (fs.lstatSync(argv.jpgpath).isDirectory()) {
    console.log(`Storing JPGs in "${argv.jpgpath}"`);
    logger.verbose({time: moment().format(), app_subsystem: 'argv_dirs',  app_dir: 'jpg', app_jpgpath: argv.jpgpath});
  }
} catch(err) {
  console.error(`The JPG folder "${argv.jpgpath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format(), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'jpg'}});
  process.exitCode = 1;
}
try {
  if (fs.lstatSync(argv.pngpath).isDirectory()) {
    console.log(`Storing PNGs in "${argv.pngpath}"`);
    logger.verbose({time: moment().format(), app_subsystem: 'argv_dirs',  app_dir: 'png', app_pngpath: argv.pngpath});
  }
} catch(err) {
  console.error(`The PNG folder "${argv.pngpath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format(), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'png'}});
  process.exitCode = 1;
}
try {
  if (fs.lstatSync(argv.videopath).isDirectory()) {
    console.log(`Using video directory "${argv.videopath}"`);
    logger.verbose({time: moment().format(), app_subsystem: 'argv_dirs',  app_dir: 'video', app_videopath: argv.videopath});
  }
} catch(err) {
  console.error(`The video folder "${argv.videopath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format(), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'video'}});
  process.exitCode = 1;
}

const port = argv.port || 3030;
app.listen(port)


