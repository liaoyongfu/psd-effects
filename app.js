var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var projectRouter = require('./routes/project');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: '2C44774A-D649-4D44-9535-46E296EF984F',
    resave: true,
    saveUninitialized: true
}));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/projects', express.static(path.join(__dirname, 'project')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// 用户认证中间件
app.use(function (req, res, next) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
    }else{
        res.locals.user = {};
    }
    next();
});

app.use(function(req, res, next){
    console.log(req.url);
    next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/project', projectRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
