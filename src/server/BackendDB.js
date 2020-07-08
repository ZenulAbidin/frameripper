const level = require('level')
var express = require('express');
var fs = require("fs");
var path = require("path");
const yargs = require('yargs');
const child_process = require('child_process');
var moment = require('moment');
var winston = require('winston');
var glob = require('glob');
var bodyParser = require('body-parser');

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

// Limitation: This backend is intended to be used only as one client at a time, so calls to isTranscodingJPG/PNGComplete will each return
// the same value if only one transcoding operation is running. (and currentProject will be in a bad state.)
var ffmpeg = null;
var ffmpeg_running = false;
var ffmpeg_error = true;
var default_null = '(null/undefined)';

var currentProject = null;

logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'program_entry_point', app_file: '/server/BackendDB.js'});

// Credits: https://stackoverflow.com/a/4347066/12452330
function formatNumberSign(theNumber)
{
    if(theNumber > 0){
        return "+" + theNumber;
    }else{
        return theNumber.toString();
    }
}

const wwwencode = (data) => {
//    return encodeURIComponent(Buffer.from(JSON.stringify(data)).toString('base64'))
    return encodeURIComponent(JSON.stringify(data))
};

const wwwdecode = (data) => {
//    return JSON.parse(Buffer.from(decodeURIComponent(data), 'base64').toString())
    return JSON.parse(decodeURIComponent(data))
};

var app = express();
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://iamomegastorm.tk:3011");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.get('/startjpgtranscode', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/startjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    runFFmpegJPG();
  }
  logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/startjpgtranscode', app_request: 'get', app_status: 200});
  res.json({ok: wwwencode(true)});
})

app.get('/abortjpgtranscode', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/abortjpgtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
      res.json({ok: wwwencode(true)})
    } else {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': wwwencode('ffmpeg is not running')})
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortjpgtranscode', app_request: 'get', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/startpngtranscode', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/startpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    runFFmpegPNG();
  }
  logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/startpngtranscode', app_request: 'get', app_status: 200});
  res.json({ok: wwwencode(true)});
})

app.get('/abortpngtranscode', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/abortpngtranscode\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (ffmpeg_running) {
      ffmpeg.kill();
      ffmpeg_running = false;
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
      res.json({ok: wwwencode(true)})
    } else {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 400, app_response: {'error': 'ffmpeg is not running'}});
      res.status(400).json({'error': wwwencode('ffmpeg is not running')})
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/abortpngtranscode', app_request: 'get', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/projects', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    getProjects(db).then(function(projects) {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': projects}});
      res.status(200).json({'projects': wwwencode(projects)})
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    var projects = ['Big-Buck-Bunny.mp4', 'Crab-Rave.mp4', 'FooBar2000test.mp4'];
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'get', app_status: 200, app_response: {'projects': null}});
    res.status(200).json({'projects': wwwencode(projects)})
  }
})

app.post('/projects', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.post(\'/projects\', function (req, res) {', app_file: '/server/BackendDB.js'});
  // Intentional, grabs undefined but not other falsy values which don't gum leveldb
  if (!argv.testClient) {
    if (req.body.projects == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "projects" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "projects" doesn\'t exist')})
    } else {
      var projects_decoded = wwwdecode(req.body.projects);
      setProjects(db, projects_decoded).then(value => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'post', app_status: 200});
        res.json({ok:true})
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/projects', app_request: 'post', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/currentproject', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    getCurrentProject(db).then(function(project) {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': project}});
      res.status(200).json({'currentProject': wwwencode(project)})
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    var project =  'Big-Buck-Bunny.mp4';
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'get', app_status: 200, app_response: {'currentProject': null}});
    res.status(200).json({'currentProject': wwwencode(project)})
  }
})

app.post('/currentproject', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.post(\'/currentproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (req.body.currentProject == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "currentProject" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "currentProject" doesn\'t exist')})
    } else {
      var currentProject_decoded = wwwdecode(req.body.currentProject);
      setCurrentProject(db, currentProject_decoded).then(value => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'post', app_status: 200});
        res.json({ok:true})
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }
  }
  else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentproject', app_request: 'post', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/currentsettings', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      getSettings(db, project).then(function(settings) {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
        res.status(200).json({'prefix': wwwencode(settings.prefix), 'frameOffset': wwwencode(settings.frameOffset)})
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    var settings = {prefix: 'bbb', frameOffset: -2};
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'get', app_status: 200, app_response: settings});
    res.status(200).json({prefix: wwwencode(settings.prefix), frameOffset: wwwencode(settings.frameOffset)})
  }
})

