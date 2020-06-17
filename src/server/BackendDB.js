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
  transports: [
    new winston.transports.File({ filename: logfile })
  ]
});
console.log(logger);

var JPGcomplete = false;
var PNGcomplete = false;

var ffmpeg = null;
var ffmpeg_running = false;

logger.debug({app_subsystem: 'program_entry_point', app_file: '/server/BackendDB.js'});

var app = express();
app.use(express.json())

app.get('/startjpgtranscode', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/startjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    runFFmpegJPG();
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/startjpgtranscode', app_request: 'get', app_status: 200});
  res.status(200);
})

app.get('/abortjpgtranscode', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/abortjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
      res.status(200)
    } else {
      logger.error({app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': 'ffmpeg is not running'})
    }
  } else {
    logger.verbose({app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
    res.status(200)
  }
})

app.get('/startpngtranscode', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/startpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    runFFmpegPNG();
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/startpngtranscode', app_request: 'get', app_status: 200});
  res.status(200);
})

app.get('/abortpngtranscode', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/abortpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
      res.status(200)
    } else {
      logger.error({app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': 'ffmpeg is not running'})
    }
  } else {
    logger.verbose({app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
    res.status(200)
  }
})

app.get('/projects', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    getProjects(db).then(function(projects) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': projects}});
      res.status(200).json({'projects': projects})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    var projects = ['Big-Buck-Bunny.mp4', 'Crab-Rave.mp4', 'FooBar2000test.mp4'];
    logger.verbose({app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': null}});
    res.status(200).json({'projects': projects})
  }
})

app.put('/projects', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.put(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    setProjects(db, req.body.projects).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/projects', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/projects', app_request: 'put', app_status: 200});
  res.status(200)
})

app.get('/currentproject', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    getCurrentProject(db).then(function(project) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': project}});
      res.status(200).json({'currentProject': project})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    var project = 'Big-Buck-Bunny.mp4';
    logger.verbose({app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': null}});
    res.status(200).json({'currentProject': project})
  }
})

app.put('/currentproject', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.put(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    setCurrentProject(db, req.body.project).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'put', app_status: 200});
  res.status(200)
})

app.get('/currentsettings', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    getSettings(db).then(function(settings) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
      res.status(200).json(settings)
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    var settings = {prefix: 'bbb', frameOffset: -2};
    logger.verbose({app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
    res.status(200).json(settings)
  }
})

app.put('/currentsettings', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.put(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    setSettings(db, req.body.settings).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'put', app_status: 200});
  res.status(200)
})

app.get('/numframes', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    getNumFrames(db).then(function(numFrames) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
      res.status(200).json({'numFrames': numFrames})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    var numFrames = 23;
    logger.verbose({app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
    res.status(200).json({'numFrames': numFrames})
  }
})

app.put('/numframes', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.put(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    setNumFrames(db, req.body.numFrames).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'put', app_status: 200});
  res.status(200)
})

app.get('/frameslist', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    getFramesList(db).then(function(framesList) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
      res.status(200).json({'framesList': framesList})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    var framesList = [0, 1, 3, 4, 5, 6, 14, 16, 22];
    logger.verbose({app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
    res.status(200).json({'framesList': framesList})
  }
})

app.put('/frameslist', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    setFramesList(db, req.body.framesList).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'put', app_status: 200});
  res.status(200)
})

app.put('/deleteproject', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.put(\'/deleteproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    deleteProject(db, req.body.project).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'put', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  }
  logger.verbose({app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'put', app_status: 200});
  res.status(200)
})

var ticker_jpg = 0;
app.get('/istranscodingjpgcomplete', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingjpgcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    isTranscodingJPGComplete().then(function(complete) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': complete})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    ticker_jpg += 1;
    var complete = (ticker_jpg % 50 === 0) ? true : false;
    console.log(`ticker_jpg = ${ticker_jpg}`);
    logger.verbose({app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
    res.status(200).json({'complete': complete})
  }
})

var ticker_png = 0;
app.get('/istranscodingpngcomplete', function (req, res) {
  logger.debug({app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingpngcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.client_test) {
    isTranscodingPNGComplete().then(function(complete) {
      logger.verbose({app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': complete})
    }).catch(function(err) {
      logger.error({app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 400, app_response: {'error': err}});
      res.status(400).json({'error': err})
    })
  } else {
    ticker_png += 1;
    var complete = (ticker_png % 50 === 0) ? true : false;
    console.log(`ticker_png = ${ticker_png}`);
    logger.verbose({app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
    res.status(200).json({'complete': complete})
  }
})


const isTranscodingJPGComplete = () => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const isTranscodingJPGComplete = () => {', app_file: '/server/BackendDB.js'});
  return JPGcomplete === true;
}

const isTranscodingPNGComplete = () => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const isTranscodingPNGComplete = () => {', app_file: '/server/BackendDB.js'});
  return PNGcomplete === true;
}

const openDB = () => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const openDB = () => {', app_file: '/server/BackendDB.js'});
  logger.verbose({app_subsystem: 'database', app_request: 'open', app_file: DBfile});
  const db = level(DBfile, { valueEncoding: 'json' });
  return db;
}

const getProjects = db => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const getProjects = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.get('/projects').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: false, 'error': err}});
        reject(err);
      }
      logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: true, '/projects': value}});
      return resolve(value);
    })
  })
}