app.post('/currentsettings', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.post(\'/currentsettings\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (req.body.prefix == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "settings.prefix" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "prefix" doesn\'t exist')})
    }
    else if (req.body.frameOffset == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "settings.frameOffset" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "frameOffset" doesn\'t exist')})
    }
    else {
      var prefix_decoded = wwwdecode(req.body.prefix);
      var frameOffset_decoded = wwwdecode(req.body.frameOffset);
      var project = getCurrentProject(db).then(project => {
        setSettings(db, project, prefix_decoded, frameOffset_decoded).then(value => {
          logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 200});
          res.json({ok:true})
        }).catch(function(err) {
          logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
          res.status(400).json({'error': wwwencode(err.toString())})
        })
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/currentsettings', app_request: 'post', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/numframes', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      getNumFrames(db, project).then(function(numFrames) {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
        res.status(200).json({'numFrames': wwwencode(numFrames)})
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    var numFrames = 23;
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'get', app_status: 200, app_response: {'numFrames': numFrames}});
    res.status(200).json({'numFrames': wwwencode(numFrames)})
  }
})

app.post('/numframes', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.post(\'/numframes\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (req.body.numFrames == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "numFrames" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "numFrames" doesn\'t exist')})
    } else {
      var numFrames_decoded = wwwdecode(req.body.numFrames);
      var project = getCurrentProject(db).then(project => {
        setNumFrames(db, project, numFrames_decoded).then(value => {
          logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'post', app_status: 200});
          res.json({ok:true})
        }).catch(function(err) {
          logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
          res.status(400).json({'error': wwwencode(err.toString())})
        })
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/numframes', app_request: 'post', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

app.get('/frameslist', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    var project = getCurrentProject(db).then(project => {
      getFramesList(db, project).then(function(framesList) {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
        res.status(200).json({'framesList': wwwencode(framesList)})
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error':wwwencode(err.toString())})
      })
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    var framesList = [0, 1, 3, 4, 5, 6, 14, 16, 22];
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'get', app_status: 200, app_response: {'framesList': framesList}});
    res.status(200).json({'framesList': wwwencode(framesList)})
  }
})

app.post('/frameslist', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/frameslist\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    if (req.body.framesList == null) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'post', app_status: 400, app_response: {'error': 'Required key "framesList" doesn\'t exist'}});
      res.status(400).json({'error': wwwencode('Required key "framesList" doesn\'t exist')})
    } else {
      var framesList_decoded = wwwdecode(req.body.framesList)
      var project = getCurrentProject(db).then(project => {
        setFramesList(db, project, framesList_decoded).then(value => {
          logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'post', app_status: 200});
          res.json({ok:true})
        }).catch(function(err) {
          logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
          res.status(400).json({'error': wwwencode(err.toString())})
        })
      }).catch(function(err) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
        res.status(400).json({'error': wwwencode(err.toString())})
      })
    }
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/frameslist', app_request: 'post', app_status: 200});
    res.json({ok:true})
  }
})

app.post('/deleteproject', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.post(\'/deleteproject\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    deleteProject(db, wwwdecode(req.body.project)).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'post', app_status: 200});
      res.json({ok: wwwencode(true)})
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'post', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(complete)})
    })
  } else {
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/deleteproject', app_request: 'post', app_status: 200});
    res.json({ok: wwwencode(true)})
  }
})

var ticker_jpg = 0;
app.get('/istranscodingjpgcomplete', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingjpgcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    isTranscodingJPGComplete().then(function(complete) {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': wwwencode(complete)})
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    ticker_jpg += 1;
    var complete = (ticker_jpg % 50 === 0) ? true : false;
    console.log(`ticker_jpg = ${ticker_jpg}`);
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingjpgcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete, 'ticker': ticker_jpg}});
    res.status(200).json({'complete': wwwencode(complete)})
  }
})

var ticker_png = 0;
app.get('/istranscodingpngcomplete', function (req, res) {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'app.get(\'/istranscodingpngcomplete\', function (req, res) {', app_file: '/server/BackendDB.js'});
  if (!argv.testClient) {
    isTranscodingPNGComplete().then(function(complete) {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete}});
      res.status(200).json({'complete': wwwencode(complete)})
    }).catch(function(err) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 400, app_response: {'error': err.stack || default_null}});
      res.status(400).json({'error': wwwencode(err.toString())})
    })
  } else {
    ticker_png += 1;
    var complete = (ticker_png % 50 === 0) ? true : false;
    console.log(`ticker_png = ${ticker_png}`);
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'endpoint', app_url: '/istranscodingpngcomplete', app_request: 'get', app_status: 200, app_response: {'complete': complete, 'ticker': ticker_png}});
    res.status(200).json({'complete': wwwencode(complete)})
  }
})


const isTranscodingJPGComplete = () => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const isTranscodingJPGComplete = () => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    if (!ffmpeg_error && !ffmpeg_running) {
      resolve(JPGcomplete === true);
    } else {
      reject('ffmpeg is not running')
    }
  })
}

const isTranscodingPNGComplete = () => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const isTranscodingPNGComplete = () => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    if (!ffmpeg_error && !ffmpeg_running) {
      resolve(PNGcomplete === true);
    } else {
      reject('ffmpeg is not running')
    }
  })
}

const openDB = () => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const openDB = () => {', app_file: '/server/BackendDB.js'});
  logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'open', app_file: DBfile});
  const db = level(DBfile, { valueEncoding: 'json' });
  return db;
}

const getProjects = db => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const getProjects = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.get('/projects').then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: true, '/projects': value}});
      return resolve(value);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/projects', app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const setProjects = (db, projects) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const setProjects = (db, projects) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    db.put('/projects', projects).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: projects || default_null, app_response: {success: true}});
      if (!projects.includes(currentProject)) {
        currentProject = null;
      }
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/projects', app_value: projects || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const getCurrentProject = db => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const getCurrentProject = db => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    // Use cached value if exists to avoid expensive DB call
    if (currentProject) {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_response: {success: true, '/currentProject': currentProject, cached: true}});
      return resolve(currentProject);
    }
    db.get('/currentProject').then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_response: {success: true, '/currentProject': value, cached: false}});
      return resolve(value);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/currentProject', app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const setCurrentProject = (db, project) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const setCurrentProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    getProjects(db).then(projects => {
      if (project == null || !projects.includes(project)) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
      }
    }).catch(err => {
      reject(err);
    });
    db.put('/currentProject', project).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: true}});
      currentProject = project;
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/currentProject', app_value: project || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const getSettings = (db, project) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const getSettings = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
    }

    db.get('/project/'+project+'/prefix').then((prefix) => {
      db.get('/project/'+project+'/frameOffset').then((frameOffset) => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: true, [`/project/${project}/prefix`]: prefix}});
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: true, [`/project/${project}/frameOffset`]: frameOffset}});
        resolve({'prefix': prefix, 'frameOffset': frameOffset});
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack || default_null}});
        reject(err);
      })
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const setSettings = (db, project, prefix, frameOffset) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const setSettings = (db, project, prefix, frameOffset) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
    if (!exists) reject('Project doesn\'t exist');
    db.put('/project/'+project+'/prefix', prefix).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: true}});
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/prefix', app_value: prefix || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
    db.put('/project/'+project+'/frameOffset', frameOffset).then((value) => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/frameOffset', app_value: frameOffset || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}


const getNumFrames = (db, project) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const getNumFrames = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
      return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.get('/project/'+project+'/numFrames').then(numFrames => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: true, [`/project/${project}/numFrames`]: numFrames}});
      resolve(numFrames);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })

  })
}

const setNumFrames = (db, project, numFrames) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const setNumFrames = (db, project, numFrames) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
        return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/numFrames', numFrames).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/numFrames', app_value: numFrames || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const getFramesList = (db, project) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const getFramesList = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    getProjects(db).then(projects => {
      var exists = project != null && projects.includes(project);
      if (!exists) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
      }
    }).catch(err => {
      reject(err);
    });
    db.get('/project/'+project+'/framesList').then(framesList => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: true, [`/project/${project}/framesList`]: framesList}});
      resolve(framesList);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'get', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const setFramesList = (db, project, framesList) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const setFramesList = (db, project, framesList) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    var exists = project != null && getProjects(db).then(projects => {
        return projects.includes(project);
    }).catch(err => {
      reject(err);
    });
    if (!exists) {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: false, 'error': 'Project doesn\'t exist'}});
      reject('Project doesn\'t exist');
    }
    db.put('/project/'+project+'/framesList', framesList).then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: true}});
      resolve(null);
    }).catch(err => {
      logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'set', app_key: '/project/'+project+'/framesList', app_value: framesList || default_null, app_response: {success: false, 'error': err.stack || default_null}});
      reject(err);
    })
  })
}