const setProjects = (db, projects) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const setProjects = (db, projects) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.set('/projects', projects).then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: value, app_response: {success: false, 'error': err}});
        reject(err);
      }
      else {
        logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: value, app_response: {success: true}});
        resolve(null);
      }
    })
  })
}

const getCurrentProject = db => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const getCurrentProject = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.get('/currentProject').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_value: value, app_response: {success: false, 'error': err}});
        reject(err);
      }
      logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_response: {success: true, '/currentProject': value}});
      return resolve(value);
    })
  })
}

const setCurrentProject = (db, project) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const setCurrentProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
      return projects.includes(project);
    });
    if (!exists) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
    }
    db.set('/currentProject', project).then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project, app_response: {success: false, 'error': err}});
        reject(err);
      }
      else {
        logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project, app_response: {success: true}});
        resolve(null);
      }
    })
  })
}

const getSettings = (db, project) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const getSettings = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
      return projects.includes(project);
    });
    if (!exists) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
    }
    var prefix = db.get('/project/'+project+'/prefix').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err}});
        reject(err);
      }
      return value;
    })
    var frameOffset = db.get('/project/'+project+'/frameOffset').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err}});
        reject(err);
      }
      return value;
    })
    logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: true, [`/project/${project}/prefix`]: prefix}});
    logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: true, [`/project/${project}/frameOffset`]: frameOffset}});
    resolve({'prefix': prefix, 'frameOffset': frameOffset});
  })
}

const setSettings = (db, project, prefix, frameOffset) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const setSettings = (db, project, prefix, frameOffset) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
      return projects.includes(project);
    });
    logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/prefix', prefix).then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix, app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    db.get('/project/'+project+'/frameOffset', frameOffset).then((err, value) => {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset, app_response: {success: false, 'error': err}});
      if (err) reject(err);
    })
    logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix, app_response: {success: true}});
    logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset, app_response: {success: true}});
    resolve(null);
  })
}


const getNumFrames = (db, project) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const getNumFrames = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
      return projects.includes(project);
    });
    if (!exists) {
      logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    var numFrames = db.get('/project/'+project+'/numFrames').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err}});
        reject(err);
      }
      return value;
    })
    logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: true, [`/project/${project}/numFrames`]: numFrames}});
    resolve(numFrames);
  })
}

const setNumFrames = (db, project, numFrames) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const setNumFrames = (db, project, numFrames) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) {
      logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/numFrames', numFrames).then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames, app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames, app_response: {success: true}});
    resolve(null);
  })
}

const getFramesList = (db, project) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const getFramesList = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
      return projects.includes(project);
    });
    if (!exists) {
      logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    var framesList = db.get('/project/'+project+'/framesList').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err}});
        reject(err);
      }
      return value;
    })
    logger.verbose({app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: true, [`/project/${project}/framesList`]: framesList}});
    resolve(framesList);
  })
}

const setFramesList = (db, project, framesList) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const setFramesList = (db, project, framesList) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = getProjects(db).then(projects => {
        return projects.includes(project);
    });
    if (!exists) {
      logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/framesList', framesList).then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList, app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList, app_response: {success: true}});
    resolve(null);
  })
}

const deleteProject = (db, project) => {
  logger.debug({app_subsystem: 'function_call', app_func: 'const deleteProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var projects = getProjects(db).then(projects => {
        return projects;
    });
    var exists = projects.includes(project)
    if (!exists) {
      logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.del('/project/'+project+'/prefix').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: true}});
    db.del('/project/'+project+'/frameOffset').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: true}});
    db.del('/project/'+project+'/numFrames').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err}});
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: true}});
    db.del('/project/'+project+'/framesList').then((err, value) => {
      if (err) {
        logger.error({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err}});
        reject(err);
      }
    })
    logger.verbose({app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: true}});
    projects = projects.filter((value, index, arr) => {
        return value !== project;
    })
    resolve(null);
  })
}