const deleteProject = (db, project) => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const deleteProject = (db, project) => {', app_file: '/server/BackendDB.js'});
  return new Promise((resolve, reject) => {
    getProjects(db).then(projects => {
      var exists = project != null &&  projects.includes(project);
      if (!exists) {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': 'Project doesn\'t exist'}});
        reject('Project doesn\'t exist');
      };
      db.del('/project/'+project+'/prefix').then(value => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: true}});
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/prefix', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack || default_null}});
        reject(err);
      })

      db.del('/project/'+project+'/frameOffset').then(value => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: true}});
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/frameOffset', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack || default_null}});
        reject(err);
      })

      db.del('/project/'+project+'/numFrames').then(value => {
      logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: true}});
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/numFrames', app_response: {success: false, 'error': err.stack || default_null}});
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack || default_null}});
        reject(err);
      })

      db.del('/project/'+project+'/framesList').then(value => {
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: true}});
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del', app_key: '/project/'+project+'/framesList', app_response: {success: false, 'error': err.stack || default_null}});
        reject(err);
      })

      projects = projects.filter((value, index, arr) => {
        return value !== project;
      })
      setProjects(db, projects).then(value => {
        if (project == currentProject) {
          currentProject = null;
        }
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del_projremove', app_key: '/project/'+project, app_response: {success: true}});
        resolve(null);
      }).catch(err => {
        logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'database', app_request: 'del_projremove', app_key: '/project/'+project, app_response:  {success: false, 'error': err.stack || default_null}});
        reject(err);
      })
    }).catch(err => {
      reject(err);
    })
  })
}

const runFFmpegJPG = () => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const runFFmpegJPG = framesList => {', app_file: '/server/BackendDB.js'});
  JPGcomplete = false;

  getCurrentProject(db).then(project => {
    getSettings(db, project).then(function(settings) {
      if (!argv.testServer) {
        // Wipe all the image files from the directory before transcoding
        var files = glob.sync(path.join(argv.jpgpath, settings.prefix, "*.jpg"));
        //logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'glob', app_fileList: files});
        for (var file of files) {
          fs.unlink(file, (err) => {
            if (err) throw err;
            //logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'jpg', app_operation: 'del', app_file: file});
          });
        }

        var video_arg = path.join(argv.videopath, project)
        const args = ["-hide_banner", "-loglevel", "warning", "-i", video_arg, "-nostdin", "-y", settings.prefix+".%06d.jpg"]
        var working_dir = path.join(argv.jpgpath, settings.prefix)
        if (!fs.existsSync(working_dir)){
            fs.mkdirSync(working_dir, { recursive: true });
        }
        logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'spawn', options: args});
        //var options = "-i argv.videopath/filename -nostdin -y -vf fps=1 prefix%06d.jpg" (jpgdir)
        ffmpeg = child_process.spawn("ffmpeg", args, {
          cwd: working_dir
        });
        ffmpeg_running = true;

        ffmpeg.stdout.on("data", data => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stdout', output: data.toString()});
        });

        ffmpeg.stderr.on("data", data => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'stderr', output: data.toString()});
        });

        ffmpeg.on('error', (error) => {
            //error.message
            logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'error', output: error});
            ffmpeg_running = false;
        });

        ffmpeg.on("close", code => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'jpg', app_stream: 'close', output: code});
            setNumFrames(db, project, files.length).then(value => {
              logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_db', app_transcode: 'jpg', app_key: 'numframes', app_value: value,  app_response: {success: true, 'numFrames': files.length}});
            }).catch(function(err) {
              logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_db', app_transcode: 'jpg', app_key: 'numframes', app_value: value,  app_response: {success: false, 'error': err}});
            })
            JPGcomplete = true;
            ffmpeg_running = false;
            ffmpeg_error = code != 0;
        });
      } else {
        setTimeout(function() {
          JPGcomplete = true;
          ffmpeg_running = false;
        }, 5000);
      }
    }).catch(err => {
      throw err;
    });
  }).catch(err => {
    throw err;
  });
}

const runFFmpegPNG = () => {
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'function_call', app_func: 'const runFFmpegPNG = framesList => {', app_file: '/server/BackendDB.js'});
  PNGcomplete = false;

  getCurrentProject(db).then(project => {
    getFramesList(db, project).then(function(framesList) {
      getSettings(db, project).then(function(settings) {
        if (!argv.testServer) {
          // Wipe all the image files from the directory before transcoding
          var files = glob.sync(path.join(argv.pngpath, settings.prefix, "*.png"));
          //logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
          for (var file of files) {
            fs.unlink(file, (err) => {
              if (err) throw err;
              //logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'del', app_file: file});
            });
          }

          /* "select='eq(n\\,franemumber-offset)+eq(n\\,franemumber-offset)'"*/
          var select_arg = "select='" //eq(n\\,franemumber-offset)+eq(n\\,franemumber-offset)'";
          for (const frame of framesList) {
            select_arg += `eq(n\\,${frame}${formatNumberSign(settings.frameOffset)})+`
          }
          select_arg = select_arg.substring(0,select_arg.length-1) + "'";
          var video_arg = path.join(argv.videopath, project)
          const args = ["-hide_banner", "-loglevel", "warning", "-i", video_arg, "-nostdin", "-y", "-vf", select_arg, "-vsync", "0", settings.prefix+".%06d.png"]
          var working_dir = path.join(argv.pngpath, settings.prefix)
          if (!fs.existsSync(working_dir)){
              fs.mkdirSync(working_dir, { recursive: true });
          }
          logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'spawn', options: args});
          ffmpeg = child_process.spawn("ffmpeg", args, {
            cwd: working_dir
          });

          ffmpeg_running = true;

          ffmpeg.stdout.on("data", data => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stdout', output: data.toString()});
          });

          ffmpeg.stderr.on("data", data => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'stderr', output: data.toString()});
          });

          ffmpeg.on('error', (error) => {
            logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'error', output: error});
            ffmpeg_running = false;
          });

          ffmpeg.on("close", code => {
            logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg', app_transcode: 'png', app_stream: 'close', output: code});
            // Rename all the numbers from 1,2,3 to the actual frame numbers.
            var files = glob.sync(path.join(argv.pngpath, settings.prefix, "*.png"));
            //logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'glob', app_fileList: files});
            for (var i = 0; i < files.length; i++) {
              // filename plus the image path and current project is guarrenteed to be at least 10 characters long
              var renamed_file = files[i].substr(0, files[i].length-10) + ('000000'+framesList[i]).slice(-6) + files[i].substr(files[i].length-4);
              fs.rename(files[i], renamed_file, (err) => {
                if (err) throw err;
              });
              logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'ffmpeg_fs', app_transcode: 'png', app_operation: 'rename', app_oldfile: files[i], app_newfile: renamed_file});
            }
            PNGcomplete = true;
            ffmpeg_running = false;
            ffmpeg_error = code != 0;
          });
        } else {
          setTimeout(function() {
            JPGcomplete = true;
            ffmpeg_running = false;
            ffmpeg_error = false;
          }, 5000);
        }
      }).catch(err => {
        throw err;
      });
    }).catch(err => {
      throw err;
    });
  });
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
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv_dirs',  app_dir: 'jpg', app_jpgpath: argv.jpgpath});
  }
} catch(err) {
  console.error(`The JPG folder "${argv.jpgpath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'jpg'}});
  process.exitCode = 1;
}
try {
  if (fs.lstatSync(argv.pngpath).isDirectory()) {
    console.log(`Storing PNGs in "${argv.pngpath}"`);
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv_dirs',  app_dir: 'png', app_pngpath: argv.pngpath});
  }
} catch(err) {
  console.error(`The PNG folder "${argv.pngpath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'png'}});
  process.exitCode = 1;
}
try {
  if (fs.lstatSync(argv.videopath).isDirectory()) {
    console.log(`Using video directory "${argv.videopath}"`);
    logger.verbose({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv_dirs',  app_dir: 'video', app_videopath: argv.videopath});
  }
} catch(err) {
  console.error(`The video folder "${argv.videopath}" doesn't exist. Please create it before running.`);
  console.error(err);
  logger.error({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'argv', app_response: {success: false, error_type: 'dir_noent', dir: 'video'}});
  process.exitCode = 1;
}

getCurrentProject(db).then(function(project) {
  currentProject = project;
  logger.debug({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'init', app_operation: 'currentProjectCache', app_response: {success: true, 'currentProject': currentProject}});
}).catch(function(err) {
  // New database, populate it with default values
  logger.warn({time: moment().format("YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ"), app_subsystem: 'init', app_operation: 'currentProjectCache', app_response: {success: false, 'error': 'currentProject not set in DB'}});
  setProjects(db, [])
  db.put('/currentProject', '(null)').then(dummy => {})
})

const port = argv.port || 3030;
app.listen(port)