const runFFmpegJPG = () => {
  const settings = getSettings(db).then(settings => {
    return settings;
  })
  logger.debug({app_subsystem: 'function_call', app_func: 'const runFFmpegJPG = framesList => {', app_file: '/server/BackendDB.js'});
  JPGcomplete = false;

  const currentProject = getCurrentProject(db).then(currentProject => {
    return currentProject;
  })

  if (!argv.server_test) {
    // Wipe all the image files from the directory before transcoding
    var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.jpg"));
    logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'glob', app_fileList: files});
    for (const file of files) {
      logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'del', app_file: file});
      fs.unlinkSync(file);
    }

    var video_arg = path.join(argv.videopath, currentProject)
    const args = ["-i", video_arg, "-nostdin", "-y", "-vf", "fps=1", settings.prefix+"%06d.jpg"]
    logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'spawn', options: args});
    //var options = "-i argv.videopath/filename -nostdin -y -vf fps=1 prefix%06d.jpg" (jpgdir)
    ffmpeg = child_process.spawn({"cwd": path.join(argv.jpgpath, currentProject)},  "ffmpeg", args, {
      cwd: argv.jpgdir
    });
    ffmpeg_running = true;

    ffmpeg.stdout.on("data", data => {
        logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stdout', output: data});
    });

    ffmpeg.stderr.on("data", data => {
        logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stderr', output: data});
    });

    ffmpeg.on('error', (error) => {
        //error.message
        logger.error({app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'error', output: error});
    });

    ffmpeg.on("close", code => {
        logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'close', output: code});
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
  logger.debug({app_subsystem: 'function_call', app_func: 'const runFFmpegPNG = framesList => {', app_file: '/server/BackendDB.js'});
  PNGcomplete = false;

  const framesList = getFramesList(db).then(function(framesList) {
    return framesList;
  })
  const currentProject = getCurrentProject(db).then(currentProject => {
    return currentProject;
  })
  const settings = getSettings(db).then(settings => {
    return settings;
  })

  if (!argv.server_test) {
    // Wipe all the image files from the directory before transcoding
    var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.png"));
    logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
    for (const file of files) {
      logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'del', app_file: file});
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
    logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'spawn', options: args});
    ffmpeg = child_process.spawn({"cwd": path.join(argv.pngpath, currentProject)}, "ffmpeg", args, {
        cwd: argv.pngdir
    });

    ffmpeg_running = true;

    ffmpeg.stdout.on("data", data => {
      logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stdout', output: data});
    });

    ffmpeg.stderr.on("data", data => {
      logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stderr', output: data});
    });

    ffmpeg.on('error', (error) => {
      logger.error({app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'error', output: error});
    });

    ffmpeg.on("close", code => {
      logger.verbose({app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'close', output: code});
      // Rename all the numbers from 1,2,3 to the actual frame numbers.
      var files = glob.sync(path.join(argv.jpgpath, currentProject, "*.png"));
      logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
      for (var i = 0; i < files.length; i++) {
        // filename plus the image path and current project is guarrenteed to be at least 10 characters long
        var renamed_file = files[i].substr(0, files[i].length-10) + ('000000'+framesList[i]).slice(-6) + files[i].substr(files[i].length-4);
        fs.renameSync(files[i], renamed_file)
        logger.verbose({app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'rename', app_oldfile: files[i], app_newfile: renamed_file});
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
    .help()
    .alias('help', 'h')
    .usage('Usage: $0 --argv.jpgpath JPGFOLDER --argv.pngpath PNGFOLDER')
    .argv;

try {
  if (fs.lstatSync(argv.jpgpath).isDirectory() && fs.lstatSync(argv.pngpath).isDirectory() && fs.lstatSync(argv.videopath).isDirectory()) {
    console.log(`Storing JPGs in ${argv.jpgpath}, PNGs in ${argv.pngpath}. Using video directory ${argv.videopath}`);
  logger.verbose({app_subsystem: 'argv', app_response: {success: true, jpgpath: argv.jpgpath, pngpath: argv.pngpath, videopath: argv.videopath, test_client: argv['test-client'], test_server: argv['test-server']}});
  }
} catch(err) {
  console.error("One or more folders don't exist. Please ensure they exist before running.");
  console.error(err);
  logger.error({app_subsystem: 'argv', app_response: {success: false, error_type: 'directory_notexists', 'error': err}});
  process.exit(1);
}


